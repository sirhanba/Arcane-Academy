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

function canCraft(recipe) {
  if (state.gold < recipe.gold) return false;
  return Object.keys(recipe.ingredients).every(id => (state.inventory[id] || 0) >= recipe.ingredients[id]);
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

    let ingredientsHtml = Object.keys(r.ingredients).map(id => {
      const mat = findItemDef(id);
      const have = state.inventory[id] || 0;
      const need = r.ingredients[id];
      return '<span class="ing' + (have >= need ? "" : " missing") + '">' + mat.icon + ' ' + mat.name + ' ' + have + '/' + need + '</span>';
    }).join("");
    if (r.gold > 0) {
      ingredientsHtml += '<span class="ing' + (state.gold >= r.gold ? "" : " missing") + '">🪙 Cobre ' + state.gold + '/' + r.gold + '</span>';
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
      '<button class="craft-btn" ' + (canCraft(r) ? "" : "disabled") + ' onclick="craftItem(\'' + r.result + '\')">🔨 Criar</button>';
    list.appendChild(card);
  });
}

function craftItem(resultId) {
  const r = RECIPES.find(x => x.result === resultId);
  if (!r || !canCraft(r)) return;

  Object.keys(r.ingredients).forEach(id => {
    state.inventory[id] -= r.ingredients[id];
    if (state.inventory[id] <= 0) delete state.inventory[id];
  });
  state.gold -= r.gold;
  state.inventory[r.result] = (state.inventory[r.result] || 0) + 1;

  saveState();
  render();
  renderCraft();
  showToast("🔨 Criou: " + findItemDef(r.result).name);
}
