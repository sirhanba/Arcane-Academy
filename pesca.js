// ============================================================
// pesca.js — Pesca e Cabana do Pescador (Lago Sereno).
// Sem vara não dá para pescar. Cada lançamento tem 10 min de espera (relógio do celular), não gasta mana e
// pesca de 1 a 3 itens conforme a vara. O jogo usa sempre a melhor vara que o jogador tem. Varas não ocupam mochila.
// ============================================================
const FISH_COOLDOWN_MS = 10 * 60 * 1000;

const RODS = [
  { level: 1, name: "Vara de Bambu",           icon: "🎋", price: 1000,  count: [80, 20, 0],
    loot: { nada: 10, lambari_prateado: 35, truta_do_lago: 20, carpa_dourada: 5, esturjao_arcano: 0, peixe_lua: 0, gota_agua_pura: 20, escama_brilhante: 10 } },
  { level: 2, name: "Vara de Fibra Arcana",    icon: "🪢", price: 5000,  count: [60, 30, 10],
    loot: { nada: 5, lambari_prateado: 20, truta_do_lago: 25, carpa_dourada: 15, esturjao_arcano: 4, peixe_lua: 1, gota_agua_pura: 20, escama_brilhante: 10 } },
  { level: 3, name: "Vara Cristalina",         icon: "💎", price: 20000, count: [40, 40, 20],
    loot: { nada: 2, lambari_prateado: 8, truta_do_lago: 20, carpa_dourada: 25, esturjao_arcano: 15, peixe_lua: 5, gota_agua_pura: 15, escama_brilhante: 10 } }
]; // count = chance (%) de pescar 1, 2 ou 3 itens por lançamento

let fishTimer = null;
let fishLastResult = "";

function rodDef(level) { return RODS.find(r => r.level === level) || null; }
function bestRod() { return rodDef(state.fishing.rod); }
function fishRemaining() { return Math.max(0, (state.fishing.readyAt || 0) - Date.now()); }
function fishItem(id) { return ITEMS.find(i => i.id === id) || { name: id, icon: "📦" }; }

function startFishTimer(screenId, renderFn) {
  if (fishTimer) clearInterval(fishTimer);
  fishTimer = setInterval(() => {
    const scr = document.getElementById(screenId);
    if (!scr || scr.classList.contains("hidden")) { clearInterval(fishTimer); fishTimer = null; return; }
    renderFn();
  }, 1000);
}

// ---------- Pescar ----------
function openFishing() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("pescaScreen").classList.remove("hidden");
  fishLastResult = "";
  renderFishing();
  startFishTimer("pescaScreen", renderFishing);
}

function renderFishing() {
  const rod = bestRod(), rem = fishRemaining();
  document.getElementById("pescaStatus").textContent = rod
    ? rod.icon + " " + rod.name + (rem > 0 ? " · ⏳ Próximo lançamento em " + formatDuration(rem) : " · ✅ Pronto para pescar")
    : "Você não tem uma vara. Compre uma na Cabana do Pescador.";
  const btn = document.getElementById("pescaBtn");
  btn.textContent = "🎣 Pescar";
  btn.disabled = !rod || rem > 0;
  document.getElementById("pescaResult").textContent = fishLastResult;
}

function fishRollOne(loot) {
  let r = Math.random() * 100;
  for (const id of Object.keys(loot)) {
    if (r < loot[id]) return id;
    r -= loot[id];
  }
  return "nada";
}

function fishRollCount(count) {
  let r = Math.random() * 100;
  for (let i = 0; i < count.length; i++) {
    if (r < count[i]) return i + 1;
    r -= count[i];
  }
  return 1;
}

// Um lançamento: devolve { id: quantidade } do que veio (sem "nada")
function fishCast(rod) {
  const n = fishRollCount(rod.count), got = {};
  for (let i = 0; i < n; i++) {
    const id = fishRollOne(rod.loot);
    if (id !== "nada") got[id] = (got[id] || 0) + 1;
  }
  return { got: got, tries: n };
}

function doFish() {
  const rod = bestRod();
  if (!rod || fishRemaining() > 0) return;
  const res = fishCast(rod);
  const ids = Object.keys(res.got);
  const needSlots = ids.filter(id => !(state.inventory[id] > 0)).length;
  if (needSlots > bagFree()) { showToast("🎒 Mochila cheia! Libere espaço para pescar."); return; }
  state.fishing.readyAt = Date.now() + FISH_COOLDOWN_MS;
  ids.forEach(id => { state.inventory[id] = (state.inventory[id] || 0) + res.got[id]; });
  fishLastResult = ids.length
    ? "🎣 Você pescou: " + ids.map(id => res.got[id] + "× " + fishItem(id).icon + " " + fishItem(id).name).join(", ") + "!"
    : "🎣 Só uma bota velha desta vez...";
  saveState();
  render();
  renderFishing();
  showToast(fishLastResult);
}

// ---------- Cabana do Pescador (loja de varas) ----------
function openFishShop() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("cabanaScreen").classList.remove("hidden");
  renderFishShop();
}

function renderFishShop() {
  const owned = state.fishing.rod;
  const list = document.getElementById("cabanaList");
  list.innerHTML = "";
  RODS.forEach(r => {
    const have = owned >= r.level;
    const row = document.createElement("div");
    row.className = "upgrade-row";
    const chance = r.count.map((c, i) => c > 0 ? c + "% de " + (i + 1) : "").filter(Boolean).join(" · ");
    row.innerHTML =
      '<span class="upgrade-icon">' + r.icon + '</span>' +
      '<div class="upgrade-info"><div class="uname">' + r.name + '</div>' +
      '<div class="udesc">Itens por lançamento: ' + chance + '</div></div>' +
      '<button class="upgrade-buy" ' + (have || state.gold < r.price ? "disabled " : "") + 'onclick="buyRod(' + r.level + ')">' +
      (have ? "✔ Você tem" : "🪙 " + r.price.toLocaleString("pt-BR")) + '</button>';
    list.appendChild(row);
  });
}

function buyRod(level) {
  const r = rodDef(level);
  if (!r || state.fishing.rod >= level) return;
  if (state.gold < r.price) { showToast("Cobre insuficiente."); return; }
  if (!confirm("Comprar a " + r.name + " por " + r.price.toLocaleString("pt-BR") + " Cobre?")) return;
  state.gold -= r.price;
  state.fishing.rod = level;
  saveState();
  render();
  renderFishShop();
  showToast(r.icon + " " + r.name + " comprada!");
}
