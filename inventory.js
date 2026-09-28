// ============================================================
// inventory.js — Itens, equipamentos, poções e mochila (slots de equipar, grade 5x4, card de atributos).
// ============================================================

const ITEMS = [
  { id: "erva_lunar",    name: "Erva Lunar",     icon: "🌿", rarity: "comum", weight: 50 },
  { id: "po_estelar",    name: "Pó Estelar",     icon: "✨", rarity: "comum", weight: 30 },
  { id: "cristal_arcano",name: "Cristal Arcano", icon: "🔹", rarity: "raro",  weight: 15 },
  { id: "pena_fenix",    name: "Pena de Fênix",  icon: "🪶", rarity: "epico", weight: 5  }
];

const DROP_CHANCE = 0.3; // 30% de chance de achar item ao conjurar

const EQUIP_ITEMS = [
  { id: "chapeu_aprendiz", name: "Chapéu de Aprendiz", icon: "🎩", slot: "chapeu", stats: { defense: 1 } },
  { id: "tunica_simples", name: "Túnica Simples", icon: "👕", slot: "roupa", stats: { defense: 2 } },
  { id: "botas_surradas", name: "Botas Surradas", icon: "👢", slot: "sapatos", stats: { dodge: 2 } },
  { id: "capa_iniciante", name: "Capa de Iniciante", icon: "🧣", slot: "capa", stats: { penetration: 3 } },
  { id: "colar_simples", name: "Colar Simples", icon: "📿", slot: "colar", stats: { luck: 3 } },
  { id: "anel_cobre", name: "Anel de Cobre", icon: "💍", slot: "anel", stats: { crit: 3 } },
  { id: "adaga_treino", name: "Adaga de Treino", icon: "🗡️", slot: "arma_secundaria", stats: { attack: 1 } },
  { id: "cajado_iniciante", name: "Cajado de Iniciante", icon: "⚔️", slot: "arma_principal", stats: { attack: 2 } }
];

function findItemDef(id) {
  return ITEMS.find(i => i.id === id) || EQUIP_ITEMS.find(i => i.id === id) || POTIONS.find(i => i.id === id) || null;
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

function rollItemDrop(luckBonus) {
  luckBonus = luckBonus || 0;
  if (Math.random() > (DROP_CHANCE + luckBonus)) return null;
  const totalWeight = ITEMS.reduce((sum, it) => sum + it.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const item of ITEMS) {
    if (roll < item.weight) return item;
    roll -= item.weight;
  }
  return ITEMS[0];
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
      '<div class="upgrade-info"><div class="uname">' + equippedDef.name + ' (equipado)</div></div>' +
      '<button class="upgrade-buy" onclick="unequipItem(\'' + slotId + '\')">Remover</button>';
    list.appendChild(row);
  }

  const options = EQUIP_ITEMS.filter(i => i.slot === slotId && (state.inventory[i.id] || 0) > 0);
  if (options.length === 0 && !equippedId) {
    list.innerHTML = '<div class="hint">Nenhum item disponível para este slot ainda.</div>';
  } else {
    options.forEach(i => {
      const row = document.createElement("div");
      row.className = "slot-item-row";
      row.innerHTML =
        '<span class="upgrade-icon">' + i.icon + '</span>' +
        '<div class="upgrade-info"><div class="uname">' + i.name + '</div><div class="udesc">x' + state.inventory[i.id] + ' na mochila</div></div>' +
        '<button class="upgrade-buy" onclick="equipItem(\'' + slotId + '\', \'' + i.id + '\')">Equipar</button>';
      list.appendChild(row);
    });
  }

  panel.classList.remove("hidden");
}

function closeSlotPicker() {
  document.getElementById("slotPickerPanel").classList.add("hidden");
}

function equipItem(slotId, itemId) {
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
