// ============================================================
// tutorial.js — Mini tutorial: balões apontando para cada uma das 6 abas do menu (só na primeira vez).
// Para mudar os textos, edite TUTORIAL_STEPS. "nav" = posição do botão no menu (0 = Mapa ... 5 = Enciclopédia).
// ============================================================

const TUTORIAL_STEPS = [
  { nav: 0, icon: "🗺️", title: "Mapa", text: "Aqui você viaja entre os locais, caça monstros, faz missões e visita os mercadores." },
  { nav: 1, icon: "🧙‍♀️", title: "Personagem", text: "Veja seus atributos, equipe seus itens e guarde tudo na mochila." },
  { nav: 2, icon: "⚔️", title: "Habilidades", text: "A cada nível você ganha pontos para liberar feitiços e bônus na árvore." },
  { nav: 3, icon: "🔨", title: "Criação", text: "Fabrique poções e equipamentos com os materiais que os monstros deixam." },
  { nav: 4, icon: "👥", title: "Social", text: "Converse com outros aprendizes, faça amigos e veja o ranking." },
  { nav: 5, icon: "📖", title: "Enciclopédia", text: "Ficou com dúvida? Aqui estão guias de como tudo funciona. Boa sorte, aprendiz!" }
];

let tutorialIndex = -1;   // passo atual (-1 = tutorial fechado)
let tutorialReplay = false;

function tutorialEl(id) { return document.getElementById(id); }

function tutorialNeeded() {
  return !!state.characterCreated && !!state.house && state.intro && !state.intro.tutorial;
}

function tutorialStart(replay) {
  if (tutorialIndex >= 0) return;
  tutorialReplay = !!replay;
  window.scrollTo(0, 0);
  tutorialIndex = 0;
  tutorialBuild();
  tutorialShow();
}

function tutorialBuild() {
  if (tutorialEl("tutorialOverlay")) return;
  const ov = document.createElement("div");
  ov.id = "tutorialOverlay";
  ov.className = "tut-overlay";
  const b = document.createElement("div");
  b.id = "tutorialBubble";
  b.className = "tut-bubble";
  const arrow = document.createElement("div");
  arrow.id = "tutorialArrow";
  arrow.className = "tut-arrow";
  const title = document.createElement("div");
  title.id = "tutorialTitle";
  title.className = "tut-title";
  const text = document.createElement("div");
  text.id = "tutorialText";
  text.className = "tut-text";
  const row = document.createElement("div");
  row.className = "tut-row";
  const skip = document.createElement("button");
  skip.className = "tut-skip";
  skip.id = "tutorialSkip";
  skip.textContent = "Pular";
  skip.onclick = tutorialFinish;
  const count = document.createElement("span");
  count.id = "tutorialCount";
  count.className = "tut-count";
  const next = document.createElement("button");
  next.className = "tut-next";
  next.id = "tutorialNext";
  next.onclick = tutorialNext;
  row.appendChild(skip);
  row.appendChild(count);
  row.appendChild(next);
  b.appendChild(arrow);
  b.appendChild(title);
  b.appendChild(text);
  b.appendChild(row);
  ov.appendChild(b);
  document.body.appendChild(ov);
  window.addEventListener("resize", tutorialPlace);
}

function tutorialButtons() {
  return document.querySelectorAll("#gameShell .top-nav .nav-btn");
}

function tutorialShow() {
  const step = TUTORIAL_STEPS[tutorialIndex];
  tutorialButtons().forEach((btn, i) => btn.classList.toggle("tut-hl", i === step.nav));
  tutorialEl("tutorialTitle").textContent = step.icon + " " + step.title;
  tutorialEl("tutorialText").textContent = step.text;
  tutorialEl("tutorialCount").textContent = (tutorialIndex + 1) + "/" + TUTORIAL_STEPS.length;
  const last = tutorialIndex === TUTORIAL_STEPS.length - 1;
  tutorialEl("tutorialNext").textContent = last ? "Começar" : "Próximo";
  tutorialEl("tutorialSkip").classList.toggle("hidden", last);
  tutorialPlace();
}

// Posiciona o balão logo abaixo do menu, com a setinha apontando para o botão da vez
function tutorialPlace() {
  if (tutorialIndex < 0) return;
  const step = TUTORIAL_STEPS[tutorialIndex];
  const btn = tutorialButtons()[step.nav];
  const bubble = tutorialEl("tutorialBubble");
  if (!btn || !bubble) return;
  const r = btn.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const w = Math.min(vw - 16, 330);
  const left = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2));
  bubble.style.width = w + "px";
  bubble.style.left = left + "px";
  bubble.style.top = (r.bottom + 14) + "px";
  const arrowX = Math.max(18, Math.min(w - 18, r.left + r.width / 2 - left));
  tutorialEl("tutorialArrow").style.left = (arrowX - 8) + "px";
}

function tutorialNext() {
  if (tutorialIndex >= TUTORIAL_STEPS.length - 1) { tutorialFinish(); return; }
  tutorialIndex++;
  tutorialShow();
}

function tutorialFinish() {
  tutorialIndex = -1;
  tutorialButtons().forEach(btn => btn.classList.remove("tut-hl"));
  const ov = tutorialEl("tutorialOverlay");
  if (ov) ov.remove();
  window.removeEventListener("resize", tutorialPlace);
  if (!tutorialReplay && state.intro) {
    state.intro.tutorial = true;
    saveState();
  }
  tutorialReplay = false;
}
