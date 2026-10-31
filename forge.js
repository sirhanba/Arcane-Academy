// ============================================================
// forge.js — Forja do Mestre Garrun (Academia): re-sorteia UM atributo de um equipamento, pagando Cobre.
// - Atributo principal: novo valor sorteado no mesmo intervalo do item (pode piorar).
// - Atributo secundário: troca por outro atributo da lista do item (nunca repete os que o item já tem).
// - O jogador vê "antes e depois" e escolhe ficar com o novo ou manter o antigo; o Cobre é gasto nos dois casos.
// - O resultado pendente fica salvo em state.forgePending (se fechar o jogo, a escolha volta ao reabrir a forja).
// Para ajustar os preços (Fase 4), mude só as constantes abaixo.
// ============================================================

const FORGE_NPC = "⚒️ Mestre Garrun";
const FORGE_BASE_COST = { 1: 40, 5: 120, 10: 300, 20: 700, 30: 1500, 40: 3000, 50: 6000 }; // Cobre para re-sortear o atributo principal, por nível do item
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
  forgePlayAnimation(inst, def, pending); // bigorna + martelo, depois o resultado
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
  closeForgeAnim();
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
  closeForgeAnim();
  if (!state.forgePending) return;
  state.forgePending = null;
  saveState();
  renderForge();
  showToast("↩️ Você manteve o atributo antigo.");
}


// ============================================================
// Animação da forja: bigorna, item em cima, martelo bate 3 vezes e abre o resultado.
// ============================================================
const FORGE_HIT_TIMES = [550, 1050, 1550]; // ms de cada marteladada (o CSS do martelo usa os mesmos tempos)
const FORGE_RESULT_AT = 2250;               // ms até abrir a tela do resultado
let forgeAnimTimers = [];

const FORGE_ANVIL_SVG =
  '<svg class="fg-anvil" viewBox="0 0 200 110" width="190" height="105" aria-hidden="true">' +
  '<path d="M10 12 H150 Q185 12 192 30 Q170 40 130 42 L128 58 Q150 62 150 78 H55 Q55 62 72 58 L72 42 Q30 40 10 12 Z" fill="#3b3f4d" stroke="#0d0f16" stroke-width="3" stroke-linejoin="round"/>' +
  '<path d="M14 14 H148 Q178 14 186 28 Q165 34 128 36 H74 Q36 34 14 14 Z" fill="#6b7183"/>' +
  '<path d="M14 14 H148 Q160 14 168 18 H20 Z" fill="#9aa1b5"/>' +
  '<rect x="40" y="78" width="110" height="26" rx="4" fill="#2b2e3a" stroke="#0d0f16" stroke-width="3"/>' +
  '<rect x="46" y="82" width="98" height="6" rx="2" fill="#454a5c"/></svg>';
const FORGE_HAMMER_SVG =
  '<svg viewBox="0 0 170 60" width="170" height="60" aria-hidden="true">' +
  '<rect x="52" y="24" width="112" height="12" rx="5" fill="#7a4a24" stroke="#2a1608" stroke-width="3"/>' +
  '<rect x="60" y="27" width="96" height="3" rx="1.5" fill="#a56a38"/>' +
  '<rect x="6" y="4" width="62" height="52" rx="8" fill="#8d94a8" stroke="#0d0f16" stroke-width="3"/>' +
  '<rect x="12" y="8" width="22" height="44" rx="5" fill="#b9bfd0"/>' +
  '<rect x="56" y="4" width="12" height="52" rx="4" fill="#5f6578"/></svg>';

function closeForgeAnim() {
  forgeAnimTimers.forEach(clearTimeout);
  forgeAnimTimers = [];
  const o = document.getElementById("forgeAnim");
  if (o) o.remove();
}

function forgeSparks(stage, n, big) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    s.className = "fg-spark" + (big ? " big" : "");
    const a = (-Math.PI * (0.1 + 0.8 * Math.random()));        // para cima, em leque
    const d = (big ? 90 : 55) + Math.random() * (big ? 90 : 55);
    s.style.setProperty("--dx", Math.cos(a) * d + "px");
    s.style.setProperty("--dy", Math.sin(a) * d + "px");
    s.style.animationDuration = (0.45 + Math.random() * 0.4) + "s";
    s.addEventListener("animationend", function () { s.remove(); });
    stage.appendChild(s);
  }
}

function forgePlayAnimation(inst, def, pending) {
  closeForgeAnim();
  const o = document.createElement("div");
  o.id = "forgeAnim";
  o.className = "fg-overlay";
  o.innerHTML =
    '<div class="fg-flash"></div>' +
    '<div class="fg-stage" id="fgStage">' +
      '<div class="fg-glow"></div>' +
      '<div class="fg-item" id="fgItem">' + def.icon + '</div>' +
      '<div class="fg-hammer">' + FORGE_HAMMER_SVG + '</div>' +
      FORGE_ANVIL_SVG +
      '<div class="fg-ring" id="fgRing"></div>' +
      '<div class="fg-title">Forjando…</div>' +
      '<div class="fg-skip">toque para pular</div>' +
    '</div>';
  document.body.appendChild(o);
  const stage = document.getElementById("fgStage");
  const item = document.getElementById("fgItem");

  FORGE_HIT_TIMES.forEach(function (t, i) {
    forgeAnimTimers.push(setTimeout(function () {
      const last = i === FORGE_HIT_TIMES.length - 1;
      stage.classList.remove("hit"); void stage.offsetWidth; stage.classList.add("hit");
      item.classList.remove("squash"); void item.offsetWidth; item.classList.add("squash");
      forgeSparks(stage, last ? 22 : 9, last);
      if (last) {
        const ring = document.getElementById("fgRing");
        ring.classList.remove("on"); void ring.offsetWidth; ring.classList.add("on");
        o.classList.add("final");
      }
      if (tg && tg.HapticFeedback) { try { tg.HapticFeedback.impactOccurred(last ? "heavy" : "medium"); } catch (e) {} }
    }, t));
  });
  forgeAnimTimers.push(setTimeout(function () { forgeShowResult(inst, def, pending); }, FORGE_RESULT_AT));
  o.onclick = function () { forgeShowResult(inst, def, pending); }; // pular
}

function forgeShowResult(inst, def, p) {
  const o = document.getElementById("forgeAnim");
  if (!o || o.classList.contains("result")) return;
  forgeAnimTimers.forEach(clearTimeout);
  forgeAnimTimers = [];
  o.onclick = null;
  o.classList.add("result");

  const t = forgePendingTexts(p);
  let kind, title, verdict;
  if (p.kind === "primary") {
    const d = p.newVal - p.oldVal;
    kind = d > 0 ? "up" : d < 0 ? "down" : "same";
    title = d > 0 ? "MELHOROU!" : d < 0 ? "PIOROU…" : "FICOU IGUAL";
    verdict = d > 0 ? "▲ +" + d : d < 0 ? "▼ " + d : "=";
  } else {
    kind = "swap";
    title = "NOVO ATRIBUTO";
    verdict = "Compare e escolha";
  }
  const lab = p.kind === "primary" ? (STAT_LABELS[p.stat] || [p.stat, ""]) : null;
  const range = p.kind === "primary" ? def.primary.find(function (x) { return x.stat === p.stat; }) : null;
  const pct = function (v) { return range && range.max > range.min ? Math.max(0, Math.min(100, Math.round((v - range.min) / (range.max - range.min) * 100))) : 50; };

  o.innerHTML =
    '<div class="fg-flash"></div>' +
    '<div class="cp-card fg-card fg-' + kind + '" onclick="event.stopPropagation()">' +
      '<div class="cp-title">' + title + '</div>' +
      '<div class="cp-icon-wrap" style="height:84px"><div class="cp-rays"></div><div class="cp-ring"></div><div class="cp-icon" style="font-size:2.8rem">' + def.icon + '</div></div>' +
      '<div class="cp-name">' + def.name + '</div>' +
      '<div class="cp-sub"><span class="lv-tag">Nv. ' + def.tier + '</span> ' + (p.kind === "primary" ? "Atributo principal" : "Atributo secundário") + '</div>' +
      '<div class="fg-compare">' +
        '<div class="fg-side fg-old"><div class="hint">Antes</div><div class="fg-val">' + t.before + '</div></div>' +
        '<div class="fg-arrow">➜</div>' +
        '<div class="fg-side fg-new"><div class="hint">Depois</div><div class="fg-val">' + (p.kind === "primary" ? '+<span class="count-up" data-from="' + p.oldVal + '" data-to="' + p.newVal + '">' + p.oldVal + '</span>' + lab[1] + ' ' + lab[0] : t.after) + '</div></div>' +
      '</div>' +
      (range ? '<div class="fg-meter"><div class="fg-meter-bar"><i class="fg-m-old" style="left:' + pct(p.oldVal) + '%"></i><i class="fg-m-new" style="left:' + pct(p.newVal) + '%"></i></div><div class="cp-range">' + range.min + ' ◂ intervalo ▸ ' + range.max + '</div></div>' : '') +
      '<div class="fg-verdict">' + verdict + '</div>' +
      (isGearEquipped(p.uid) ? '<div class="hint" style="text-align:center">Item equipado: os atributos mudam na hora se você ficar com o novo.</div>' : '') +
      '<div class="combat-actions fg-actions">' +
        '<button class="btn-attack" onclick="forgeKeepNew()">✅ Ficar com o novo</button>' +
        '<button class="btn-flee" onclick="forgeKeepOld()">↩️ Manter o antigo</button>' +
      '</div>' +
    '</div>';
  o.querySelectorAll(".count-up").forEach(function (el) {
    const from = Number(el.dataset.from), to = Number(el.dataset.to);
    const start = Date.now() + 700;
    (function step() {
      const k = Math.min(1, Math.max(0, (Date.now() - start) / 800));
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1 && el.isConnected) requestAnimationFrame(step);
    })();
  });
  if (kind === "up") spawnConfetti(30);
  if (tg && tg.HapticFeedback) { try { tg.HapticFeedback.notificationOccurred(kind === "up" ? "success" : kind === "down" ? "error" : "warning"); } catch (e) {} }
}
