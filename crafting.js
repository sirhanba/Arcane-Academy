// ============================================================
// crafting.js — Criação (craft): fabricar poções e equipamentos com os materiais dropados.
// ============================================================

// Cada receita: item que será criado (result), aba, ingredientes { idDoMaterial: quantidade } e custo em Cobre.
// Para ajustar o equilíbrio do jogo, basta mudar os números aqui.
const RECIPES = [
  // ----- Poções -----
  { result: "pocao_vida_p", tab: "pocoes", ingredients: { erva_lunar: 1 }, gold: 0 },
  { result: "pocao_vida_g", tab: "pocoes", ingredients: { erva_lunar: 2, po_estelar: 1 }, gold: 0 },
  { result: "pocao_vida_e", tab: "pocoes", ingredients: { erva_lunar: 2, pena_fenix: 1 }, gold: 0 },
  { result: "pocao_mana_p", tab: "pocoes", ingredients: { po_estelar: 1 }, gold: 0 },
  { result: "pocao_mana_g", tab: "pocoes", ingredients: { po_estelar: 2, erva_lunar: 1 }, gold: 0 },
  { result: "pocao_mana_e", tab: "pocoes", ingredients: { po_estelar: 2, cristal_arcano: 2 }, gold: 0 }
];
// Equipamentos (EQUIP_DEFS, em inventory.js) são fabricados à parte — cada um gera uma
// instância única com atributos sorteados, então não cabem no formato "receita simples" acima.

// Nome e sufixo de cada atributo (para mostrar o que o equipamento dá)
const STAT_LABELS = {
  attack: ["Ataque", ""], defense: ["Defesa", ""], hp: ["HP Máx", ""], mana: ["Mana Máx", ""],
  hpRegen: ["Regen HP", ""], manaRegen: ["Regen Mana", ""],
  penetration: ["Penetração", "%"], luck: ["Sorte", "%"], crit: ["Crítico", "%"], dodge: ["Esquiva", "%"]
};

let craftTab = "pocoes";
let craftOnlyAvailable = false; // filtro: mostrar só o que dá pra fabricar agora
let craftSlotFilter = null;     // filtro de tipo de equipamento (id de CRAFT_SLOT_FILTERS) ou null
let craftTierFilter = null;     // filtro de nível do equipamento (1, 5 ou 10) ou null

// Filtros por tipo (aba Equipamentos). "Botas" = slot Sapatos (ainda sem itens; entram na Fase 2).
const CRAFT_SLOT_FILTERS = [
  { id: "armas", label: "⚔️ Armas", slots: ["arma_principal", "arma_secundaria"] },
  { id: "chapeu", label: "🎩 Chapéu", slots: ["chapeu"] },
  { id: "roupa", label: "👕 Roupa", slots: ["roupa"] },
  { id: "sapatos", label: "👢 Botas", slots: ["sapatos"] },
  { id: "capa", label: "🧣 Capa", slots: ["capa"] },
  { id: "colar", label: "📿 Colar", slots: ["colar"] },
  { id: "anel", label: "💍 Anel", slots: ["anel"] }
];
const CRAFT_TIER_FILTERS = [1, 5, 10];

function toggleCraftFilter() {
  craftOnlyAvailable = !craftOnlyAvailable;
  renderCraft();
}

function setCraftSlotFilter(id) {
  craftSlotFilter = craftSlotFilter === id ? null : id;
  renderCraft();
}

function setCraftTierFilter(tier) {
  craftTierFilter = craftTierFilter === tier ? null : tier;
  renderCraft();
}

function clearCraftFilters() {
  craftOnlyAvailable = false;
  craftSlotFilter = null;
  craftTierFilter = null;
  renderCraft();
}

function craftHasFilter() {
  return craftOnlyAvailable || (craftTab === "equipamentos" && (craftSlotFilter !== null || craftTierFilter !== null));
}

function appendCraftEmptyHint(list, msg) {
  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = msg || "Nada pode ser criado com os seus materiais agora.";
  list.appendChild(hint);
}

// Botões de filtro (tipo e nível) da aba Equipamentos
function renderCraftFilterChips() {
  const slotBox = document.getElementById("craftSlotChips");
  const tierBox = document.getElementById("craftTierChips");
  slotBox.innerHTML = "";
  tierBox.innerHTML = "";
  CRAFT_SLOT_FILTERS.forEach(f => {
    const b = document.createElement("button");
    b.className = "craft-chip" + (craftSlotFilter === f.id ? " active" : "");
    b.textContent = f.label;
    b.onclick = () => setCraftSlotFilter(f.id);
    slotBox.appendChild(b);
  });
  CRAFT_TIER_FILTERS.forEach(t => {
    const b = document.createElement("button");
    b.className = "craft-chip" + (craftTierFilter === t ? " active" : "");
    b.textContent = "Nv. " + t;
    b.onclick = () => setCraftTierFilter(t);
    tierBox.appendChild(b);
  });
}
const craftQty = {}; // quantidade escolhida por receita (só usado para poções)

// Quantas cópias dessa receita dá pra fabricar agora, com os materiais/Cobre atuais
function maxCraftable(recipe) {
  let max = recipe.gold > 0 ? Math.floor(state.gold / recipe.gold) : Infinity;
  Object.keys(recipe.ingredients).forEach(id => {
    const have = state.inventory[id] || 0;
    max = Math.min(max, Math.floor(have / recipe.ingredients[id]));
  });
  return Math.max(0, max);
}

function getCraftQty(resultId, max) {
  const q = craftQty[resultId] || 1;
  return Math.min(Math.max(q, 1), Math.max(max, 1));
}

function changeCraftQty(resultId, delta) {
  const r = RECIPES.find(x => x.result === resultId);
  const max = maxCraftable(r);
  craftQty[resultId] = Math.min(Math.max(getCraftQty(resultId, max) + delta, 1), Math.max(max, 1));
  renderCraft();
}

function setCraftQtyMax(resultId) {
  const r = RECIPES.find(x => x.result === resultId);
  craftQty[resultId] = Math.max(1, maxCraftable(r));
  renderCraft();
}

function openCraft() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("craftScreen").classList.remove("hidden");
  renderCraft();
}

function setCraftTab(tab) {
  craftTab = tab;
  renderCraft();
}

function recipeEffectText(itemId) {
  const potion = potionDef(itemId);
  if (potion) {
    return "Restaura " + potion.amount + " de " + (potion.type === "heal" ? "HP" : "Mana");
  }
  return "";
}

// Texto do(s) atributo(s) principal(is) com o range de RNG, ex: "Ataque 8–16"
function gearPrimaryRangeText(def) {
  return def.primary.map(p => {
    const label = (STAT_LABELS[p.stat] || [p.stat, ""])[0];
    return label + " " + p.min + "–" + p.max;
  }).join(" + ");
}

// Texto da pool de secundários, ex: "Sorteia 2 de: Crítico +3%, Mana +10, Sorte +2"
function gearPoolText(def) {
  const options = def.pool.map(s => {
    const label = (STAT_LABELS[s.stat] || [s.stat, ""]);
    return label[0] + " +" + s.amount + label[1];
  }).join(", ");
  return (def.arch ? ARCH_LABELS[def.arch] + " · " : "") + "Sorteia " + def.secondaryCount + " secundário" + (def.secondaryCount > 1 ? "s" : "") + " de: " + options;
}

function renderCraft() {
  document.getElementById("craftTabPocoes").classList.toggle("active", craftTab === "pocoes");
  document.getElementById("craftTabEquip").classList.toggle("active", craftTab === "equipamentos");
  const filterBtn = document.getElementById("craftFilterBtn");
  filterBtn.classList.toggle("active", craftOnlyAvailable);
  filterBtn.textContent = (craftOnlyAvailable ? "✅" : "☐") + " Só o que posso criar";
  document.getElementById("craftEquipFilters").classList.toggle("hidden", craftTab !== "equipamentos");
  if (craftTab === "equipamentos") renderCraftFilterChips();
  document.getElementById("craftClearBtn").classList.toggle("hidden", !craftHasFilter());

  // Materiais que o jogador tem + Cobre
  document.getElementById("craftMaterials").innerHTML =
    ITEMS.map(m => '<span class="mat-chip">' + m.icon + ' ' + m.name + ' <b>' + (state.inventory[m.id] || 0) + '</b></span>').join("") +
    '<span class="mat-chip">🪙 Cobre <b>' + state.gold + '</b></span>';

  const list = document.getElementById("craftList");
  list.innerHTML = "";

  if (craftTab === "equipamentos") {
    renderCraftEquipamentos(list);
    return;
  }

  const recipes = RECIPES.filter(r => r.tab === craftTab && (!craftOnlyAvailable || maxCraftable(r) > 0));
  if (recipes.length === 0) appendCraftEmptyHint(list);
  recipes.forEach(r => {
    const def = findItemDef(r.result);
    const owned = state.inventory[r.result] || 0;
    const isPotion = craftTab === "pocoes";
    const max = maxCraftable(r);
    const qty = isPotion ? getCraftQty(r.result, max) : 1;

    let ingredientsHtml = Object.keys(r.ingredients).map(id => {
      const mat = findItemDef(id);
      const have = state.inventory[id] || 0;
      const need = r.ingredients[id] * qty;
      return '<span class="ing' + (have >= need ? "" : " missing") + '">' + mat.icon + ' ' + mat.name + ' ' + have + '/' + need + '</span>';
    }).join("");
    if (r.gold > 0) {
      ingredientsHtml += '<span class="ing' + (state.gold >= r.gold * qty ? "" : " missing") + '">🪙 Cobre ' + state.gold + '/' + (r.gold * qty) + '</span>';
    }

    const card = document.createElement("div");
    card.className = "craft-card";
    card.innerHTML =
      '<div class="craft-head">' +
        '<span class="craft-icon">' + def.icon + '</span>' +
        '<div class="craft-info">' +
          '<div class="uname">' + def.name + '</div>' +
          '<div class="udesc">' + recipeEffectText(r.result) + '</div>' +
          '<div class="udesc">Na mochila: ' + owned + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="craft-ingredients">' + ingredientsHtml + '</div>' +
      (isPotion
        ? '<div class="qty-row">' +
            '<button class="qty-btn" ' + (max === 0 ? "disabled" : "") + ' onclick="changeCraftQty(\'' + r.result + '\', -1)">−</button>' +
            '<div class="craft-qty-val">' + (max === 0 ? 0 : qty) + '</div>' +
            '<button class="qty-btn" ' + (qty >= max ? "disabled" : "") + ' onclick="changeCraftQty(\'' + r.result + '\', 1)">+</button>' +
            '<button class="qty-max-btn" ' + (max === 0 ? "disabled" : "") + ' onclick="setCraftQtyMax(\'' + r.result + '\')">Máx (' + max + ')</button>' +
          '</div>'
        : '') +
      '<button class="craft-btn" ' + (max === 0 ? "disabled" : "") + ' onclick="craftItem(\'' + r.result + '\')">🔨 Criar' + (isPotion && qty > 1 ? " (" + qty + "x)" : "") + '</button>';
    list.appendChild(card);
  });
}

function craftItem(resultId) {
  const r = RECIPES.find(x => x.result === resultId);
  if (!r) return;
  const isPotion = r.tab === "pocoes";
  const max = maxCraftable(r);
  if (max <= 0) return;
  const qty = isPotion ? Math.min(getCraftQty(resultId, max), max) : 1;
  if (qty <= 0) return;

  // Mochila: poção nova precisa de 1 célula (conta as liberadas pelos ingredientes gastos)
  let freed = 0;
  Object.keys(r.ingredients).forEach(id => {
    if ((state.inventory[id] || 0) === r.ingredients[id] * qty) freed++;
  });
  if (!(state.inventory[r.result] > 0) && bagFree() + freed < 1) { showToast("🎒 Mochila cheia! Libere espaço."); return; }

  Object.keys(r.ingredients).forEach(id => {
    state.inventory[id] -= r.ingredients[id] * qty;
    if (state.inventory[id] <= 0) delete state.inventory[id];
  });
  state.gold -= r.gold * qty;
  state.inventory[r.result] = (state.inventory[r.result] || 0) + qty;
  craftQty[resultId] = 1;
  if (isPotion) addStat("potionsCrafted", qty); // conquistas

  saveState();
  render();
  renderCraft();
  showToast("🔨 Criou " + (qty > 1 ? qty + "x " : "") + findItemDef(r.result).name);
}

function renderCraftEquipamentos(list) {
  let shown = 0;
  EQUIP_DEFS.forEach(def => {
    const cost = GEAR_TIER_COST[def.tier];
    const owned = state.gearInventory.filter(g => g.defId === def.id).length;
    const affordable = state.gold >= cost.gold && Object.keys(cost.materials).every(id => (state.inventory[id] || 0) >= cost.materials[id]);
    if (craftOnlyAvailable && !affordable) return;
    if (craftSlotFilter) {
      const f = CRAFT_SLOT_FILTERS.find(x => x.id === craftSlotFilter);
      if (f && !f.slots.includes(def.slot)) return;
    }
    if (craftTierFilter && def.tier !== craftTierFilter) return;
    shown++;

    let ingredientsHtml = Object.keys(cost.materials).map(id => {
      const mat = findItemDef(id);
      const have = state.inventory[id] || 0;
      const need = cost.materials[id];
      return '<span class="ing' + (have >= need ? "" : " missing") + '">' + mat.icon + ' ' + mat.name + ' ' + have + '/' + need + '</span>';
    }).join("");
    ingredientsHtml += '<span class="ing' + (state.gold >= cost.gold ? "" : " missing") + '">🪙 Cobre ' + state.gold + '/' + cost.gold + '</span>';

    const canAfford = state.gold >= cost.gold && Object.keys(cost.materials).every(id => (state.inventory[id] || 0) >= cost.materials[id]);

    const card = document.createElement("div");
    card.className = "craft-card";
    card.innerHTML =
      '<div class="craft-head">' +
        '<span class="craft-icon">' + def.icon + '</span>' +
        '<div class="craft-info">' +
          '<div class="uname">' + def.name + gearTag(def) + '</div>' +
          '<div class="udesc">Requer Nv.' + def.requiredLevel + ' pra equipar · ' + gearPrimaryRangeText(def) + '</div>' +
          '<div class="udesc">' + gearPoolText(def) + '</div>' +
          '<div class="udesc">Na mochila: ' + owned + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="craft-ingredients">' + ingredientsHtml + '</div>' +
      '<button class="craft-btn" ' + (canAfford ? "" : "disabled") + ' onclick="craftEquipment(\'' + def.id + '\')">🔨 Criar</button>';
    list.appendChild(card);
  });
  if (shown === 0) {
    const f = craftSlotFilter ? CRAFT_SLOT_FILTERS.find(x => x.id === craftSlotFilter) : null;
    const noItemsOfType = f && !EQUIP_DEFS.some(d => f.slots.includes(d.slot));
    appendCraftEmptyHint(list, noItemsOfType ? "Ainda não existem equipamentos desse tipo. Eles chegam em breve!"
      : (craftSlotFilter || craftTierFilter) ? "Nenhum equipamento encontrado com esses filtros." : null);
  }
}

function craftEquipment(defId) {
  const instance = craftGearItem(defId);
  if (!instance) return;
  render();
  renderCraft();
  const def = gearDef(defId);
  showToast("🔨 Criou " + def.name + " — " + gearStatLine(instance));
}
