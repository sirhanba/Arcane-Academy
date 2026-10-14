// ============================================================
// daily.js — Prêmio diário: trilha de 10 dias. Cada dia em que o jogador entra e resgata, avança 1 dia na trilha.
// Faltar um dia NÃO reseta: só atrasa. Depois do dia 10 recomeça no dia 1. VIP não muda nada aqui.
// O dia vira à meia-noite de Brasília. A data é lida do celular (decisão: se alguém burlar, o prejuízo é pequeno).
// Para ajustar os prêmios (Fase 4), mude só a lista DAILY_REWARDS.
// ============================================================

const DAILY_REWARDS = [
  { gold: 50 },
  { items: { pocao_vida_p: 2 } },
  { gold: 80 },
  { items: { pocao_mana_p: 2 } },
  { gold: 120 },
  { items: { pocao_vida_g: 2 } },
  { gold: 200 },
  { items: { pocao_mana_g: 2 } },
  { items: { pocao_vida_e: 1, pocao_mana_e: 1 } },
  { gold: 400 }
];

// Data de hoje em Brasília, "AAAA-MM-DD"
function dailyToday() {
  try {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  } catch (e) {
    const d = new Date(Date.now() - 3 * 3600000); // Brasília = UTC-3
    return d.toISOString().slice(0, 10);
  }
}

function dailyAvailable() {
  return !!state.characterCreated && state.daily.last !== dailyToday();
}

// Próximo dia a resgatar (0..9)
function dailyNextIndex() {
  return state.daily.claimed % DAILY_REWARDS.length;
}

function dailyRewardText(r) {
  const parts = [];
  if (r.gold) parts.push("🪙 " + r.gold + " Cobre");
  if (r.items) Object.keys(r.items).forEach(id => {
    const p = potionDef(id);
    parts.push("🧪 " + r.items[id] + "× " + (p ? p.name : id));
  });
  return parts.join(" + ");
}

function dailyShortText(r) {
  if (r.gold) return "🪙 " + r.gold;
  return Object.keys(r.items).map(id => "🧪" + r.items[id]).join(" ");
}

function dailyScreenVisible() {
  const s = document.getElementById("dailyScreen");
  return s && !s.classList.contains("hidden");
}

function updateDailyDot() {
  const e = document.getElementById("dailyDot");
  if (e) e.classList.toggle("hidden", !dailyAvailable());
}

function openDaily() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("dailyScreen").classList.remove("hidden");
  renderDaily();
  window.scrollTo(0, 0);
}

function renderDaily() {
  const box = document.getElementById("dailyCard");
  if (!box) return;
  box.innerHTML = "";
  const next = dailyNextIndex();
  const avail = dailyAvailable();
  const cycleStart = state.daily.claimed - next; // quantos já foram em ciclos completos

  const title = document.createElement("div");
  title.className = "inv-title";
  title.textContent = "🎁 Prêmio diário";
  box.appendChild(title);
  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Entre e resgate todo dia. Se faltar um dia, a trilha só espera: nada é perdido.";
  hint.style.marginBottom = "8px";
  box.appendChild(hint);

  const grid = document.createElement("div");
  grid.className = "daily-grid";
  DAILY_REWARDS.forEach((r, i) => {
    const cell = document.createElement("div");
    const done = i < next;
    const today = i === next;
    cell.className = "daily-cell" + (done ? " done" : "") + (today ? (avail ? " today" : " wait") : "");
    const d = document.createElement("div");
    d.className = "daily-day";
    d.textContent = "Dia " + (i + 1);
    const t = document.createElement("div");
    t.className = "daily-reward";
    t.textContent = done ? "✅" : dailyShortText(r);
    cell.appendChild(d);
    cell.appendChild(t);
    grid.appendChild(cell);
  });
  box.appendChild(grid);

  const r = DAILY_REWARDS[next];
  const line = document.createElement("div");
  line.className = "qr-line";
  line.style.margin = "10px 0 6px";
  line.textContent = (avail ? "Hoje: " : "Próximo (dia " + (next + 1) + "): ") + dailyRewardText(r);
  box.appendChild(line);

  const btn = document.createElement("button");
  btn.className = "confirm-btn";
  btn.textContent = avail ? "Resgatar prêmio do dia " + (next + 1) : "✅ Já resgatado hoje — volte amanhã";
  btn.disabled = !avail;
  btn.onclick = claimDaily;
  box.appendChild(btn);
}

// Quantos espaços novos a mochila precisa para receber as poções deste prêmio
function dailyBagNeeded(r) {
  if (!r.items) return 0;
  return Object.keys(r.items).filter(id => (state.inventory[id] || 0) === 0).length;
}

function claimDaily() {
  if (!dailyAvailable()) return;
  const idx = dailyNextIndex();
  const r = DAILY_REWARDS[idx];
  if (dailyBagNeeded(r) > bagFree()) {
    showToast("🎒 Mochila cheia! Abra espaço para coletar as poções.");
    return;
  }
  if (r.gold) state.gold += r.gold;
  if (r.items) Object.keys(r.items).forEach(id => {
    state.inventory[id] = (state.inventory[id] || 0) + r.items[id];
  });
  state.daily.claimed++;
  state.daily.last = dailyToday();
  saveState();
  render();
  renderDaily();
  showToast("🎁 Dia " + (idx + 1) + ": " + dailyRewardText(r));
}

// O dia pode virar com o jogo aberto: reconfere ao voltar para o app e a cada minuto
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && typeof state !== "undefined" && state.daily) { updateDailyDot(); if (dailyScreenVisible()) renderDaily(); }
});
setInterval(() => {
  if (typeof state !== "undefined" && state && state.daily) { updateDailyDot(); if (dailyScreenVisible()) renderDaily(); }
}, 60000);
