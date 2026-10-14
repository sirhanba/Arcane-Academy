// ============================================================
// forge.js — Forja do Mestre Garrun (Academia): re-sorteia UM atributo de um equipamento, pagando Cobre.
// - Atributo principal: novo valor sorteado no mesmo intervalo do item (pode piorar).
// - Atributo secundário: troca por outro atributo da lista do item (nunca repete os que o item já tem).
// - O jogador vê "antes e depois" e escolhe ficar com o novo ou manter o antigo; o Cobre é gasto nos dois casos.
// - O resultado pendente fica salvo em state.forgePending (se fechar o jogo, a escolha volta ao reabrir a forja).
// Para ajustar os preços (Fase 4), mude só as constantes abaixo.
// ============================================================

const FORGE_NPC = "⚒️ Mestre Garrun";
const FORGE_BASE_COST = { 1: 40, 5: 120, 10: 300 }; // Cobre para re-sortear o atributo principal, por nível do item
const FORGE_SECONDARY_MULT = 2;   // o secundário custa o dobro do principal (ele troca o atributo)
const FORGE_ESCALATION = 0.5;     // cada re-sorteio no MESMO item sobe o preço em +50% do valor base

let forgeSelectedUid = null;

function forgeCost(inst, kind) {
  const def = gearDef(inst.defId);
  const base = FORGE_BASE_COST[def.tier] || 0;
  const mult = kind === "secondary" ? FORGE_SECONDARY_MULT : 1;
  return Math.round(base * mult * (1 + FORGE_ESCALATION * (inst.forged || 0)));
}

function statText(stat, value) {
  const l = STAT_LABELS[stat] || [stat, ""];
  return "+" + value + l[1] + " " + l[0];
}

function openForge() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("forgeScreen").classList.remove("hidden");
  forgeSelectedUid = null;
  renderForge();
  window.scrollTo(0, 0);
}

function forgeSelect(uid) {
  forgeSelectedUid = forgeSelectedUid === uid ? null : uid;
  renderForge();
  if (forgeSelectedUid) {
    const card = document.getElementById("forgeDetailCard");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function forgePendingValid() {
  const p = state.forgePending;
  if (!p) return false;
  const inst = findGearInstance(p.uid);
  if (!inst || !gearDef(inst.defId)) { state.forgePending = null; saveState(); return false; } // item sumiu (vendido)
  return true;
}

function renderForge() {
  const pending = forgePendingValid();
  const pendCard = document.getElementById("forgePendingCard");
  const listCard = document.getElementById("forgeListCard");
  const detailCard = document.getElementById("forgeDetailCard");
  document.getElementById("forgeGold").textContent = state.gold;

  if (pending) {
    listCard.classList.add("hidden");
    detailCard.classList.add("hidden");
    pendCard.classList.remove("hidden");
    renderForgePending();
    return;
  }
  pendCard.classList.add("hidden");
  listCard.classList.remove("hidden");
  renderForgeList();
  renderForgeDetail();
}

function renderForgeList() {
  const list = document.getElementById("forgeGearList");
  list.innerHTML = "";
  if (state.gearInventory.length === 0) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = "Você ainda não tem equipamentos. Fabrique um na aba Criação.";
    list.appendChild(h);
    return;
  }
  state.gearInventory.forEach(inst => {
    const def = gearDef(inst.defId);
    if (!def) return;
    const row = document.createElement("div");
    row.className = "upgrade-row" + (forgeSelectedUid === inst.uid ? " forge-sel" : "");
    const icon = document.createElement("span");
    icon.className = "upgrade-icon";
    icon.textContent = def.icon;
    const info = document.createElement("div");
    info.className = "upgrade-info";
    const nm = document.createElement("div");
    nm.className = "uname";
    nm.textContent = def.name + gearTag(def) + (isGearEquipped(inst.uid) ? " · equipado" : "");
    const st = document.createElement("div");
    st.className = "udesc";
    st.textContent = "Nv." + def.tier + " · " + gearStatLine(inst);
    info.appendChild(nm);
    info.appendChild(st);
    const btn = document.createElement("button");
    btn.className = "upgrade-buy";
    btn.textContent = forgeSelectedUid === inst.uid ? "Fechar" : "Forjar";
    btn.onclick = () => forgeSelect(inst.uid);
    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(btn);
    list.appendChild(row);
  });
}

function renderForgeDetail() {
  const card = document.getElementById("forgeDetailCard");
  const inst = forgeSelectedUid ? findGearInstance(forgeSelectedUid) : null;
  if (!inst) { card.classList.add("hidden"); return; }
  const def = gearDef(inst.defId);
  card.classList.remove("hidden");
  document.getElementById("forgeDetailTitle").textContent = def.icon + " " + def.name + gearTag(def);
  document.getElementById("forgeDetailInfo").textContent =
    "Re-sorteios neste item: " + (inst.forged || 0) + " (cada um sobe o preço em " + Math.round(FORGE_ESCALATION * 100) + "%)";

  const box = document.getElementById("forgeAttrList");
  box.innerHTML = "";
  const addRow = (kindLabel, text, hint, kind, key, cost) => {
    const row = document.createElement("div");
    row.className = "upgrade-row";
    const info = document.createElement("div");
    info.className = "upgrade-info";
    const t = document.createElement("div");
    t.className = "uname";
    t.textContent = text;
    const h = document.createElement("div");
    h.className = "udesc";
    h.textContent = kindLabel + " · " + hint;
    info.appendChild(t);
    info.appendChild(h);
    const btn = document.createElement("button");
    btn.className = "upgrade-buy";
    btn.textContent = "🪙 " + cost;
    btn.disabled = state.gold < cost;
    btn.onclick = () => forgeReroll(kind, key);
    row.appendChild(info);
    row.appendChild(btn);
    box.appendChild(row);
  };
  def.primary.forEach(p => {
    addRow("Principal", statText(p.stat, inst.primary[p.stat]), "novo valor entre " + p.min + " e " + p.max, "primary", p.stat, forgeCost(inst, "primary"));
  });
  inst.secondaries.forEach((s, i) => {
    addRow("Secundário", statText(s.stat, s.amount), "troca por outro atributo possível do item", "secondary", i, forgeCost(inst, "secondary"));
  });
}

// Sorteia o novo resultado, cobra o Cobre e guarda o resultado pendente (ainda NÃO aplicado ao item)
function forgeReroll(kind, key) {
  if (state.forgePending) return;
  const inst = forgeSelectedUid ? findGearInstance(forgeSelectedUid) : null;
  if (!inst) return;
  const def = gearDef(inst.defId);
  const cost = forgeCost(inst, kind);
  if (state.gold < cost) { showToast("🪙 Cobre insuficiente"); return; }

  let pending;
  if (kind === "primary") {
    const p = def.primary.find(x => x.stat === key);
    if (!p) return;
    pending = { uid: inst.uid, kind: "primary", stat: key, oldVal: inst.primary[key], newVal: rollInRange(p.min, p.max) };
  } else {
    const idx = Number(key);
    const cur = inst.secondaries[idx];
    if (!cur) return;
    const held = inst.secondaries.map(s => s.stat);
    const options = def.pool.filter(o => !held.includes(o.stat));
    if (options.length === 0) { showToast("Este item não tem outro atributo possível."); return; }
    const pick = options[Math.floor(Math.random() * options.length)];
    pending = { uid: inst.uid, kind: "secondary", idx: idx, oldVal: { stat: cur.stat, amount: cur.amount }, newVal: { stat: pick.stat, amount: pick.amount } };
  }
  state.gold -= cost;
  inst.forged = (inst.forged || 0) + 1;
  pending.cost = cost;
  state.forgePending = pending;
  saveState();
  render();
  renderForge();
  window.scrollTo(0, 0);
}

function forgePendingTexts(p) {
  if (p.kind === "primary") return { before: statText(p.stat, p.oldVal), after: statText(p.stat, p.newVal) };
  return { before: statText(p.oldVal.stat, p.oldVal.amount), after: statText(p.newVal.stat, p.newVal.amount) };
}

function renderForgePending() {
  const p = state.forgePending;
  const inst = findGearInstance(p.uid);
  const def = gearDef(inst.defId);
  document.getElementById("forgePendingTitle").textContent = "🔥 Resultado da forja — " + def.name;
  const t = forgePendingTexts(p);
  document.getElementById("forgeBefore").textContent = t.before;
  document.getElementById("forgeAfter").textContent = t.after;
  const verdict = document.getElementById("forgeVerdict");
  if (p.kind === "primary") {
    const d = p.newVal - p.oldVal;
    verdict.textContent = d > 0 ? "▲ Melhorou (+" + d + ")" : d < 0 ? "▼ Piorou (" + d + ")" : "= Ficou igual";
    verdict.style.color = d > 0 ? "#4caf7d" : d < 0 ? "#e5615a" : "";
  } else {
    verdict.textContent = "Atributo diferente: compare e escolha.";
    verdict.style.color = "";
  }
  document.getElementById("forgeAfterNote").textContent = isGearEquipped(p.uid) ? "Este item está equipado: seus atributos mudam na hora se você ficar com o novo." : "";
}

function forgeKeepNew() {
  if (!forgePendingValid()) { renderForge(); return; }
  const p = state.forgePending;
  const inst = findGearInstance(p.uid);
  if (p.kind === "primary") inst.primary[p.stat] = p.newVal;
  else inst.secondaries[p.idx] = { stat: p.newVal.stat, amount: p.newVal.amount };
  state.forgePending = null;
  recalcStats();
  saveState();
  render();
  renderForge();
  showToast("⚒️ Novo atributo aplicado: " + gearDef(inst.defId).name);
}

function forgeKeepOld() {
  if (!state.forgePending) return;
  state.forgePending = null;
  saveState();
  renderForge();
  showToast("↩️ Você manteve o atributo antigo.");
}
