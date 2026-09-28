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
    houseManaBonus: 0,
    houseLuckBonus: 0,
    critChance: 5,
    dodgeChance: 3,
    penetration: 0,
    luck: 0,
    hpRegen: 2,
    manaRegen: 1,
    gold: 0,
    essence: 0,
    inventory: { chapeu_aprendiz: 1, tunica_simples: 1, botas_surradas: 1, adaga_treino: 1 },
    equipment: { chapeu: null, roupa: null, sapatos: null, capa: null, colar: null, anel: null, arma_principal: null, arma_secundaria: null },
    upgrades: { power: 0, mana: 0, luck: 0, regen: 0 },
    questStage: "none",
    questKills: 0,
    bossCooldownUntil: 0,
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
    if (loaded.questStage === undefined) loaded.questStage = "none";
    if (loaded.questKills === undefined) loaded.questKills = 0;
    if (loaded.bossCooldownUntil === undefined) loaded.bossCooldownUntil = 0;
    if (!loaded.purchasedItems) loaded.purchasedItems = {};
    if (!loaded.currentLocation) loaded.currentLocation = "academia";
    if (loaded.travelTarget === undefined) loaded.travelTarget = null;
    if (loaded.travelArrivesAt === undefined) loaded.travelArrivesAt = 0;
    if (loaded.defeatedUntil === undefined) loaded.defeatedUntil = 0;
    if (loaded.houseManaBonus === undefined) loaded.houseManaBonus = (loaded.house === "noctivia" ? 10 : 0);
    if (loaded.houseLuckBonus === undefined) loaded.houseLuckBonus = (loaded.house === "sibyra" ? 10 : 0);
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
  const labels = { habilidades: "Habilidades", social: "Social" };
  log("🔒 " + labels[target] + " ainda não disponível neste protótipo.");
}

function log(msg) {
  document.getElementById("log").textContent = msg;
}

// ---------- NAVEGAÇÃO ENTRE TELAS ----------

function hideAllScreens() {
  ["mainApp", "mapScreen", "combatScreen", "npcScreen", "merchantScreen", "mochilaScreen", "huntSelectScreen", "victoryScreen", "defeatScreen"].forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });
}

function backToMain() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("mainApp").classList.remove("hidden");
  render();
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
