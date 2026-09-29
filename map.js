// ============================================================
// map.js — Mapa interativo: locais, rotas, viagem, arrastar/zoom e painel do local.
// ============================================================

// ---------- MAPA INTERATIVO ----------

const LOCATIONS = [
  { id: "academia", name: "Academia", icon: "🏛️", x: 140, y: 480, desc: "O lar seguro dos aprendizes. Aqui você pode descansar.", connections: ["jardins", "vila"], implemented: true },
  { id: "jardins", name: "Jardins da Academia", icon: "🌿", x: 420, y: 280, desc: "A primeira área de treino. Criaturas fracas rondam por aqui.", connections: ["academia", "floresta", "lago"], implemented: true },
  { id: "floresta", name: "Floresta Sombria", icon: "🌲", x: 680, y: 470, desc: "Densa e perigosa — poucos aprendizes se arriscam sozinhos.", connections: ["jardins", "cavernas", "ruinas", "vila", "lago"], implemented: false },
  { id: "cavernas", name: "Cavernas Ecoantes", icon: "🕳️", x: 900, y: 220, desc: "Ecos antigos ressoam nas profundezas da rocha.", connections: ["floresta", "ruinas"], implemented: false },
  { id: "lago", name: "Lago Sereno", icon: "🌊", x: 460, y: 640, desc: "Águas calmas onde dizem viver espíritos antigos.", connections: ["jardins", "floresta", "vila"], implemented: false },
  { id: "vila", name: "Vila dos Mercadores", icon: "🏘️", x: 260, y: 660, desc: "Um pequeno povoado movimentado por comerciantes viajantes.", connections: ["academia", "floresta", "lago"], implemented: false },
  { id: "ruinas", name: "Ruínas Antigas", icon: "🏚️", x: 900, y: 640, desc: "Restos de uma civilização mágica esquecida pelo tempo.", connections: ["floresta", "cavernas"], implemented: false }
];

const TRAVEL_MS = 5 * 1000; // TESTE: 5 segundos (versão final: 5 * 60 * 1000 = 5 minutos)

let mapInteractionReady = false;

let mapTransform = { x: 40, y: 60, scale: 0.7 };

function locById(id) {
  return LOCATIONS.find(l => l.id === id);
}

function openMap() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("mapScreen").classList.remove("hidden");
  document.getElementById("travelConfirmPanel").classList.add("hidden");
  pendingTravelTarget = null;
  checkTravelArrival();
  renderMapNodes();
  applyMapTransform();
  initMapInteraction();
  updateTravelBanner();
  if (!state.travelTarget) {
    renderLocationPanel(state.currentLocation);
  } else {
    document.getElementById("locationPanel").classList.add("hidden");
  }
}

function renderMapNodes() {
  const nodesWrap = document.getElementById("mapNodes");
  const edgesSvg = document.getElementById("mapEdges");
  nodesWrap.innerHTML = "";
  edgesSvg.innerHTML = "";

  const drawn = new Set();
  LOCATIONS.forEach(loc => {
    loc.connections.forEach(connId => {
      const key = [loc.id, connId].sort().join("-");
      if (drawn.has(key)) return;
      drawn.add(key);
      const other = locById(connId);
      if (!other) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", loc.x);
      line.setAttribute("y1", loc.y);
      line.setAttribute("x2", other.x);
      line.setAttribute("y2", other.y);
      line.setAttribute("stroke", "rgba(232,193,90,0.35)");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-dasharray", "6,6");
      edgesSvg.appendChild(line);
    });
  });

  LOCATIONS.forEach(loc => {
    const node = document.createElement("div");
    let cls = "map-node";
    if (loc.id === state.currentLocation) cls += " current";
    if (state.travelTarget === loc.id) cls += " traveling-to";
    node.className = cls;
    node.style.left = loc.x + "px";
    node.style.top = loc.y + "px";
    node.dataset.id = loc.id;
    node.innerHTML = loc.icon + '<div class="node-label">' + loc.name + '</div>';
    nodesWrap.appendChild(node);
  });
}

// Margem (em px do mapa, antes do zoom) mantida visível além do nó mais externo,
// pra sempre sobrar espaço e o rótulo do local não ficar colado na borda.
const MAP_PAN_MARGIN = 90;

// Calcula os limites do mapa com base nos nós existentes em LOCATIONS.
// Como lê o array direto, novos locais adicionados no futuro já entram
// automaticamente no cálculo, sem precisar mexer aqui.
function getMapContentBounds() {
  const xs = LOCATIONS.map(l => l.x);
  const ys = LOCATIONS.map(l => l.y);
  return {
    minX: Math.min(...xs) - MAP_PAN_MARGIN,
    maxX: Math.max(...xs) + MAP_PAN_MARGIN,
    minY: Math.min(...ys) - MAP_PAN_MARGIN,
    maxY: Math.max(...ys) + MAP_PAN_MARGIN
  };
}

// Impede que o jogador arraste o mapa a ponto de perder todos os locais de vista,
// mas ainda permite navegar livremente por dentro dessa área.
function clampMapTransform() {
  const viewport = document.getElementById("mapViewport");
  if (!viewport) return;
  const rect = viewport.getBoundingClientRect();
  const b = getMapContentBounds();
  const scale = mapTransform.scale;

  const xMax = -b.minX * scale;
  const xMin = rect.width - b.maxX * scale;
  const yMax = -b.minY * scale;
  const yMin = rect.height - b.maxY * scale;

  mapTransform.x = xMin > xMax ? (xMin + xMax) / 2 : Math.min(xMax, Math.max(xMin, mapTransform.x));
  mapTransform.y = yMin > yMax ? (yMin + yMax) / 2 : Math.min(yMax, Math.max(yMin, mapTransform.y));
}

function applyMapTransform() {
  clampMapTransform();
  document.getElementById("mapCanvas").style.transform =
    "translate(" + mapTransform.x + "px," + mapTransform.y + "px) scale(" + mapTransform.scale + ")";
}

function initMapInteraction() {
  if (mapInteractionReady) return;
  mapInteractionReady = true;

  const viewport = document.getElementById("mapViewport");
  const pointers = new Map();
  let dragDistance = 0;
  let tapTarget = null;
  let panStart = null;
  let pinchStart = null;

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  viewport.addEventListener("pointerdown", (e) => {
    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragDistance = 0;
    tapTarget = e.target.closest(".map-node");

    if (pointers.size === 1) {
      panStart = { x: e.clientX, y: e.clientY, tx: mapTransform.x, ty: mapTransform.y };
    } else if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      const rect = viewport.getBoundingClientRect();
      pinchStart = {
        dist: dist(pts[0], pts[1]),
        scale: mapTransform.scale,
        center: { x: (pts[0].x + pts[1].x) / 2 - rect.left, y: (pts[0].y + pts[1].y) / 2 - rect.top },
        tx: mapTransform.x,
        ty: mapTransform.y
      };
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1 && panStart) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      dragDistance = Math.hypot(dx, dy);
      mapTransform.x = panStart.tx + dx;
      mapTransform.y = panStart.ty + dy;
      applyMapTransform();
    } else if (pointers.size === 2 && pinchStart) {
      const pts = Array.from(pointers.values());
      const newDist = dist(pts[0], pts[1]);
      let newScale = pinchStart.scale * (newDist / pinchStart.dist);
      newScale = Math.max(0.4, Math.min(2.5, newScale));
      const deltaScale = newScale / pinchStart.scale;
      mapTransform.x = pinchStart.center.x - (pinchStart.center.x - pinchStart.tx) * deltaScale;
      mapTransform.y = pinchStart.center.y - (pinchStart.center.y - pinchStart.ty) * deltaScale;
      mapTransform.scale = newScale;
      dragDistance = 999; // pinching nunca conta como tap
      applyMapTransform();
    }
  });

  function endPointer(e) {
    const wasSingle = pointers.size === 1;
    pointers.delete(e.pointerId);
    panStart = null;
    pinchStart = null;

    if (pointers.size === 1) {
      const remaining = Array.from(pointers.entries())[0];
      panStart = { x: remaining[1].x, y: remaining[1].y, tx: mapTransform.x, ty: mapTransform.y };
    }

    if (wasSingle && dragDistance < 8 && tapTarget) {
      handleNodeTap(tapTarget.dataset.id);
    }
    tapTarget = null;
  }

  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);
}

let pendingTravelTarget = null;

function handleNodeTap(id) {
  const target = locById(id);
  if (!target) return;

  if (id === state.currentLocation) {
    if (!state.travelTarget) {
      document.getElementById("travelConfirmPanel").classList.add("hidden");
      renderLocationPanel(id);
    }
    return;
  }

  if (state.travelTarget) {
    log("Você já está viajando para " + locById(state.travelTarget).name + ".");
    return;
  }

  const current = locById(state.currentLocation);
  if (!current.connections.includes(id)) {
    log("Só é possível viajar para locais conectados a " + current.name + ".");
    return;
  }

  pendingTravelTarget = id;
  document.getElementById("locationPanel").classList.add("hidden");
  document.getElementById("travelConfirmTitle").textContent = target.icon + " Viajar para " + target.name + "?";
  document.getElementById("travelConfirmDesc").textContent =
    "A viagem vai levar " + formatDuration(TRAVEL_MS) + ".";
  document.getElementById("travelConfirmPanel").classList.remove("hidden");
}

function confirmTravel() {
  if (!pendingTravelTarget) return;
  state.travelTarget = pendingTravelTarget;
  state.travelArrivesAt = Date.now() + TRAVEL_MS;
  pendingTravelTarget = null;
  saveState();
  document.getElementById("travelConfirmPanel").classList.add("hidden");
  renderMapNodes();
  updateTravelBanner();
}

function cancelTravelConfirm() {
  pendingTravelTarget = null;
  document.getElementById("travelConfirmPanel").classList.add("hidden");
}

function checkTravelArrival() {
  if (state.travelTarget && Date.now() >= state.travelArrivesAt) {
    const arrivedName = locById(state.travelTarget).name;
    state.currentLocation = state.travelTarget;
    state.travelTarget = null;
    state.travelArrivesAt = 0;
    saveState();
    log("Você chegou em " + arrivedName + "!");
  }
}

function updateTravelBanner() {
  const banner = document.getElementById("travelBanner");
  if (!state.travelTarget) {
    banner.classList.add("hidden");
    return;
  }
  const remaining = Math.max(0, state.travelArrivesAt - Date.now());
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  banner.classList.remove("hidden");
  banner.textContent = "🧭 Viajando para " + locById(state.travelTarget).name + "... chega em " + mm + ":" + ss;
}

function renderLocationPanel(id) {
  const loc = locById(id);
  const panel = document.getElementById("locationPanel");
  panel.classList.remove("hidden");
  document.getElementById("locationTitle").textContent = loc.icon + " " + loc.name;
  document.getElementById("locationDesc").textContent = loc.desc;
  const actions = document.getElementById("locationActions");

  if (id === "academia") {
    actions.innerHTML = '<button class="zone-btn" style="grid-column:span 2;" onclick="restAtAcademy()"><span class="zicon">🛏️</span>Descansar (recupera HP/Mana)</button>';
    return;
  }

  if (!loc.implemented) {
    actions.innerHTML = '<div class="hint" style="grid-column:span 2;">🚧 Esta área ainda está em construção. Volte em breve!</div>';
    return;
  }

  const remaining = state.bossCooldownUntil - Date.now();
  const bossLabel = remaining > 0
    ? '<span class="zicon">⏳</span>Chefe (' + Math.ceil(remaining / 60000) + 'min)'
    : '<span class="zicon">👹</span>Chefe';
  const bossDisabled = remaining > 0 ? "disabled" : "";

  actions.innerHTML =
    '<button class="zone-btn" onclick="openHuntSelect(\'' + id + '\')"><span class="zicon">🗡️</span>Caçar</button>' +
    '<button class="zone-btn" id="bossBtn" ' + bossDisabled + ' onclick="startBoss()">' + bossLabel + '</button>' +
    '<button class="zone-btn" onclick="openNpc()"><span class="zicon">📜</span>NPC de Missão</button>' +
    '<button class="zone-btn" onclick="openMerchant()"><span class="zicon">🛒</span>Mercador</button>';
}

function restAtAcademy() {
  state.hp = state.hpMax;
  state.mana = state.manaMax;
  saveState();
  render();
  log("Você descansou na Academia. HP e Mana totalmente recuperados.");
  const descEl = document.getElementById("locationDesc");
  if (descEl) descEl.textContent = "✅ HP e Mana totalmente recuperados!";
}
