// ============================================================
// vip.js — VIP de 30 dias (comprado por Pix). O fim do VIP é decidido pelo servidor; aqui só mostramos e avisamos.
// Benefícios (aplicados em: outcome.js/quests.js/map.js/stats.js/social.js):
//   2 Essências por nível · viagens instantâneas · +50% de Sorte · missões com o dobro de Cobre e XP · ⭐ ao lado do nome.
// ============================================================

const VIP_PRICE_TEXT = "R$ 10,00"; // só para mostrar — o preço de verdade fica no servidor (PACKS.vip30)
const VIP_DAYS = 30;

const VIP_BENEFITS = [
  "💎 2 Essências Arcanas por nível (jogador comum ganha 1)",
  "🧭 Todas as viagens são instantâneas",
  "🍀 +50% no atributo Sorte (40% vira 60%)",
  "📜 Missões dão o dobro de Cobre e o dobro de XP",
  "⭐ Ícone de VIP ao lado do seu nome"
];

function vipScreenVisible() {
  const s = document.getElementById("vipScreen");
  return s && !s.classList.contains("hidden");
}

function vipRemainingText() {
  const ms = state.vipUntil - Date.now();
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const until = new Date(state.vipUntil).toLocaleDateString("pt-BR");
  if (days >= 1) return days + (days === 1 ? " dia" : " dias") + " restantes (até " + until + ")";
  if (hours >= 1) return hours + (hours === 1 ? " hora" : " horas") + " restantes (até " + until + ")";
  return "menos de 1 hora restante";
}

function vipEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function openVip() {
  hideAllScreens();
  document.getElementById("vipScreen").classList.remove("hidden");
  renderVip();
}

function renderVip() {
  const box = document.getElementById("vipCard");
  if (!box) return;
  box.innerHTML = "";
  const active = isVip();

  box.appendChild(vipEl("div", "inv-title", active ? "⭐ VIP ativo" : "⭐ Seja VIP"));
  const st = vipEl("div", "hint", active ? "⏳ " + vipRemainingText() : "Você ainda não é VIP.");
  st.style.marginBottom = "8px";
  box.appendChild(st);

  box.appendChild(vipEl("div", "hint", "BENEFÍCIOS"));
  VIP_BENEFITS.forEach(t => {
    const line = vipEl("div", "qr-line", t);
    line.style.margin = "4px 0";
    box.appendChild(line);
  });

  const cloudOk = typeof cloudEnabled === "function" && cloudEnabled();
  const btn = vipEl("button", "confirm-btn", (active ? "Renovar: +" : "Comprar VIP: ") + VIP_DAYS + " dias por " + VIP_PRICE_TEXT);
  btn.style.marginTop = "12px";
  if (!cloudOk) { btn.disabled = true; }
  btn.onclick = buyVip;
  box.appendChild(btn);
  box.appendChild(vipEl("div", "hint", cloudOk
    ? (active ? "Os " + VIP_DAYS + " dias novos são somados ao tempo que você ainda tem." : "Pagamento por Pix. O VIP ativa sozinho assim que o pagamento é confirmado.")
    : "A compra só funciona dentro do Telegram."));
}

async function buyVip() {
  if (typeof openPix !== "function") return;
  openPix("vip");
  await buyPixPack("vip30");
  if (!pixOrder) { pixReturn = ""; openVip(); } // não gerou o Pix (erro/sem conexão): volta para a tela VIP
}

// Atualiza a tela do VIP se ela estiver aberta (chamada ao receber a carteira do servidor).
function vipRefresh() {
  if (vipScreenVisible()) renderVip();
  vipCheckExpiry();
}

// Avisa uma única vez quando o VIP vence.
function vipCheckExpiry() {
  if (!state.vipUntil || state.vipUntil > Date.now()) return;
  if (state.vipNoticed === state.vipUntil) return;
  state.vipNoticed = state.vipUntil;
  recalcStats(); // a Sorte volta ao normal
  saveState();
  render();
  const msg = "⭐ Seu VIP expirou. Renove na tela VIP para voltar a ter os benefícios.";
  if (typeof tg !== "undefined" && tg && typeof tg.showAlert === "function") tg.showAlert(msg);
  else showToast(msg);
  if (vipScreenVisible()) renderVip();
}

setInterval(() => { if (state && state.characterCreated) vipCheckExpiry(); }, 30000);
