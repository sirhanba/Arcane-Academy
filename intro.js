// ============================================================
// intro.js — Introdução do jogo (primeira vez): tela de título → lore → criação de personagem
// → texto das casas → escolha da casa. Os textos aparecem aos poucos, como se alguém escrevesse na hora.
// Para mudar os textos, edite INTRO_LORE e INTRO_HOUSES abaixo.
// ============================================================

const INTRO_LORE =
  "Há muito tempo, quando o mundo de Arcanum ainda era jovem, a magia corria livre pelos rios, florestas e céus.\n\n" +
  "Mas poder sem guia traz ruína. Para proteger o equilíbrio, os primeiros magos ergueram no coração de Arcanum a Academia Arcana: uma fortaleza de pedra e luz, cercada por jardins encantados e por uma floresta onde nem todas as sombras são amigas.\n\n" +
  "Séculos se passaram. As Cavernas Ecoantes voltaram a sussurrar, o Lago Sereno guarda segredos que ninguém ousa contar, e as Ruínas Antigas despertam. Criaturas estranhas rondam os caminhos.\n\n" +
  "Agora, a Academia abre suas portas a novos aprendizes. Dizem que o destino de Arcanum depende de quem tiver coragem de atravessá-las.\n\n" +
  "E esse aprendiz é você.";

const INTRO_HOUSES =
  "Todo aprendiz da Academia pertence a uma de quatro casas. Cada uma é guiada por um animal totem e concede um bônus que o acompanha para sempre.\n\n" +
  "🐺 Vaelunna, o Lobo, guarda a força de quem ataca primeiro.\n" +
  "🦉 Noctivia, a Coruja, guarda a sabedoria e o poder da mana.\n" +
  "🐍 Sibyra, a Serpente, guarda o golpe certeiro e mortal.\n" +
  "🦌 Cervanthus, o Cervo, guarda a vitalidade de quem resiste a tudo.\n\n" +
  "Escolha com o coração, aprendiz. Sua casa é a sua família.";

const INTRO_CHAR_MS = 28;      // tempo por letra
let introTimer = null;
let introFinish = null;        // termina o texto na hora (toque na tela)
let introNextAction = null;    // o que o botão "Continuar" faz

function introEl(id) { return document.getElementById(id); }

function introEnsureState() {
  if (!state.intro) state.intro = { lore: false, houses: false };
}

// Novo jogador: mostra a tela de título
function introStart() {
  ["creationScreen", "houseScreen"].forEach(id => introEl(id).classList.add("hidden"));
  introEl("introScreen").classList.remove("hidden");
  introEl("introTitleView").classList.remove("hidden");
  introEl("introTextView").classList.add("hidden");
}

// Botão "Entrar": começa o texto da história
function introEnter() {
  introEl("introTitleView").classList.add("hidden");
  introEl("introTextView").classList.remove("hidden");
  introPlayText(INTRO_LORE, () => {
    if (introReplayMode) { introPlayText(INTRO_HOUSES, introReplayEnd); return; } // revisão: segue direto para o texto das casas
    introEnsureState();
    state.intro.lore = true;
    saveState();
    introEl("introScreen").classList.add("hidden");
    introEl("creationScreen").classList.remove("hidden");
    introEl("genderF").classList.toggle("active", state.gender === "f");
    introEl("genderM").classList.toggle("active", state.gender === "m");
    renderAvatar();
  });
}

// Depois de criar o personagem: texto das casas (uma vez) e então a escolha da casa
function introHousesThenPick() {
  introEnsureState();
  if (state.intro.houses) { introGoHouse(); return; }
  introEl("creationScreen").classList.add("hidden");
  introEl("houseScreen").classList.add("hidden");
  introEl("introScreen").classList.remove("hidden");
  introEl("introTitleView").classList.add("hidden");
  introEl("introTextView").classList.remove("hidden");
  introPlayText(INTRO_HOUSES, () => {
    state.intro.houses = true;
    saveState();
    introGoHouse();
  });
}

function introGoHouse() {
  introEl("introScreen").classList.add("hidden");
  introEl("houseScreen").classList.remove("hidden");
  renderHouseScreen();
}

// Escreve o texto aos poucos (sem cursor). O texto inteiro já ocupa o lugar desde o início,
// então nada "pula" na tela enquanto as letras aparecem.
function introPlayText(text, onNext) {
  if (introTimer) clearTimeout(introTimer);
  introNextAction = onNext;
  const box = introEl("introText");
  box.textContent = "";
  const shown = document.createElement("span");
  const rest = document.createElement("span");
  rest.style.visibility = "hidden";
  rest.textContent = text;
  box.appendChild(shown);
  box.appendChild(rest);
  introEl("introHint").classList.remove("hidden");
  introEl("introNextBtn").classList.add("hidden");

  let i = 0;
  const done = () => {
    if (introTimer) clearTimeout(introTimer);
    introTimer = null;
    introFinish = null;
    shown.textContent = text;
    rest.textContent = "";
    introEl("introHint").classList.add("hidden");
    introEl("introNextBtn").classList.remove("hidden");
  };
  introFinish = done;
  const step = () => {
    if (i >= text.length) { done(); return; }
    const c = text[i];
    i++;
    shown.textContent = text.slice(0, i);
    rest.textContent = text.slice(i);
    let delay = INTRO_CHAR_MS;
    if (c === "." || c === "!" || c === "?") delay = INTRO_CHAR_MS * 9;
    else if (c === ",") delay = INTRO_CHAR_MS * 4;
    else if (c === "\n") delay = INTRO_CHAR_MS * 6;
    introTimer = setTimeout(step, delay);
  };
  step();
}

// Toque na tela: completa o texto na hora
function introSkip() {
  if (introFinish) introFinish();
}

function introNext() {
  const fn = introNextAction;
  introNextAction = null;
  if (fn) fn();
}

// ---------- REVER A INTRODUÇÃO (recurso permanente: botão no fim do Guia da Enciclopédia) ----------
let introReplayMode = false;

function introReplay() {
  if (state.combatActive || (typeof combat !== "undefined" && combat)) { showToast("Termine o combate primeiro."); return; }
  introReplayMode = true;
  hideAllScreens();
  introEl("gameShell").classList.add("hidden");
  introEl("introScreen").classList.remove("hidden");
  introEl("introTitleView").classList.remove("hidden");
  introEl("introTextView").classList.add("hidden");
  window.scrollTo(0, 0);
}

function introReplayEnd() {
  introReplayMode = false;
  introEl("introScreen").classList.add("hidden");
  introEl("gameShell").classList.remove("hidden");
  render();
  openMap();
}
