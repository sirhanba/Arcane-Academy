// ============================================================
// social.js — Aba Social: Ranking de jogadores (lido do servidor ao abrir a aba).
// ============================================================

const RANKING_MEDALS = ["🥇", "🥈", "🥉"];

function openSocial() {
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
