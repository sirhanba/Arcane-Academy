// ============================================================
// veio.js — Veio de Minério (Cavernas Ecoantes): escavar gasta Mana e tem tempo de espera.
// Uma única escavada. O tempo de espera usa o relógio do celular (como a Estufa).
// ============================================================
const MINE_MANA_COST = 30;
const MINE_COOLDOWN_MS = 30 * 60 * 1000;
// Resultado sorteado (chances somam 100; "nada" = 5%)
const MINE_LOOT = [
  { item: "fragmento_quartzo", chance: 55, min: 2, max: 4 },
  { item: "cristal_arcano",    chance: 30, min: 1, max: 2 },
  { item: "poeira_de_osso",    chance: 10, min: 2, max: 4 }
];

let mineTimer = null;
let mineLastResult = "";

function mineRemaining() { return Math.max(0, (state.mining.readyAt || 0) - Date.now()); }

function openMine() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("mineScreen").classList.remove("hidden");
  mineLastResult = "";
  renderMine();
  if (mineTimer) clearInterval(mineTimer);
  mineTimer = setInterval(() => {
    const scr = document.getElementById("mineScreen");
    if (!scr || scr.classList.contains("hidden")) { clearInterval(mineTimer); mineTimer = null; return; }
    renderMine();
  }, 1000);
}

function renderMine() {
  const rem = mineRemaining();
  const btn = document.getElementById("mineDigBtn");
  document.getElementById("mineStatus").textContent =
    "💙 Mana: " + Math.floor(state.mana) + " / " + state.manaMax + (rem > 0 ? " · ⏳ Próxima escavada em " + formatDuration(rem) : " · ✅ Pronto para escavar");
  btn.textContent = "⛏️ Escavar — " + MINE_MANA_COST + " Mana";
  btn.disabled = rem > 0 || state.mana < MINE_MANA_COST;
  document.getElementById("mineResult").textContent = mineLastResult;
}

function mineRoll() {
  let r = Math.random() * 100;
  for (const l of MINE_LOOT) {
    if (r < l.chance) return { item: l.item, qty: l.min + Math.floor(Math.random() * (l.max - l.min + 1)) };
    r -= l.chance;
  }
  return null;
}

function mineDig() {
  if (mineRemaining() > 0) return;
  if (state.mana < MINE_MANA_COST) { showToast("Mana insuficiente (precisa de " + MINE_MANA_COST + ")."); return; }
  const r = mineRoll();
  if (r && !(state.inventory[r.item] > 0) && bagFree() < 1) { showToast("🎒 Mochila cheia! Libere espaço para escavar."); return; }
  state.mana -= MINE_MANA_COST;
  state.mining.readyAt = Date.now() + MINE_COOLDOWN_MS;
  if (r) {
    state.inventory[r.item] = (state.inventory[r.item] || 0) + r.qty;
    const it = ITEMS.find(i => i.id === r.item);
    mineLastResult = "⛏️ Você encontrou +" + r.qty + " " + (it ? it.icon + " " + it.name : r.item) + "!";
  } else {
    mineLastResult = "⛏️ Só pedra comum desta vez... nada de valor.";
  }
  saveState();
  render();
  renderMine();
  showToast(mineLastResult);
}
