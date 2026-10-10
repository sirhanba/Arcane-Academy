// ============================================================
// social.js — Aba Social: Ranking de jogadores (lido do servidor ao abrir a aba).
// ============================================================

const RANKING_MEDALS = ["🥇", "🥈", "🥉"];

// ---------- Ponto vermelho do botão Social ----------
// Aparece quando chega um pedido de amizade novo; some quando o jogador abre a aba Social.
let socialIncoming = 0;
let socialSeen = 0;
try { socialSeen = parseInt(localStorage.getItem("arcanum_social_seen"), 10) || 0; } catch (e) { /* sem storage: tudo bem */ }

function refreshSocialDot() {
  const dot = document.getElementById("socialDot");
  if (dot) dot.classList.toggle("hidden", !(socialIncoming > socialSeen));
}

function markSocialSeen() {
  socialSeen = socialIncoming;
  try { localStorage.setItem("arcanum_social_seen", String(socialSeen)); } catch (e) { /* ignora */ }
  refreshSocialDot();
}

// Chamado pelo sinal de vida (cloud.js) com o número de pedidos esperando resposta.
function updateSocialDot(n) {
  const grew = n > socialIncoming;
  socialIncoming = n;
  if (socialSeen > socialIncoming) { socialSeen = socialIncoming; markSocialSeen(); }
  const screen = document.getElementById("socialScreen");
  if (screen && !screen.classList.contains("hidden")) {
    // O jogador já está na aba: atualiza a lista em vez de acender o ponto.
    if (grew) renderFriends();
    markSocialSeen();
    return;
  }
  refreshSocialDot();
}

function openSocial() {
  markSocialSeen();
  startChat();
  renderFriends();
  renderRanking();
}

async function renderRanking() {
  const box = document.getElementById("rankingList");
  const mine = document.getElementById("rankingMe");
  if (!box) return;
  mine.textContent = "";

  if (typeof cloudEnabled !== "function" || !cloudEnabled()) {
    box.innerHTML = '<div class="hint">O ranking só funciona dentro do Telegram.</div>';
    return;
  }
  box.innerHTML = '<div class="hint">Carregando ranking…</div>';

  try {
    // Garante que o seu progresso mais recente já está no servidor antes de ler o ranking.
    if (typeof cloudPushNow === "function") await cloudPushNow();
    const r = await cloudCall("ranking");
    box.innerHTML = "";
    const top = r.top || [];
    if (top.length === 0) {
      box.innerHTML = '<div class="hint">Ainda não há jogadores no ranking.</div>';
    }
    top.forEach((p, i) => {
      const house = HOUSES.find(h => h.id === p.house);
      const row = document.createElement("div");
      row.className = "upgrade-row";
      if (p.isMe) row.style.background = "rgba(232,193,90,0.12)";

      const pos = document.createElement("span");
      pos.className = "upgrade-icon";
      pos.textContent = i < 3 ? RANKING_MEDALS[i] : "#" + (i + 1);

      const info = document.createElement("div");
      info.className = "upgrade-info";
      const nm = document.createElement("div");
      nm.className = "uname";
      nm.textContent = (house ? house.icon + " " : "") + (p.name || "?") + (p.isMe ? " (você)" : "");
      info.appendChild(nm);

      const lv = document.createElement("div");
      lv.style.fontWeight = "bold";
      lv.textContent = "Nv. " + (p.level || 1);

      row.appendChild(pos);
      row.appendChild(info);
      row.appendChild(lv);
      box.appendChild(row);
    });
    if (r.me) {
      mine.textContent = "Você: #" + r.me.rank + " de " + r.me.total + " jogadores";
    }
  } catch (e) {
    box.innerHTML = '<div class="hint">Não foi possível carregar o ranking. Tente abrir a aba de novo.</div>';
  }
}

// ============================================================
// AMIGOS: adicionar pelo nickname (pedido + aceite), lista com bolinha verde de online.
// ============================================================

const FRIEND_ERRORS = {
  not_found: "Jogador não encontrado.",
  self: "Você não pode adicionar a si mesmo.",
  already_friends: "Vocês já são amigos.",
  already_pending: "Você já enviou um pedido para esse jogador.",
  limit_me: "Você atingiu o limite de 50 amigos.",
  limit_them: "Esse jogador não pode receber mais pedidos agora.",
  too_many_pending: "Você tem pedidos pendentes demais. Aguarde ou cancele alguns.",
  no_request: "Esse pedido não existe mais."
};

let friendsData = { friends: [], incoming: [], outgoing: [], max: 50 };
let friendOpen = null; // nickname do amigo com o painel de ações aberto

function friendEl(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function friendHouseIcon(houseId) {
  const h = HOUSES.find(x => x.id === houseId);
  return h ? h.icon + " " : "";
}

async function renderFriends() {
  const list = document.getElementById("friendsList");
  if (!list) return;
  if (!cloudEnabled()) {
    document.getElementById("friendsIncoming").innerHTML = "";
    document.getElementById("friendsOutgoing").innerHTML = "";
    list.innerHTML = '<div class="hint">Amigos só funcionam dentro do Telegram.</div>';
    return;
  }
  try {
    const r = await cloudCall("friends_list");
    if (!r.ok) throw new Error("friends_list");
    friendsData = r;
    socialIncoming = r.incoming.length;
    markSocialSeen();
  } catch (e) {
    list.innerHTML = '<div class="hint">Não foi possível carregar os amigos. Tente abrir a aba de novo.</div>';
    return;
  }
  drawFriends();
}

function drawFriends() {
  const d = friendsData;
  document.getElementById("friendsTitle").textContent = "👥 Amigos (" + d.friends.length + "/" + d.max + ")";

  // Pedidos recebidos
  const inc = document.getElementById("friendsIncoming");
  inc.innerHTML = "";
  if (d.incoming.length) {
    inc.appendChild(friendEl("div", "hint", "📨 Pedidos recebidos"));
    d.incoming.forEach(p => {
      const row = friendEl("div", "upgrade-row");
      const info = friendEl("div", "upgrade-info");
      info.appendChild(friendEl("div", "uname", friendHouseIcon(p.house) + p.name));
      info.appendChild(friendEl("div", "udesc", "Nv. " + p.level));
      const btns = friendEl("div");
      btns.style.cssText = "display:flex;gap:6px;";
      const ok = friendEl("button", "upgrade-buy", "Aceitar");
      ok.onclick = () => friendAction("friend_accept", p.name, "🤝 " + p.name + " agora é seu amigo!");
      const no = friendEl("button", "upgrade-buy", "Recusar");
      no.onclick = () => friendAction("friend_remove", p.name, "Pedido recusado");
      btns.appendChild(ok);
      btns.appendChild(no);
      row.appendChild(info);
      row.appendChild(btns);
      inc.appendChild(row);
    });
  }

  // Lista de amigos
  const list = document.getElementById("friendsList");
  list.innerHTML = "";
  if (d.friends.length === 0) {
    list.appendChild(friendEl("div", "hint", "Você ainda não tem amigos. Digite o nickname de um jogador acima."));
  }
  d.friends.forEach(p => {
    const row = friendEl("div", "upgrade-row");
    row.style.cursor = "pointer";
    row.onclick = () => { friendOpen = friendOpen === p.name ? null : p.name; drawFriends(); };
    const dot = friendEl("span", "", p.online ? "🟢" : "⚪");
    dot.title = p.online ? "Online" : "Offline";
    dot.style.marginRight = "8px";
    const info = friendEl("div", "upgrade-info");
    info.appendChild(friendEl("div", "uname", friendHouseIcon(p.house) + p.name));
    info.appendChild(friendEl("div", "udesc", p.online ? "Online" : "Offline"));
    row.appendChild(dot);
    row.appendChild(info);
    row.appendChild(friendEl("div", "", "Nv. " + p.level));
    list.appendChild(row);

    if (friendOpen === p.name) {
      const panel = friendEl("div", "upgrade-row");
      panel.style.cssText = "gap:6px;flex-wrap:wrap;justify-content:flex-end;";
      const gift = friendEl("button", "upgrade-buy", "🎁 Presente");
      gift.disabled = true; gift.title = "Em breve";
      const duel = friendEl("button", "upgrade-buy", "⚔️ Desafiar");
      duel.disabled = true; duel.title = "Em breve";
      const rm = friendEl("button", "upgrade-buy", "🗑️ Remover");
      rm.onclick = () => {
        if (!confirm("Remover " + p.name + " dos amigos?")) return;
        friendOpen = null;
        friendAction("friend_remove", p.name, "Amigo removido");
      };
      panel.appendChild(gift);
      panel.appendChild(duel);
      panel.appendChild(rm);
      list.appendChild(panel);
    }
  });

  // Pedidos enviados
  const out = document.getElementById("friendsOutgoing");
  out.innerHTML = "";
  if (d.outgoing.length) {
    out.appendChild(friendEl("div", "hint", "⏳ Pedidos enviados"));
    d.outgoing.forEach(p => {
      const row = friendEl("div", "upgrade-row");
      const info = friendEl("div", "upgrade-info");
      info.appendChild(friendEl("div", "uname", friendHouseIcon(p.house) + p.name));
      info.appendChild(friendEl("div", "udesc", "Aguardando resposta"));
      const cancel = friendEl("button", "upgrade-buy", "Cancelar");
      cancel.onclick = () => friendAction("friend_remove", p.name, "Pedido cancelado");
      row.appendChild(info);
      row.appendChild(cancel);
      out.appendChild(row);
    });
  }
}

// Executa uma ação de amizade no servidor e recarrega a lista.
async function friendAction(action, name, okMsg) {
  try {
    const r = await cloudCall(action, { name: name });
    if (!r.ok) { showToast("❌ " + (FRIEND_ERRORS[r.error] || "Não foi possível concluir.")); }
    else { showToast(okMsg); }
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
  }
  renderFriends();
}

// Envia um pedido de amizade (usado pela busca e pelo chat). Devolve true se deu certo.
async function requestFriend(name) {
  if (!cloudEnabled()) { showToast("Amigos só funcionam dentro do Telegram."); return false; }
  let ok = false;
  try {
    const r = await cloudCall("friend_request", { name: name });
    if (!r.ok) {
      showToast("❌ " + (FRIEND_ERRORS[r.error] || "Não foi possível enviar o pedido."));
    } else {
      ok = true;
      showToast(r.accepted ? "🤝 " + name + " agora é seu amigo!" : "📨 Pedido enviado para " + name);
    }
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
  }
  renderFriends();
  return ok;
}

async function sendFriendRequest() {
  const input = document.getElementById("friendInput");
  const name = input.value.trim();
  if (!name) return;
  if (await requestFriend(name)) input.value = "";
}

// ============================================================
// CHAT GERAL: todos os jogadores; atualiza a cada 10 s enquanto a aba Social está aberta.
// O filtro de palavrões roda no servidor.
// ============================================================

const CHAT_POLL_MS = 10000;
const CHAT_MAX_LOCAL = 100;
let chatTimer = null;
let chatMsgs = [];
let chatLastId = 0;
let chatBusy = false;

function chatMuted(name) {
  return (state.mutedNames || []).includes(String(name).toLowerCase());
}

function startChat() {
  chatMsgs = [];
  chatLastId = 0;
  document.getElementById("chatBox").innerHTML = "";
  closeChatUser();
  if (!cloudEnabled()) {
    document.getElementById("chatBox").innerHTML = '<div class="hint">O chat só funciona dentro do Telegram.</div>';
    return;
  }
  chatPoll();
  if (chatTimer) clearInterval(chatTimer);
  chatTimer = setInterval(() => {
    const screen = document.getElementById("socialScreen");
    if (!screen || screen.classList.contains("hidden")) { clearInterval(chatTimer); chatTimer = null; return; }
    if (!document.hidden) chatPoll();
  }, CHAT_POLL_MS);
}

async function chatPoll() {
  if (chatBusy) return;
  chatBusy = true;
  try {
    const r = await cloudCall("chat_list", { after: chatLastId });
    if (r.ok && r.messages && r.messages.length) {
      r.messages.forEach(m => { chatMsgs.push(m); chatLastId = Math.max(chatLastId, m.id); });
      if (chatMsgs.length > CHAT_MAX_LOCAL) chatMsgs = chatMsgs.slice(-CHAT_MAX_LOCAL);
      drawChat();
    } else if (chatMsgs.length === 0) {
      drawChat();
    }
  } catch (e) { /* sem conexão: tenta de novo no próximo ciclo */ }
  chatBusy = false;
}

function drawChat() {
  const box = document.getElementById("chatBox");
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  box.innerHTML = "";
  const shown = chatMsgs.filter(m => m.mine || !chatMuted(m.name));
  if (shown.length === 0) {
    box.appendChild(friendEl("div", "hint", "Nenhuma mensagem ainda. Seja o primeiro!"));
  }
  shown.forEach(m => {
    const line = friendEl("div");
    line.style.marginBottom = "3px";
    const who = friendEl("b", "", friendHouseIcon(m.house) + m.name);
    who.style.color = m.mine ? "#e8c15a" : "#9ad0ff";
    if (!m.mine) { who.style.cursor = "pointer"; who.onclick = () => openChatUser(m.name); }
    line.appendChild(who);
    line.appendChild(document.createTextNode(": " + m.text));
    box.appendChild(line);
  });
  if (nearBottom || chatMsgs.length <= CHAT_SHOW) box.scrollTop = box.scrollHeight;
}

function openChatUser(name) {
  const panel = document.getElementById("chatUserPanel");
  panel.innerHTML = "";
  panel.appendChild(friendEl("div", "uname", name));
  const row = friendEl("div");
  row.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;";
  const add = friendEl("button", "upgrade-buy", "➕ Adicionar amigo");
  add.onclick = async () => { closeChatUser(); await requestFriend(name); };
  const mute = friendEl("button", "upgrade-buy", chatMuted(name) ? "🔊 Reativar" : "🔇 Silenciar");
  mute.onclick = () => { toggleChatMute(name); closeChatUser(); };
  const close = friendEl("button", "upgrade-buy", "Fechar");
  close.onclick = closeChatUser;
  row.appendChild(add);
  row.appendChild(mute);
  row.appendChild(close);
  panel.appendChild(row);
  panel.classList.remove("hidden");
}

function closeChatUser() {
  document.getElementById("chatUserPanel").classList.add("hidden");
}

function toggleChatMute(name) {
  const key = String(name).toLowerCase();
  const list = state.mutedNames || (state.mutedNames = []);
  const i = list.indexOf(key);
  if (i >= 0) { list.splice(i, 1); showToast("🔊 " + name + " reativado"); }
  else { list.push(key); if (list.length > 100) list.shift(); showToast("🔇 " + name + " silenciado"); }
  saveState();
  drawChat();
}

const CHAT_ERRORS = {
  slow: "Calma! Espere alguns segundos entre as mensagens.",
  empty: "Digite uma mensagem.",
  no_character: "Crie seu personagem antes de usar o chat."
};

async function sendChat() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  if (!cloudEnabled()) { showToast("O chat só funciona dentro do Telegram."); return; }
  try {
    const r = await cloudCall("chat_send", { text: text });
    if (!r.ok) { showToast("❌ " + (CHAT_ERRORS[r.error] || "Não foi possível enviar.")); return; }
    input.value = "";
    chatPoll();
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
  }
}
