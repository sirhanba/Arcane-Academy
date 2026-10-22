// ============================================================
// sacrificio.js — Altar de Sacrifício (Catacumbas Subterrâneas): uma aposta com risco.
// Cada sacrifício custa a oferenda (consumida mesmo se vier "nada") + 25% do HP máximo. Se o HP atual não
// for maior que esse custo, o sacrifício fica bloqueado (nunca mata o jogador). Espera de 30 min (relógio do celular).
// ============================================================
const SACRIFICE_HP_PCT = 25;
const SACRIFICE_COOLDOWN_MS = 30 * 60 * 1000;
const SACRIFICE_UNCOMMON = ["essencia_sombria", "escama_brilhante", "fragmento_quartzo"];
const SACRIFICE_RARE = ["olho_gorgona", "sangue_dragao", "coracao_elemental"];

// Cada resultado: { chance, type: "u"|"r"|"item", n, id } — "u" = incomum aleatório, "r" = raro aleatório. O resto das chances = nada.
const SACRIFICE_OFFERS = {
  cobre:    { cost: 1000, outcomes: [{ chance: 25, type: "u", n: 1 }, { chance: 20, type: "u", n: 2 }, { chance: 8, type: "r", n: 1 }, { chance: 2, type: "item", id: "pena_fenix", n: 1 }] },
  material: { qty: 5,     outcomes: [{ chance: 35, type: "u", n: 1 }, { chance: 12, type: "u", n: 2 }, { chance: 3, type: "r", n: 1 }] },
  raro:     { item: "cristal_arcano", outcomes: [{ chance: 40, type: "u", n: 1 }, { chance: 20, type: "r", n: 1 }, { chance: 10, type: "item", id: "pena_fenix", n: 1 }] }
};

let sacrificeTimer = null;
let sacrificeLastResult = "";

function sacItem(id) { return ITEMS.find(i => i.id === id) || { name: id, icon: "📦" }; }
function sacrificeHpCost() { return Math.ceil(state.hpMax * SACRIFICE_HP_PCT / 100); }
function sacrificeRemaining() { return Math.max(0, (state.sacrifice.readyAt || 0) - Date.now()); }
function sacrificeHpOk() { return state.hp > sacrificeHpCost(); } // não pode matar o jogador
// Materiais comuns oferecíveis (peixes ficam de fora: só servem para vender)
function sacrificeCommons() {
  return ITEMS.filter(i => i.rarity === "comum" && !FISH_IDS.includes(i.id) && (state.inventory[i.id] || 0) >= SACRIFICE_OFFERS.material.qty);
}

function openSacrifice() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("sacrificioScreen").classList.remove("hidden");
  sacrificeLastResult = "";
  renderSacrifice();
  if (sacrificeTimer) clearInterval(sacrificeTimer);
  sacrificeTimer = setInterval(() => {
    const scr = document.getElementById("sacrificioScreen");
    if (!scr || scr.classList.contains("hidden")) { clearInterval(sacrificeTimer); sacrificeTimer = null; return; }
    renderSacrifice();
  }, 1000);
}

function sacOutcomeText(o) {
  const n = o.n > 1 ? o.n + " " : "1 ";
  if (o.type === "u") return o.chance + "%: " + n + (o.n > 1 ? "incomuns" : "incomum");
  if (o.type === "r") return o.chance + "%: " + n + "raro";
  return o.chance + "%: " + sacItem(o.id).name;
}

function renderSacrifice() {
  const rem = sacrificeRemaining(), hpCost = sacrificeHpCost(), hpOk = sacrificeHpOk();
  document.getElementById("sacrificioStatus").textContent =
    "❤️ HP: " + Math.floor(state.hp) + " / " + state.hpMax + " · Custo de cada sacrifício: " + hpCost + " HP (" + SACRIFICE_HP_PCT + "% do máximo) · " +
    (rem > 0 ? "⏳ Altar em silêncio: " + formatDuration(rem) : "✅ Altar pronto");
  document.getElementById("sacrificioNote").textContent = !hpOk ? "💀 Seu HP é baixo demais: o sacrifício te mataria. Recupere a vida antes." : "";
  const list = document.getElementById("sacrificioList");
  list.innerHTML = "";
  const rows = [];
  const o1 = SACRIFICE_OFFERS.cobre;
  rows.push({ key: "cobre", icon: "🪙", name: "Oferenda de Cobre", cost: "🪙 " + o1.cost.toLocaleString("pt-BR"), have: state.gold >= o1.cost, outs: o1.outcomes });
  const o3 = SACRIFICE_OFFERS.raro;
  rows.push({ key: "raro", icon: "🔹", name: "Oferenda Rara", cost: "1× " + sacItem(o3.item).name, have: (state.inventory[o3.item] || 0) >= 1, outs: o3.outcomes });
  const commons = sacrificeCommons();
  if (commons.length === 0) {
    rows.push({ key: "material", icon: "🦴", name: "Oferenda de Materiais", cost: SACRIFICE_OFFERS.material.qty + "× do mesmo material comum", have: false, outs: SACRIFICE_OFFERS.material.outcomes });
  }
  commons.forEach(m => rows.push({ key: "material:" + m.id, icon: m.icon, name: "Oferenda de Materiais", cost: SACRIFICE_OFFERS.material.qty + "× " + m.name, have: true, outs: SACRIFICE_OFFERS.material.outcomes }));
  rows.forEach(r => {
    const nada = 100 - r.outs.reduce((a, o) => a + o.chance, 0);
    const row = document.createElement("div");
    row.className = "upgrade-row";
    row.innerHTML =
      '<span class="upgrade-icon">' + r.icon + '</span>' +
      '<div class="upgrade-info"><div class="uname">' + r.name + ' — ' + r.cost + '</div>' +
      '<div class="udesc">Nada: ' + nada + '% · ' + r.outs.map(sacOutcomeText).join(" · ") + '</div></div>' +
      '<button class="upgrade-buy" ' + (!r.have || rem > 0 || !hpOk ? "disabled " : "") + 'onclick="doSacrifice(\'' + r.key + '\')">Sacrificar</button>';
    list.appendChild(row);
  });
  document.getElementById("sacrificioResult").textContent = sacrificeLastResult;
}

function sacrificeRoll(outcomes) {
  let r = Math.random() * 100;
  for (const o of outcomes) {
    if (r < o.chance) {
      const got = {};
      for (let i = 0; i < o.n; i++) {
        const id = o.type === "item" ? o.id : (o.type === "u" ? SACRIFICE_UNCOMMON : SACRIFICE_RARE)[Math.floor(Math.random() * 3)];
        got[id] = (got[id] || 0) + 1;
      }
      return got;
    }
    r -= o.chance;
  }
  return {};
}

function doSacrifice(key) {
  if (sacrificeRemaining() > 0) return;
  if (!sacrificeHpOk()) { showToast("💀 Seu HP é baixo demais: o sacrifício te mataria."); return; }
  const parts = key.split(":");
  const kind = parts[0];
  const offer = SACRIFICE_OFFERS[kind];
  if (!offer) return;
  // oferenda
  let takeId = null, takeQty = 0, takeGold = 0;
  if (kind === "cobre") { if (state.gold < offer.cost) { showToast("Cobre insuficiente."); return; } takeGold = offer.cost; }
  else if (kind === "raro") { takeId = offer.item; takeQty = 1; }
  else { takeId = parts[1]; takeQty = offer.qty; const m = sacItem(takeId); if (m.rarity !== "comum" || FISH_IDS.includes(takeId)) return; }
  if (takeId && (state.inventory[takeId] || 0) < takeQty) { showToast("Você não tem a oferenda."); return; }
  // resultado e espaço na mochila (uma pilha que se esvazia libera 1 espaço)
  const got = sacrificeRoll(offer.outcomes);
  const ids = Object.keys(got);
  const freed = takeId && state.inventory[takeId] === takeQty && !ids.includes(takeId) ? 1 : 0;
  const stillNew = ids.filter(id => !(state.inventory[id] > 0)).length;
  if (stillNew > bagFree() + freed) { showToast("🎒 Mochila cheia! Libere espaço antes de sacrificar."); return; }
  // cobra tudo
  state.gold -= takeGold;
  if (takeId) { state.inventory[takeId] -= takeQty; if (state.inventory[takeId] <= 0) delete state.inventory[takeId]; }
  state.hp -= sacrificeHpCost();
  state.sacrifice.readyAt = Date.now() + SACRIFICE_COOLDOWN_MS;
  ids.forEach(id => { state.inventory[id] = (state.inventory[id] || 0) + got[id]; });
  sacrificeLastResult = ids.length
    ? "🕯️ O altar aceitou: +" + ids.map(id => got[id] + "× " + sacItem(id).icon + " " + sacItem(id).name).join(", ") + "!"
    : "🕯️ O altar ficou em silêncio... sua oferenda e seu sangue foram em vão.";
  saveState();
  render();
  renderSacrifice();
  showToast(sacrificeLastResult);
}
