// ============================================================
// altar.js — Altar de Mana (Vale dos Cristais): restaura toda a Mana de graça, 1 vez por hora.
// A espera usa o relógio do celular. Não dá item, então não usa a mochila.
// ============================================================
const ALTAR_COOLDOWN_MS = 60 * 60 * 1000;

let altarTimer = null;
let altarLastResult = "";

function altarRemaining() { return Math.max(0, (state.altar.readyAt || 0) - Date.now()); }

function openAltar() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("altarScreen").classList.remove("hidden");
  altarLastResult = "";
  renderAltar();
  if (altarTimer) clearInterval(altarTimer);
  altarTimer = setInterval(() => {
    const scr = document.getElementById("altarScreen");
    if (!scr || scr.classList.contains("hidden")) { clearInterval(altarTimer); altarTimer = null; return; }
    renderAltar();
  }, 1000);
}

function renderAltar() {
  const rem = altarRemaining();
  const full = state.mana >= state.manaMax;
  document.getElementById("altarStatus").textContent =
    "💙 Mana: " + Math.floor(state.mana) + " / " + state.manaMax + (rem > 0 ? " · ⏳ Próximo uso em " + formatDuration(rem) : " · ✅ Altar pronto");
  const btn = document.getElementById("altarBtn");
  btn.textContent = "💠 Receber a energia do Altar";
  btn.disabled = rem > 0 || full;
  document.getElementById("altarResult").textContent = altarLastResult || (full && rem === 0 ? "Sua Mana já está cheia." : "");
}

function useAltar() {
  if (altarRemaining() > 0 || state.mana >= state.manaMax) return;
  const gained = state.manaMax - Math.floor(state.mana);
  state.mana = state.manaMax;
  state.altar.readyAt = Date.now() + ALTAR_COOLDOWN_MS;
  altarLastResult = "💠 O Altar restaurou toda a sua Mana (+" + gained + ")!";
  saveState();
  render();
  renderAltar();
  showToast(altarLastResult);
}
