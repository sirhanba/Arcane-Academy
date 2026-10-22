// ============================================================
// torre.js — Torre do Desafio (Picos Celestiais): 40 andares seguidos, 1 tentativa por dia (reseta à meia-noite de Brasília).
// Vida e mana NÃO recuperam entre andares. Entre um andar e outro dá para beber poções, seguir ou desistir (guarda tudo).
// Derrota: perde METADE do Cobre ganho na torre naquela tentativa (XP e itens ficam). Fugir é bloqueado. Não conta para missões.
// ============================================================
const TOWER_MIN_LEVEL = 5;
const TOWER_FLOORS = [
  ["rato_arcano", "corvo_selvagem", "livro_maldito", "corvo_ancestral"],
  ["peixe_abissal", "aranha_sombria", "morcego_cristalino", "ent_ancestral"],
  ["escaravelho_cristalino", "lobo_cinzento", "esqueleto_guerreiro", "patriarca_das_cavernas"],
  ["javali_espinhoso", "sereia_corrompida", "cogumelo_sombrio", "arquimago_corrompido"],
  ["gargula_menor", "lumefogo_enganoso", "elemental_de_quartzo", "leviata_do_lago"],
  ["gargula_de_tomo", "veia_animada", "ghoul_faminto", "rainha_de_cristal"],
  ["mago_fantasma", "hidra_dos_lodos", "serpente_das_aguas", "rei_esqueleto"],
  ["arquivista_sombrio", "grifo_das_tempestades", "cavaleiro_remanescente", "monstro_do_pantano"],
  ["colosso_prismatico", "elemental_do_gelo", "golem_de_pedra_antigo", "arquilich"],
  ["bruxa_das_neblinas", "lich_menor", "dragao_menor_das_neves", "patriarca_das_tempestades"]
].reduce((a, b) => a.concat(b), []);
const TOWER_TOTAL = TOWER_FLOORS.length; // 40
const TOWER_UNCOMMON = ["essencia_sombria", "escama_brilhante", "fragmento_quartzo"];
const TOWER_RARE = ["olho_gorgona", "sangue_dragao", "coracao_elemental"];
// Baús: "u" = incomum aleatório, "r" = raro aleatório, ou id de item fixo
const TOWER_CHESTS = { 10: ["u"], 20: ["u", "u"], 30: ["r"], 40: ["r", "r", "pena_fenix"] };

let towerQuitAsk = false;
let towerMsg = "";

function towerDef(id) {
  for (const loc in LOCATION_MONSTERS) { const m = LOCATION_MONSTERS[loc].find(x => x.id === id); if (m) return { def: m, boss: false }; }
  for (const loc in LOCATION_BOSSES) { if (LOCATION_BOSSES[loc].id === id) return { def: LOCATION_BOSSES[loc], boss: true }; }
  return null;
}
function towerItem(id) { return ITEMS.find(i => i.id === id) || { name: id, icon: "📦" }; }
function towerPick(list) { return list[Math.floor(Math.random() * list.length)]; }
function towerUsedToday() { return state.tower.last === dailyToday(); }

// Uma tentativa deixada no meio de uma luta (app fechado) conta como derrota — evita fugir do risco fechando o jogo.
function towerSettleStale() {
  const r = state.tower && state.tower.run;
  if (r && r.phase === "fight" && !combat) towerFail();
}

function openTower() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  towerSettleStale();
  hideAllScreens();
  document.getElementById("towerScreen").classList.remove("hidden");
  towerQuitAsk = false;
  renderTower();
}

function renderTower() {
  const r = state.tower.run;
  const st = document.getElementById("towerStatus"), body = document.getElementById("towerBody");
  document.getElementById("towerNote").textContent = towerMsg;
  let h = "";
  if (!r) {
    if (state.level < TOWER_MIN_LEVEL) {
      st.textContent = "🔒 Requer nível " + TOWER_MIN_LEVEL + ".";
    } else if (towerUsedToday()) {
      st.textContent = "⏳ Você já tentou a torre hoje. A próxima tentativa abre à meia-noite (Brasília).";
    } else {
      st.textContent = "✅ Tentativa de hoje disponível. Vida e mana não recuperam entre os andares.";
      h = '<button class="zone-btn" style="grid-column:span 2;" onclick="towerStart()"><span class="zicon">🗼</span>Subir a torre</button>';
    }
  } else {
    const items = Object.keys(r.items).map(id => towerItem(id).icon + " " + towerItem(id).name + " ×" + r.items[id]).join(", ") || "nenhum";
    st.innerHTML = "🗼 Andares vencidos: <b>" + r.floor + " / " + TOWER_TOTAL + "</b><br>❤️ " + Math.floor(state.hp) + "/" + state.hpMax + " · 🔵 " + Math.floor(state.mana) + "/" + state.manaMax +
      "<br>Ganho na torre: ✨ " + r.xp + " XP · 🪙 " + r.gold + " Cobre · 🎒 " + items;
    if (r.chest) {
      const names = TOWER_CHESTS[r.chest].map(x => x === "u" ? "1 incomum" : x === "r" ? "1 raro" : towerItem(x).name).join(" + ");
      h += '<div class="zone-desc">🎁 Baú do andar ' + r.chest + ': ' + names + '. Precisa de espaço na mochila.</div>' +
        '<button class="zone-btn" style="grid-column:span 2;" onclick="towerOpenChest()"><span class="zicon">🎁</span>Abrir baú</button>';
    }
    const owned = POTIONS.filter(p => (state.inventory[p.id] || 0) > 0);
    if (owned.length) {
      h += '<div class="zone-desc">🧪 Poções:</div>' + owned.map(p => '<div class="combat-potion-row"><span>' + p.icon + ' ' + p.name + ' (x' + state.inventory[p.id] + ')</span><button onclick="towerPotion(\'' + p.id + '\')">Usar</button></div>').join("");
    }
    if (r.phase === "done") {
      h += '<button class="zone-btn" style="grid-column:span 2;" onclick="towerFinish()"><span class="zicon">🏆</span>Concluir</button>';
    } else {
      h += '<button class="zone-btn" ' + (r.chest ? "disabled " : "") + 'onclick="towerNext()"><span class="zicon">⚔️</span>Andar ' + (r.floor + 1) + '</button>' +
        '<button class="zone-btn" onclick="towerQuit()"><span class="zicon">🏳️</span>' + (towerQuitAsk ? (r.chest ? "Confirmar (perde o baú)" : "Confirmar saída") : "Desistir") + '</button>';
    }
  }
  body.innerHTML = h;
}

function towerPotion(id) { usePotionFromBag(id); renderTower(); }

function towerStart() {
  if (state.level < TOWER_MIN_LEVEL || towerUsedToday() || state.tower.run) return;
  state.tower.last = dailyToday();
  state.tower.run = { floor: 0, gold: 0, xp: 0, items: {}, phase: "rest", chest: 0 };
  towerMsg = "";
  saveState();
  towerNext();
}

function towerNext() {
  const r = state.tower.run;
  if (!r || r.chest || r.phase !== "rest" || r.floor >= TOWER_TOTAL) return;
  const info = towerDef(TOWER_FLOORS[r.floor]);
  if (!info) return;
  r.phase = "fight";
  saveState();
  beginCombat(info.def, info.boss, "torre");
}

// Chamado por beginCombat quando locationId === "torre"
function towerCombatSetup() {
  combat.tower = true;
  combat.cooldownMs = 0;
  document.getElementById("combatBackBtn").classList.add("hidden");
  const f = document.getElementById("fleeBtn"); if (f) f.classList.add("hidden");
  document.getElementById("enemyName").textContent = "Andar " + (state.tower.run.floor + 1) + " — " + combat.name;
}

// Chamado por winCombat
function towerWin(rewards) {
  const r = state.tower.run;
  r.gold += rewards.goldGain; r.xp += rewards.xpGain;
  if (rewards.droppedItem) r.items[rewards.droppedItem.id] = (r.items[rewards.droppedItem.id] || 0) + 1;
  addStat(combat.isBoss ? "bosses" : "kills");
  r.floor += 1;
  if (TOWER_CHESTS[r.floor]) r.chest = r.floor;
  r.phase = r.floor >= TOWER_TOTAL ? "done" : "rest";
  combat = null;
  towerMsg = "✅ Andar " + r.floor + " vencido! +" + rewards.xpGain + " XP, +" + rewards.goldGain + " Cobre" +
    (rewards.droppedItem ? ", " + rewards.droppedItem.icon + " " + rewards.droppedItem.name : "") + (rewards.lostItem ? " (mochila cheia: " + rewards.lostItem.name + " se perdeu)" : "") +
    (rewards.leveledUp ? " 🎉 Nível " + rewards.newLevel + "!" : "");
  towerQuitAsk = false;
  saveState();
  hideAllScreens();
  document.getElementById("towerScreen").classList.remove("hidden");
  renderTower();
}

// Chamado por loseCombat (ou por towerSettleStale)
function towerFail() {
  const r = state.tower.run;
  const loss = r ? Math.min(state.gold, Math.floor(r.gold / 2)) : 0;
  state.gold -= loss;
  state.hp = 1;
  state.tower.run = null;
  combat = null;
  towerMsg = "💀 Derrota no andar " + (r ? r.floor + 1 : "?") + ". Você perdeu 🪙 " + loss + " Cobre (metade do ganho na torre). XP e itens ficam com você. A torre reabre amanhã.";
  saveState();
  render();
  hideAllScreens();
  document.getElementById("towerScreen").classList.remove("hidden");
  renderTower();
}

function towerOpenChest() {
  const r = state.tower.run;
  if (!r || !r.chest) return;
  const ids = TOWER_CHESTS[r.chest].map(x => x === "u" ? towerPick(TOWER_UNCOMMON) : x === "r" ? towerPick(TOWER_RARE) : x);
  const backup = Object.assign({}, state.inventory);
  for (const id of ids) {
    if (!bagCanHold(id)) { state.inventory = backup; towerMsg = "🎒 Mochila sem espaço para o baú. Libere espaço e tente de novo."; renderTower(); return; }
    state.inventory[id] = (state.inventory[id] || 0) + 1;
  }
  towerMsg = "🎁 Baú aberto: " + ids.map(id => towerItem(id).icon + " " + towerItem(id).name).join(", ") + "!";
  r.chest = 0;
  saveState(); render();
  renderTower();
}

function towerQuit() {
  const r = state.tower.run;
  if (!r || r.phase !== "rest") return;
  if (!towerQuitAsk) { towerQuitAsk = true; renderTower(); return; }
  towerMsg = "🏳️ Você desistiu no andar " + r.floor + " e guardou tudo o que ganhou." + (r.chest ? " (O baú foi perdido.)" : "");
  state.tower.run = null;
  towerQuitAsk = false;
  saveState();
  renderTower();
}

function towerFinish() {
  const r = state.tower.run;
  if (!r || r.phase !== "done") return;
  if (r.chest && !towerQuitAsk) { towerQuitAsk = true; towerMsg = "🎁 Você ainda não abriu o baú! Toque em Concluir de novo para abrir mão dele."; renderTower(); return; }
  towerMsg = "🏆 Torre concluída! Todos os 40 andares vencidos.";
  state.tower.run = null; towerQuitAsk = false;
  saveState();
  renderTower();
}
