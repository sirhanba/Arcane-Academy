// ============================================================
// witch.js — A Cabana da Bruxa (Pântano dos Murmúrios) e a Vassoura Voadora.
// A vassoura ocupa 1 espaço da mochila e funciona só de estar lá: cada viagem vira instantânea e gasta 1 carga.
// Zerou as cargas, ela se destrói. Não pode ser vendida (não é equipamento nem material) nem anunciada no Bazar.
// ============================================================
const BROOM_PRICE = 20000;  // Cobre
const BROOM_CHARGES = 30;   // viagens por vassoura

function hasBroom() { return (state.broomCharges || 0) > 0; }

function openWitch() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("witchScreen").classList.remove("hidden");
  renderWitch();
}

function renderWitch() {
  const have = hasBroom();
  document.getElementById("witchStatus").textContent = have
    ? "🧹 Sua vassoura: " + state.broomCharges + " / " + BROOM_CHARGES + " cargas."
    : "Você não tem uma vassoura voadora.";
  const btn = document.getElementById("witchBuyBtn");
  btn.textContent = "🧹 Comprar Vassoura Voadora — 🪙 " + BROOM_PRICE.toLocaleString("pt-BR");
  btn.disabled = have || state.gold < BROOM_PRICE;
  document.getElementById("witchNote").textContent = have
    ? "Você já tem uma vassoura. Quando as cargas acabarem, ela se desfaz e você pode comprar outra."
    : (state.gold < BROOM_PRICE ? "Você ainda não tem Cobre suficiente." : "");
}

function buyBroom() {
  if (hasBroom()) { showToast("Você já tem uma vassoura."); return; }
  if (state.gold < BROOM_PRICE) { showToast("Cobre insuficiente."); return; }
  if (bagFree() < 1) { showToast("🎒 Mochila cheia! Libere espaço."); return; }
  if (!confirm("Comprar a Vassoura Voadora por " + BROOM_PRICE.toLocaleString("pt-BR") + " Cobre? Ela tem " + BROOM_CHARGES + " cargas e não pode ser vendida.")) return;
  state.gold -= BROOM_PRICE;
  state.broomCharges = BROOM_CHARGES;
  saveState();
  render();
  renderWitch();
  showToast("🧹 Vassoura Voadora comprada! Suas viagens agora são instantâneas.");
}

// Chamado quando uma viagem começa. Devolve true se a vassoura foi usada (viagem instantânea).
function useBroomForTravel() {
  if (!hasBroom()) return false;
  state.broomCharges -= 1;
  if (state.broomCharges <= 0) {
    state.broomCharges = 0;
    showToast("🧹 Sua vassoura gastou a última carga e se desfez.");
  }
  return true;
}

// Detalhe da vassoura (tocada na mochila)
function openBroomDetail() {
  const panel = document.getElementById("slotPickerPanel");
  document.getElementById("slotPickerTitle").textContent = "🧹 Vassoura Voadora";
  document.getElementById("slotPickerList").innerHTML =
    '<div class="slot-item-row">' +
      '<span class="upgrade-icon">🧹</span>' +
      '<div class="upgrade-info"><div class="udesc">Torna suas viagens instantâneas. Cada viagem gasta 1 carga; sem cargas, ela se desfaz. Não precisa equipar e não pode ser vendida.</div>' +
      '<div class="udesc">Cargas: ' + (state.broomCharges || 0) + ' / ' + BROOM_CHARGES + '</div></div>' +
    '</div>';
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
