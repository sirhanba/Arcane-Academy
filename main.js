// ============================================================
// main.js — Inicialização do jogo e loop principal (regeneração de mana, viagem, derrota).
// ============================================================

let state = loadState();

recalcStats();

// Regeneração de mana — intervalo dinâmico (afetado pelo upgrade "regen")
const BASE_REGEN_MS = 10000;

const MIN_REGEN_MS = 3000;

let regenAccumulator = 0;

setInterval(() => {
  regenAccumulator += 1000;
  const regenLevel = state.upgrades.regen || 0;
  const houseRegenBonus = state.house === "noctivia" ? 2000 : 0;
  const currentInterval = Math.max(MIN_REGEN_MS, BASE_REGEN_MS - regenLevel * 1000 - houseRegenBonus);
  if (regenAccumulator >= currentInterval) {
    regenAccumulator = 0;
    if (state.mana < state.manaMax) {
      state.mana += 1;
      saveState();
      render();
    }
  }

  // Viagem no mapa
  if (state.travelTarget) {
    const arrivedNow = Date.now() >= state.travelArrivesAt;
    checkTravelArrival();
    if (!document.getElementById("mapScreen").classList.contains("hidden")) {
      if (arrivedNow) {
        renderMapNodes();
        renderLocationPanel(state.currentLocation);
      }
      updateTravelBanner();
    }
  }

  // Derrota / reviver
  if (state.defeatedUntil) {
    if (Date.now() >= state.defeatedUntil) {
      revivePlayer();
    } else if (!document.getElementById("defeatScreen").classList.contains("hidden")) {
      updateDefeatTimer();
    }
  }
}, 1000);

initScreen();

if (state.characterCreated && state.house) render();
