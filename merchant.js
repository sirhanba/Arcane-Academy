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
  merchantTab = "comprar";
  renderMerchant();
}

let merchantTab = "comprar"; // "comprar" | "vender"

function setMerchantTab(tab) {
  merchantTab = tab;
  closeBuyQtyPanel();
  renderMerchant();
}

function renderMerchant() {
  document.getElementById("merchantTabBuy").classList.toggle("active", merchantTab === "comprar");
  document.getElementById("merchantTabSell").classList.toggle("active", merchantTab === "vender");
  document.getElementById("merchantList").classList.toggle("hidden", merchantTab !== "comprar");
  document.getElementById("sellList").classList.toggle("hidden", merchantTab !== "vender");
  if (merchantTab === "vender") {
    renderSellList();
    return;
  }
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
    if (!bagCanHold(id)) { showToast("🎒 Mochila cheia! Libere espaço."); return; }
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
  if (!bagCanHold(item.id)) { showToast("🎒 Mochila cheia! Libere espaço."); return; }

  state[wallet] -= total;
  state.inventory[item.id] = (state.inventory[item.id] || 0) + qty;
  saveState();
  render();
  renderMerchant();
  closeBuyQtyPanel();
  showToast("✅ Comprou " + qty + "x " + item.name);
}

// ---------- VENDA ----------

// Preço de venda (Cobre) de cada material. Para ajustar o equilíbrio, mude aqui.
const MATERIAL_SELL_PRICE = {
  erva_lunar: 20,      // comum
  po_estelar: 20,      // comum
  cristal_arcano: 40,  // raro
  pena_fenix: 60       // épico
};

// Preço de venda (Cobre) de equipamentos por tier: Nv.1 = 50 e dobra a cada tier.
const GEAR_SELL_PRICE = { 1: 50, 5: 100, 10: 200 };

// Equipamentos só podem ser vendidos na Vila dos Mercadores.
function canSellGearHere() {
  return currentMerchantId === "vila";
}

function gearSellPrice(def) {
  return GEAR_SELL_PRICE[def.tier] || 0;
}

function renderSellList() {
  const list = document.getElementById("sellList");
  list.innerHTML = "";
  let rows = 0;

  ITEMS.forEach(m => {
    const have = state.inventory[m.id] || 0;
    if (have <= 0) return;
    rows++;
    const price = MATERIAL_SELL_PRICE[m.id] || 0;
    const row = document.createElement("div");
    row.className = "upgrade-row";
    row.innerHTML =
      '<span class="upgrade-icon">' + m.icon + '</span>' +
      '<div class="upgrade-info">' +
        '<div class="uname">' + m.name + '</div>' +
        '<div class="udesc">🪙 ' + price + ' cada · Na mochila: ' + have + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;">' +
        '<button class="upgrade-buy" onclick="sellMaterial(\'' + m.id + '\', false)">Vender 1</button>' +
        '<button class="upgrade-buy" onclick="sellMaterial(\'' + m.id + '\', true)">Tudo (🪙 ' + (price * have) + ')</button>' +
      '</div>';
    list.appendChild(row);
  });

  if (canSellGearHere()) {
    // Só equipamentos fora dos slots (os equipados não podem ser vendidos)
    const gear = state.gearInventory.filter(g => gearDef(g.defId) && !isGearEquipped(g.uid));
    gear.forEach(inst => {
      rows++;
      const def = gearDef(inst.defId);
      const row = document.createElement("div");
      row.className = "upgrade-row";
      row.innerHTML =
        '<span class="upgrade-icon">' + def.icon + '</span>' +
        '<div class="upgrade-info">' +
          '<div class="uname">' + def.name + (def.twoHanded ? " (2 mãos)" : "") + '</div>' +
          '<div class="udesc">' + gearStatLine(inst) + '</div>' +
        '</div>' +
        '<button class="upgrade-buy" onclick="sellGear(\'' + inst.uid + '\')">🪙 ' + gearSellPrice(def) + '</button>';
      list.appendChild(row);
    });
  } else {
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.style.marginTop = "8px";
    hint.textContent = "Equipamentos só podem ser vendidos na Vila dos Mercadores.";
    list.appendChild(hint);
  }

  if (rows === 0) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "Você não tem nada para vender aqui.";
    list.insertBefore(empty, list.firstChild);
  }
}

function sellMaterial(id, all) {
  const have = state.inventory[id] || 0;
  if (have <= 0) return;
  const qty = all ? have : 1;
  const def = findItemDef(id);
  const total = qty * (MATERIAL_SELL_PRICE[id] || 0);

  state.inventory[id] -= qty;
  if (state.inventory[id] <= 0) delete state.inventory[id];
  state.gold += total;
  saveState();
  render();
  renderSellList();
  showToast("💰 Vendeu " + qty + "x " + def.name + " por " + total + " Cobre");
}

function sellGear(uid) {
  const inst = findGearInstance(uid);
  if (!inst || isGearEquipped(uid)) return;
  const def = gearDef(inst.defId);
  if (!def) return;
  const price = gearSellPrice(def);
  if (!confirm("Vender " + def.name + " por " + price + " Cobre? Não dá para desfazer.")) return;

  state.gearInventory = state.gearInventory.filter(g => g.uid !== uid);
  state.gold += price;
  saveState();
  render();
  renderSellList();
  showToast("💰 Vendeu " + def.name + " por " + price + " Cobre");
}
