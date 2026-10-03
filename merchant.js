// ============================================================
// merchant.js — Mercador: loja, compra por quantidade e notificações de compra.
// ============================================================

const POTION_SHOP = POTIONS.map(p => ({
  id: p.id, name: p.name, icon: p.icon,
  desc: "Restaura " + p.amount + " de " + (p.type === "heal" ? "HP" : "Mana") + " (vai pra mochila)",
  cost: p.cost, currency: p.currency
}));

const MATERIAL_PRICE_COMMON = 100; // Cobre
const MATERIAL_PRICE_RARE = 200;   // Cobre

function materialShopItem(id, price) {
  const def = findItemDef(id);
  return { id: id, name: def.name, icon: def.icon, desc: def.desc || "Material de fabricação (vai pra mochila)", cost: price, currency: "gold" };
}

// Cada mercador tem seu estoque: poções nos locais de caça, materiais na Vila dos Mercadores.
const MERCHANTS = {
  jardins: {
    title: "🛒 Mercador Ithren", quote: "Boas relíquias, bom preço. Dê uma olhada.",
    items: () => [...POTION_SHOP, { id: "amuleto_forca", name: "Amuleto da Força", icon: "🔱", desc: "+2 de Ataque permanente", cost: 5, currency: "essence" }]
  },
  floresta: {
    title: "🛒 Mercadora da Trilha", quote: "Poções frescas pra quem encara a floresta.",
    items: () => [...POTION_SHOP]
  },
  vila: {
    title: "🛒 Mercadores da Vila", quote: "Materiais raros? Temos, mas não é de graça.",
    items: () => [
      materialShopItem("erva_lunar", MATERIAL_PRICE_COMMON),
      materialShopItem("po_estelar", MATERIAL_PRICE_COMMON),
      materialShopItem("cristal_arcano", MATERIAL_PRICE_RARE)
    ]
  }
};

let currentMerchantId = "jardins";

function currentShopItems() {
  const m = MERCHANTS[currentMerchantId];
  return m ? m.items() : [];
}

function shopItemById(id) {
  return currentShopItems().find(i => i.id === id) || null;
}

function isStackableShopItem(id) {
  return !!potionDef(id) || !!ITEMS.find(i => i.id === id);
}

function openMerchant(locationId) {
  if (isDefeated()) { showDefeatScreen(0); return; }
  if (locationId && MERCHANTS[locationId]) currentMerchantId = locationId;
  hideAllScreens();
  document.getElementById("merchantScreen").classList.remove("hidden");
  document.getElementById("buyQtyPanel").classList.add("hidden");
  const m = MERCHANTS[currentMerchantId];
  document.getElementById("merchantTitle").textContent = m.title;
  document.getElementById("merchantQuote").textContent = '"' + m.quote + '"';
  renderMerchant();
}

function renderMerchant() {
  const list = document.getElementById("merchantList");
  list.innerHTML = "";
  currentShopItems().forEach(item => {
    const isPotion = isStackableShopItem(item.id);
    const alreadyBought = item.id === "amuleto_forca" && state.purchasedItems[item.id];
    const wallet = item.currency === "gold" ? state.gold : state.essence;
    const canAfford = wallet >= item.cost && !alreadyBought;
    const costIcon = item.currency === "gold" ? "🪙" : "💎";
    const clickHandler = isPotion ? "openBuyQtyPicker" : "buyItem";

    const row = document.createElement("div");
    row.className = "upgrade-row";
    row.innerHTML =
      '<span class="upgrade-icon">' + item.icon + '</span>' +
      '<div class="upgrade-info">' +
        '<div class="uname">' + item.name + '</div>' +
        '<div class="udesc">' + item.desc + '</div>' +
      '</div>' +
      '<button class="upgrade-buy' + (item.currency === "essence" ? " essence-cost" : "") + '" ' +
        (canAfford ? "" : "disabled") + ' onclick="' + clickHandler + '(\'' + item.id + '\')">' +
        (alreadyBought ? "Adquirido" : costIcon + " " + item.cost) +
      '</button>';
    list.appendChild(row);
  });
}

function buyItem(id) {
  const item = shopItemById(id);
  if (!item) return;
  const wallet = item.currency === "gold" ? "gold" : "essence";
  if (state[wallet] < item.cost) return;

  if (id === "amuleto_forca") {
    if (state.purchasedItems[id]) return;
    state.purchasedItems[id] = true;
    recalcStats();
  } else {
    state.inventory[id] = (state.inventory[id] || 0) + 1;
  }

  state[wallet] -= item.cost;
  saveState();
  render();
  renderMerchant();
  showToast("✅ Comprou: " + item.name);
}

let buyQtyItemId = null;

function openBuyQtyPicker(id) {
  const item = shopItemById(id);
  if (!item) return;
  buyQtyItemId = id;
  const wallet = item.currency === "gold" ? state.gold : state.essence;
  const maxQty = Math.max(0, Math.floor(wallet / item.cost));

  document.getElementById("buyQtyTitle").innerHTML = item.icon + " " + item.name;
  const input = document.getElementById("buyQtyInput");
  input.max = maxQty;
  input.value = maxQty > 0 ? 1 : 0;
  updateBuyQtyTotal();
  document.getElementById("buyQtyPanel").classList.remove("hidden");
}

function closeBuyQtyPanel() {
  buyQtyItemId = null;
  document.getElementById("buyQtyPanel").classList.add("hidden");
}

function currentBuyMax() {
  const item = shopItemById(buyQtyItemId);
  const wallet = item.currency === "gold" ? state.gold : state.essence;
  return Math.max(0, Math.floor(wallet / item.cost));
}

function changeBuyQty(delta) {
  const input = document.getElementById("buyQtyInput");
  const max = currentBuyMax();
  let val = (parseInt(input.value, 10) || 0) + delta;
  val = Math.max(0, Math.min(max, val));
  input.value = val;
  updateBuyQtyTotal();
}

function onBuyQtyInput() {
  const input = document.getElementById("buyQtyInput");
  const max = currentBuyMax();
  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 0) val = 0;
  if (val > max) val = max;
  input.value = val;
  updateBuyQtyTotal();
}

function setBuyQtyMax() {
  document.getElementById("buyQtyInput").value = currentBuyMax();
  updateBuyQtyTotal();
}

function updateBuyQtyTotal() {
  const item = shopItemById(buyQtyItemId);
  const qty = parseInt(document.getElementById("buyQtyInput").value, 10) || 0;
  const total = qty * item.cost;
  const costIcon = item.currency === "gold" ? "🪙" : "💎";
  document.getElementById("buyQtyTotal").textContent = "Total: " + costIcon + " " + total;
}

function confirmBuyQty() {
  const item = shopItemById(buyQtyItemId);
  if (!item) return;
  const qty = parseInt(document.getElementById("buyQtyInput").value, 10) || 0;
  if (qty <= 0) return;
  const wallet = item.currency === "gold" ? "gold" : "essence";
  const total = qty * item.cost;
  if (state[wallet] < total) return;

  state[wallet] -= total;
  state.inventory[item.id] = (state.inventory[item.id] || 0) + qty;
  saveState();
  render();
  renderMerchant();
  closeBuyQtyPanel();
  showToast("✅ Comprou " + qty + "x " + item.name);
}
