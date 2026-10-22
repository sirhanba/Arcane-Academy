// ============================================================
// portal.js — Portal entre as Cavernas Ecoantes e a Academia (ida e volta).
// Atravessar custa 500 Cobre e o portal precisa de 30 minutos para se recarregar (relógio do celular).
// A espera é uma só, valendo para os dois lados. A travessia é instantânea e ignora as conexões do mapa.
// ============================================================
const PORTAL_COST = 500;
const PORTAL_COOLDOWN_MS = 30 * 60 * 1000;
const PORTAL_ENDS = ["cavernas", "academia"];

let portalTimer = null;

function portalHere() { return PORTAL_ENDS.includes(state.currentLocation); }
function portalDest() { return state.currentLocation === PORTAL_ENDS[0] ? PORTAL_ENDS[1] : PORTAL_ENDS[0]; }
function portalRemaining() { return Math.max(0, (state.portal.readyAt || 0) - Date.now()); }

function openPortal() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("portalScreen").classList.remove("hidden");
  renderPortal();
  if (portalTimer) clearInterval(portalTimer);
  portalTimer = setInterval(() => {
    const scr = document.getElementById("portalScreen");
    if (!scr || scr.classList.contains("hidden")) { clearInterval(portalTimer); portalTimer = null; return; }
    renderPortal();
  }, 1000);
}

function renderPortal() {
  const rem = portalRemaining();
  const here = portalHere();
  const dest = here ? locById(portalDest()) : null;
  document.getElementById("portalStatus").textContent = !here
    ? "O portal só funciona nas Cavernas Ecoantes e na Academia."
    : "Destino: " + dest.icon + " " + dest.name + " · " + (rem > 0 ? "⏳ Recarregando: " + formatDuration(rem) : "✅ Portal pronto");
  const btn = document.getElementById("portalBtn");
  btn.textContent = "🌀 Atravessar — 🪙 " + PORTAL_COST;
  btn.disabled = !here || rem > 0 || state.gold < PORTAL_COST || !!state.travelTarget;
  document.getElementById("portalNote").textContent = here && rem === 0 && state.gold < PORTAL_COST ? "Você não tem Cobre suficiente." : "";
}

function usePortal() {
  if (!portalHere() || portalRemaining() > 0 || state.travelTarget) return;
  if (state.gold < PORTAL_COST) { showToast("Cobre insuficiente."); return; }
  const dest = locById(portalDest());
  state.gold -= PORTAL_COST;
  state.portal.readyAt = Date.now() + PORTAL_COOLDOWN_MS;
  state.currentLocation = dest.id;
  addStat("travels"); // conquistas
  saveState();
  render();
  openMap();
  showToast("🌀 Você atravessou o portal e chegou em " + dest.name + "!");
}
