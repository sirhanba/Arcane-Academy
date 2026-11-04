// ============================================================
// main.js — Inicialização do jogo e loop principal (viagem, derrota).
// ============================================================

let state = loadState();

recalcStats();
cloudInit();

// Avisos do bot: o Telegram só deixa o bot escrever para quem permitiu. Pedimos UMA vez (janela nativa do Telegram),
// depois da introdução e do tutorial, e fora do combate.
function askBotWriteAccess() {
  if (!tg || typeof tg.requestWriteAccess !== "function") return;
  if (!state.characterCreated || !state.house || tutorialNeeded()) return;
  if (state.intro.notif) return;
  const cs = document.getElementById("combatScreen");
  if (cs && !cs.classList.contains("hidden")) return;
  state.intro.notif = true;
  saveState();
  const u = tg.initDataUnsafe && tg.initDataUnsafe.user;
  if (u && u.allows_write_to_pms) return; // já permitido
  try { if (!tg.isVersionAtLeast || tg.isVersionAtLeast("6.9")) tg.requestWriteAccess(); } catch (e) {}
}

setInterval(() => {
  askBotWriteAccess();
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
if (tutorialNeeded()) tutorialStart(); // fechou o jogo no meio do tutorial: recomeça


// ---------- Reportar bugs: abre um chat com o criador no Telegram ----------
const BUG_REPORT_TG_USER = "thiagomaia_dev";
function openTgChat(title, prompt) {
  if (!BUG_REPORT_TG_USER) { showToast("Canal ainda não configurado."); return; }
  const text = encodeURIComponent(title + "\nNível: " + state.level + "\nLocal: " + (state.currentLocation || "-") + "\n\n" + prompt + "\n");
  const url = "https://t.me/" + BUG_REPORT_TG_USER + "?text=" + text;
  if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
}
function openBugReport() { openTgChat("🐞 Bug no Arcanum", "O que aconteceu:"); }
function openFeedback() { openTgChat("💬 Feedback sobre o Arcanum", "Minha opinião:"); }
