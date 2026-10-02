// ============================================================
// core.js — Núcleo: integração Telegram, estado do jogo (salvar/carregar), navegação entre telas e utilitários.
// ============================================================

// --- Integração básica com o Telegram Web App ---
let tg = window.Telegram ? window.Telegram.WebApp : null;

if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || "";
}

// --- Estado do jogo (salvo no localStorage por enquanto) ---
const STORAGE_KEY = "academia_arcana_save";

function defaultState() {
  return {
    name: "",
    characterCreated: false,
    house: null,
    gender: "f",
    presetIndex: 0,
    level: 1,
    xp: 0,
    xpToNext: 50,
    mana: 10,
    manaMax: 10,
    hp: 30,
    hpMax: 30,
    attack: 4,
    defense: 1,
    baseAttack: 4,
    baseDefense: 1,
    baseHpMax: 30,
    baseManaMax: 10,
    critChance: 5,
    dodgeChance: 3,
    penetration: 0,
    luck: 0,
    hpRegen: 2,
    manaRegen: 1,
    gold: 0,
    essence: 0,
    inventory: {},
    equipment: { chapeu: null, roupa: null, sapatos: null, capa: null, colar: null, anel: null, arma_principal: null, arma_secundaria: null },
    gearInventory: [], // equipamentos fabricados com atributos sorteados (ver EQUIP_DEFS em inventory.js)
    nextGearUid: 1,
    upgrades: { power: 0, mana: 0, luck: 0, regen: 0 },
    questProgress: {}, // por local: { jardins: { stage: "none|hunting|ready|done", kills: 0 } }
    bossCooldowns: {}, // por local: { jardins: timestampFimDoCooldown }
    purchasedItems: {},
    currentLocation: "academia",
    travelTarget: null,
    travelArrivesAt: 0,
    defeatedUntil: 0
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded = raw ? JSON.parse(raw) : defaultState();
    if (!loaded.inventory) loaded.inventory = {};
    if (!loaded.upgrades) loaded.upgrades = { power: 0, mana: 0, luck: 0, regen: 0 };
    if (loaded.hp === undefined) loaded.hp = 30;
    if (loaded.hpMax === undefined) loaded.hpMax = 30;
    if (loaded.attack === undefined) loaded.attack = 4;
    if (loaded.defense === undefined) loaded.defense = 1;
    // Migração: missão e cooldown do chefe eram globais (Jardins); agora são por local.
    if (!loaded.questProgress) {
      loaded.questProgress = {};
      if (loaded.questStage && loaded.questStage !== "none") {
        loaded.questProgress.jardins = { stage: loaded.questStage, kills: loaded.questKills || 0 };
      }
    }
    if (!loaded.bossCooldowns) {
      loaded.bossCooldowns = {};
      if (loaded.bossCooldownUntil) loaded.bossCooldowns.jardins = loaded.bossCooldownUntil;
    }
    delete loaded.questStage;
    delete loaded.questKills;
    delete loaded.bossCooldownUntil;
    if (!loaded.purchasedItems) loaded.purchasedItems = {};
    if (!loaded.currentLocation) loaded.currentLocation = "academia";
    if (loaded.travelTarget === undefined) loaded.travelTarget = null;
    if (loaded.travelArrivesAt === undefined) loaded.travelArrivesAt = 0;
    if (loaded.defeatedUntil === undefined) loaded.defeatedUntil = 0;
    delete loaded.houseManaBonus; // bônus de casa agora é calculado em recalcStats (ver HOUSES em character.js)
    delete loaded.houseLuckBonus;
    if (loaded.critChance === undefined) loaded.critChance = 5;
    if (loaded.dodgeChance === undefined) loaded.dodgeChance = 3;
    if (loaded.penetration === undefined) loaded.penetration = 0;
    if (loaded.luck === undefined) loaded.luck = 0;
    if (loaded.hpRegen === undefined) loaded.hpRegen = 2;
    if (loaded.manaRegen === undefined) loaded.manaRegen = 1;
    if (!loaded.equipment) {
      loaded.equipment = { chapeu: null, roupa: null, sapatos: null, capa: null, colar: null, anel: null, arma_principal: null, arma_secundaria: null };
    }
    if (loaded.characterCreated === undefined) loaded.characterCreated = false;
    if (loaded.house === undefined) loaded.house = null;
    if (!loaded.gender) loaded.gender = "f";
    if (!loaded.gearInventory) loaded.gearInventory = [];
    if (loaded.nextGearUid === undefined) loaded.nextGearUid = 1;
    if (loaded.presetIndex === undefined) loaded.presetIndex = 0;
    return loaded;
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignora se storage falhar */ }
}

function resetProgress() {
  if (confirm("Isso vai apagar todo o progresso salvo neste dispositivo. Continuar?")) {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
}

// ---------- SÓ PARA TESTES — remover (junto do botão no game.html) na versão final ----------
function debugLevelUp() {
  state.xp = state.xpToNext;
  checkLevelUp();
  saveState();
  render();
  showToast("🧪 Teste: você subiu para o nível " + state.level);
}

function navClick(target) {
  if (target === "mochila") {
    hideAllScreens();
    document.getElementById("mochilaScreen").classList.remove("hidden");
    document.getElementById("slotPickerPanel").classList.add("hidden");
    renderInventory();
    return;
  }
  if (target === "mapa") {
    openMap();
    return;
  }
  if (target === "criacao") {
    openCraft();
    return;
  }
  if (target === "habilidades") {
    hideAllScreens();
    document.getElementById("habilidadesScreen").classList.remove("hidden");
    return;
  }
  if (target === "social") {
    hideAllScreens();
    document.getElementById("socialScreen").classList.remove("hidden");
    return;
  }
}

function log(msg) {
  // A tela inicial fixa com o log sumiu (o mapa é a aba padrão agora);
  // toda mensagem de status vira uma notificação (toast), visível em qualquer aba.
  showToast(msg);
}

// ---------- NAVEGAÇÃO ENTRE TELAS ----------

function hideAllScreens() {
  ["mapScreen", "combatScreen", "npcScreen", "merchantScreen", "mochilaScreen", "huntSelectScreen", "victoryScreen", "defeatScreen", "craftScreen", "habilidadesScreen", "socialScreen"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });
}

function backToMain() {
  // O mapa é a tela padrão do jogo agora (não existe mais uma "tela inicial" separada).
  openMap();
}

function formatDuration(ms) {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return totalSec + " segundo" + (totalSec === 1 ? "" : "s");
  const min = Math.round(totalSec / 60);
  return min + " minuto" + (min === 1 ? "" : "s");
}

function showToast(msg) {
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
