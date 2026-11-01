// ============================================================
// spellfx.js — Efeitos visuais das magias no combate (só visual; não mexe em dano nem em regras).
// playSpellFx(skillId, casterEl, targets) — targets: [{ el, main }]
// ============================================================
const SPELL_FX = {};
function spR(a, b) { return a + Math.random() * (b - a); }
function spCenter(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, l: r.left, t: r.top }; }
function spLayer() {
  let l = document.getElementById("spellLayer");
  if (!l) { l = document.createElement("div"); l.id = "spellLayer"; document.body.appendChild(l); }
  return l;
}
function spAdd(layer, cls, css, life) {
  const d = document.createElement("div");
  d.className = cls;
  Object.keys(css || {}).forEach(function (k) { if (k.indexOf("--") === 0) d.style.setProperty(k, css[k]); else d.style[k] = css[k]; });
  layer.appendChild(d);
  d.addEventListener("animationend", function (e) { if (e.target === d && (life === undefined || e.animationName === life)) d.remove(); });
  return d;
}

// ---------- GELO: lança + explosão de cristais ----------
SPELL_FX.ice = function (caster, targets) {
  const L = spLayer();
  const c = caster ? spCenter(caster) : { x: 60, y: 200 };
  const FLY = 0.30; // tempo da lança até o alvo principal
  let rank = 0;
  // lança de gelo voando até o alvo principal
  const main = targets.find(function (t) { return t.main; }) || targets[0];
  const m = spCenter(main.el);
  const dx = m.x - c.x, dy = m.y - c.y, ang = Math.atan2(dy, dx) * 180 / Math.PI;
  spAdd(L, "sp-lance", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", "--ang": ang + "deg", animationDuration: FLY + "s" });
  spAdd(L, "sp-trail", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", "--ang": ang + "deg", animationDuration: FLY + 0.2 + "s" });
  // brilho azul na tela
  spAdd(L, "sp-tint ice", { animationDelay: FLY + "s" });
  targets.forEach(function (t) {
    const p = spCenter(t.el);
    const d = t.main ? FLY : FLY + 0.14 + 0.1 * (rank++);          // os outros alvos congelam em onda
    const big = !!t.main;
    // clarão + anéis
    spAdd(L, "sp-flash ice", { left: p.x + "px", top: p.y + "px", animationDelay: d + "s", "--s": big ? 1.25 : 0.85 });
    spAdd(L, "sp-ring ice", { left: p.x + "px", top: p.y + "px", animationDelay: d + "s", "--s": big ? 3 : 2.1 });
    if (big) spAdd(L, "sp-ring ice r2", { left: p.x + "px", top: p.y + "px", animationDelay: d + 0.08 + "s", "--s": 4.2 });
    // espinhos de gelo (cristais) em leque
    const n = big ? 13 : 8;
    for (let i = 0; i < n; i++) {
      const a = (360 / n) * i + spR(-12, 12);
      const len = big ? spR(52, 92) : spR(34, 58);
      const w = big ? spR(13, 19) : spR(10, 14);
      const wrap = spAdd(L, "sp-spike-wrap", { left: (p.x - w / 2) + "px", top: (p.y - len) + "px", width: w + "px", height: len + "px", transform: "rotate(" + a + "deg)" });
      const sp = document.createElement("div");
      sp.className = "sp-spike";
      sp.style.animationDelay = (d + spR(0, 0.07)) + "s";
      sp.style.animationDuration = (big ? 1.0 : 0.85) + "s";
      sp.addEventListener("animationend", function () { wrap.remove(); });
      wrap.appendChild(sp);
    }
    // estilhaços voando
    for (let i = 0; i < (big ? 16 : 9); i++) {
      const a = spR(0, Math.PI * 2), dist = spR(40, big ? 120 : 80);
      spAdd(L, "sp-shard", { left: p.x + "px", top: p.y + "px", "--dx": Math.cos(a) * dist + "px", "--dy": Math.sin(a) * dist + 30 + "px", animationDelay: (d + 0.18 + spR(0, 0.12)) + "s", width: spR(4, 9) + "px", height: spR(4, 9) + "px" });
    }
    // marca de gelo no card: fica enquanto o efeito (−esquiva) durar; o jogo remove quando o efeito acabar
    t.el.classList.add("mark-frost", "mark-new");
    t.el.style.setProperty("--md", (d + 0.05) + "s");
  });
};

function playSpellFx(skillId, casterEl, targets) {
  const fn = SPELL_FX[skillId];
  if (fn && targets && targets.length) fn(casterEl, targets, arguments[3]);
}


// Quando o efeito acaba: o gelo racha e estilhaça (chamado quando e.dodgeDown some)
function spellMarkBreak(el, kind, delay) {
  const L = spLayer();
  const p = spCenter(el);
  el.classList.remove("mark-new");
  el.classList.add("mark-break");
  el.style.setProperty("--mb", (delay || 0) + "s");
  for (let i = 0; i < 14; i++) {
    const a = spR(0, Math.PI * 2), dist = spR(30, 90);
    spAdd(L, "sp-shard", { left: (p.l + spR(0.1, 0.9) * p.w) + "px", top: (p.t + spR(0.1, 0.9) * p.h) + "px", "--dx": Math.cos(a) * dist + "px", "--dy": Math.sin(a) * dist + 40 + "px", animationDelay: ((delay || 0) + spR(0, 0.12)) + "s", width: spR(5, 10) + "px", height: spR(5, 10) + "px" });
  }
}


// ---------- MALDIÇÃO DA RUÍNA: orbe sombrio + selo rúnico + caveiras ----------
const SP_SIGIL_SVG =
  '<svg viewBox="-50 -50 100 100" width="100%" height="100%" aria-hidden="true">' +
  '<circle r="46" fill="none" stroke="#c78bff" stroke-width="2.2"/><circle r="38" fill="none" stroke="#8a3df0" stroke-width="1.2" stroke-dasharray="3 4"/>' +
  '<polygon points="0,-34 10,-10 34,-10 15,6 22,30 0,16 -22,30 -15,6 -34,-10 -10,-10" fill="rgba(120,40,200,0.35)" stroke="#d9a8ff" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<circle r="9" fill="none" stroke="#e8c8ff" stroke-width="1.6"/>' +
  '<g stroke="#c78bff" stroke-width="2">' + [0,45,90,135,180,225,270,315].map(function (a) { return '<line x1="0" y1="-46" x2="0" y2="-41" transform="rotate(' + a + ')"/>'; }).join("") + '</g></svg>';

SPELL_FX.curse = function (caster, targets) {
  const L = spLayer();
  const c = caster ? spCenter(caster) : { x: 60, y: 200 };
  const FLY = 0.32;
  let rank = 0;
  const main = targets.find(function (t) { return t.main; }) || targets[0];
  const m = spCenter(main.el);
  const dx = m.x - c.x, dy = m.y - c.y, ang = Math.atan2(dy, dx) * 180 / Math.PI;
  spAdd(L, "sp-orb", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", animationDuration: FLY + "s" });
  spAdd(L, "sp-trail curse", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", "--ang": ang + "deg", animationDuration: FLY + "s" });
  spAdd(L, "sp-tint curse", { animationDelay: FLY + "s" });
  targets.forEach(function (t) {
    const p = spCenter(t.el);
    const big = !!t.main;
    const d = big ? FLY : FLY + 0.16 + 0.12 * (rank++);
    const S = big ? 150 : 104;
    // selo rúnico girando sob o inimigo
    const sg = spAdd(L, "sp-sigil", { left: (p.x - S / 2) + "px", top: (p.y - S / 2) + "px", width: S + "px", height: S + "px", animationDelay: d + "s" });
    sg.innerHTML = SP_SIGIL_SVG;
    spAdd(L, "sp-flash curse", { left: p.x + "px", top: p.y + "px", animationDelay: d + "s", "--s": big ? 1.3 : 0.9 });
    spAdd(L, "sp-ring curse", { left: p.x + "px", top: p.y + "px", animationDelay: d + "s", "--s": big ? 3 : 2.1 });
    // fumaça roxa subindo
    for (let i = 0; i < (big ? 9 : 6); i++) {
      const sz = spR(36, 70);
      spAdd(L, "sp-smoke", { left: (p.x + spR(-p.w / 2.4, p.w / 2.4) - sz / 2) + "px", top: (p.y + spR(-4, p.h / 3) - sz / 2) + "px", width: sz + "px", height: sz + "px",
        "--rx": spR(-24, 24) + "px", "--ry": -spR(50, 100) + "px", animationDelay: (d + 0.05 + spR(0, 0.3)) + "s", animationDuration: spR(0.9, 1.4) + "s" });
    }
    // caveira fantasma que sobe
    spAdd(L, "sp-skull", { left: p.x + "px", top: (p.y - 6) + "px", fontSize: big ? "2.4rem" : "1.7rem", animationDelay: (d + 0.12) + "s" }).textContent = "☠️";
    // a marca roxa fica no card enquanto o efeito durar
    t.el.classList.add("mark-curse", "mark-cnew");
    t.el.style.setProperty("--cd", (d + 0.1) + "s");
  });
};

// Quando a maldição acaba: a fumaça se desfaz e a caveira sobe
function spellCurseBreak(el, delay) {
  const L = spLayer();
  const p = spCenter(el);
  el.classList.remove("mark-cnew");
  el.classList.add("curse-break");
  el.style.setProperty("--cb", (delay || 0) + "s");
  spAdd(L, "sp-skull out", { left: p.x + "px", top: (p.y - 6) + "px", fontSize: "1.8rem", animationDelay: (delay || 0) + "s" }).textContent = "☠️";
  for (let i = 0; i < 6; i++) {
    const sz = spR(30, 56);
    spAdd(L, "sp-smoke", { left: (p.x + spR(-p.w / 2.4, p.w / 2.4) - sz / 2) + "px", top: (p.y + spR(-4, p.h / 3) - sz / 2) + "px", width: sz + "px", height: sz + "px",
      "--rx": spR(-20, 20) + "px", "--ry": -spR(40, 80) + "px", animationDelay: ((delay || 0) + spR(0, 0.2)) + "s", animationDuration: spR(0.6, 0.9) + "s" });
  }
}

// ---------- Etiquetas de efeito no card do inimigo ----------
// effects: [{ kind: "ice"|"curse", icon, text, turns }]. Com 1 efeito: etiqueta completa. Com 2 ou mais: só ícone + turnos (compacto).
function spellRenderTags(el, effects, delays) {
  const sig = effects.map(function (f) { return f.kind + f.text + f.turns; }).join("|");
  let box = el.querySelector(".mark-tags");
  if (box && el._tagSig === sig) return;
  if (box) box.remove();
  el._tagSig = sig;
  if (!effects.length) return;
  box = document.createElement("div");
  box.className = "mark-tags" + (effects.length > 1 ? " compact" : "");
  const MAX = 3;
  effects.slice(0, MAX).forEach(function (f, i) {
    const s = document.createElement("span");
    s.className = "mark-tag " + f.kind;
    s.innerHTML = f.icon + '<span class="txt"> ' + f.text + '</span> <b>' + f.turns + 't</b>';
    if (delays && delays[f.kind] !== undefined) s.style.animationDelay = delays[f.kind] + "s"; else if (!delays) s.style.animation = "none";
    box.appendChild(s);
  });
  if (effects.length > MAX) { const more = document.createElement("span"); more.className = "mark-tag more"; more.textContent = "+" + (effects.length - MAX); box.appendChild(more); }
  el.appendChild(box);
}

// ---------- DRENO VITAL: correntes sombrias puxam a vida do inimigo para o conjurador ----------
SPELL_FX.drain = function (caster, targets, opts) {
  opts = opts || {};
  const L = spLayer();
  const t = targets[0];
  const c = caster ? spCenter(caster) : { x: 60, y: 200, w: 100, h: 100 };
  const m = spCenter(t.el);
  const dx = m.x - c.x, dy = m.y - c.y, len = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const GRAB = 0.3, FLOW = 0.55;
  spAdd(L, "sp-tint drain", { animationDelay: "0s" });
  // 3 correntes ondulando do conjurador até o inimigo
  [-14, 0, 14].forEach(function (off, i) {
    spAdd(L, "sp-chain", { left: c.x + "px", top: (c.y + off) + "px", width: len + "px", "--ang": ang + "deg", animationDelay: (i * 0.05) + "s" });
  });
  // inimigo é agarrado: pulso escuro + flash vermelho
  spAdd(L, "sp-flash drain", { left: m.x + "px", top: m.y + "px", animationDelay: GRAB + "s", "--s": 1.3 });
  spAdd(L, "sp-ring drain", { left: m.x + "px", top: m.y + "px", animationDelay: GRAB + "s", "--s": 2.4 });
  t.el.classList.add("drain-hit"); t.el.style.setProperty("--dh", GRAB + "s");
  // gotas de vida fluem do inimigo para o conjurador em arco
  for (let i = 0; i < 12; i++) {
    const sx = m.x + spR(-m.w / 3, m.w / 3), sy = m.y + spR(-m.h / 3, m.h / 3);
    const ex = c.x + spR(-10, 10), ey = c.y + spR(-20, 20);
    const px = -(ey - sy), py = (ex - sx), n = Math.sqrt(px * px + py * py) || 1, bend = spR(-40, 40);
    spAdd(L, "sp-drop", { left: sx + "px", top: sy + "px", "--dx": (ex - sx) + "px", "--dy": (ey - sy) + "px",
      "--mx": ((ex - sx) / 2 + px / n * bend) + "px", "--my": ((ey - sy) / 2 + py / n * bend) + "px",
      animationDelay: (GRAB + 0.05 + i * 0.045) + "s", animationDuration: spR(0.5, 0.7) + "s" });
  }
  // conjurador recebe a vida: aura vermelha que vira verde-cura
  const END = GRAB + FLOW + 0.25;
  spAdd(L, "sp-heal", { left: (c.x - c.w / 2) + "px", top: (c.y - c.h / 2) + "px", width: c.w + "px", height: c.h + "px", animationDelay: (END - 0.15) + "s" });
  spAdd(L, "sp-ring heal", { left: c.x + "px", top: c.y + "px", animationDelay: END + "s", "--s": 2.2 });
  for (let i = 0; i < 6; i++) spAdd(L, "sp-plus", { left: (c.x + spR(-c.w / 3, c.w / 3)) + "px", top: (c.y + spR(0, c.h / 3)) + "px", animationDelay: (END + i * 0.06) + "s" }).textContent = "+";
};

// ---------- SETA ARCANA: projétil de energia arcana (feitiço básico, rápido) ----------
SPELL_FX.arcane = function (caster, targets, opts) {
  opts = opts || {};
  const L = spLayer();
  const t = targets[0];
  const c = caster ? spCenter(caster) : { x: 60, y: 200, w: 100, h: 100 };
  const m = spCenter(t.el);
  const dx = m.x - c.x, dy = m.y - c.y, ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const CHARGE = 0.18, FLY = 0.26, HIT = CHARGE + FLY, big = !!opts.crit;
  // carga: runa girando no conjurador
  spAdd(L, "sp-rune", { left: (c.x - 34) + "px", top: (c.y - 34) + "px", animationDelay: "0s" });
  // projétil + rastro
  spAdd(L, "sp-trail arcane", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", "--ang": ang + "deg", animationDelay: CHARGE + "s", animationDuration: FLY + "s" });
  spAdd(L, "sp-bolt" + (big ? " big" : ""), { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", "--ang": ang + "deg", animationDelay: CHARGE + "s", animationDuration: FLY + "s" });
  // impacto
  spAdd(L, "sp-flash arcane", { left: m.x + "px", top: m.y + "px", animationDelay: HIT + "s", "--s": big ? 1.6 : 1 });
  spAdd(L, "sp-ring arcane", { left: m.x + "px", top: m.y + "px", animationDelay: HIT + "s", "--s": big ? 3 : 2 });
  const n = big ? 12 : 7;
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i + spR(-12, 12), d = spR(36, big ? 80 : 58);
    spAdd(L, "sp-spark", { left: m.x + "px", top: m.y + "px", "--rx": Math.cos(a * Math.PI / 180) * d + "px", "--ry": Math.sin(a * Math.PI / 180) * d + "px", animationDelay: HIT + "s" });
  }
  if (big) spAdd(L, "sp-tint arcane", { animationDelay: HIT + "s" });
  t.el.classList.add("arcane-hit"); t.el.style.setProperty("--ah", HIT + "s");
};

// ---------- IMPACTO ÍGNEO: esfera de fogo que explode no alvo ----------
SPELL_FX.fire = function (caster, targets, opts) {
  opts = opts || {};
  const L = spLayer();
  const t = targets[0];
  const c = caster ? spCenter(caster) : { x: 60, y: 200, w: 100, h: 100 };
  const m = spCenter(t.el);
  const dx = m.x - c.x, dy = m.y - c.y, ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const CHARGE = 0.3, FLY = 0.35, HIT = CHARGE + FLY, big = !!opts.crit;
  // carga: brasas se juntam no conjurador
  for (let i = 0; i < 8; i++) {
    const a = i * 45 * Math.PI / 180;
    spAdd(L, "sp-ember in", { left: c.x + "px", top: c.y + "px", "--rx": Math.cos(a) * 46 + "px", "--ry": Math.sin(a) * 46 + "px", animationDelay: (i * 0.02) + "s" });
  }
  spAdd(L, "sp-fireorb charge", { left: c.x + "px", top: c.y + "px", animationDelay: "0s" });
  // bola de fogo voando + rastro de chamas
  spAdd(L, "sp-trail fire", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", "--ang": ang + "deg", animationDelay: CHARGE + "s", animationDuration: FLY + "s" });
  spAdd(L, "sp-fireorb fly", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", animationDelay: CHARGE + "s", animationDuration: FLY + "s" });
  for (let i = 0; i < 7; i++) spAdd(L, "sp-ember trail", { left: (c.x + dx * (0.12 + i * 0.12)) + "px", top: (c.y + dy * (0.12 + i * 0.12)) + "px", "--rx": spR(-14, 14) + "px", "--ry": spR(-30, -8) + "px", animationDelay: (CHARGE + FLY * (0.12 + i * 0.12)) + "s" });
  // explosão
  spAdd(L, "sp-flash fire", { left: m.x + "px", top: m.y + "px", animationDelay: HIT + "s", "--s": big ? 2.3 : 1.6 });
  spAdd(L, "sp-blast", { left: m.x + "px", top: m.y + "px", animationDelay: HIT + "s", "--s": big ? 2.6 : 1.8 });
  spAdd(L, "sp-ring fire", { left: m.x + "px", top: m.y + "px", animationDelay: (HIT + 0.04) + "s", "--s": big ? 3.6 : 2.4 });
  const n = big ? 22 : 14;
  for (let i = 0; i < n; i++) {
    const a = spR(0, Math.PI * 2), d = spR(30, big ? 110 : 80);
    spAdd(L, "sp-ember burst", { left: m.x + "px", top: m.y + "px", "--rx": Math.cos(a) * d + "px", "--ry": (Math.sin(a) * d - 20) + "px", animationDelay: (HIT + spR(0, 0.06)) + "s", animationDuration: spR(0.5, 0.9) + "s" });
  }
  spAdd(L, "sp-tint fire" + (big ? " big" : ""), { animationDelay: HIT + "s" });
  t.el.classList.add("fire-hit"); t.el.style.setProperty("--fh", HIT + "s");
};

// ---------- DESCARGA ELETROSTÁTICA: raio que atravessa o alvo e salta em cadeia ----------
function spBolt(L, x1, y1, x2, y2, w, delay, dur, cls) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), n = Math.max(5, Math.round(len / 18));
  const nx = -dy / len, ny = dx / len;
  const pts = [[x1, y1]];
  for (let i = 1; i < n; i++) { const o = spR(-14, 14) * (w > 3 ? 1 : 0.7); pts.push([x1 + dx * i / n + nx * o, y1 + dy * i / n + ny * o]); }
  pts.push([x2, y2]);
  const d = pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  const pad = 30, minX = Math.min(x1, x2) - pad, minY = Math.min(y1, y2) - pad, W = Math.abs(dx) + pad * 2, H = Math.abs(dy) + pad * 2;
  const el = spAdd(L, "sp-bolt-svg " + (cls || ""), { left: minX + "px", top: minY + "px", width: W + "px", height: H + "px", animationDelay: delay + "s", animationDuration: dur + "s" });
  const sh = pts.map(function (p) { return (p[0] - minX).toFixed(1) + "," + (p[1] - minY).toFixed(1); }).join(" ");
  el.innerHTML = '<svg width="' + W + '" height="' + H + '" style="overflow:visible"><polyline points="' + sh + '" fill="none" stroke="#7fb8ff" stroke-width="' + (w + 5) + '" stroke-linejoin="round" stroke-linecap="round" opacity="0.55"/>' +
    '<polyline points="' + sh + '" fill="none" stroke="#fff" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

SPELL_FX.shock = function (caster, targets) {
  const L = spLayer();
  const c = caster ? spCenter(caster) : { x: 60, y: 200, w: 100, h: 100 };
  const main = targets.find(function (t) { return t.main; }) || targets[0];
  const m = spCenter(main.el);
  const CHARGE = 0.22, HIT = CHARGE + 0.05;
  spAdd(L, "sp-tint shock", { animationDelay: CHARGE + "s" });
  // carga: faíscas elétricas no mago
  spAdd(L, "sp-flash shock", { left: c.x + "px", top: c.y + "px", animationDelay: "0s", "--s": 0.9 });
  for (let i = 0; i < 6; i++) { const a = spR(0, 6.28); spBolt(L, c.x, c.y, c.x + Math.cos(a) * 34, c.y + Math.sin(a) * 34, 2, i * 0.03, 0.2, "mini"); }
  // raio principal: mago -> alvo (atravessa e continua um pouco)
  spBolt(L, c.x, c.y, m.x, m.y, 4, CHARGE, 0.32);
  spBolt(L, c.x + 6, c.y - 4, m.x - 6, m.y + 4, 2, CHARGE + 0.02, 0.28);
  let k = 0;
  targets.forEach(function (t) {
    const p = spCenter(t.el), big = !!t.main, d = HIT + (big ? 0 : 0.1 + 0.1 * (k++));
    if (!big) spBolt(L, m.x, m.y, p.x, p.y, 3, d - 0.08, 0.3); // salto em cadeia
    spAdd(L, "sp-flash shock", { left: p.x + "px", top: p.y + "px", animationDelay: d + "s", "--s": big ? 1.6 : 1 });
    spAdd(L, "sp-ring shock", { left: p.x + "px", top: p.y + "px", animationDelay: d + "s", "--s": big ? 2.6 : 1.8 });
    const n = big ? 8 : 5;
    for (let i = 0; i < n; i++) { const a = spR(0, 6.28), r = spR(30, big ? 70 : 50);
      spAdd(L, "sp-spark shock", { left: p.x + "px", top: p.y + "px", "--rx": Math.cos(a) * r + "px", "--ry": Math.sin(a) * r + "px", animationDelay: d + "s" }); }
    if (big) { spAdd(L, "sp-pierce", { left: (p.x - 40) + "px", top: (p.y - 40) + "px", animationDelay: d + "s" }); }
    p.el = t.el; t.el.classList.add("shock-hit"); t.el.style.setProperty("--sh", d + "s");
  });
};

// ---------- EXPLOSÃO ARCANA: carga longa, detonação enorme no centro do grupo ----------
SPELL_FX.nova = function (caster, targets) {
  const L = spLayer();
  const c = caster ? spCenter(caster) : { x: 60, y: 200, w: 100, h: 100 };
  const ps = targets.map(function (t) { return spCenter(t.el); });
  const cx = ps.reduce(function (a, p) { return a + p.x; }, 0) / ps.length, cy = ps.reduce(function (a, p) { return a + p.y; }, 0) / ps.length;
  const CHARGE = 0.7, FLY = 0.3, HIT = CHARGE + FLY;
  const dx = cx - c.x, dy = cy - c.y;
  // 1) carga longa: runa grande + energia sendo sugada para o mago, tela escurece
  spAdd(L, "sp-tint nova-dark", { animationDelay: "0s" });
  spAdd(L, "sp-novarune", { left: (c.x - 55) + "px", top: (c.y - 55) + "px", animationDelay: "0s" });
  spAdd(L, "sp-fireorb nova-core", { left: c.x + "px", top: c.y + "px", animationDelay: "0s" });
  for (let i = 0; i < 16; i++) {
    const a = spR(0, 6.28), r = spR(60, 100);
    spAdd(L, "sp-ember in nova", { left: c.x + "px", top: c.y + "px", "--rx": Math.cos(a) * r + "px", "--ry": Math.sin(a) * r + "px", animationDelay: (i * 0.04) + "s", animationDuration: "0.35s" });
  }
  // 2) o orbe voa até o centro do grupo
  spAdd(L, "sp-fireorb nova-fly", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", animationDelay: CHARGE + "s", animationDuration: FLY + "s" });
  spAdd(L, "sp-trail nova", { left: c.x + "px", top: c.y + "px", "--dx": dx + "px", "--dy": dy + "px", "--ang": Math.atan2(dy, dx) * 180 / Math.PI + "deg", animationDelay: CHARGE + "s", animationDuration: FLY + "s" });
  // 3) detonação
  spAdd(L, "sp-whiteout", { animationDelay: HIT + "s" });
  spAdd(L, "sp-blast nova", { left: cx + "px", top: cy + "px", animationDelay: HIT + "s", "--s": 5.5 });
  spAdd(L, "sp-ring nova", { left: cx + "px", top: cy + "px", animationDelay: HIT + "s", "--s": 7 });
  spAdd(L, "sp-ring nova", { left: cx + "px", top: cy + "px", animationDelay: (HIT + 0.1) + "s", "--s": 9 });
  for (let i = 0; i < 26; i++) {
    const a = spR(0, 6.28), d = spR(70, 200);
    spAdd(L, "sp-spark nova", { left: cx + "px", top: cy + "px", "--rx": Math.cos(a) * d + "px", "--ry": Math.sin(a) * d + "px", animationDelay: (HIT + spR(0, 0.08)) + "s", animationDuration: spR(0.5, 0.9) + "s" });
  }
  document.body.style.setProperty("--qk", HIT + "s");
  document.body.classList.add("nova-quake");
  ps.forEach(function (p, i) {
    const t = targets[i];
    t.el.classList.add("nova-hit"); t.el.style.setProperty("--nh", (HIT + 0.04 * i) + "s");
  });
};

// ---------- BARREIRA DE MANA: escudo mágico no jogador enquanto o buff durar ----------
SPELL_FX.barrier = function (caster) {
  const L = spLayer();
  const c = spCenter(caster);
  for (let i = 0; i < 3; i++) spAdd(L, "sp-ring barrier", { left: c.x + "px", top: c.y + "px", animationDelay: (i * 0.14) + "s", "--s": 3.4 - i * 0.6 });
  spAdd(L, "sp-flash barrier", { left: c.x + "px", top: c.y + "px", animationDelay: "0.1s", "--s": 1.4 });
  for (let i = 0; i < 12; i++) {
    const sz = spR(5, 9);
    spAdd(L, "sp-hexbit", { left: (c.x + spR(-c.w / 2, c.w / 2)) + "px", top: (c.y + spR(-c.h / 2, c.h / 2)) + "px", width: sz + "px", height: sz + "px", "--ry": -spR(30, 70) + "px", animationDelay: spR(0.1, 0.6) + "s" });
  }
  caster.classList.add("mark-barrier", "mark-bnew");
  caster.style.setProperty("--bd", "0.15s");
};
// o escudo absorve um golpe: onda de choque na superfície
function spellBarrierHit(el, delay) {
  const L = spLayer(), c = spCenter(el);
  spAdd(L, "sp-bhit", { left: (c.l - 6) + "px", top: (c.t - 6) + "px", width: (c.w + 12) + "px", height: (c.h + 12) + "px", animationDelay: (delay || 0) + "s" });
  spAdd(L, "sp-flash barrier", { left: c.x + "px", top: c.y + "px", animationDelay: (delay || 0) + "s", "--s": 1.1 });
}
// o escudo acaba: racha e se desfaz em cacos
function spellBarrierBreak(el, delay) {
  const L = spLayer(), c = spCenter(el);
  el.classList.remove("mark-bnew"); el.classList.add("barrier-break"); el.style.setProperty("--bb", (delay || 0) + "s");
  for (let i = 0; i < 14; i++) {
    const side = i % 4, px = side < 2 ? c.l + spR(0, c.w) : (side === 2 ? c.l : c.l + c.w), py = side < 2 ? (side === 0 ? c.t : c.t + c.h) : c.t + spR(0, c.h);
    spAdd(L, "sp-shard barrier", { left: px + "px", top: py + "px", "--rx": spR(-30, 30) + "px", "--ry": spR(20, 70) + "px", "--rot": spR(-200, 200) + "deg", animationDelay: ((delay || 0) + spR(0, 0.15)) + "s" });
  }
}

// ---------- PULSAR REGENERATIVO: cura imediata + aura de regeneração por 3 turnos ----------
SPELL_FX.regen = function (caster) {
  const L = spLayer();
  const c = spCenter(caster);
  spAdd(L, "sp-heart", { left: c.x + "px", top: (c.y + 6) + "px", animationDelay: "0s" }).textContent = "💖";
  for (let i = 0; i < 3; i++) spAdd(L, "sp-ring regen", { left: c.x + "px", top: c.y + "px", animationDelay: (0.12 + i * 0.16) + "s", "--s": 3.2 - i * 0.5 });
  spAdd(L, "sp-flash regen", { left: c.x + "px", top: c.y + "px", animationDelay: "0.1s", "--s": 1.4 });
  for (let i = 0; i < 10; i++) spAdd(L, "sp-plus", { left: (c.x + spR(-c.w / 2.5, c.w / 2.5)) + "px", top: (c.y + spR(0, c.h / 2.5)) + "px", animationDelay: (0.15 + i * 0.07) + "s" }).textContent = "+";
  caster.classList.add("mark-regen", "mark-rnew");
  caster.style.setProperty("--rd", "0.2s");
};
// a cada turno: pulso curto e número de cura
function spellRegenTick(el, delay, txt) {
  const L = spLayer(), c = spCenter(el);
  spAdd(L, "sp-ring regen", { left: c.x + "px", top: c.y + "px", animationDelay: delay + "s", "--s": 2.4 });
  for (let i = 0; i < 5; i++) spAdd(L, "sp-plus", { left: (c.x + spR(-c.w / 2.5, c.w / 2.5)) + "px", top: (c.y + spR(0, c.h / 2.5)) + "px", animationDelay: (delay + i * 0.05) + "s" }).textContent = "+";
  el.classList.remove("regen-tick"); void el.offsetWidth; el.classList.add("regen-tick"); el.style.setProperty("--rt", delay + "s");
}
// o efeito acaba: a aura sobe e se dissolve
function spellRegenEnd(el, delay) {
  const L = spLayer(), c = spCenter(el);
  el.classList.remove("mark-rnew"); el.classList.add("regen-end"); el.style.setProperty("--re", delay + "s");
  spAdd(L, "sp-heart out", { left: c.x + "px", top: c.y + "px", animationDelay: delay + "s" }).textContent = "💖";
}

// ---------- SOBRECARGA MÍSTICA: vórtice de poder; aura de chamas no jogador enquanto durar ----------
function spOverloadAura(el) {
  if (!el.querySelector(".ov-aura")) { const a = document.createElement("div"); a.className = "ov-aura"; el.appendChild(a); }
}
SPELL_FX.overload = function (caster) {
  const L = spLayer();
  const c = spCenter(caster);
  spAdd(L, "sp-tint overload", { animationDelay: "0s" });
  spAdd(L, "sp-vortex", { left: (c.x - 70) + "px", top: (c.y - 70) + "px", animationDelay: "0s" });
  for (let i = 0; i < 3; i++) spAdd(L, "sp-ring overload", { left: c.x + "px", top: c.y + "px", animationDelay: (0.35 + i * 0.12) + "s", "--s": 3.6 - i * 0.6 });
  spAdd(L, "sp-flash overload", { left: c.x + "px", top: c.y + "px", animationDelay: "0.35s", "--s": 1.7 });
  for (let i = 0; i < 16; i++) {
    const a = spR(0, 6.28), r = spR(50, 80);
    spAdd(L, "sp-ember in overload", { left: c.x + "px", top: c.y + "px", "--rx": Math.cos(a) * r + "px", "--ry": Math.sin(a) * r + "px", animationDelay: (i * 0.02) + "s", animationDuration: "0.35s" });
  }
  for (let i = 0; i < 12; i++) spAdd(L, "sp-flame", { left: (c.x + spR(-c.w / 2.4, c.w / 2.4)) + "px", top: (c.y + c.h / 3) + "px", "--ry": -spR(50, 100) + "px", animationDelay: (0.4 + spR(0, 0.5)) + "s" });
  const f = spAdd(L, "fx-float fx-crit", { left: c.x + "px", top: (c.y - c.h * 0.2) + "px", animationDelay: "0.5s" });
  f.textContent = "ATQ +30%";
  caster.classList.add("mark-overload", "mark-onew");
  caster.style.setProperty("--od", "0.35s");
  spOverloadAura(caster);
};
function spellOverloadEnd(el, delay) {
  const L = spLayer(), c = spCenter(el);
  el.classList.remove("mark-onew"); el.classList.add("overload-end"); el.style.setProperty("--oe", delay + "s");
  for (let i = 0; i < 8; i++) spAdd(L, "sp-flame out", { left: (c.x + spR(-c.w / 2.4, c.w / 2.4)) + "px", top: (c.y + spR(-4, c.h / 3)) + "px", "--ry": -spR(40, 80) + "px", animationDelay: (delay + spR(0, 0.2)) + "s" });
}


// ---------- Integração com o combate ----------
const SPELL_FX_MAP = { seta_arcana: "arcane", impacto_igneo: "fire", lanca_gelo: "ice", descarga_eletrostatica: "shock", dreno_vital: "drain", maldicao_ruina: "curse", explosao_arcana: "nova", barreira_mana: "barrier", pulsar_regenerativo: "regen", sobrecarga_mistica: "overload" };
// impact = quando o dano/cura aparece; total = quando a rodada dos inimigos pode começar (segundos)
const SPELL_FX_TIMING = { arcane: { impact: 0.46, total: 0.95 }, fire: { impact: 0.68, total: 1.3 }, ice: { impact: 0.34, total: 1.1 }, shock: { impact: 0.3, total: 1.0 }, drain: { impact: 0.6, total: 1.5 }, curse: { impact: 0.36, total: 1.2 }, nova: { impact: 1.05, total: 1.8 }, barrier: { impact: 0.4, total: 1.0 }, regen: { impact: 0.4, total: 1.1 }, overload: { impact: 0.5, total: 1.1 } };

// Tira todas as marcas de magia do jogador (início/fim de combate)
function clearSpellMarks() {
  const side = document.querySelector("#combatScreen .combat-side");
  if (side) {
    side.classList.remove("mark-barrier", "mark-bnew", "barrier-break", "mark-regen", "mark-rnew", "regen-tick", "regen-end", "mark-overload", "mark-onew", "overload-end");
    side.querySelectorAll(".mark-tags, .ov-aura").forEach(function (x) { x.remove(); });
    side._tagSig = "";
  }
  const L = document.getElementById("spellLayer"); if (L) L.innerHTML = "";
}

// Sincroniza as marcas dos buffs do jogador com o estado do combate (chamado a cada renderCombat)
function syncPlayerBuffMarks(cmb) {
  const side = document.querySelector("#combatScreen .combat-side");
  if (!side || !cmb) return;
  const defs = [
    { key: "barrier", cls: "mark-barrier", endCls: "barrier-break", newCls: "mark-bnew", all: ["mark-barrier", "mark-bnew", "barrier-break"], end: spellBarrierBreak },
    { key: "regen", cls: "mark-regen", endCls: "regen-end", newCls: "mark-rnew", all: ["mark-regen", "mark-rnew", "regen-end", "regen-tick"], end: spellRegenEnd },
    { key: "overload", cls: "mark-overload", endCls: "overload-end", newCls: "mark-onew", all: ["mark-overload", "mark-onew", "overload-end"], end: spellOverloadEnd }
  ];
  const tags = [];
  defs.forEach(function (d) {
    const on = !!cmb[d.key];
    const has = side.classList.contains(d.cls) && !side.classList.contains(d.endCls);
    if (on && !has) { side.classList.remove(d.endCls); side.classList.add(d.cls); }
    if (!on && has) {
      d.end(side, 0);
      setTimeout(function () { if (!cmb[d.key]) d.all.forEach(function (c) { side.classList.remove(c); }); if (d.key === "overload" && !cmb.overload) { const a = side.querySelector(".ov-aura"); if (a) a.remove(); } }, 1000);
    }
  });
  if (cmb.overload) spOverloadAura(side);
  const eff = function (o) { return o.fresh ? o.turns - 1 : o.turns; };
  if (cmb.barrier) tags.push({ kind: "barrier", icon: "🔰", text: "+" + cmb.barrier.bonus + " DEF", turns: eff(cmb.barrier) });
  if (cmb.regen) tags.push({ kind: "regen", icon: "💖", text: "+" + cmb.regen.amount + " HP/t", turns: eff(cmb.regen) });
  if (cmb.overload) tags.push({ kind: "overload", icon: "🌀", text: "ATQ +30%", turns: eff(cmb.overload) });
  spellRenderTags(side, tags);
}

// Marcas persistentes nos cards dos inimigos (gelo e maldição). Os cards são recriados a cada renderização,
// então tudo é desenhado a partir do estado do inimigo; a animação de "surgir" e "quebrar" roda só uma vez.
function syncEnemyMarks(cmb) {
  const cards = document.querySelectorAll("#combatScreen .enemy-card");
  const eff = function (o) { return o.fresh ? o.turns - 1 : o.turns; };
  cmb.enemies.forEach(function (e, i) {
    const el = cards[i]; if (!el) return;
    const dead = e.hp <= 0;
    const fx = [];
    [["dodgeDown", "_fxFrost", "mark-frost", "mark-new", "ice", "❄️"], ["curse", "_fxCurse", "mark-curse", "mark-cnew", "curse", "☠️"]].forEach(function (k) {
      const on = !!e[k[0]] && !dead;
      if (on) {
        el.classList.add(k[2]);
        if (!e[k[1]]) { el.classList.add(k[3]); el.style.setProperty(k[0] === "curse" ? "--cd" : "--md", "0s"); e[k[1]] = true; }
        fx.push(k[0] === "curse" ? { kind: "curse", icon: "☠️", text: "+" + e.curse.pct + "% dano", turns: eff(e.curse) } : { kind: "ice", icon: "❄️", text: "−" + e.dodgeDown.amount + "% esq.", turns: eff(e.dodgeDown) });
      } else if (e[k[1]]) {
        e[k[1]] = false;
        if (!dead) {
          el.classList.add(k[2]);
          if (k[0] === "curse") spellCurseBreak(el, 0); else spellMarkBreak(el, "ice", 0);
        }
      }
    });
    spellRenderTags(el, fx);
  });
}
