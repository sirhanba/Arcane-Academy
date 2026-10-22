// ============================================================
// estudos.js — Sala de Estudos (Biblioteca Arcaica): tomos que dão um bônus temporário por 1 hora (tempo real,
// relógio do celular). Só 1 tomo ativo por vez. O bônus de XP vale ao vencer monstros e chefes, não nas missões.
// ============================================================
const STUDY_DURATION_MS = 60 * 60 * 1000;
const STUDY_TOMES = [
  { id: "sabedoria", icon: "📘", name: "Tomo da Sabedoria", cost: 300, desc: "+25% de XP ao vencer monstros" },
  { id: "fortuna",   icon: "📗", name: "Tomo da Fortuna",   cost: 400, desc: "+15% de Sorte (soma ao seu valor, até o teto de 100%)" },
  { id: "poder",     icon: "📕", name: "Tomo do Poder",     cost: 300, desc: "+10% de Ataque" }
];
const STUDY_XP_MULT = 1.25;
const STUDY_LUCK_BONUS = 15;
const STUDY_ATTACK_MULT = 1.10;

let studyTimer = null;

function studyTome(id) { return STUDY_TOMES.find(t => t.id === id) || null; }
// Tomo ativo agora (ou null, se acabou o tempo)
function studyActiveId() {
  const s = state.study;
  return s && s.tome && s.until > Date.now() ? s.tome : null;
}
function studyRemaining() { return Math.max(0, (state.study.until || 0) - Date.now()); }

// Chamado a cada poucos segundos: quando o tomo acaba, tira o bônus dos atributos
function studyTick() {
  if (state.study && state.study.tome && state.study.until <= Date.now()) {
    state.study = { tome: null, until: 0 };
    recalcStats();
    saveState();
    showToast("📚 O efeito do seu tomo acabou.");
    render();
  }
  renderStudyBadge();
  const scr = document.getElementById("estudosScreen");
  if (scr && !scr.classList.contains("hidden")) renderStudy();
}
setInterval(studyTick, 5000);

function renderStudyBadge() {
  const el = document.getElementById("studyBadge");
  if (!el) return;
  const id = studyActiveId();
  if (!id) { el.classList.add("hidden"); el.textContent = ""; return; }
  const t = studyTome(id);
  el.textContent = t.icon + " " + t.name + " ativo — " + formatDuration(studyRemaining());
  el.classList.remove("hidden");
}

function openStudy() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("estudosScreen").classList.remove("hidden");
  renderStudy();
  if (studyTimer) clearInterval(studyTimer);
  studyTimer = setInterval(() => {
    const scr = document.getElementById("estudosScreen");
    if (!scr || scr.classList.contains("hidden")) { clearInterval(studyTimer); studyTimer = null; return; }
    renderStudy();
  }, 1000);
}

function renderStudy() {
  const active = studyActiveId();
  document.getElementById("estudosStatus").textContent = active
    ? studyTome(active).icon + " " + studyTome(active).name + " ativo · ⏳ " + formatDuration(studyRemaining())
    : "Nenhum tomo ativo.";
  const list = document.getElementById("estudosList");
  list.innerHTML = "";
  STUDY_TOMES.forEach(t => {
    const row = document.createElement("div");
    row.className = "upgrade-row";
    row.innerHTML =
      '<span class="upgrade-icon">' + t.icon + '</span>' +
      '<div class="upgrade-info"><div class="uname">' + t.name + '</div>' +
      '<div class="udesc">' + t.desc + ' · 1 hora</div></div>' +
      '<button class="upgrade-buy" ' + (state.gold < t.cost ? "disabled " : "") + 'onclick="readTome(\'' + t.id + '\')">' +
      (active === t.id ? "🔄 Renovar " : "📖 Ler ") + '🪙 ' + t.cost + '</button>';
    list.appendChild(row);
  });
}

function readTome(id) {
  const t = studyTome(id);
  if (!t) return;
  if (state.gold < t.cost) { showToast("Cobre insuficiente."); return; }
  const active = studyActiveId();
  if (active && active !== id && !confirm("Você já tem o " + studyTome(active).name + " ativo. Ler o " + t.name + " troca o efeito e reinicia a hora. Continuar?")) return;
  state.gold -= t.cost;
  state.study = { tome: id, until: Date.now() + STUDY_DURATION_MS };
  recalcStats();
  saveState();
  render();
  renderStudy();
  renderStudyBadge();
  showToast(t.icon + " " + t.name + " ativo por 1 hora!");
}
