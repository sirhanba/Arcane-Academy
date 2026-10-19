// ============================================================
// estufa.js — A Estufa (Jardins da Academia): plantar e colher materiais com o tempo.
// Plantar consome 1 unidade do material (a "semente") + uma taxa em Cobre. A planta cresce em tempo real
// (relógio do celular), mesmo com o jogo fechado. Regar com Gota d'Água Pura corta 25% do tempo que falta (1 vez por planta).
// ============================================================
const GREENHOUSE_START_PLOTS = 2;
const GREENHOUSE_MAX_PLOTS = 6;
const GREENHOUSE_PLOT_COST = { 3: 500, 4: 1500, 5: 4000, 6: 10000 }; // Cobre pelo canteiro de número N
const GREENHOUSE_WATER_ITEM = "gota_agua_pura";
const GREENHOUSE_WATER_CUT = 0.25; // reduz 25% do tempo restante

const GREENHOUSE_CROPS = [
  { id: "erva_lunar",     fee: 15, ms: 30 * 60 * 1000, min: 3, max: 5 },
  { id: "raiz_fibrosa",   fee: 15, ms: 45 * 60 * 1000, min: 3, max: 5 },
  { id: "casca_bruta",    fee: 20, ms: 60 * 60 * 1000, min: 3, max: 6 }
];

let greenhouseTimer = null;

function cropDef(id) { return GREENHOUSE_CROPS.find(c => c.id === id); }
function ghItem(id) { return ITEMS.find(i => i.id === id) || { name: id, icon: "📦" }; }

function openGreenhouse() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("estufaScreen").classList.remove("hidden");
  renderGreenhouse();
  if (greenhouseTimer) clearInterval(greenhouseTimer);
  greenhouseTimer = setInterval(() => {
    const scr = document.getElementById("estufaScreen");
    if (!scr || scr.classList.contains("hidden")) { clearInterval(greenhouseTimer); greenhouseTimer = null; return; }
    renderGreenhouse();
  }, 1000);
}

function plantCrop(bed, cropId) {
  const g = state.greenhouse;
  const c = cropDef(cropId);
  if (!c || g.beds[bed]) return;
  if ((state.inventory[c.id] || 0) < 1) { showToast("Você precisa de 1 " + ghItem(c.id).name + " na mochila."); return; }
  if (state.gold < c.fee) { showToast("Cobre insuficiente para a taxa do jardineiro."); return; }
  state.inventory[c.id] -= 1;
  if (state.inventory[c.id] <= 0) delete state.inventory[c.id];
  state.gold -= c.fee;
  const now = Date.now();
  g.beds[bed] = { crop: c.id, plantedAt: now, readyAt: now + c.ms, watered: false };
  saveState();
  render();
  renderGreenhouse();
  showToast("🌱 " + ghItem(c.id).name + " plantada!");
}

function waterCrop(bed) {
  const b = state.greenhouse.beds[bed];
  if (!b || b.watered) return;
  const now = Date.now();
  if (b.readyAt <= now) return;
  if ((state.inventory[GREENHOUSE_WATER_ITEM] || 0) < 1) { showToast("Você precisa de 1 " + ghItem(GREENHOUSE_WATER_ITEM).name + "."); return; }
  state.inventory[GREENHOUSE_WATER_ITEM] -= 1;
  if (state.inventory[GREENHOUSE_WATER_ITEM] <= 0) delete state.inventory[GREENHOUSE_WATER_ITEM];
  b.readyAt = now + Math.round((b.readyAt - now) * (1 - GREENHOUSE_WATER_CUT));
  b.watered = true;
  saveState();
  render();
  renderGreenhouse();
  showToast("💧 Regada! O tempo que faltava caiu 25%.");
}

function harvestCrop(bed) {
  const b = state.greenhouse.beds[bed];
  if (!b || Date.now() < b.readyAt) return;
  const c = cropDef(b.crop);
  if (!c) { state.greenhouse.beds[bed] = null; saveState(); renderGreenhouse(); return; }
  if (!(state.inventory[c.id] > 0) && bagFree() < 1) { showToast("🎒 Mochila cheia! Libere espaço para colher."); return; }
  const qty = c.min + Math.floor(Math.random() * (c.max - c.min + 1));
  state.inventory[c.id] = (state.inventory[c.id] || 0) + qty;
  state.greenhouse.beds[bed] = null;
  saveState();
  render();
  renderGreenhouse();
  showToast("🧺 Colheita: +" + qty + " " + ghItem(c.id).name);
}

function buyGreenhousePlot() {
  const g = state.greenhouse;
  if (g.plots >= GREENHOUSE_MAX_PLOTS) return;
  const n = g.plots + 1, cost = GREENHOUSE_PLOT_COST[n];
  if (state.gold < cost) { showToast("Cobre insuficiente."); return; }
  if (!confirm("Comprar o canteiro " + n + " por " + cost.toLocaleString("pt-BR") + " Cobre?")) return;
  state.gold -= cost;
  g.plots = n;
  g.beds.push(null);
  saveState();
  render();
  renderGreenhouse();
  showToast("🌱 Canteiro " + n + " liberado!");
}

function renderGreenhouse() {
  const g = state.greenhouse;
  const list = document.getElementById("estufaBeds");
  if (!list) return;
  const now = Date.now();
  let html = "";
  for (let i = 0; i < g.plots; i++) {
    const b = g.beds[i];
    html += '<div class="card estufa-bed"><div class="estufa-title">Canteiro ' + (i + 1) + '</div>';
    if (!b) {
      html += '<div class="udesc">Vazio. Plantar gasta 1 do material + a taxa do jardineiro.</div><div class="estufa-plants">';
      GREENHOUSE_CROPS.forEach(c => {
        const it = ghItem(c.id), have = state.inventory[c.id] || 0;
        const ok = have >= 1 && state.gold >= c.fee;
        html += '<button class="craft-btn" ' + (ok ? "" : "disabled ") + 'onclick="plantCrop(' + i + ',\'' + c.id + '\')">' +
          it.icon + ' ' + it.name + '<br><span class="udesc">🪙 ' + c.fee + ' · ' + formatDuration(c.ms) + ' · rende ' + c.min + '–' + c.max + ' (tem ' + have + ')</span></button>';
      });
      html += '</div>';
    } else {
      const c = cropDef(b.crop), it = ghItem(b.crop);
      if (now >= b.readyAt) {
        html += '<div class="udesc">' + it.icon + ' ' + it.name + ' — <b>pronta!</b></div>' +
          '<button class="craft-btn" onclick="harvestCrop(' + i + ')">🧺 Colher</button>';
      } else {
        const water = state.inventory[GREENHOUSE_WATER_ITEM] || 0;
        html += '<div class="udesc">' + it.icon + ' ' + it.name + ' — faltam <b>' + formatDuration(b.readyAt - now) + '</b></div>' +
          (b.watered ? '<div class="udesc">💧 Já regada</div>'
            : '<button class="craft-btn" ' + (water >= 1 ? "" : "disabled ") + 'onclick="waterCrop(' + i + ')">💧 Regar (−25% do tempo que falta) — 1 Gota d\'Água Pura (tem ' + water + ')</button>');
      }
    }
    html += '</div>';
  }
  list.innerHTML = html;
  const buy = document.getElementById("estufaBuyPlot");
  if (g.plots >= GREENHOUSE_MAX_PLOTS) {
    buy.textContent = "Todos os canteiros liberados";
    buy.disabled = true;
  } else {
    const n = g.plots + 1, cost = GREENHOUSE_PLOT_COST[n];
    buy.textContent = "➕ Comprar canteiro " + n + " — 🪙 " + cost.toLocaleString("pt-BR");
    buy.disabled = state.gold < cost;
  }
}
