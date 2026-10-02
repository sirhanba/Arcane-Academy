// ============================================================
// character.js — Criação de personagem (nickname, avatar, gênero) e seleção de casa.
// ============================================================

// ---------- CRIAÇÃO DE PERSONAGEM ----------

// Lista simulada de nicknames já usados (sem servidor real ainda)
const RESERVED_NICKS = ["admin", "teste", "moderador", "arcaneacademy"];

const PRESETS = [
  { label: "Visual 1", hair: "#7d4fd6", face: "#f2c9a0", hairShape: "wave" },
  { label: "Visual 2", hair: "#e8c15a", face: "#e0a87a", hairShape: "spiky" },
  { label: "Visual 3", hair: "#3a3a3a", face: "#f6d9b8", hairShape: "long" },
  { label: "Visual 4", hair: "#a63b3b", face: "#c98a5c", hairShape: "bob" }
];

let nickAvailable = false;

function checkNickname() {
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
  } else {
    statusEl.textContent = "✓ Nickname disponível (verificação local — sem servidor ainda)";
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

function cyclePreset(dir) {
  state.presetIndex = (state.presetIndex + dir + PRESETS.length) % PRESETS.length;
  renderAvatar();
}

function buildAvatarSvg() {
  const preset = PRESETS[state.presetIndex];
  const robeColor = state.gender === "f" ? "#7d4fd6" : "#2f4d8a";
  const robeShape = state.gender === "f"
    ? "M35,180 L30,100 Q70,80 110,100 L105,180 Z"
    : "M38,180 L34,100 Q70,88 106,100 L102,180 Z";

  let hairPath = "";
  if (preset.hairShape === "wave") {
    hairPath = "M35,70 Q70,30 105,70 Q100,50 70,45 Q40,50 35,70 Z";
  } else if (preset.hairShape === "spiky") {
    hairPath = "M32,72 L45,35 L55,60 L70,30 L85,60 L95,35 L108,72 Z";
  } else if (preset.hairShape === "long") {
    hairPath = "M33,70 Q70,25 107,70 L112,150 L98,150 L95,75 L45,75 L42,150 L28,150 Z";
  } else {
    hairPath = "M34,72 Q70,32 106,72 Q108,90 95,95 Q70,80 45,95 Q32,90 34,72 Z";
  }

  return '<circle cx="70" cy="70" r="32" fill="' + preset.face + '" />' +
    '<path d="' + robeShape + '" fill="' + robeColor + '" />' +
    '<circle cx="58" cy="68" r="3.5" fill="#2a1a3d" />' +
    '<circle cx="82" cy="68" r="3.5" fill="#2a1a3d" />' +
    '<path d="M60,85 Q70,92 80,85" stroke="#5a3a1a" stroke-width="2" fill="none" />' +
    '<path d="' + hairPath + '" fill="' + preset.hair + '" />';
}

function renderAvatar() {
  const preset = PRESETS[state.presetIndex];
  document.getElementById("presetLabel").textContent = preset.label;
  document.getElementById("avatarSvg").innerHTML = buildAvatarSvg();
}

// Bônus fixos de cada casa (valores em "bonuses"; lidos por houseBonus() e aplicados em recalcStats):
//   attackPct = % de Ataque total · hpPct = % de HP máx · mana, manaRegen, hpRegen, crit = valores fixos
const HOUSES = [
  {
    id: "vaelunna",
    name: "Vaelunna",
    icon: "🐺",
    color: "#e8c15a",
    desc: "Uivam sob a lua cheia, movidos por instinto, lealdade de matilha e fúria no ataque.",
    buff: "+10% de Ataque total",
    bonuses: { attackPct: 10 }
  },
  {
    id: "noctivia",
    name: "Noctivia",
    icon: "🦉",
    color: "#4caf7d",
    desc: "Guardiões do saber noturno, enxergam o que os outros não veem e guardam reservas profundas de magia.",
    buff: "+20 Mana máxima e +2 Regen de Mana por turno",
    bonuses: { mana: 20, manaRegen: 2 }
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
    color: "#4a7bc7",
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
}

function updateConfirmButton() {
  document.getElementById("confirmBtn").disabled = !nickAvailable;
}

function confirmCharacter() {
  if (!nickAvailable) return;
  state.characterCreated = true;
  saveState();
  document.getElementById("creationScreen").classList.add("hidden");
  document.getElementById("houseScreen").classList.remove("hidden");
  renderHouseScreen();
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
    document.getElementById("houseScreen").classList.remove("hidden");
    renderHouseScreen();
  } else {
    document.getElementById("genderF").classList.toggle("active", state.gender === "f");
    document.getElementById("genderM").classList.toggle("active", state.gender === "m");
    renderAvatar();
  }
}
