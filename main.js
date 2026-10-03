// ============================================================
// main.js — Inicialização do jogo e loop principal (viagem, derrota).
// ============================================================

let state = loadState();

recalcStats();
cloudInit();

setInterval(() => {
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
