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
  { result: "pocao_mana_e", tab: "pocoes", ingredients: { po_estelar: 2, cristal_arcano: 2 }, gold: 0 },

  // ----- Equipamentos -----
  { result: "capa_iniciante", tab: "equipamentos", ingredients: { erva_lunar: 3, po_estelar: 2 }, gold: 20 },
  { result: "colar_simples", tab: "equipamentos", ingredients: { po_estelar: 3, cristal_arcano: 1 }, gold: 30 },
  { result: "anel_cobre", tab: "equipamentos", ingredients: { po_estelar: 2, cristal_arcano: 2 }, gold: 40 },
  { result: "cajado_iniciante", tab: "equipamentos", ingredients: { erva_lunar: 4, po_estelar: 3, cristal_arcano: 2 }, gold: 60 }
];

// Nome e sufixo de cada atributo (para mostrar o que o equipamento dá)
const STAT_LABELS = {
  attack: ["Ataque", ""], defense: ["Defesa", ""], hp: ["HP Máx", ""], mana: ["Mana Máx", ""],
  hpRegen: ["Regen HP", ""], manaRegen: ["Regen Mana", ""],
  penetration: ["Penetração", "%"], luck: ["Sorte", "%"], crit: ["Crítico", "%"], dodge: ["Esquiva", "%"]
};

let craftTab = "pocoes";
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
  const eq = EQUIP_ITEMS.find(i => i.id === itemId);
  if (eq) {
    const slot = EQUIPMENT_SLOTS.find(s => s.id === eq.slot);
    const stats = Object.keys(eq.stats || {}).map(k => {
      const label = STAT_LABELS[k] || [k, ""];
      return "+" + eq.stats[k] + label[1] + " " + label[0];
    }).join(", ");
    return (slot ? slot.label + " · " : "") + stats;
  }
  return "";
}

function renderCraft() {
  document.getElementById("craftTabPocoes").classList.toggle("active", craftTab === "pocoes");
  document.getElementById("craftTabEquip").classList.toggle("active", craftTab === "equipamentos");

  // Materiais que o jogador tem + Cobre
  document.getElementById("craftMaterials").innerHTML =
    ITEMS.map(m => '<span class="mat-chip">' + m.icon + ' ' + m.name + ' <b>' + (state.inventory[m.id] || 0) + '</b></span>').join("") +
    '<span class="mat-chip">🪙 Cobre <b>' + state.gold + '</b></span>';

  const list = document.getElementById("craftList");
  list.innerHTML = "";

  RECIPES.filter(r => r.tab === craftTab).forEach(r => {
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
