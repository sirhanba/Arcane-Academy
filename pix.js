// ============================================================
// pix.js — Comprar Essência com Pix (Mercado Pago).
// O aparelho só escolhe o pacote; preço, QR Code e crédito são feitos no servidor.
// ============================================================

// Só para mostrar na tela — o preço de verdade fica no servidor (PACKS em supabase/2_funcao_sync.ts).
const PIX_PACKS = [
  { id: "p25", essence: 25, price: "R$ 5,00" },
  { id: "p50", essence: 50, price: "R$ 10,00" },
  { id: "p100", essence: 100, price: "R$ 15,00" }
];
const PIX_POLL_MS = 5000;

let pixOrder = null;
let pixPollTimer = null;
let pixTickTimer = null;
let pixBusy = false;

function pixScreenVisible() {
  const s = document.getElementById("pixScreen");
  return s && !s.classList.contains("hidden");
}

function pixStopTimers() {
  if (pixPollTimer) { clearInterval(pixPollTimer); pixPollTimer = null; }
  if (pixTickTimer) { clearInterval(pixTickTimer); pixTickTimer = null; }
}

function pixEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function openPix() {
  hideAllScreens();
  document.getElementById("pixScreen").classList.remove("hidden");
  showPixPacks();
}

function closePix() {
  pixStopTimers();
  pixOrder = null;
  backToMain();
}

function showPixPacks() {
  pixStopTimers();
  pixOrder = null;
  document.getElementById("pixPay").classList.add("hidden");
  const box = document.getElementById("pixPacks");
  box.classList.remove("hidden");
  box.innerHTML = "";
  box.appendChild(pixEl("div", "inv-title", "💎 Seus: " + state.essence));
  if (typeof cloudEnabled !== "function" || !cloudEnabled()) {
    box.appendChild(pixEl("div", "hint", "A compra só funciona dentro do Telegram."));
    return;
  }
  box.appendChild(pixEl("div", "hint", "Pague com Pix: escolha o pacote e escaneie o QR Code (ou use o copia e cola). A Essência chega sozinha."));
  PIX_PACKS.forEach(p => {
    const row = pixEl("div", "upgrade-row");
    row.appendChild(pixEl("span", "upgrade-icon", "💎"));
    const info = pixEl("div", "upgrade-info");
    info.appendChild(pixEl("div", "uname", p.essence + " Essência Arcana"));
    row.appendChild(info);
    const btn = pixEl("button", "upgrade-buy", p.price);
    btn.onclick = () => buyPixPack(p.id);
    row.appendChild(btn);
    box.appendChild(row);
  });
}

const PIX_ERRORS = {
  pix_unavailable: "Pix indisponível no momento. Tente de novo em instantes.",
  too_many: "Muitos pedidos seguidos. Aguarde alguns minutos.",
  no_character: "Crie seu personagem antes de comprar.",
  pack: "Pacote inválido."
};

async function buyPixPack(packId) {
  if (pixBusy) return;
  pixBusy = true;
  try {
    if (typeof cloudPushNow === "function") await cloudPushNow(); // o servidor precisa conhecer o seu personagem
    const r = await cloudCall("pix_create", { pack: packId });
    if (!r.ok) { showToast("❌ " + (PIX_ERRORS[r.error] || "Não foi possível gerar o Pix.")); return; }
    showPixPayment(r.order);
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
  } finally {
    pixBusy = false;
  }
}

function pixCountdownText(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function showPixPayment(order) {
  pixStopTimers();
  pixOrder = order;
  document.getElementById("pixPacks").classList.add("hidden");
  const box = document.getElementById("pixPay");
  box.classList.remove("hidden");
  box.innerHTML = "";

  const pack = PIX_PACKS.find(p => p.id === order.pack);
  box.appendChild(pixEl("div", "hint", "VOCÊ VAI RECEBER"));
  const big = pixEl("div", "inv-title", "💎 " + order.essence + " · " + (pack ? pack.price : "R$ " + (order.cents / 100).toFixed(2).replace(".", ",")));
  box.appendChild(big);

  if (order.qr_base64) {
    const wrap = pixEl("div");
    wrap.style.cssText = "background:#fff;padding:12px;border-radius:12px;width:fit-content;margin:10px auto;";
    const img = document.createElement("img");
    img.src = "data:image/png;base64," + order.qr_base64;
    img.alt = "QR Code Pix";
    img.style.cssText = "display:block;width:220px;height:220px;";
    wrap.appendChild(img);
    box.appendChild(wrap);
  }

  const timer = pixEl("div", "hint", "");
  timer.id = "pixTimer";
  timer.style.textAlign = "center";
  box.appendChild(timer);

  box.appendChild(pixEl("div", "hint", "OU USE O CÓDIGO COPIA E COLA"));
  const code = pixEl("div", "", order.qr_code);
  code.style.cssText = "font-family:monospace;font-size:0.7rem;word-break:break-all;padding:8px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;margin:6px 0;user-select:all;";
  box.appendChild(code);
  const copy = pixEl("button", "craft-btn", "📋 Copiar código");
  copy.onclick = () => copyPixCode(order.qr_code);
  box.appendChild(copy);

  const status = pixEl("div", "hint", "Aguardando pagamento…");
  status.id = "pixStatus";
  status.style.marginTop = "10px";
  box.appendChild(status);
  box.appendChild(pixEl("div", "hint", "1. Abra o app do seu banco · 2. Escaneie o QR ou cole o código · 3. Confirme o pagamento"));

  const other = pixEl("button", "back-link", "‹ Escolher outro pacote");
  other.onclick = showPixPacks;
  box.appendChild(other);

  const tick = () => {
    if (!pixScreenVisible()) { pixStopTimers(); return; }
    const left = Date.parse(order.expires_at) - Date.now();
    timer.textContent = left > 0 ? "⏳ Expira em " + pixCountdownText(left) : "Este Pix expirou.";
  };
  tick();
  pixTickTimer = setInterval(tick, 1000);
  pixPollTimer = setInterval(pixPoll, PIX_POLL_MS);
}

function copyPixCode(text) {
  const ok = () => showToast("📋 Código copiado!");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(ok, () => pixCopyFallback(text, ok));
  } else {
    pixCopyFallback(text, ok);
  }
}

function pixCopyFallback(text, ok) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0;";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); ok(); } catch (e) { showToast("Toque no código e copie manualmente."); }
  ta.remove();
}

async function pixPoll() {
  if (!pixOrder) return;
  if (!pixScreenVisible()) { pixStopTimers(); return; }
  const order = pixOrder;
  try {
    const r = await cloudCall("pix_status", { orderId: order.id });
    if (!pixOrder || pixOrder.id !== order.id) return; // trocou de tela/pedido durante a consulta
    if (!r.ok) return;
    if (r.status === "paid") {
      pixStopTimers();
      if (r.wallet) applyWallet(r.wallet);
      pixOrder = null;
      document.getElementById("pixPay").classList.add("hidden");
      const box = document.getElementById("pixPacks");
      box.classList.remove("hidden");
      showPixPacks();
      box.insertBefore(pixEl("div", "hint", "✅ Pagamento confirmado! +" + order.essence + " 💎 na sua conta."), box.firstChild);
      showToast("✅ Pagamento confirmado! +" + order.essence + " 💎");
    } else if (r.status === "expired") {
      pixStopTimers();
      const st = document.getElementById("pixStatus");
      if (st) st.textContent = "Este Pix expirou. Escolha o pacote de novo para gerar outro.";
    }
  } catch (e) { /* sem conexão: tenta de novo no próximo ciclo */ }
}
