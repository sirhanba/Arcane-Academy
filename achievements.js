// ============================================================
// achievements.js — Conquistas: contadores, degraus, resgate (Cobre / Essência), títulos e tela.
// Para mudar metas e recompensas, edite ACHIEVEMENTS abaixo.
// ATENÇÃO: as metas, a Essência e os títulos precisam ser IGUAIS aos da tabela ACH do servidor (2_funcao_sync.ts);
// o servidor é quem paga a Essência e confere o título.
// Cada conquista tem 4 degraus: Cobre nos 2 primeiros, Essência nos 2 últimos; o último também dá um título.
// ============================================================

const ACHIEVEMENTS = [
  { id: "cacador", icon: "🗡️", name: "Caçador", desc: "Monstros abatidos", counter: "kills", title: "Caçador de Monstros",
    tiers: [{ goal: 10, gold: 30 }, { goal: 50, gold: 100 }, { goal: 200, essence: 1 }, { goal: 1000, essence: 2 }] },
  { id: "quebra_chefes", icon: "👑", name: "Quebra-Chefes", desc: "Chefes derrotados", counter: "bosses", title: "Matador de Chefes",
    tiers: [{ goal: 1, gold: 50 }, { goal: 5, gold: 150 }, { goal: 20, essence: 1 }, { goal: 50, essence: 3 }] },
  { id: "artesao", icon: "🔨", name: "Artesão", desc: "Equipamentos criados", counter: "gearCrafted", title: "Mestre Artesão",
    tiers: [{ goal: 1, gold: 30 }, { goal: 5, gold: 100 }, { goal: 20, essence: 1 }, { goal: 50, essence: 2 }] },
  { id: "alquimista", icon: "🧪", name: "Alquimista", desc: "Poções criadas", counter: "potionsCrafted", title: "Alquimista",
    tiers: [{ goal: 10, gold: 30 }, { goal: 50, gold: 100 }, { goal: 200, essence: 1 }, { goal: 500, essence: 2 }] },
  { id: "aventureiro", icon: "📜", name: "Aventureiro", desc: "Missões completas", counter: "quests", title: "Herói de Arcanum",
    tiers: [{ goal: 1, gold: 50 }, { goal: 2, gold: 100 }, { goal: 5, essence: 1 }, { goal: 10, essence: 2 }] },
  { id: "viajante", icon: "🧭", name: "Viajante", desc: "Viagens feitas", counter: "travels", title: "Andarilho",
    tiers: [{ goal: 5, gold: 30 }, { goal: 25, gold: 100 }, { goal: 100, essence: 1 }, { goal: 300, essence: 2 }] },
  { id: "veterano", icon: "⭐", name: "Veterano", desc: "Nível alcançado", counter: "level", title: "Mestre Arcano",
    tiers: [{ goal: 5, gold: 50 }, { goal: 10, gold: 150 }, { goal: 25, essence: 1 }, { goal: 50, essence: 3 }] },
  { id: "comerciante", icon: "💰", name: "Comerciante", desc: "Itens vendidos", counter: "sold", title: "Mercador Nato",
    tiers: [{ goal: 10, gold: 30 }, { goal: 50, gold: 100 }, { goal: 200, essence: 1 }, { goal: 500, essence: 2 }] },
  { id: "mago", icon: "🔮", name: "Mago", desc: "Habilidades ativas liberadas", counter: "activeSkills", title: "Arquimago",
    tiers: [{ goal: 1, gold: 30 }, { goal: 3, gold: 100 }, { goal: 6, essence: 1 }, { goal: 10, essence: 2 }] }
];

function achById(id) { return ACHIEVEMENTS.find(a => a.id === id) || null; }

// Contadores ficam em state.stats (nível vem de state.level). activeSkills guarda o maior valor já alcançado.
function achSyncDerived() {
  if (!state.stats) state.stats = {};
  if (typeof SKILL_NODES !== "undefined" && state.skills) {
    const n = SKILL_NODES.filter(x => x.skill && state.skills[x.id]).length;
    if (n > (state.stats.activeSkills || 0)) state.stats.activeSkills = n;
  }
}

function addStat(key, n) {
  if (!state.stats) state.stats = {};
  state.stats[key] = (state.stats[key] || 0) + (n === undefined ? 1 : n);
}

function achCounter(a) {
  if (a.counter === "level") return state.level;
  return (state.stats && state.stats[a.counter]) || 0;
}
function achClaimed(a) { return Math.min(a.tiers.length, (state.achClaimed && state.achClaimed[a.id]) || 0); }

// Quantos degraus já dá para resgatar
function achReadyCount(a) {
  let c = achClaimed(a), n = 0;
  const cnt = achCounter(a);
  while (c < a.tiers.length && cnt >= a.tiers[c].goal) { c++; n++; }
  return n;
}
function achReadyTotal() { return ACHIEVEMENTS.reduce((s, a) => s + achReadyCount(a), 0); }

function achTitleText(id) {
  const a = achById(id);
  return a && achClaimed(a) >= a.tiers.length ? a.title : "";
}
function ownedTitles() { return ACHIEVEMENTS.filter(a => achClaimed(a) >= a.tiers.length); }

// Texto pequeno do título, para pôr ao lado de um nome (nome e título de outros jogadores: sempre textContent)
function titleSpan(title) {
  if (!title) return null;
  const s = document.createElement("span");
  s.className = "title-tag";
  s.textContent = title;
  return s;
}

// Ponto vermelho (aba Personagem e botão Conquistas) e resumo do card
function updateAchDot() {
  achSyncDerived();
  const ready = achReadyTotal();
  ["achDot", "achBtnDot"].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.classList.toggle("hidden", ready === 0);
  });
  const sum = document.getElementById("achSummary");
  if (sum) {
    const total = ACHIEVEMENTS.length * 4;
    const done = ACHIEVEMENTS.reduce((s, a) => s + achClaimed(a), 0);
    sum.textContent = done + " de " + total + " degraus completos" + (ready > 0 ? " · 🎁 " + ready + " para resgatar" : "");
  }
}

function openAchievements() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("conquistasScreen").classList.remove("hidden");
  renderAchievements();
  window.scrollTo(0, 0);
}

function achRewardText(t, isLast, a) {
  const parts = [];
  if (t.gold) parts.push("🪙 " + t.gold);
  if (t.essence) parts.push("💎 " + t.essence);
  if (isLast) parts.push("🎖️ título «" + a.title + "»");
  return parts.join(" + ");
}

function renderAchievements() {
  achSyncDerived();
  // ----- título -----
  const tb = document.getElementById("achTitleBox");
  tb.innerHTML = "";
  const owned = ownedTitles();
  if (!owned.length) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = "Complete o último degrau de uma conquista para ganhar um título. Ele aparece ao lado do seu nome.";
    tb.appendChild(h);
  } else {
    const cur = document.createElement("div");
    cur.className = "hint";
    cur.textContent = state.title && achTitleText(state.title) ? "Usando: " + achTitleText(state.title) : "Nenhum título em uso. Toque num título para usar.";
    tb.appendChild(cur);
    const chips = document.createElement("div");
    chips.className = "craft-chips";
    owned.forEach(a => {
      const b = document.createElement("button");
      b.className = "craft-chip" + (state.title === a.id ? " active" : "");
      b.textContent = a.title;
      b.onclick = () => equipTitle(a.id);
      chips.appendChild(b);
    });
    tb.appendChild(chips);
  }

  // ----- lista -----
  const list = document.getElementById("achList");
  list.innerHTML = "";
  ACHIEVEMENTS.forEach(a => {
    const claimed = achClaimed(a), cnt = achCounter(a), ready = achReadyCount(a);
    const complete = claimed >= a.tiers.length;
    const next = complete ? null : a.tiers[claimed];
    const card = document.createElement("div");
    card.className = "card ach-card";
    const dots = a.tiers.map((t, i) => i < claimed ? "●" : "○").join(" ");
    let html =
      '<div class="ach-head"><span class="ach-icon">' + a.icon + '</span>' +
      '<div class="ach-info"><div class="uname">' + a.name + '</div><div class="udesc">' + a.desc + '</div></div>' +
      '<div class="ach-dots">' + dots + '</div></div>';
    if (complete) {
      html += '<div class="hint">✅ Completa · título «' + a.title + '»</div>';
    } else {
      const pct = Math.min(100, Math.round(cnt / next.goal * 100));
      html += '<div class="ach-bar"><div class="ach-bar-in" style="width:' + pct + '%"></div></div>' +
        '<div class="ach-line"><span>' + Math.min(cnt, next.goal) + ' / ' + next.goal + '</span>' +
        '<span>Recompensa: ' + achRewardText(next, claimed === a.tiers.length - 1, a) + '</span></div>';
    }
    card.innerHTML = html;
    if (ready > 0) {
      const btn = document.createElement("button");
      btn.className = "craft-btn";
      btn.style.marginTop = "8px";
      btn.textContent = "🎁 Resgatar" + (ready > 1 ? " (" + ready + " degraus)" : "");
      btn.onclick = () => claimAchievement(a.id);
      card.appendChild(btn);
    }
    list.appendChild(card);
  });
}

let achBusy = false;

async function claimAchievement(id) {
  if (achBusy) return;
  const a = achById(id);
  if (!a) return;
  achSyncDerived();
  let c = achClaimed(a), gold = 0, ess = 0, gotTitle = false;
  const cnt = achCounter(a);
  while (c < a.tiers.length && cnt >= a.tiers[c].goal) {
    gold += a.tiers[c].gold || 0;
    ess += a.tiers[c].essence || 0;
    c++;
    if (c === a.tiers.length) gotTitle = true;
  }
  if (c === achClaimed(a)) return;
  achBusy = true;
  try {
    if (!state.achClaimed) state.achClaimed = {};
    state.achClaimed[a.id] = c;
    state.gold += gold;
    const online = typeof cloudEnabled === "function" && cloudEnabled();
    const essBefore = state.essence;
    if (ess > 0 && !online) state.essence += ess; // teste fora do Telegram; no Telegram o servidor paga
    if (gotTitle && !state.title) state.title = a.id;
    saveState();
    render();
    renderAchievements();
    const parts = [];
    if (gold) parts.push("🪙 +" + gold);
    if (gotTitle) parts.push("🎖️ título «" + a.title + "»");
    showToast("🏆 " + a.name + "! " + parts.join(" · "));
    if (ess > 0 && online) {
      await cloudPushNow(); // o servidor confere e paga a Essência
      const got = state.essence - essBefore;
      if (got > 0) showToast("💎 +" + got + " Essência Arcana");
    } else if (ess > 0) {
      showToast("💎 +" + ess + " Essência Arcana");
    }
  } finally {
    achBusy = false;
  }
}

function equipTitle(id) {
  state.title = state.title === id ? null : id;
  saveState();
  render();
  renderAchievements();
}
