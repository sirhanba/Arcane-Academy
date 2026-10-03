// ============================================================
// inventory.js — Itens, equipamentos, poções e mochila (slots de equipar, grade 5x4, card de atributos).
// ============================================================

const ITEMS = [
  { id: "erva_lunar",    name: "Erva Lunar",     icon: "🌿", rarity: "comum", desc: "Erva que floresce sob a luz da lua. Base das Poções de Vida e usada em quase todo equipamento." },
  { id: "po_estelar",    name: "Pó Estelar",     icon: "✨", rarity: "comum", desc: "Poeira brilhante deixada por estrelas cadentes. Base das Poções de Mana e usada em equipamentos." },
  { id: "cristal_arcano",name: "Cristal Arcano", icon: "🔹", rarity: "raro",  desc: "Cristal que guarda magia pura. Usado em equipamentos mais fortes e em poções de Mana superiores." },
  { id: "pena_fenix",    name: "Pena de Fênix",  icon: "🪶", rarity: "epico", desc: "Pena que arde sem se consumir. Essencial para as Poções de Vida superiores e os equipamentos mais poderosos." }
];

const DROP_CHANCE_CAP = 70; // teto (%) da chance TOTAL de drop de um monstro comum, com Sorte
const BOSS_DROP_CHANCE_CAP = 100; // teto para chefes (com Sorte 100% e soma base 50%, sempre dropa)

// Catálogo de equipamentos fabricáveis (tabela do Thiago). Cada entrada é um "molde":
// ao fabricar, o(s) atributo(s) principal(is) são sorteados dentro do range (±30%),
// e N atributos secundários são sorteados (sem repetir) dentro da pool.
// O Cajado é exceção: 2 atributos principais (Ataque e Defesa) e ocupa os 2 slots de arma.
const EQUIP_DEFS = [
  // ----- Cajado (2 mãos) -----
  { id: "cajado_aprendiz", name: "Cajado do Aprendiz", icon: "🪄", slot: "arma_principal", twoHanded: true, tier: 1, requiredLevel: 1,
    primary: [{ stat: "attack", min: 8, max: 16 }, { stat: "defense", min: 4, max: 7 }],
    secondaryCount: 1, pool: [{ stat: "mana", amount: 8 }, { stat: "manaRegen", amount: 1 }, { stat: "crit", amount: 1 }] },
  { id: "cajado_elementalista", name: "Cajado do Elementalista", icon: "🪄", slot: "arma_principal", twoHanded: true, tier: 5, requiredLevel: 5,
    primary: [{ stat: "attack", min: 21, max: 39 }, { stat: "defense", min: 8, max: 16 }],
    secondaryCount: 2, pool: [{ stat: "mana", amount: 20 }, { stat: "manaRegen", amount: 2 }, { stat: "crit", amount: 3 }, { stat: "penetration", amount: 2 }, { stat: "hpRegen", amount: 2 }] },
  { id: "cajado_arcanista", name: "Cajado do Arcanista Supremo", icon: "🪄", slot: "arma_principal", twoHanded: true, tier: 10, requiredLevel: 10,
    primary: [{ stat: "attack", min: 46, max: 85 }, { stat: "defense", min: 18, max: 33 }],
    secondaryCount: 3, pool: [{ stat: "mana", amount: 40 }, { stat: "manaRegen", amount: 4 }, { stat: "crit", amount: 4 }, { stat: "penetration", amount: 4 }, { stat: "hp", amount: 25 }, { stat: "hpRegen", amount: 4 }] },

  // ----- Varinha (mão principal) -----
  { id: "varinha_bordo", name: "Varinha de Bordo", icon: "✨", slot: "arma_principal", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "attack", min: 7, max: 13 }],
    secondaryCount: 1, pool: [{ stat: "crit", amount: 2 }, { stat: "penetration", amount: 1 }, { stat: "mana", amount: 5 }] },
  { id: "varinha_cristal", name: "Varinha de Cristal Infuso", icon: "✨", slot: "arma_principal", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "attack", min: 18, max: 33 }],
    secondaryCount: 2, pool: [{ stat: "crit", amount: 3 }, { stat: "penetration", amount: 3 }, { stat: "mana", amount: 10 }, { stat: "luck", amount: 2 }] },
  { id: "varinha_sombria", name: "Varinha Sombria da Ruína", icon: "✨", slot: "arma_principal", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "attack", min: 39, max: 72 }],
    secondaryCount: 3, pool: [{ stat: "crit", amount: 6 }, { stat: "penetration", amount: 4 }, { stat: "mana", amount: 18 }, { stat: "luck", amount: 3 }, { stat: "manaRegen", amount: 3 }] },

  // ----- Totem (mão principal) -----
  { id: "totem_madeira", name: "Totem de Madeira Runada", icon: "🗿", slot: "arma_principal", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "defense", min: 6, max: 10 }],
    secondaryCount: 1, pool: [{ stat: "hp", amount: 10 }, { stat: "dodge", amount: 1 }, { stat: "hpRegen", amount: 1 }] },
  { id: "totem_espiritual", name: "Totem Espiritual de Rocha", icon: "🗿", slot: "arma_principal", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "defense", min: 18, max: 33 }],
    secondaryCount: 2, pool: [{ stat: "hp", amount: 25 }, { stat: "dodge", amount: 2 }, { stat: "hpRegen", amount: 3 }, { stat: "luck", amount: 2 }] },
  { id: "totem_ancestral", name: "Totem Ancestral da Guardiã", icon: "🗿", slot: "arma_principal", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "defense", min: 40, max: 74 }],
    secondaryCount: 3, pool: [{ stat: "hp", amount: 60 }, { stat: "dodge", amount: 3 }, { stat: "hpRegen", amount: 5 }, { stat: "luck", amount: 3 }, { stat: "mana", amount: 23 }] },

  // ----- Grimório (mão secundária) -----
  { id: "grimorio_iniciado", name: "Grimório do Iniciado", icon: "📖", slot: "arma_secundaria", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "defense", min: 3, max: 5 }],
    secondaryCount: 1, pool: [{ stat: "mana", amount: 8 }, { stat: "manaRegen", amount: 1 }, { stat: "hp", amount: 5 }] },
  { id: "grimorio_conhecimentos", name: "Grimório dos Conhecimentos Perdidos", icon: "📖", slot: "arma_secundaria", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "defense", min: 7, max: 13 }],
    secondaryCount: 2, pool: [{ stat: "mana", amount: 18 }, { stat: "manaRegen", amount: 3 }, { stat: "hp", amount: 13 }, { stat: "hpRegen", amount: 2 }] },
  { id: "grimorio_segredos", name: "Grimório dos Segredos Eternos", icon: "📖", slot: "arma_secundaria", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "defense", min: 15, max: 29 }],
    secondaryCount: 3, pool: [{ stat: "mana", amount: 38 }, { stat: "manaRegen", amount: 5 }, { stat: "hp", amount: 30 }, { stat: "hpRegen", amount: 4 }, { stat: "dodge", amount: 2 }] },

  // ----- Orbe (mão secundária) -----
  { id: "orbe_aprendiz", name: "Orbe do Aprendiz", icon: "🔮", slot: "arma_secundaria", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "attack", min: 4, max: 8 }],
    secondaryCount: 1, pool: [{ stat: "crit", amount: 1 }, { stat: "penetration", amount: 1 }, { stat: "mana", amount: 5 }] },
  { id: "orbe_neblina", name: "Orbe da Neblina Mística", icon: "🔮", slot: "arma_secundaria", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "attack", min: 13, max: 23 }],
    secondaryCount: 2, pool: [{ stat: "crit", amount: 3 }, { stat: "penetration", amount: 3 }, { stat: "mana", amount: 10 }, { stat: "luck", amount: 2 }] },
  { id: "orbe_vazio", name: "Orbe do Vazio Astral", icon: "🔮", slot: "arma_secundaria", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "attack", min: 28, max: 52 }],
    secondaryCount: 3, pool: [{ stat: "crit", amount: 5 }, { stat: "penetration", amount: 6 }, { stat: "mana", amount: 20 }, { stat: "luck", amount: 4 }, { stat: "manaRegen", amount: 2 }] },

  // ----- Cabeça -----
  { id: "capuz_pano", name: "Capuz de Pano Simples", icon: "🎩", slot: "chapeu", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "defense", min: 2, max: 4 }],
    secondaryCount: 1, pool: [{ stat: "mana", amount: 5 }, { stat: "hp", amount: 5 }, { stat: "luck", amount: 1 }] },
  { id: "diadema_foco", name: "Diadema de Foco Místico", icon: "🎩", slot: "chapeu", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "defense", min: 7, max: 13 }],
    secondaryCount: 2, pool: [{ stat: "mana", amount: 13 }, { stat: "hp", amount: 13 }, { stat: "crit", amount: 2 }, { stat: "manaRegen", amount: 2 }] },
  { id: "coroa_espiritual", name: "Coroa Espiritual da Revelação", icon: "👑", slot: "chapeu", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "defense", min: 15, max: 29 }],
    secondaryCount: 3, pool: [{ stat: "mana", amount: 28 }, { stat: "hp", amount: 25 }, { stat: "crit", amount: 3 }, { stat: "manaRegen", amount: 3 }, { stat: "hpRegen", amount: 3 }] },

  // ----- Torso -----
  { id: "tunica_novico", name: "Túnica do Noviço", icon: "👕", slot: "roupa", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "defense", min: 9, max: 17 }],
    secondaryCount: 1, pool: [{ stat: "hp", amount: 5 }, { stat: "mana", amount: 5 }, { stat: "hpRegen", amount: 1 }] },
  { id: "tunica_tecelao", name: "Túnica do Tecelão Astral", icon: "👕", slot: "roupa", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "defense", min: 26, max: 48 }],
    secondaryCount: 2, pool: [{ stat: "hp", amount: 15 }, { stat: "mana", amount: 10 }, { stat: "dodge", amount: 2 }, { stat: "hpRegen", amount: 3 }] },
  { id: "manto_eclipse", name: "Manto do Eclipse Arcano", icon: "👕", slot: "roupa", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "defense", min: 57, max: 107 }],
    secondaryCount: 3, pool: [{ stat: "hp", amount: 35 }, { stat: "mana", amount: 23 }, { stat: "dodge", amount: 2 }, { stat: "hpRegen", amount: 5 }, { stat: "manaRegen", amount: 3 }] },

  // ----- Capa -----
  { id: "capa_viajante", name: "Capa de Viajante", icon: "🧣", slot: "capa", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "defense", min: 3, max: 5 }],
    secondaryCount: 1, pool: [{ stat: "dodge", amount: 1 }, { stat: "hp", amount: 5 }, { stat: "mana", amount: 5 }] },
  { id: "capa_penumbra", name: "Capa da Penumbra", icon: "🧣", slot: "capa", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "defense", min: 8, max: 16 }],
    secondaryCount: 2, pool: [{ stat: "dodge", amount: 2 }, { stat: "hp", amount: 10 }, { stat: "mana", amount: 10 }, { stat: "luck", amount: 2 }] },
  { id: "manto_sombras", name: "Manto das Sombras Vivas", icon: "🧣", slot: "capa", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "defense", min: 20, max: 36 }],
    secondaryCount: 3, pool: [{ stat: "dodge", amount: 4 }, { stat: "hp", amount: 23 }, { stat: "mana", amount: 18 }, { stat: "crit", amount: 2 }, { stat: "hpRegen", amount: 3 }] },

  // ----- Colar -----
  { id: "amuleto_pedras", name: "Amuleto de Pedras Simples", icon: "📿", slot: "colar", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "attack", min: 2, max: 4 }],
    secondaryCount: 1, pool: [{ stat: "mana", amount: 4 }, { stat: "luck", amount: 1 }, { stat: "penetration", amount: 1 }] },
  { id: "colar_ametista", name: "Colar de Ametista Runada", icon: "📿", slot: "colar", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "attack", min: 6, max: 10 }],
    secondaryCount: 2, pool: [{ stat: "mana", amount: 10 }, { stat: "luck", amount: 2 }, { stat: "penetration", amount: 2 }, { stat: "crit", amount: 2 }] },
  { id: "pendente_sol", name: "Pendente do Sol Arcano", icon: "📿", slot: "colar", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "attack", min: 13, max: 23 }],
    secondaryCount: 3, pool: [{ stat: "mana", amount: 23 }, { stat: "luck", amount: 3 }, { stat: "penetration", amount: 4 }, { stat: "crit", amount: 3 }, { stat: "manaRegen", amount: 2 }] },

  // ----- Anel -----
  { id: "anel_latao", name: "Anel de Latão Encantado", icon: "💍", slot: "anel", twoHanded: false, tier: 1, requiredLevel: 1,
    primary: [{ stat: "attack", min: 1, max: 3 }],
    secondaryCount: 1, pool: [{ stat: "mana", amount: 3 }, { stat: "luck", amount: 1 }, { stat: "hp", amount: 4 }] },
  { id: "anel_sinergia", name: "Anel da Sinergia Elemental", icon: "💍", slot: "anel", twoHanded: false, tier: 5, requiredLevel: 5,
    primary: [{ stat: "attack", min: 4, max: 8 }],
    secondaryCount: 2, pool: [{ stat: "mana", amount: 8 }, { stat: "luck", amount: 3 }, { stat: "hp", amount: 10 }, { stat: "hpRegen", amount: 2 }] },
  { id: "anel_mente", name: "Anel da Mente Imortal", icon: "💍", slot: "anel", twoHanded: false, tier: 10, requiredLevel: 10,
    primary: [{ stat: "attack", min: 10, max: 18 }],
    secondaryCount: 3, pool: [{ stat: "mana", amount: 18 }, { stat: "luck", amount: 5 }, { stat: "manaRegen", amount: 2 }, { stat: "hpRegen", amount: 3 }] }
];

// Custo de fabricação por tier — não veio na tabela do Thiago, valores propostos (fácil de ajustar aqui).
const GEAR_TIER_COST = {
  1: { materials: { erva_lunar: 2, po_estelar: 1 }, gold: 20 },
  5: { materials: { erva_lunar: 3, po_estelar: 2, cristal_arcano: 1 }, gold: 60 },
  10: { materials: { erva_lunar: 4, po_estelar: 3, cristal_arcano: 2, pena_fenix: 1 }, gold: 140 }
};

function gearDef(id) {
  return EQUIP_DEFS.find(d => d.id === id);
}

function findGearInstance(uid) {
  return state.gearInventory.find(g => g.uid === uid);
}

function rollInRange(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Fabrica uma instância do equipamento (rola atributo principal e sorteia secundários).
// Retorna a instância criada, ou null se faltar material/Cobre.
function craftGearItem(defId) {
  const def = gearDef(defId);
  if (!def) return null;
  const cost = GEAR_TIER_COST[def.tier];
  if (state.gold < cost.gold) return null;
  for (const matId in cost.materials) {
    if ((state.inventory[matId] || 0) < cost.materials[matId]) return null;
  }

  Object.keys(cost.materials).forEach(matId => {
    state.inventory[matId] -= cost.materials[matId];
    if (state.inventory[matId] <= 0) delete state.inventory[matId];
  });
  state.gold -= cost.gold;

  const primary = {};
  def.primary.forEach(p => { primary[p.stat] = rollInRange(p.min, p.max); });

  const poolCopy = def.pool.slice();
  const secondaries = [];
  for (let i = 0; i < def.secondaryCount && poolCopy.length > 0; i++) {
    const idx = Math.floor(Math.random() * poolCopy.length);
    secondaries.push(poolCopy.splice(idx, 1)[0]);
  }

  const instance = { uid: "g" + state.nextGearUid, defId: defId, primary: primary, secondaries: secondaries };
  state.nextGearUid += 1;
  state.gearInventory.push(instance);
  saveState();
  return instance;
}

function findItemDef(id) {
  return ITEMS.find(i => i.id === id) || POTIONS.find(i => i.id === id) || null;
}

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

// 1 sorteio por vitória: no máximo 1 material. Cada monstro/chefe tem sua tabela "drops"
// (chances em %, soma ≤ 100; o que sobra é "não dropou nada").
// Sorte é multiplicativa: cada chance × (1 + Sorte/100). O total fica limitado a DROP_CHANCE_CAP
// (ou ao total base da tabela, se ele já for maior que o teto).
function rollMonsterDrop(drops, luckPercent, isBoss) {
  if (!drops || drops.length === 0) return null;
  const baseTotal = drops.reduce((sum, d) => sum + d.chance, 0);
  if (baseTotal <= 0) return null;
  const finalTotal = Math.min(Math.max(isBoss ? BOSS_DROP_CHANCE_CAP : DROP_CHANCE_CAP, baseTotal), baseTotal * (1 + (luckPercent || 0) / 100));
  const scale = finalTotal / baseTotal;
  let roll = Math.random() * 100;
  for (const d of drops) {
    const chance = d.chance * scale;
    if (roll < chance) return findItemDef(d.item);
    roll -= chance;
  }
  return null;
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

// Um slot é considerado "ocupado por arma de 2 mãos" quando o mesmo uid está
// tanto em arma_principal quanto em arma_secundaria.
function slotHeldByTwoHanded(slotId) {
  if (slotId !== "arma_principal" && slotId !== "arma_secundaria") return false;
  const uid = state.equipment[slotId];
  if (!uid) return false;
  return state.equipment.arma_principal === uid && state.equipment.arma_secundaria === uid;
}

function gearStatLine(instance) {
  const def = gearDef(instance.defId);
  const parts = def.primary.map(p => "+" + instance.primary[p.stat] + " " + (STAT_LABELS[p.stat] || [p.stat, ""])[0]);
  instance.secondaries.forEach(s => parts.push("+" + s.amount + (STAT_LABELS[s.stat] || [s.stat, ""])[1] + " " + (STAT_LABELS[s.stat] || [s.stat, ""])[0]));
  return parts.join(" · ");
}

function renderEquipmentCard() {
  document.getElementById("mochilaAvatarSvg").innerHTML = buildAvatarSvg();

  const leftCol = document.getElementById("equipColLeft");
  const rightCol = document.getElementById("equipColRight");
  leftCol.innerHTML = "";
  rightCol.innerHTML = "";

  EQUIPMENT_SLOTS.forEach(slotDef => {
    const uid = state.equipment[slotDef.id];
    const instance = uid ? findGearInstance(uid) : null;
    const def = instance ? gearDef(instance.defId) : null;
    const slotEl = document.createElement("div");
    slotEl.className = "equip-slot" + (def ? " filled" : "");
    slotEl.title = def ? def.name : slotDef.label;
    slotEl.onclick = () => openSlotPicker(slotDef.id);
    slotEl.innerHTML = def
      ? def.icon
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

  // Slot de arma secundária ocupado por uma arma de 2 mãos: só dá pra remover, nada pra equipar aqui.
  if (slotId === "arma_secundaria" && slotHeldByTwoHanded("arma_secundaria")) {
    const uid = state.equipment.arma_secundaria;
    const def = gearDef(findGearInstance(uid).defId);
    list.innerHTML =
      '<div class="slot-item-row">' +
        '<span class="upgrade-icon">' + def.icon + '</span>' +
        '<div class="upgrade-info"><div class="uname">' + def.name + ' (arma de 2 mãos)</div><div class="udesc">Ocupa também o slot de arma principal</div></div>' +
        '<button class="upgrade-buy" onclick="unequipSlot(\'arma_principal\')">Remover</button>' +
      '</div>';
    panel.classList.remove("hidden");
    return;
  }

  const equippedUid = state.equipment[slotId];
  if (equippedUid) {
    const instance = findGearInstance(equippedUid);
    const def = instance && gearDef(instance.defId);
    if (def) {
      const row = document.createElement("div");
      row.className = "slot-item-row";
      row.innerHTML =
        '<span class="upgrade-icon">' + def.icon + '</span>' +
        '<div class="upgrade-info"><div class="uname">' + def.name + ' (equipado)</div><div class="udesc">' + gearStatLine(instance) + '</div></div>' +
        '<button class="upgrade-buy" onclick="unequipSlot(\'' + slotId + '\')">Remover</button>';
      list.appendChild(row);
    }
  }

  const options = state.gearInventory.filter(inst => {
    const def = gearDef(inst.defId);
    if (!def) return false;
    if (isGearEquipped(inst.uid)) return false;
    if (slotId === "arma_secundaria") return def.slot === "arma_secundaria"; // 2 mãos só equipa pela principal
    return def.slot === slotId;
  });

  if (options.length === 0 && !equippedUid) {
    list.innerHTML = '<div class="hint">Nenhum equipamento disponível para este slot ainda. Fabrique um na aba Criação.</div>';
  } else {
    options.forEach(inst => {
      const def = gearDef(inst.defId);
      const locked = state.level < def.requiredLevel;
      const row = document.createElement("div");
      row.className = "slot-item-row";
      row.innerHTML =
        '<span class="upgrade-icon">' + def.icon + '</span>' +
        '<div class="upgrade-info"><div class="uname">' + def.name + (def.twoHanded ? " (2 mãos)" : "") + '</div><div class="udesc">' + gearStatLine(inst) + '</div></div>' +
        (locked
          ? '<button class="upgrade-buy" disabled>🔒 Nv.' + def.requiredLevel + '</button>'
          : '<button class="upgrade-buy" onclick="equipItem(\'' + slotId + '\', \'' + inst.uid + '\')">Equipar</button>');
      list.appendChild(row);
    });
  }

  panel.classList.remove("hidden");
}

function closeSlotPicker() {
  document.getElementById("slotPickerPanel").classList.add("hidden");
}

function isGearEquipped(uid) {
  return Object.values(state.equipment).includes(uid);
}

function equipItem(slotId, uid) {
  const instance = findGearInstance(uid);
  if (!instance) return;
  const def = gearDef(instance.defId);
  if (!def || state.level < def.requiredLevel) return;

  if (def.twoHanded) {
    state.equipment.arma_principal = uid;
    state.equipment.arma_secundaria = uid;
  } else if (slotId === "arma_principal") {
    // Se a arma principal atual era de 2 mãos, ela ocupava a secundária também — libera.
    if (slotHeldByTwoHanded("arma_principal")) state.equipment.arma_secundaria = null;
    state.equipment.arma_principal = uid;
  } else {
    state.equipment[slotId] = uid;
  }

  recalcStats();
  saveState();
  closeSlotPicker();
  renderInventory();
}

function unequipSlot(slotId) {
  const uid = state.equipment[slotId];
  if (!uid) return;

  if (slotHeldByTwoHanded(slotId)) {
    state.equipment.arma_principal = null;
    state.equipment.arma_secundaria = null;
  } else {
    state.equipment[slotId] = null;
  }

  recalcStats();
  saveState();
  closeSlotPicker();
  renderInventory();
}

function render5x4Grid() {
  const grid = document.getElementById("invGrid5x4");
  grid.innerHTML = "";
  const entries = Object.keys(state.inventory).filter(id => state.inventory[id] > 0);
  // Equipamentos fabricados que NÃO estão equipados (cada um é único, ocupa 1 célula)
  const gearEntries = state.gearInventory.filter(g => gearDef(g.defId) && !isGearEquipped(g.uid));

  const total = entries.length + gearEntries.length;
  const cells = Math.max(20, Math.ceil(total / 5) * 5); // mínimo 5x4; cresce se encher

  for (let i = 0; i < cells; i++) {
    const cell = document.createElement("div");
    cell.className = "inv-cell";
    if (i < entries.length) {
      const id = entries[i];
      const def = findItemDef(id);
      const count = state.inventory[id];
      cell.innerHTML = (def ? def.icon : "❓") + (count > 1 ? '<span class="icount">x' + count + '</span>' : "");
      cell.title = def ? def.name : id;
      cell.style.cursor = "pointer";
      if (potionDef(id)) {
        cell.onclick = () => openPotionDetail(id);
      } else {
        cell.onclick = () => openMaterialDetail(id);
      }
    } else if (i < total) {
      const inst = gearEntries[i - entries.length];
      const def = gearDef(inst.defId);
      cell.className = "inv-cell gear";
      cell.innerHTML = def.icon + '<span class="gtier">Nv.' + def.requiredLevel + '</span>';
      cell.title = def.name;
      cell.style.cursor = "pointer";
      cell.onclick = () => openGearDetail(inst.uid);
    }
    grid.appendChild(cell);
  }
}

// Detalhe de um material (tocado na grade): nome, descrição e quantidade.
function openMaterialDetail(id) {
  const def = findItemDef(id);
  if (!def) return;
  const panel = document.getElementById("slotPickerPanel");
  document.getElementById("slotPickerTitle").textContent = def.icon + " " + def.name;
  document.getElementById("slotPickerList").innerHTML =
    '<div class="slot-item-row">' +
      '<span class="upgrade-icon">' + def.icon + '</span>' +
      '<div class="upgrade-info"><div class="udesc">' + (def.desc || "Material de criação.") + '</div>' +
      '<div class="udesc">Na mochila: ' + (state.inventory[id] || 0) + '</div></div>' +
    '</div>';
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Detalhe de uma poção (tocada na grade): efeito, quantidade e botão Usar.
function openPotionDetail(id) {
  const def = potionDef(id);
  if (!def) return;
  const isHeal = def.type === "heal";
  const full = isHeal ? state.hp >= state.hpMax : state.mana >= state.manaMax;
  const panel = document.getElementById("slotPickerPanel");
  document.getElementById("slotPickerTitle").textContent = def.icon + " " + def.name;
  document.getElementById("slotPickerList").innerHTML =
    '<div class="slot-item-row">' +
      '<span class="upgrade-icon">' + def.icon + '</span>' +
      '<div class="upgrade-info"><div class="udesc">Restaura ' + def.amount + ' de ' + (isHeal ? "HP" : "Mana") + '.</div>' +
      '<div class="udesc">Na mochila: ' + (state.inventory[id] || 0) + '</div></div>' +
      (full
        ? '<button class="upgrade-buy" disabled>' + (isHeal ? "HP cheio" : "Mana cheia") + '</button>'
        : '<button class="upgrade-buy" onclick="usePotionFromPanel(\'' + id + '\')">Usar</button>') +
    '</div>';
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function usePotionFromPanel(id) {
  usePotionFromBag(id);
  if ((state.inventory[id] || 0) > 0) openPotionDetail(id);
  else closeSlotPicker();
}

// Detalhe de um equipamento da mochila (tocado na grade): mostra atributos e permite equipar.
function openGearDetail(uid) {
  const inst = findGearInstance(uid);
  if (!inst) return;
  const def = gearDef(inst.defId);
  if (!def) return;
  const panel = document.getElementById("slotPickerPanel");
  const list = document.getElementById("slotPickerList");
  document.getElementById("slotPickerTitle").textContent = def.icon + " " + def.name + (def.twoHanded ? " (2 mãos)" : "");

  const locked = state.level < def.requiredLevel;
  const blockedByTwoHanded = def.slot === "arma_secundaria" && slotHeldByTwoHanded("arma_secundaria");
  let btn;
  if (locked) {
    btn = '<button class="upgrade-buy" disabled>🔒 Nv.' + def.requiredLevel + '</button>';
  } else if (blockedByTwoHanded) {
    btn = '<button class="upgrade-buy" disabled>Remova a arma de 2 mãos</button>';
  } else {
    btn = '<button class="upgrade-buy" onclick="equipItem(\'' + def.slot + '\', \'' + inst.uid + '\')">Equipar</button>';
  }

  list.innerHTML =
    '<div class="slot-item-row">' +
      '<span class="upgrade-icon">' + def.icon + '</span>' +
      '<div class="upgrade-info"><div class="uname">' + def.name + '</div>' +
      '<div class="udesc">' + gearStatLine(inst) + '</div>' +
      '<div class="udesc">Requer Nv.' + def.requiredLevel + '</div></div>' +
      btn +
    '</div>';
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---------- MERCADOR ----------

function potionIconSvg(color) {
  return '<svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align:middle">' +
    '<path d="M9 2h6v3l4 8v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6l4-8V2z" fill="none" stroke="' + color + '" stroke-width="1.5"/>' +
    '<path d="M6 14.5h12v3.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3.5z" fill="' + color + '"/>' +
    '</svg>';
}

const POTION_ICON_HEAL = potionIconSvg("#e5615a");

const POTION_ICON_MANA = potionIconSvg("#4a90e2");

const POTIONS = [
  { id: "pocao_vida_p", name: "Poção de Vida Pequena", icon: POTION_ICON_HEAL, type: "heal", amount: 40, cost: 8, currency: "gold" },
  { id: "pocao_vida_g", name: "Poção de Vida Grande", icon: POTION_ICON_HEAL, type: "heal", amount: 80, cost: 16, currency: "gold" },
  { id: "pocao_vida_e", name: "Poção de Vida Enorme", icon: POTION_ICON_HEAL, type: "heal", amount: 150, cost: 30, currency: "gold" },
  { id: "pocao_mana_p", name: "Poção de Mana Pequena", icon: POTION_ICON_MANA, type: "mana", amount: 10, cost: 6, currency: "gold" },
  { id: "pocao_mana_g", name: "Poção de Mana Grande", icon: POTION_ICON_MANA, type: "mana", amount: 20, cost: 12, currency: "gold" },
  { id: "pocao_mana_e", name: "Poção de Mana Enorme", icon: POTION_ICON_MANA, type: "mana", amount: 35, cost: 22, currency: "gold" }
];

function potionDef(id) {
  return POTIONS.find(p => p.id === id);
}

function applyPotionEffect(id) {
  const def = potionDef(id);
  if (!def) return null;
  if (!(state.inventory[id] > 0)) return null;
  state.inventory[id] -= 1;
  if (state.inventory[id] <= 0) delete state.inventory[id];

  let amountApplied;
  if (def.type === "heal") {
    amountApplied = Math.min(def.amount, state.hpMax - state.hp);
    state.hp = Math.min(state.hpMax, state.hp + def.amount);
  } else {
    amountApplied = Math.min(def.amount, state.manaMax - state.mana);
    state.mana = Math.min(state.manaMax, state.mana + def.amount);
  }
  return { def: def, amountApplied: amountApplied };
}

function usePotionFromBag(id) {
  const result = applyPotionEffect(id);
  if (!result) return;
  saveState();
  render();
  render5x4Grid();
  log("🧪 Bebeu " + result.def.name + " e recuperou " + result.amountApplied + " de " + (result.def.type === "heal" ? "HP" : "Mana") + ".");
}
