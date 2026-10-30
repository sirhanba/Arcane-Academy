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

// Filtros por tipo (aba Equipamentos). "Botas" = slot Sapatos.
const CRAFT_SLOT_FILTERS = [
  { id: "armas", label: "⚔️ Armas", slots: ["arma_principal", "arma_secundaria"] },
  { id: "chapeu", label: "🎩 Chapéu", slots: ["chapeu"] },
  { id: "roupa", label: "👕 Roupa", slots: ["roupa"] },
  { id: "sapatos", label: "👢 Botas", slots: ["sapatos"] },
  { id: "capa", label: "🧣 Capa", slots: ["capa"] },
  { id: "colar", label: "📿 Colar", slots: ["colar"] },
  { id: "anel", label: "💍 Anel", slots: ["anel"] }
];
const CRAFT_TIER_FILTERS = [1, 5, 10, 20, 30, 40, 50];

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
const craftOpenIds = new Set(); // equipamentos com a sanfona aberta (mantém aberto ao redesenhar)
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

    // Card sanfona (igual às abas da Enciclopédia): fechado mostra só ícone, nome e nível.
    const card = document.createElement("details");
    card.className = "enc-item craft-acc" + (canAfford ? " can-craft" : "");
    if (craftOpenIds.has(def.id)) card.open = true;
    card.addEventListener("toggle", function () {
      if (card.open) craftOpenIds.add(def.id); else craftOpenIds.delete(def.id);
    });
    card.innerHTML =
      '<summary class="craft-sum">' +
        '<span class="craft-icon">' + def.icon + '</span>' +
        '<span class="craft-sum-name">' + def.name + '</span>' +
        '<span class="lv-tag">Nv. ' + def.tier + '</span>' +
      '</summary>' +
      '<div class="enc-body">' +
        '<div class="udesc">' + gearTag(def).replace(/[()]/g, "").trim() + (gearTag(def) ? " · " : "") + 'Requer Nv.' + def.requiredLevel + ' pra equipar</div>' +
        '<div class="udesc">' + gearPrimaryRangeText(def) + '</div>' +
        '<div class="udesc">' + gearPoolText(def) + '</div>' +
        '<div class="udesc">Na mochila: ' + owned + '</div>' +
        '<div class="craft-ingredients">' + ingredientsHtml + '</div>' +
        '<button class="craft-btn" ' + (canAfford ? "" : "disabled") + ' onclick="craftEquipment(\'' + def.id + '\')">🔨 Criar</button>' +
      '</div>';
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
  showCraftPopup(instance);
}

// ---------- Popup de item criado ----------
function closeCraftPopup() {
  const p = document.getElementById("craftPopup");
  if (p) p.remove();
}

function showCraftPopup(instance) {
  closeCraftPopup();
  const def = gearDef(instance.defId);
  let n = 0;
  const delay = function () { return (0.9 + 0.28 * n++).toFixed(2) + "s"; };
  let rollSum = 0, rollCount = 0;

  let stats = def.primary.map(function (p) {
    const v = instance.primary[p.stat];
    const pct = p.max > p.min ? Math.round((v - p.min) / (p.max - p.min) * 100) : 100;
    rollSum += pct; rollCount++;
    const lab = STAT_LABELS[p.stat] || [p.stat, ""];
    return '<div class="cp-stat" style="--d:' + delay() + '">' +
      '<div class="cp-stat-top"><span class="cp-stat-name">' + lab[0] + '</span>' +
      '<span class="cp-val">+<span class="count-up" data-to="' + v + '">0</span>' + lab[1] + '</span></div>' +
      '<div class="cp-bar"><i style="--w:' + pct + '%;--d:' + delay() + '"></i></div>' +
      '<div class="cp-range">sorteio ' + p.min + '–' + p.max + (pct >= 90 ? ' · ★ quase o máximo!' : '') + '</div></div>';
  }).join("");
  stats += instance.secondaries.map(function (s) {
    const lab = STAT_LABELS[s.stat] || [s.stat, ""];
    return '<div class="cp-stat cp-sec" style="--d:' + delay() + '"><div class="cp-stat-top"><span class="cp-stat-name">' + lab[0] + '</span>' +
      '<span class="cp-val">+' + s.amount + lab[1] + '</span></div></div>';
  }).join("");

  const avg = rollCount ? rollSum / rollCount : 0;
  const verdict = avg >= 90 ? ["PERFEITO!", "perfect"] : avg >= 70 ? ["Ótimo sorteio!", "great"] : avg >= 40 ? ["Bom sorteio", "ok"] : ["Sorteio fraco… a Forja pode ajudar", "low"];

  const p = document.createElement("div");
  p.id = "craftPopup";
  p.className = "cp-overlay";
  p.onclick = closeCraftPopup;
  p.innerHTML =
    '<div class="cp-flash"></div>' +
    '<div class="cp-card cp-' + verdict[1] + '" onclick="event.stopPropagation()">' +
      '<div class="cp-title">ITEM CRIADO!</div>' +
      '<div class="cp-icon-wrap"><div class="cp-rays"></div><div class="cp-ring"></div><div class="cp-ring cp-ring2"></div><div class="cp-icon">' + def.icon + '</div></div>' +
      '<div class="cp-name">' + def.name + '</div>' +
      '<div class="cp-sub"><span class="lv-tag">Nv. ' + def.tier + '</span> ' + (def.arch && ARCH_LABELS[def.arch] ? ARCH_LABELS[def.arch] : "") + '</div>' +
      '<div class="cp-stats">' + stats + '</div>' +
      '<div class="cp-verdict" style="--d:' + delay() + '">' + verdict[0] + '</div>' +
      '<button class="craft-btn cp-ok" style="--d:' + delay() + '" onclick="closeCraftPopup()">Continuar</button>' +
    '</div>';
  document.body.appendChild(p);

  p.querySelectorAll(".count-up").forEach(function (el, i) { countUpTo(el, Number(el.dataset.to), 700, 900 + 280 * i); });
  spawnConfetti(avg >= 90 ? 40 : avg >= 70 ? 26 : 14);
  if (tg && tg.HapticFeedback) { try { tg.HapticFeedback.notificationOccurred("success"); } catch (e) {} }
}
