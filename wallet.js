// ============================================================
// wallet.js — Carteira protegida pelo servidor (anti-trapaça).
// A Essência, os espaços da mochila e o Amuleto são do SERVIDOR: o aparelho só mostra e pede.
// Ganhos de Essência (nível, missão) são pagos pelo servidor ao receber o save; gastos passam por walletSpend().
// Fora do Telegram (teste no navegador) continua tudo local.
// ============================================================

let walletVer = -1;     // versão da carteira que o aparelho já aplicou (ignora respostas mais antigas)
let walletBusy = false;
let cheatHandled = false;

// Salva só no aparelho (sem avisar a nuvem — evita um laço de salvar → responder → salvar).
function persistLocal() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
}

// Aplica a carteira oficial vinda do servidor.
function applyWallet(w) {
  if (!w || typeof w.ver !== "number" || w.ver < walletVer) return;
  walletVer = w.ver;
  const changed = state.essence !== w.essence || state.bagSlots !== w.bagSlots || !!state.purchasedItems.amuleto_forca !== !!w.amulet;
  state.essence = w.essence;
  state.bagSlots = w.bagSlots;
  if (w.amulet) state.purchasedItems.amuleto_forca = true; else delete state.purchasedItems.amuleto_forca;
  if (!changed) return;
  recalcStats();
  persistLocal();
  render();
  const visible = id => { const e = document.getElementById(id); return e && !e.classList.contains("hidden"); };
  if (visible("mochilaScreen")) renderInventory();
  if (visible("merchantScreen")) renderMerchant();
}

// Gasta Essência no servidor. Devolve true se o servidor aprovou (e já descontou). reason: revive | respec | bag_slot | amulet
async function walletSpend(reason) {
  if (walletBusy) return false;
  walletBusy = true;
  try {
    if (typeof cloudPushNow === "function") await cloudPushNow(); // garante que ganhos recentes já foram pagos
    const r = await cloudCall("wallet_spend", { reason: reason });
    if (r.wallet) applyWallet(r.wallet);
    if (!r.ok) showToast(r.error === "already" ? "Você já possui este item." : "💎 Essência insuficiente.");
    return !!r.ok;
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
    return false;
  } finally {
    walletBusy = false;
  }
}

// O servidor recusou um save impossível: avisa o jogador e volta ao último estado válido.
function handleCheat(r) {
  if (cheatHandled) return;
  cheatHandled = true;
  cloudReady = false; // para de enviar saves até recarregar
  const msg = "⚠️ Detectamos uma alteração impossível no seu progresso. Seu jogo foi restaurado para o último estado válido e a conta foi marcada para análise.";
  const done = () => { if (r && r.save) location.reload(); };
  if (r && r.save) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r.save)); } catch (e) { /* ignora */ }
  }
  if (typeof tg !== "undefined" && tg && typeof tg.showAlert === "function") tg.showAlert(msg, done);
  else { alert(msg); done(); }
}
