// ============================================================
// social.js — Aba Social: Ranking de jogadores (lido do servidor ao abrir a aba).
// ============================================================

const RANKING_MEDALS = ["🥇", "🥈", "🥉"];

function openSocial() {
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

async function sendFriendRequest() {
  const input = document.getElementById("friendInput");
  const name = input.value.trim();
  if (!name) return;
  if (!cloudEnabled()) { showToast("Amigos só funcionam dentro do Telegram."); return; }
  try {
    const r = await cloudCall("friend_request", { name: name });
    if (!r.ok) {
      showToast("❌ " + (FRIEND_ERRORS[r.error] || "Não foi possível enviar o pedido."));
    } else {
      input.value = "";
      showToast(r.accepted ? "🤝 " + name + " agora é seu amigo!" : "📨 Pedido enviado para " + name);
    }
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
  }
  renderFriends();
}
