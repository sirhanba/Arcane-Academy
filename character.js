// ============================================================
// character.js — Criação de personagem (nickname, avatar, gênero) e seleção de casa.
// ============================================================

// ---------- CRIAÇÃO DE PERSONAGEM ----------

// Lista simulada de nicknames já usados (sem servidor real ainda)
const RESERVED_NICKS = ["admin", "teste", "moderador", "arcaneacademy"];

// Visual do personagem: 5 cabelos e 5 rostos por gênero (imagens av_*.png na raiz, em camadas).
const AV_COUNT = 5;
const AV_VER = 1; // aumente ao trocar as imagens (evita cache antigo)
const AV_W = 292, AV_H = 640; // tamanho da tela das camadas

let nickAvailable = false;

async function checkNickname() {
  const val = document.getElementById("nickInput").value.trim();
  const statusEl = document.getElementById("nickStatus");

  if (val.length < 3 || val.length > 16) {
    statusEl.textContent = "O nickname deve ter entre 3 e 16 caracteres.";
    statusEl.className = "nick-status bad";
    nickAvailable = false;
  } else if (!/^[a-zA-Z0-9_]+$/.test(val)) {
    statusEl.textContent = "Use apenas letras, números e _ (sem espaços).";
    statusEl.className = "nick-status bad";
    nickAvailable = false;
  } else if (RESERVED_NICKS.includes(val.toLowerCase())) {
    statusEl.textContent = "Esse nickname já está em uso.";
    statusEl.className = "nick-status bad";
    nickAvailable = false;
  } else if (cloudEnabled()) {
    // Confere no servidor se já existe outro jogador com esse nickname.
    statusEl.textContent = "Verificando…";
    statusEl.className = "nick-status";
    nickAvailable = false;
    updateConfirmButton();
    try {
      const r = await cloudCall("check_name", { name: val });
      if (document.getElementById("nickInput").value.trim() !== val) return; // o texto mudou durante a consulta
      if (r.available) {
        statusEl.textContent = "✓ Nickname disponível";
        statusEl.className = "nick-status ok";
        nickAvailable = true;
        state.name = val;
      } else {
        statusEl.textContent = r.reason === "format" ? "Nickname inválido." : "Esse nickname já está em uso.";
        statusEl.className = "nick-status bad";
      }
    } catch (e) {
      statusEl.textContent = "Sem conexão com o servidor. Tente de novo.";
      statusEl.className = "nick-status bad";
    }
  } else {
    // Fora do Telegram (teste no navegador): só verificação local.
    statusEl.textContent = "✓ Nickname disponível (teste local, sem servidor)";
    statusEl.className = "nick-status ok";
    nickAvailable = true;
    state.name = val;
  }
  updateConfirmButton();
}

function selectGender(g) {
  state.gender = g;
  document.getElementById("genderF").classList.toggle("active", g === "f");
  document.getElementById("genderM").classList.toggle("active", g === "m");
  renderAvatar();
  updateConfirmButton();
}

function cycleHair(dir) {
  state.hair = ((state.hair || 0) + dir + AV_COUNT) % AV_COUNT;
  renderAvatar();
}

function cycleFace(dir) {
  state.face = ((state.face || 0) + dir + AV_COUNT) % AV_COUNT;
  renderAvatar();
}

// Monta o personagem em camadas (corpo + rosto + cabelo) dentro de um <svg viewBox="0 0 292 640">.
function buildAvatarSvg() {
  const g = state.gender === "m" ? "m" : "f";
  const h = Math.min(AV_COUNT - 1, Math.max(0, state.hair || 0));
  const f = Math.min(AV_COUNT - 1, Math.max(0, state.face || 0));
  const layer = (n) => '<image href="av_' + n + '.png?v=' + AV_VER + '" x="0" y="0" width="' + AV_W + '" height="' + AV_H + '" />';
  return layer("body_" + g) + layer("face_" + g + "_" + f) + layer("hair_" + g + "_" + h);
}

function renderAvatar() {
  document.getElementById("hairLabel").textContent = "Cabelo " + ((state.hair || 0) + 1) + "/" + AV_COUNT;
  document.getElementById("faceLabel").textContent = "Rosto " + ((state.face || 0) + 1) + "/" + AV_COUNT;
  document.getElementById("avatarSvg").innerHTML = buildAvatarSvg();
}

// Bônus fixos de cada casa (valores em "bonuses"; lidos por houseBonus() e aplicados em recalcStats):
//   attackPct = % de Ataque total · hpPct = % de HP máx · manaPct = % de Mana máx · manaRegen, hpRegen, crit = valores fixos
const HOUSES = [
  {
    id: "vaelunna",
    name: "Vaelunna",
    icon: "🐺",
    color: "#4a7bc7",
    desc: "Uivam sob a lua cheia, movidos por instinto, lealdade de matilha e fúria no ataque.",
    buff: "+10% de Ataque total",
    bonuses: { attackPct: 10 }
  },
  {
    id: "noctivia",
    name: "Noctivia",
    icon: "🦉",
    color: "#c9a24b",
    desc: "Guardiões do saber noturno, enxergam o que os outros não veem e guardam reservas profundas de magia.",
    buff: "+15% de Mana máxima e +1 Regen de Mana por turno",
    bonuses: { manaPct: 15, manaRegen: 1 }
  },
  {
    id: "sibyra",
    name: "Sibyra",
    icon: "🐍",
    color: "#c0453f",
    desc: "Astutos e traiçoeiros, atacam apenas no instante perfeito — cada golpe encontra o ponto fraco.",
    buff: "+8% de Crítico",
    bonuses: { crit: 8 }
  },
  {
    id: "cervanthus",
    name: "Cervanthus",
    icon: "🦌",
    color: "#4caf7d",
    desc: "Fortes e resilientes, avançam com passos firmes e imponentes, aguentando golpes que derrubariam os outros.",
    buff: "+15% de HP máximo e +1 Regen de HP por turno",
    bonuses: { hpPct: 15, hpRegen: 1 }
  }
];

// Bônus da casa atual para um atributo (0 se não houver)
function houseBonus(key) {
  const h = HOUSES.find(x => x.id === state.house);
  return (h && h.bonuses[key]) || 0;
}

function renderHouseScreen() {
  const grid = document.getElementById("houseGrid");
  grid.innerHTML = "";
  HOUSES.forEach(h => {
    const isSelected = state.house === h.id;
    const card = document.createElement("div");
    card.className = "house-card" + (isSelected ? " selected" : "");
    card.style.borderColor = isSelected ? h.color : "rgba(255,255,255,0.1)";
    card.style.background = isSelected ? h.color + "18" : "rgba(255,255,255,0.03)";
    card.onclick = () => selectHouse(h.id);
    card.innerHTML =
      '<div class="house-icon">' + h.icon + '</div>' +
      '<div class="house-info">' +
        '<div class="hname" style="color:' + h.color + '">' + h.name + '</div>' +
        '<div class="hdesc">' + h.desc + '</div>' +
        '<div class="hbuff">' + h.buff + '</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

function selectHouse(id) {
  state.house = id;
  renderHouseScreen();
  document.getElementById("confirmHouseBtn").disabled = false;
}

function confirmHouse() {
  if (!state.house) return;
  recalcStats();
  state.hp = state.hpMax;
  state.mana = state.manaMax;
  saveState();
  document.getElementById("houseScreen").classList.add("hidden");
  document.getElementById("gameShell").classList.remove("hidden");
  render();
  openMap();
  if (typeof tutorialNeeded === "function" && tutorialNeeded()) tutorialStart(); // mini tutorial (só na 1ª vez)
}

function updateConfirmButton() {
  document.getElementById("confirmBtn").disabled = !nickAvailable;
}

async function confirmCharacter() {
  if (!nickAvailable) return;
  // Confere de novo no servidor (outro jogador pode ter pegado o nome nesse meio tempo).
  if (cloudEnabled()) {
    try {
      const r = await cloudCall("check_name", { name: state.name });
      if (!r.available) {
        nickAvailable = false;
        const statusEl = document.getElementById("nickStatus");
        statusEl.textContent = "Esse nickname acabou de ser usado por outro jogador. Escolha outro.";
        statusEl.className = "nick-status bad";
        updateConfirmButton();
        return;
      }
    } catch (e) {
      showToast("Sem conexão com o servidor. Tente de novo.");
      return;
    }
  }
  state.characterCreated = true;
  saveState();
  document.getElementById("creationScreen").classList.add("hidden");
  introHousesThenPick(); // texto das casas (só na 1ª vez) e depois a escolha da casa
}

function initScreen() {
  if (state.characterCreated && state.house) {
    document.getElementById("creationScreen").classList.add("hidden");
    document.getElementById("houseScreen").classList.add("hidden");
    document.getElementById("gameShell").classList.remove("hidden");
    if (isDefeated()) {
      showDefeatScreen(0);
    } else {
      openMap();
    }
  } else if (state.characterCreated && !state.house) {
    document.getElementById("creationScreen").classList.add("hidden");
    introHousesThenPick();
  } else if (!state.intro || !state.intro.lore) {
    introStart(); // jogador novo: tela de título → história → criação
  } else {
    document.getElementById("creationScreen").classList.remove("hidden");
    document.getElementById("genderF").classList.toggle("active", state.gender === "f");
    document.getElementById("genderM").classList.toggle("active", state.gender === "m");
    renderAvatar();
  }
}
