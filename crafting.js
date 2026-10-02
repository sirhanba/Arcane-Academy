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

function toggleCraftFilter() {
  craftOnlyAvailable = !craftOnlyAvailable;
  renderCraft();
}

function appendCraftEmptyHint(list) {
  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Nada pode ser criado com os seus materiais agora.";
  list.appendChild(hint);
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
  return "Sorteia " + def.secondaryCount + " secundário" + (def.secondaryCount > 1 ? "s" : "") + " de: " + options;
}

function renderCraft() {
  document.getElementById("craftTabPocoes").classList.toggle("active", craftTab === "pocoes");
  document.getElementById("craftTabEquip").classList.toggle("active", craftTab === "equipamentos");
  const filterBtn = document.getElementById("craftFilterBtn");
  filterBtn.classList.toggle("active", craftOnlyAvailable);
  filterBtn.textContent = (craftOnlyAvailable ? "✅" : "☐") + " Só o que posso criar";

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

  Object.keys(r.ingredients).forEach(id => {
    state.inventory[id] -= r.ingredients[id] * qty;
    if (state.inventory[id] <= 0) delete state.inventory[id];
  });
  state.gold -= r.gold * qty;
  state.inventory[r.result] = (state.inventory[r.result] || 0) + qty;
  craftQty[resultId] = 1;

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
          '<div class="uname">' + def.name + (def.twoHanded ? " (2 mãos)" : "") + '</div>' +
          '<div class="udesc">Requer Nv.' + def.requiredLevel + ' pra equipar · ' + gearPrimaryRangeText(def) + '</div>' +
          '<div class="udesc">' + gearPoolText(def) + '</div>' +
          '<div class="udesc">Na mochila: ' + owned + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="craft-ingredients">' + ingredientsHtml + '</div>' +
      '<button class="craft-btn" ' + (canAfford ? "" : "disabled") + ' onclick="craftEquipment(\'' + def.id + '\')">🔨 Criar</button>';
    list.appendChild(card);
  });
  if (shown === 0) appendCraftEmptyHint(list);
}

function craftEquipment(defId) {
  const instance = craftGearItem(defId);
  if (!instance) return;
  render();
  renderCraft();
  const def = gearDef(defId);
  showToast("🔨 Criou " + def.name + " — " + gearStatLine(instance));
}
