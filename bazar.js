// ============================================================
// bazar.js — Bazar da Vila: venda de equipamentos entre jogadores (preço fixo, em Cobre, anúncios anônimos).
// O servidor guarda os anúncios e decide tudo (preço mínimo, taxa, limite, prazo). Aqui só mostramos e pedimos.
// As entregas (Cobre de vendas, equipamento comprado, equipamento devolvido) chegam do servidor e são aplicadas aqui
// UMA vez cada (chave em state.marketApplied) e depois confirmadas ao servidor (market_ack).
// Os números abaixo (preço mínimo, taxa, limite, dias) só servem para exibir: o que vale é o do servidor (2_funcao_sync.ts).
// ============================================================

const BAZAR_NAME = "Bazar da Vila";
const BAZAR_MIN_PRICE = 100;
const BAZAR_MAX_PRICE = 10000000;
const BAZAR_FEE_PCT = 5;
const BAZAR_MAX_ACTIVE = 3;
const BAZAR_DAYS = 3;
const BAZAR_BAG_NOTICE_MS = 10 * 60 * 1000; // aviso de "mochila cheia" no máximo a cada 10 min

const BAZAR_SORTS = [
  { id: "price_asc", label: "💲 Menor preço" },
  { id: "price_desc", label: "💰 Maior preço" },
  { id: "recent", label: "🕒 Mais recentes" }
];

let bazarTab = "comprar";       // "comprar" | "vender" | "meus"
let bazarSlotFilter = null;     // id de CRAFT_SLOT_FILTERS ou null
let bazarTierFilter = null;     // 1, 5 ou 10 ou null
let bazarSort = "recent";
let bazarItems = [];            // anúncios da aba Comprar (já carregados)
let bazarPage = 0;
let bazarHasMore = false;
let bazarLoading = false;
let bazarMineItems = [];        // meus anúncios
let bazarBusy = false;          // uma operação do Bazar por vez
let bazarSellUid = null;        // equipamento escolhido na aba Vender
let bazarLastBagNotice = 0;

function bazarSleep(ms) { return new Promise(res => setTimeout(res, ms)); }

function bazarVisible() {
  const e = document.getElementById("bazarScreen");
  return !!e && !e.classList.contains("hidden");
}

function bazarFmt(n) { return Number(n).toLocaleString("pt-BR"); }

function bazarTimeLeft(ms) {
  const left = ms - Date.now();
  if (left <= 0) return "encerrando";
  const h = Math.floor(left / 3600000);
  if (h >= 24) return Math.floor(h / 24) + "d " + (h % 24) + "h";
  if (h >= 1) return h + "h " + Math.floor((left % 3600000) / 60000) + "min";
  return Math.max(1, Math.ceil(left / 60000)) + "min";
}

// ---------- Abrir / abas ----------
function openBazar() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("bazarScreen").classList.remove("hidden");
  closeBazarSellPanel();
  bazarTab = "comprar";
  renderBazar();
  if (!cloudEnabled()) return;
  bazarCollect();
  bazarLoadList(true);
  bazarLoadMine();
}

function setBazarTab(tab) {
  bazarTab = tab;
  closeBazarSellPanel();
  renderBazar();
  if (!cloudEnabled()) return;
  if (tab === "comprar") bazarLoadList(true);
  else bazarLoadMine();
}

// ---------- Chamadas ao servidor ----------
// Garante que o servidor já tem o save mais recente (ele confere o Cobre e os itens do save salvo).
async function bazarFlush() {
  for (let i = 0; i < 30 && typeof cloudSaving !== "undefined" && cloudSaving; i++) await bazarSleep(200);
  await cloudPushNow();
  for (let i = 0; i < 30 && typeof cloudSaving !== "undefined" && cloudSaving; i++) await bazarSleep(200);
}

let bazarReq = 0; // numera os pedidos de lista: só a resposta do pedido mais novo vale (filtro trocado no meio do carregamento)

async function bazarLoadList(reset) {
  const my = ++bazarReq;
  bazarLoading = true;
  if (reset) { bazarPage = 0; bazarItems = []; bazarHasMore = false; }
  renderBazar();
  try {
    const r = await cloudCall("market_list", { defs: bazarFilterDefs(), sort: bazarSort, page: bazarPage });
    if (my !== bazarReq) return;
    if (r && r.ok) {
      bazarItems = bazarItems.concat(r.items || []);
      bazarHasMore = !!r.hasMore;
    } else showToast("❌ Não foi possível abrir o Bazar agora.");
  } catch (e) {
    if (my === bazarReq) showToast("❌ Sem conexão com o servidor.");
  } finally {
    if (my === bazarReq) { bazarLoading = false; renderBazar(); }
  }
}

async function bazarLoadMine() {
  try {
    const r = await cloudCall("market_mine");
    if (r && r.ok) { bazarMineItems = r.items || []; if (bazarVisible()) renderBazar(); }
  } catch (e) { /* mostra o que já tinha */ }
}

// Quais tipos de equipamento (defId) combinam com os filtros. null = sem filtro.
function bazarFilterDefs() {
  if (!bazarSlotFilter && !bazarTierFilter) return null;
  const f = bazarSlotFilter ? CRAFT_SLOT_FILTERS.find(x => x.id === bazarSlotFilter) : null;
  return EQUIP_DEFS.filter(d => (!f || f.slots.includes(d.slot)) && (!bazarTierFilter || d.tier === bazarTierFilter)).map(d => d.id);
}

// ---------- Entregas (venda, compra, devolução) ----------
// Aplica as entregas do servidor no save local (uma vez cada), salva e confirma. Devolve um resumo.
async function bazarApply(deliveries) {
  const res = { gold: 0, bought: 0, returned: 0, bagFull: false };
  if (!deliveries || !deliveries.length) return res;
  if (!Array.isArray(state.marketApplied)) state.marketApplied = [];
  const applied = new Set(state.marketApplied);
  const ack = [];
  let changed = false;

  function newInstance(it) {
    const inst = { uid: "g" + state.nextGearUid, defId: it.defId, primary: it.primary, secondaries: it.secondaries };
    if (it.forged) inst.forged = it.forged;
    state.nextGearUid += 1;
    return inst;
  }

  // 1) Cobre das vendas
  deliveries.filter(d => d.key[0] === "s").forEach(d => {
    if (!applied.has(d.key)) {
      state.gold += d.gold || 0;
      res.gold += d.gold || 0;
      applied.add(d.key); state.marketApplied.push(d.key); changed = true;
    }
    ack.push(d.key);
  });
  // 2) Equipamentos comprados (o Cobre é descontado agora)
  deliveries.filter(d => d.key[0] === "b").forEach(d => {
    if (applied.has(d.key)) { ack.push(d.key); return; }
    if (!d.item || !gearDef(d.item.defId)) return;
    if (state.gold < (d.pay || 0)) return;
    if (bagFree() < 1) { res.bagFull = true; return; }
    state.gold -= d.pay || 0;
    state.gearInventory.push(newInstance(d.item));
    res.bought++;
    applied.add(d.key); state.marketApplied.push(d.key); changed = true;
    ack.push(d.key);
  });
  // 3) Equipamentos que voltam (anúncio expirou ou foi cancelado)
  deliveries.filter(d => d.key[0] === "r").forEach(d => {
    if (applied.has(d.key)) { ack.push(d.key); return; }
    if (!d.item || !gearDef(d.item.defId)) return;
    if (bagFree() < 1) { res.bagFull = true; return; }
    state.gearInventory.push(newInstance(d.item));
    res.returned++;
    applied.add(d.key); state.marketApplied.push(d.key); changed = true;
    ack.push(d.key);
  });

  if (state.marketApplied.length > 150) state.marketApplied = state.marketApplied.slice(-150);
  if (changed) {
    saveState();
    render();
    if (typeof renderInventory === "function" && !document.getElementById("mochilaScreen").classList.contains("hidden")) renderInventory();
  }
  if (ack.length) {
    try {
      await bazarFlush(); // o servidor precisa ver o save novo ANTES da confirmação
      await cloudCall("market_ack", { keys: ack });
    } catch (e) { /* sem conexão: na próxima vez o servidor entrega de novo e o jogo ignora o que já aplicou */ }
  }
  return res;
}

function bazarNotifyResult(res) {
  if (res.gold > 0) showToast("💰 Você vendeu um item no Bazar da Vila! +" + bazarFmt(res.gold) + " Cobre");
  if (res.returned > 0) showToast("📦 " + (res.returned > 1 ? res.returned + " equipamentos voltaram" : "Um equipamento voltou") + " do Bazar para a sua mochila");
  if (res.bagFull && Date.now() - bazarLastBagNotice > BAZAR_BAG_NOTICE_MS) {
    bazarLastBagNotice = Date.now();
    showToast("🎒 Mochila cheia! Libere espaço para resgatar seu item do Bazar da Vila.");
  }
}

// Busca e aplica o que estiver esperando (ao abrir o Bazar e quando o sinal de vida avisa).
async function bazarCollect() {
  if (!cloudEnabled() || typeof cloudReady === "undefined" || !cloudReady || bazarBusy) return;
  bazarBusy = true;
  try {
    const r = await cloudCall("market_collect");
    if (r && r.ok) bazarNotifyResult(await bazarApply(r.deliveries));
  } catch (e) { /* tenta de novo no próximo sinal de vida */ }
  finally { bazarBusy = false; }
  if (bazarVisible()) { bazarLoadMine(); renderBazar(); }
}

// Chamado pelo sinal de vida (cloud.js): m = { sold, returns, buys }
function marketOnHeartbeat(m) {
  if (!m) return;
  if ((m.sold || 0) + (m.returns || 0) + (m.buys || 0) > 0) bazarCollect();
}

// ---------- Comprar ----------
async function bazarBuy(id) {
  if (bazarBusy) return;
  const l = bazarItems.find(x => x.id === id);
  if (!l) return;
  const def = gearDef(l.item.defId);
  if (!def) return;
  if (state.gold < l.price) { showToast("🪙 Cobre insuficiente."); return; }
  if (bagFree() < 1) { showToast("🎒 Mochila cheia! Libere espaço."); return; }
  if (!confirm("Comprar " + def.name + " por " + bazarFmt(l.price) + " Cobre? Não dá para desfazer.")) return;
  bazarBusy = true;
  renderBazar();
  try {
    await bazarFlush();
    const r = await cloudCall("market_buy", { id: id });
    if (!r || !r.ok) {
      const msg = { gone: "Esse anúncio não está mais disponível.", own: "Esse anúncio é seu.", no_gold: "🪙 Cobre insuficiente.",
        bag_full: "🎒 Mochila cheia! Libere espaço.", no_character: "Crie seu personagem primeiro." };
      showToast((r && msg[r.error]) || "❌ Não foi possível comprar agora.");
    } else {
      const res = await bazarApply(r.deliveries);
      if (res.bought > 0) showToast("🏪 Você comprou " + def.name + " por " + bazarFmt(l.price) + " Cobre!");
      else showToast("🏪 Compra feita! O item chega assim que houver espaço na mochila.");
      bazarNotifyResult(Object.assign(res, { bought: 0 }));
    }
  } catch (e) {
    showToast("❌ Sem conexão com o servidor. Se o Cobre foi cobrado, o item chega no próximo sinal de vida.");
  } finally {
    bazarBusy = false;
  }
  bazarLoadList(true);
}

// ---------- Vender ----------
function openBazarSellPanel(uid) {
  const inst = findGearInstance(uid);
  if (!inst || isGearEquipped(uid)) return;
  if (state.forgePending && state.forgePending.uid === uid) { showToast("⚒️ Conclua a forja deste item antes de anunciar."); return; }
  if (bazarMineItems.filter(x => x.status === "active").length >= BAZAR_MAX_ACTIVE) { showToast("Você já tem " + BAZAR_MAX_ACTIVE + " anúncios ativos."); return; }
  bazarSellUid = uid;
  const def = gearDef(inst.defId);
  document.getElementById("bazarSellTitle").textContent = def.icon + " " + def.name + gearTag(def);
  document.getElementById("bazarSellStats").textContent = gearStatLine(inst);
  const input = document.getElementById("bazarPriceInput");
  input.value = "";
  onBazarPriceInput();
  document.getElementById("bazarSellPanel").classList.remove("hidden");
  document.getElementById("bazarSellPanel").scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeBazarSellPanel() {
  bazarSellUid = null;
  const p = document.getElementById("bazarSellPanel");
  if (p) p.classList.add("hidden");
}

function bazarPriceValue() {
  const v = Math.floor(Number(document.getElementById("bazarPriceInput").value));
  return Number.isFinite(v) ? v : 0;
}

function onBazarPriceInput() {
  const price = bazarPriceValue();
  const fee = Math.floor(price * BAZAR_FEE_PCT / 100);
  const el = document.getElementById("bazarSellTotal");
  if (price < BAZAR_MIN_PRICE) el.textContent = "Preço mínimo: 🪙 " + BAZAR_MIN_PRICE;
  else if (price > BAZAR_MAX_PRICE) el.textContent = "Preço máximo: 🪙 " + bazarFmt(BAZAR_MAX_PRICE);
  else el.textContent = "Taxa do Bazar (" + BAZAR_FEE_PCT + "%): 🪙 " + bazarFmt(fee) + " · Você recebe: 🪙 " + bazarFmt(price - fee);
}

async function confirmBazarSell() {
  if (bazarBusy || !bazarSellUid) return;
  const uid = bazarSellUid;
  const inst = findGearInstance(uid);
  if (!inst || isGearEquipped(uid)) { closeBazarSellPanel(); return; }
  const price = bazarPriceValue();
  if (price < BAZAR_MIN_PRICE || price > BAZAR_MAX_PRICE) { onBazarPriceInput(); showToast("Preço fora do permitido."); return; }
  const def = gearDef(inst.defId);
  const fee = Math.floor(price * BAZAR_FEE_PCT / 100);
  if (!confirm("Anunciar " + def.name + " por " + bazarFmt(price) + " Cobre? Você recebe " + bazarFmt(price - fee) + " se vender. O item fica no Bazar por " + BAZAR_DAYS + " dias.")) return;
  bazarBusy = true;
  try {
    await bazarFlush();
    const r = await cloudCall("market_create", { gearUid: uid, price: price });
    if (!r || !r.ok) {
      const msg = { limit: "Você já tem " + BAZAR_MAX_ACTIVE + " anúncios ativos.", equipped: "Desequipe o item antes de anunciar.",
        price: "Preço fora do permitido.", not_found: "Item não encontrado. Tente de novo em instantes.", already: "Esse item já está anunciado.",
        no_character: "Crie seu personagem primeiro." };
      showToast((r && msg[r.error]) || "❌ Não foi possível anunciar agora.");
    } else {
      state.gearInventory = state.gearInventory.filter(g => g.uid !== uid);
      saveState();
      render();
      closeBazarSellPanel();
      showToast("🏪 Anúncio publicado por " + bazarFmt(price) + " Cobre!");
    }
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
  } finally {
    bazarBusy = false;
  }
  await bazarLoadMine();
  renderBazar();
}

// ---------- Meus anúncios ----------
async function bazarCancel(id) {
  if (bazarBusy) return;
  const l = bazarMineItems.find(x => x.id === id);
  if (!l) return;
  const def = gearDef(l.item.defId);
  if (!confirm("Cancelar o anúncio de " + (def ? def.name : "equipamento") + "? O item volta para a sua mochila.")) return;
  bazarBusy = true;
  try {
    const r = await cloudCall("market_cancel", { id: id });
    if (!r || !r.ok) showToast("Esse anúncio não está mais ativo (talvez já tenha sido vendido).");
  } catch (e) {
    showToast("❌ Sem conexão com o servidor.");
  } finally {
    bazarBusy = false;
  }
  await bazarCollect();
  await bazarLoadMine();
  renderBazar();
}

// ---------- Filtros ----------
function setBazarSlotFilter(id) { bazarSlotFilter = bazarSlotFilter === id ? null : id; bazarLoadList(true); }
function setBazarTierFilter(t) { bazarTierFilter = bazarTierFilter === t ? null : t; bazarLoadList(true); }
function setBazarSort(id) { bazarSort = id; bazarLoadList(true); }
function clearBazarFilters() { bazarSlotFilter = null; bazarTierFilter = null; bazarLoadList(true); }
function bazarMore() { if (bazarLoading) return; bazarPage++; bazarLoadList(false); }

// ---------- Telas ----------
function bazarChip(box, label, active, onclick) {
  const b = document.createElement("button");
  b.className = "craft-chip" + (active ? " active" : "");
  b.textContent = label;
  b.onclick = onclick;
  box.appendChild(b);
}

function bazarGearRow(item, rightHtml, extraLine) {
  const def = gearDef(item.defId);
  if (!def) return null;
  let stats = "";
  try { stats = gearStatLine(item); } catch (e) { stats = ""; }
  const row = document.createElement("div");
  row.className = "upgrade-row";
  row.innerHTML =
    '<span class="upgrade-icon">' + def.icon + '</span>' +
    '<div class="upgrade-info">' +
      '<div class="uname">' + def.name + gearTag(def) + '</div>' +
      '<div class="udesc">' + stats + '</div>' +
      '<div class="udesc">Nv. ' + def.requiredLevel + (extraLine ? " · " + extraLine : "") + '</div>' +
    '</div>' + rightHtml;
  return row;
}

function renderBazar() {
  if (!bazarVisible()) return;
  document.getElementById("bazarTabBuy").classList.toggle("active", bazarTab === "comprar");
  document.getElementById("bazarTabSell").classList.toggle("active", bazarTab === "vender");
  document.getElementById("bazarTabMine").classList.toggle("active", bazarTab === "meus");
  document.getElementById("bazarGold").textContent = bazarFmt(state.gold);
  ["Buy", "Sell", "Mine"].forEach(n => document.getElementById("bazarPane" + n).classList.add("hidden"));

  const offline = document.getElementById("bazarOffline");
  offline.classList.toggle("hidden", cloudEnabled());
  if (!cloudEnabled()) return;

  if (bazarTab === "comprar") { document.getElementById("bazarPaneBuy").classList.remove("hidden"); renderBazarBuy(); }
  else if (bazarTab === "vender") { document.getElementById("bazarPaneSell").classList.remove("hidden"); renderBazarSell(); }
  else { document.getElementById("bazarPaneMine").classList.remove("hidden"); renderBazarMine(); }
}

function renderBazarBuy() {
  const slotBox = document.getElementById("bazarSlotChips");
  const tierBox = document.getElementById("bazarTierChips");
  const sortBox = document.getElementById("bazarSortChips");
  slotBox.innerHTML = ""; tierBox.innerHTML = ""; sortBox.innerHTML = "";
  CRAFT_SLOT_FILTERS.forEach(f => bazarChip(slotBox, f.label, bazarSlotFilter === f.id, () => setBazarSlotFilter(f.id)));
  CRAFT_TIER_FILTERS.forEach(t => bazarChip(tierBox, "Nv. " + t, bazarTierFilter === t, () => setBazarTierFilter(t)));
  BAZAR_SORTS.forEach(s => bazarChip(sortBox, s.label, bazarSort === s.id, () => setBazarSort(s.id)));
  document.getElementById("bazarClearBtn").classList.toggle("hidden", !(bazarSlotFilter || bazarTierFilter));

  const list = document.getElementById("bazarList");
  list.innerHTML = "";
  bazarItems.forEach(l => {
    const afford = state.gold >= l.price;
    const btn = '<button class="upgrade-buy" ' + (afford && !bazarBusy ? "" : "disabled") + ' onclick="bazarBuy(\'' + l.id + '\')">🪙 ' + bazarFmt(l.price) + '</button>';
    const row = bazarGearRow(l.item, btn, "expira em " + bazarTimeLeft(l.expiresAt));
    if (row) list.appendChild(row);
  });
  if (bazarLoading) {
    const h = document.createElement("div"); h.className = "hint"; h.textContent = "Carregando..."; list.appendChild(h);
  } else if (!bazarItems.length) {
    const h = document.createElement("div"); h.className = "hint";
    h.textContent = (bazarSlotFilter || bazarTierFilter) ? "Nenhum equipamento à venda com esses filtros." : "Nenhum equipamento à venda no momento. Que tal anunciar o seu?";
    list.appendChild(h);
  }
  document.getElementById("bazarMoreBtn").classList.toggle("hidden", !bazarHasMore || bazarLoading);
}

function renderBazarSell() {
  const active = bazarMineItems.filter(x => x.status === "active").length;
  document.getElementById("bazarSellInfo").textContent =
    "Anúncios ativos: " + active + "/" + BAZAR_MAX_ACTIVE + " · Taxa: " + BAZAR_FEE_PCT + "% · Duração: " + BAZAR_DAYS + " dias · Preço mínimo: 🪙 " + BAZAR_MIN_PRICE;
  const list = document.getElementById("bazarSellList");
  list.innerHTML = "";
  const gear = state.gearInventory.filter(g => gearDef(g.defId) && !isGearEquipped(g.uid));
  gear.forEach(inst => {
    const row = bazarGearRow(inst, '<button class="upgrade-buy" onclick="openBazarSellPanel(\'' + inst.uid + '\')">Anunciar</button>', null);
    if (row) list.appendChild(row);
  });
  if (!gear.length) {
    const h = document.createElement("div"); h.className = "hint";
    h.textContent = "Você não tem equipamentos na mochila para anunciar. Equipamentos equipados precisam ser desequipados antes.";
    list.appendChild(h);
  }
}

function renderBazarMine() {
  const list = document.getElementById("bazarMineList");
  list.innerHTML = "";
  const active = bazarMineItems.filter(x => x.status === "active").length;
  document.getElementById("bazarMineInfo").textContent = "Anúncios ativos: " + active + "/" + BAZAR_MAX_ACTIVE;
  bazarMineItems.forEach(l => {
    let right, extra;
    if (l.status === "active") {
      right = '<button class="upgrade-buy" onclick="bazarCancel(\'' + l.id + '\')">Cancelar</button>';
      extra = "🪙 " + bazarFmt(l.price) + " · expira em " + bazarTimeLeft(l.expiresAt);
    } else {
      right = '<button class="upgrade-buy" onclick="bazarCollect()">Resgatar</button>';
      extra = "⏳ Não vendeu · libere espaço na mochila e toque em Resgatar";
    }
    const row = bazarGearRow(l.item, right, extra);
    if (row) list.appendChild(row);
  });
  if (!bazarMineItems.length) {
    const h = document.createElement("div"); h.className = "hint";
    h.textContent = "Você não tem anúncios. Vá na aba Vender para anunciar um equipamento.";
    list.appendChild(h);
  }
}
