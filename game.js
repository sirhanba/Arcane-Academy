// --- LÓGICA E REGRAS DO JOGO ---

let tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || "";
}

const STORAGE_KEY = "arcanum_save";
const DROP_CHANCE = 0.3;

const BASE_CRIT = 50;
const BASE_DODGE = 50;
const BASE_PENETRATION = 0;
const BASE_LUCK = 0;
const BASE_HP_REGEN = 2;
const BASE_MANA_REGEN = 1;
const PENETRATION_CAP = 70;

const EQUIPMENT_SLOTS = [
  { id: "chapeu", label: "Chapéu", icon: "🎩", side: "left" },
  { id: "roupa", label: "Roupa", icon: "👕", side: "left" },
  { id: "sapatos", label: "Sapatos", icon: "👢", side: "left" },
  { id: "capa", label: "Capa", icon: "🧣", side: "left" },
  { id: "colar", label: "Colar", icon: "📿", side: "right" },
  { id: "anel", label: "Anel", icon: "💍", side: "right" },
  { id: "arma_principal", label: "Arma Principal", icon: "⚔️", side: "right" },
  { id: "arma_secundaria", label: "Arma Secundária", icon: "🗡️", side: "right" }
];

const RESERVED_NICKS = ["admin", "teste", "moderador", "arcanum"];

const PRESETS = [
  { label: "Visual 1", hair: "#7d4fd6", face: "#f2c9a0", hairShape: "wave" },
  { label: "Visual 2", hair: "#e8c15a", face: "#e0a87a", hairShape: "spiky" },
  { label: "Visual 3", hair: "#3a3a3a", face: "#f6d9b8", hairShape: "long" },
  { label: "Visual 4", hair: "#a63b3b", face: "#c98a5c", hairShape: "bob" }
];

const HOUSES = [
  {
    id: "vaelunna",
    name: "Vaelunna",
    icon: "🐺",
    color: "#e8c15a",
    desc: "Uivam sob a lua cheia, movidos por instinto, lealdade de matilha e fúria no ataque.",
    buff: "+15% XP e Moedas por conjuração",
    statKey: "power",
    statValue: 0.15
  },
  {
    id: "noctivia",
    name: "Noctivia",
    icon: "🦉",
    color: "#4caf7d",
    desc: "Guardiões do saber noturno, enxergam o que os outros não veem e guardam reservas profundas de magia.",
    buff: "+10 Mana máxima e regeneração mais rápida",
    statKey: "mana",
    statValue: 10
  },
  {
    id: "sibyra",
    name: "Sibyra",
    icon: "🐍",
    color: "#c0453f",
    desc: "Astutos e traiçoeiros, atacam apenas no instante perfeito — e a sorte nunca os abandona.",
    buff: "+10% de chance de encontrar itens",
    statKey: "luck",
    statValue: 0.10
  },
  {
    id: "cervanthus",
    name: "Cervanthus",
    icon: "🦌",
    color: "#4a7bc7",
    desc: "Fortes e resilientes, avançam com passos firmes e imponentes, sempre bem providos.",
    buff: "+20% Moedas de Cobre por conjuração",
    statKey: "gold",
    statValue: 0.20
  }
];

const LOCATIONS = [
  { id: "academia", name: "Academia", icon: "🏛️", x: 140, y: 480, desc: "O lar seguro dos aprendizes. Aqui você pode descansar.", connections: ["jardins", "vila"], implemented: true },
  { id: "jardins", name: "Jardins da Academia", icon: "🌿", x: 420, y: 280, desc: "A primeira área de treino. Criaturas fracas rondam por aqui.", connections: ["academia", "floresta", "lago"], implemented: true },
  { id: "floresta", name: "Floresta Sombria", icon: "🌲", x: 680, y: 470, desc: "Densa e perigosa — poucos aprendizes se arriscam sozinhos.", connections: ["jardins", "cavernas", "ruinas", "vila", "lago"], implemented: false },
  { id: "cavernas", name: "Cavernas Ecoantes", icon: "🕳️", x: 900, y: 220, desc: "Ecos antigos ressoam nas profundezas da rocha.", connections: ["floresta", "ruinas"], implemented: false },
  { id: "lago", name: "Lago Sereno", icon: "🌊", x: 460, y: 640, desc: "Águas calmas onde dizem viver espíritos antigos.", connections: ["jardins", "floresta", "vila"], implemented: false },
  { id: "vila", name: "Vila dos Mercadores", icon: "🏘️", x: 260, y: 660, desc: "Um pequeno povoado movimentado por comerciantes viajantes.", connections: ["academia", "floresta", "lago"], implemented: false },
  { id: "ruinas", name: "Ruínas Antigas", icon: "🏚️", x: 900, y: 640, desc: "Restos de uma civilização mágica esquecida pelo tempo.", connections: ["floresta", "cavernas"], implemented: false }
];

const LOCATION_MONSTERS = {
  jardins: [
    { id: "rato_arcano", name: "Rato Arcano", icon: "🐀", level: 1, hp: 14, attack: 3, defense: 0, xp: 8, gold: 3, requiredLevel: 1 },
    { id: "corvo_selvagem", name: "Corvo Selvagem", icon: "🐦", level: 2, hp: 20, attack: 4, defense: 1, xp: 12, gold: 5, requiredLevel: 1 },
    { id: "aranha_sombria", name: "Aranha Sombria", icon: "🕷️", level: 3, hp: 28, attack: 5, defense: 2, xp: 18, gold: 8, requiredLevel: 3 }
  ]
};

const BOSS = { name: "Corvo Ancestral", icon: "🐦‍⬛", hp: 60, attack: 7, defense: 3, xp: 40, gold: 25, cooldownMs: 20 * 60 * 1000 };
const TRAVEL_MS = 5 * 1000;
const DEFEAT_MS = 5 * 1000;
const DEFEAT_SKIP_COST = 3;

let combat = null;
let huntLocationId = null;
let nickAvailable = false;
let mapInteractionReady = false;
let mapTransform = { x: 40, y: 60, scale: 0.7 };
let pendingTravelTarget = null;
let currentCraftCategory = "potions";
let combatLogEntries = [];
let buyQtyItemId = null;

function defaultState() {
  return {
    name: "",
    characterCreated: false,
    house: null,
    gender: "f",
    presetIndex: 0,
    level: 1,
    xp: 0,
    xpToNext: 50,
    mana: 10,
    manaMax: 10,
    hp: 30,
    hpMax: 30,
    attack: 4,
    defense: 1,
    baseAttack: 4,
    baseDefense: 1,
    baseHpMax: 30,
    baseManaMax: 10,
    houseManaBonus: 0,
    houseLuckBonus: 0,
    critChance: 50,
    dodgeChance: 50,
    penetration: 0,
    luck: 0,
    hpRegen: 2,
    manaRegen: 1,
    gold: 0,
    essence: 0,
    inventory: { chapeu_aprendiz: 1, tunica_simples: 1, botas_surradas: 1, varinha_salgueiro: 1 },
    equipment: { chapeu: null, roupa: null, sapatos: null, capa: null, colar: null, anel: null, arma_principal: null, arma_secundaria: null },
    upgrades: { power: 0, mana: 0, luck: 0, regen: 0 },
    questStage: "none",
    questKills: 0,
    bossCooldownUntil: 0,
    purchasedItems: {},
    currentLocation: "academia",
    travelTarget: null,
    travelArrivesAt: 0,
    defeatedUntil: 0
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const loaded = raw ? JSON.parse(raw) : defaultState();
    if (!loaded.inventory) loaded.inventory = {};
    if (!loaded.upgrades) loaded.upgrades = { power: 0, mana: 0, luck: 0, regen: 0 };
    if (loaded.hp === undefined) loaded.hp = 30;
    if (loaded.hpMax === undefined) loaded.hpMax = 30;
    if (loaded.attack === undefined) loaded.attack = 4;
    if (loaded.defense === undefined) loaded.defense = 1;
    if (loaded.questStage === undefined) loaded.questStage = "none";
    if (loaded.questKills === undefined) loaded.questKills = 0;
    if (loaded.bossCooldownUntil === undefined) loaded.bossCooldownUntil = 0;
    if (!loaded.purchasedItems) loaded.purchasedItems = {};
    if (!loaded.currentLocation) loaded.currentLocation = "academia";
    if (loaded.travelTarget === undefined) loaded.travelTarget = null;
    if (loaded.travelArrivesAt === undefined) loaded.travelArrivesAt = 0;
    if (loaded.defeatedUntil === undefined) loaded.defeatedUntil = 0;
    if (loaded.houseManaBonus === undefined) loaded.houseManaBonus = (loaded.house === "noctivia" ? 10 : 0);
    if (loaded.houseLuckBonus === undefined) loaded.houseLuckBonus = (loaded.house === "sibyra" ? 10 : 0);
    if (loaded.critChance === undefined) loaded.critChance = 50;
    if (loaded.dodgeChance === undefined) loaded.dodgeChance = 50;
    if (loaded.penetration === undefined) loaded.penetration = 0;
    if (loaded.luck === undefined) loaded.luck = 0;
    if (loaded.hpRegen === undefined) loaded.hpRegen = 2;
    if (loaded.manaRegen === undefined) loaded.manaRegen = 1;
    if (!loaded.equipment) {
      loaded.equipment = { chapeu: null, roupa: null, sapatos: null, capa: null, colar: null, anel: null, arma_principal: null, arma_secundaria: null };
    }
    if (loaded.characterCreated === undefined) loaded.characterCreated = false;
    if (loaded.house === undefined) loaded.house = null;
    if (!loaded.gender) loaded.gender = "f";
    if (loaded.presetIndex === undefined) loaded.presetIndex = 0;
    return loaded;
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { }
}

let state = loadState();

function findItemDef(id) {
  return ITEMS.find(i => i.id === id) || EQUIP_ITEMS.find(i => i.id === id) || POTIONS.find(i => i.id === id) || null;
}

function potionDef(id) {
  return POTIONS.find(p => p.id === id);
}

function locById(id) {
  return LOCATIONS.find(l => l.id === id);
}

function equipmentBonus(statKey) {
  let total = 0;
  EQUIPMENT_SLOTS.forEach(slotDef => {
    const itemId = state.equipment[slotDef.id];
    if (!itemId) return;
    const def = EQUIP_ITEMS.find(i => i.id === itemId);
    if (def && def.stats && def.stats[statKey]) total += def.stats[statKey];
  });
  return total;
}

function recalcStats() {
  const lvl = state.level;
  state.baseAttack = 4 + (lvl - 1);
  state.baseDefense = 1 + Math.floor((lvl - 1) / 2);
  state.baseHpMax = 30 + (lvl - 1) * 5;
  state.baseManaMax = 10 + (lvl - 1) * 2;

  const amuletoBonus = state.purchasedItems.amuleto_forca ? 2 : 0;

  state.attack = state.baseAttack + equipmentBonus("attack") + amuletoBonus;
  state.defense = state.baseDefense + equipmentBonus("defense");

  const newHpMax = state.baseHpMax + equipmentBonus("hp");
  const newManaMax = state.baseManaMax + equipmentBonus("mana") + (state.houseManaBonus || 0);
  state.hpMax = newHpMax;
  state.manaMax = newManaMax;
  state.hp = Math.min(state.hp, newHpMax);
  state.mana = Math.min(state.mana, newManaMax);

  state.critChance = BASE_CRIT + equipmentBonus("crit");
  state.dodgeChance = BASE_DODGE + equipmentBonus("dodge");
  state.penetration = Math.min(PENETRATION_CAP, BASE_PENETRATION + equipmentBonus("penetration"));
  state.luck = BASE_LUCK + equipmentBonus("luck") + (state.houseLuckBonus || 0);
  state.hpRegen = BASE_HP_REGEN + equipmentBonus("hpRegen");
  state.manaRegen = BASE_MANA_REGEN + equipmentBonus("manaRegen");
}

recalcStats();

function render() {
  const houseObj = HOUSES.find(h => h.id === state.house);
  
  document.getElementById("hdrPlayerName").textContent = state.name || "Aprendiz";
  document.getElementById("hdrHouse").textContent = houseObj ? houseObj.icon + " " + houseObj.name : "Sem Casa";
  if (houseObj) document.getElementById("hdrHouse").style.color = houseObj.color;
  document.getElementById("hdrLevel").textContent = "LV. " + state.level;

  document.getElementById("hdrHpText").textContent = state.hp + " / " + state.hpMax;
  document.getElementById("hdrHpBar").style.width = Math.max(0, (state.hp / state.hpMax) * 100) + "%";

  document.getElementById("hdrManaText").textContent = state.mana + " / " + state.manaMax;
  document.getElementById("hdrManaBar").style.width = Math.max(0, (state.mana / state.manaMax) * 100) + "%";

  document.getElementById("hdrXpText").textContent = state.xp + " / " + state.xpToNext;
  document.getElementById("hdrXpBar").style.width = Math.min(100, (state.xp / state.xpToNext) * 100) + "%";

  document.getElementById("goldVal").textContent = state.gold;
  document.getElementById("essenceVal").textContent = state.essence;

  renderInventory();
}

function renderInventory() {
  renderEquipmentCard();
  renderAttributesCard();
  render5x4Grid();
}

function renderAttributesCard() {
  const grid = document.getElementById("attrGrid");
  if (!grid) return;
  const rows = [
    { label: "⚔️ Ataque", val: state.attack },
    { label: "🛡️ Defesa", val: state.defense },
    { label: "❤️ HP Máximo", val: state.hpMax },
    { label: "🔵 Mana Máxima", val: state.manaMax },
    { label: "🌿 Regen HP/turno", val: "+" + state.hpRegen },
    { label: "✨ Regen Mana/turno", val: "+" + state.manaRegen },
    { label: "🗡️ Penetração", val: state.penetration + "%" },
    { label: "🍀 Sorte", val: state.luck + "%" },
    { label: "💥 Crítico", val: state.critChance + "%" },
    { label: "🌀 Esquiva", val: state.dodgeChance + "%" }
  ];
  grid.innerHTML = rows.map(r =>
    '<div class="attr-item"><span class="alabel">' + r.label + '</span><span class="aval">' + r.val + '</span></div>'
  ).join("");
}

function renderEquipmentCard() {
  document.getElementById("mochilaAvatarSvg").innerHTML = buildAvatarSvg();

  const leftCol = document.getElementById("equipColLeft");
  const rightCol = document.getElementById("equipColRight");
  leftCol.innerHTML = "";
  rightCol.innerHTML = "";

  EQUIPMENT_SLOTS.forEach(slotDef => {
    const equippedId = state.equipment[slotDef.id];
    const equippedDef = equippedId ? findItemDef(equippedId) : null;
    const slotEl = document.createElement("div");
    slotEl.className = "equip-slot" + (equippedDef ? " filled" : "");
    slotEl.title = slotDef.label;
    slotEl.onclick = () => openSlotPicker(slotDef.id);
    slotEl.innerHTML = equippedDef
      ? equippedDef.icon
      : '<span class="slot-placeholder">' + slotDef.icon + '</span>';
    (slotDef.side === "left" ? leftCol : rightCol).appendChild(slotEl);
  });
}

function openSlotPicker(slotId) {
  const slotDef = EQUIPMENT_SLOTS.find(s => s.id === slotId);
  const panel = document.getElementById("slotPickerPanel");
  const list = document.getElementById("slotPickerList");
  document.getElementById("slotPickerTitle").textContent = slotDef.icon + " " + slotDef.label;
  list.innerHTML = "";

  const equippedId = state.equipment[slotId];
  if (equippedId) {
    const equippedDef = findItemDef(equippedId);
    const row = document.createElement("div");
    row.className = "slot-item-row";
    row.innerHTML =
      '<span class="upgrade-icon">' + equippedDef.icon + '</span>' +
      '<div class="upgrade-info"><div class="uname">' + equippedDef.name + ' (equipado)</div><div class="udesc">' + getStatsSummaryText(equippedDef.stats) + '</div></div>' +
      '<button class="upgrade-buy" onclick="unequipItem(\'' + slotId + '\')">Remover</button>';
    list.appendChild(row);
  }

  const options = EQUIP_ITEMS.filter(i => i.slot === slotId && (state.inventory[i.id] || 0) > 0);
  if (options.length === 0 && !equippedId) {
    list.innerHTML = '<div class="hint">Nenhum item disponível para este slot ainda.</div>';
  } else {
    options.forEach(i => {
      const canEquip = state.level >= (i.reqLevel || 1);
      const twoHandText = i.twoHanded ? ' <span style="color:var(--gold);font-size:0.65rem;">(2 Mãos)</span>' : '';
      const row = document.createElement("div");
      row.className = "slot-item-row";
      row.innerHTML =
        '<span class="upgrade-icon">' + i.icon + '</span>' +
        '<div class="upgrade-info">' +
          '<div class="uname">' + i.name + twoHandText + ' <span style="font-size:0.7rem; color:var(--gold);">(Nv. ' + i.reqLevel + ')</span></div>' +
          '<div class="udesc">' + getStatsSummaryText(i.stats) + '</div>' +
        '</div>' +
        '<button class="upgrade-buy" ' + (canEquip ? '' : 'disabled') + ' onclick="equipItem(\'' + slotId + '\', \'' + i.id + '\')">' +
          (canEquip ? 'Equipar' : '🔒 Nv. ' + i.reqLevel) +
        '</button>';
      list.appendChild(row);
    });
  }

  panel.classList.remove("hidden");
}

function closeSlotPicker() {
  document.getElementById("slotPickerPanel").classList.add("hidden");
}

function getStatsSummaryText(stats) {
  if (!stats) return "";
  const labels = {
    attack: "Ataque", defense: "Defesa", hp: "HP", mana: "Mana",
    crit: "% Crítico", dodge: "% Esquiva", penetration: "% Penetração",
    luck: "% Sorte", hpRegen: "Regen HP", manaRegen: "Regen Mana"
  };
  return Object.keys(stats).map(k => "+" + stats[k] + " " + (labels[k] || k)).join(", ");
}

function equipItem(slotId, itemId) {
  const itemDef = findItemDef(itemId);
  if (itemDef && state.level < (itemDef.reqLevel || 1)) {
    showToast("❌ Nível insuficiente para equipar!");
    return;
  }

  if (itemDef.twoHanded) {
    if (state.equipment.arma_secundaria) {
      const secId = state.equipment.arma_secundaria;
      state.inventory[secId] = (state.inventory[secId] || 0) + 1;
      state.equipment.arma_secundaria = null;
    }
  } else {
    if (state.equipment.arma_principal) {
      const mainDef = findItemDef(state.equipment.arma_principal);
      if (mainDef && mainDef.twoHanded) {
        state.inventory[mainDef.id] = (state.inventory[mainDef.id] || 0) + 1;
        state.equipment.arma_principal = null;
      }
    }
  }

  const currentlyEquipped = state.equipment[slotId];
  if (currentlyEquipped) {
    state.inventory[currentlyEquipped] = (state.inventory[currentlyEquipped] || 0) + 1;
  }
  state.inventory[itemId] -= 1;
  if (state.inventory[itemId] <= 0) delete state.inventory[itemId];
  state.equipment[slotId] = itemId;
  recalcStats();
  saveState();
  closeSlotPicker();
  renderInventory();
}

function unequipItem(slotId) {
  const equippedId = state.equipment[slotId];
  if (!equippedId) return;
  state.inventory[equippedId] = (state.inventory[equippedId] || 0) + 1;
  state.equipment[slotId] = null;
  recalcStats();
  saveState();
  closeSlotPicker();
  renderInventory();
}

function render5x4Grid() {
  const grid = document.getElementById("invGrid5x4");
  grid.innerHTML = "";
  const entries = Object.keys(state.inventory).filter(id => state.inventory[id] > 0);

  for (let i = 0; i < 20; i++) {
    const cell = document.createElement("div");
    cell.className = "inv-cell";
    const id = entries[i];
    if (id) {
      const def = findItemDef(id);
      const count = state.inventory[id];
      cell.innerHTML = (def ? def.icon : "❓") + (count > 1 ? '<span class="icount">x' + count + '</span>' : "");
      cell.title = def ? def.name : id;
      if (potionDef(id)) {
        cell.style.cursor = "pointer";
        cell.onclick = () => usePotionFromBag(id);
      }
    }
    grid.appendChild(cell);
  }
}

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
    statusEl.textContent = "✓ Nickname disponível";
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
    
