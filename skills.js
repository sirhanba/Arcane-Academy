// ============================================================
// skills.js — Árvore de habilidades (igual para todos os jogadores): nós de atributo, habilidades ativas,
// pontos (1 por nível), desbloqueio por vizinhança, reset e tela arrastável.
// ============================================================

// ---------- REGRAS ----------

const SKILL_COST_STAT = 1;      // custo (pontos) de um nó pequeno de atributo
const SKILL_COST_ACTIVE = 2;    // custo (pontos) de um nó grande de habilidade ativa
const SKILL_RESET_COST = 20;    // Essência Arcana para resetar todos os pontos
const SKILL_ROOT_ID = "S";      // nó inicial (Seta Arcana)
const SKILL_ROOT_LEVEL = 3;     // nível mínimo para liberar o nó inicial

// Nós pequenos: o que cada tipo de atributo dá (por nó). Para ajustar o equilíbrio, mude aqui.
const SKILL_STATS = {
  attack:      { label: "Ataque",                   amount: 3,  suffix: "",  icon: "⚔️" },
  crit:        { label: "Crítico",                  amount: 2,  suffix: "%", icon: "💥" },
  penetration: { label: "Penetração",               amount: 2,  suffix: "%", icon: "🗡️" },
  hp:          { label: "HP máximo",                amount: 12, suffix: "",  icon: "❤️" },
  defense:     { label: "Defesa",                   amount: 1,  suffix: "",  icon: "🛡️" },
  hpRegen:     { label: "Regen de HP por turno",    amount: 1,  suffix: "",  icon: "💚" },
  dodge:       { label: "Esquiva",                  amount: 1,  suffix: "%", icon: "💨" },
  mana:        { label: "Mana máxima",              amount: 6,  suffix: "",  icon: "🔵" },
  manaRegen:   { label: "Regen de Mana por turno",  amount: 1,  suffix: "",  icon: "💧" }
};

// ---------- HABILIDADES ATIVAS ----------
// power(atk) = dano base (null = sem dano). Os outros campos descrevem o efeito (lidos por castSkill, em combat.js):
//   critBonus = % de Crítico extra só nessa conjuração · extraPen = % de Penetração extra · lifesteal = fração do dano que cura
//   dodgeDown / curse / barrier / regen / overload = efeitos com duração em turnos (ver combat.js)
const ACTIVE_SKILLS = [
  { id: "seta_arcana", name: "Seta Arcana", icon: "🔮", cost: 8, type: "Feitiço ofensivo simples",
    power: a => a * 1.2 + 5, formula: "Ataque × 1,2 + 5",
    effect: "Dano direto de elemento puro.",
    desc: "Dispara um projétil de energia arcana concentrada no alvo. É o feitiço básico de qualquer arcanista." },
  { id: "impacto_igneo", name: "Impacto Ígneo", icon: "🔥", cost: 18, type: "Feitiço ofensivo (foco em Crítico)",
    power: a => a * 1.8 + 12, formula: "Ataque × 1,8 + 12", critBonus: 10,
    effect: "+10% de chance de Crítico nesta conjuração.",
    desc: "Invoca uma esfera de fogo denso que explode ao atingir o inimigo, buscando pontos fracos na armadura." },
  { id: "lanca_gelo", name: "Lança de Gelo", icon: "❄️", cost: 22, type: "Feitiço ofensivo / controle",
    power: a => a * 1.4 + 8, formula: "Ataque × 1,4 + 8", dodgeDown: { amount: 5, turns: 1 },
    effect: "Reduz a Esquiva do inimigo em 5% no próximo turno.",
    desc: "Um projétil pontiagudo de gelo que perfura o alvo, congelando suas articulações e diminuindo sua mobilidade." },
  { id: "descarga_eletrostatica", name: "Descarga Eletrostática", icon: "⚡", cost: 25, type: "Feitiço ofensivo (foco em Penetração)",
    power: a => a * 1.5 + 15, formula: "Ataque × 1,5 + 15", extraPen: 20,
    effect: "Ignora 20% da Defesa do inimigo (soma-se à sua Penetração).",
    desc: "Libera um raio elétrico instantâneo que atravessa as proteções e armaduras do oponente." },
  { id: "dreno_vital", name: "Dreno Vital", icon: "🩸", cost: 20, type: "Feitiço ofensivo / sustentação",
    power: a => a * 1.1 + 6, formula: "Ataque × 1,1 + 6", lifesteal: 0.5,
    effect: "Recupera HP igual a 50% do dano causado.",
    desc: "Projeta correntes sombrias que roubam a força vital do inimigo para curar as feridas do conjurador." },
  { id: "barreira_mana", name: "Barreira de Mana", icon: "🔰", cost: 15, type: "Feitiço defensivo (suporte)",
    power: null, formula: "Sem dano", barrier: { turns: 2 },
    effect: "Defesa +(Defesa do equipamento × 0,5) + 10 por 2 turnos.",
    desc: "Molda a mana ao redor do corpo criando um escudo translúcido que absorve parte do impacto dos ataques sofridos." },
  { id: "pulsar_regenerativo", name: "Pulsar Regenerativo", icon: "💖", cost: 28, type: "Feitiço de cura / utilitário",
    power: null, formula: "Sem dano (cura)", regen: { turns: 3 },
    effect: "Regen de HP/turno +(Ataque × 0,4) + 8 por 3 turnos.",
    desc: "Envolve o conjurador com uma aura de restauração que acelera continuamente a regeneração celular." },
  { id: "maldicao_ruina", name: "Maldição da Ruína", icon: "☠️", cost: 16, type: "Feitiço de debuff / amplificação",
    power: a => a * 0.5, formula: "Ataque × 0,5", curse: { pct: 25, turns: 2 },
    effect: "O inimigo recebe +25% de dano de todos os feitiços nos próximos 2 turnos.",
    desc: "Marca a alma do oponente com uma selagem arcana, tornando-o extremamente vulnerável a ataques mágicos posteriores." },
  { id: "explosao_arcana", name: "Explosão Arcana", icon: "☄️", cost: 45, type: "Feitiço ofensivo pesado",
    power: a => a * 2.6 + 30, formula: "Ataque × 2,6 + 30",
    effect: "Consome muita mana, mas tem alto valor base de dano.",
    desc: "Condensa uma grande quantidade de energia mágica em um único ponto e a faz explodir violentamente contra o inimigo." },
  { id: "sobrecarga_mistica", name: "Sobrecarga Mística", icon: "🌀", cost: 35, type: "Feitiço de buff / keystone final",
    power: null, formula: "Sem dano", overload: { turns: 2, atkPct: 30, critBonus: 10, costPct: 50 },
    effect: "Por 2 turnos: Ataque +30%, Crítico +10%, mas outros feitiços custam +50% de Mana.",
    desc: "Força os limites do corpo para canalizar um fluxo devastador de magia pura, aumentando dramaticamente o poder ofensivo por um curto período." }
];

function activeSkillDef(id) {
  return ACTIVE_SKILLS.find(s => s.id === id) || null;
}

// ---------- NÓS DA ÁRVORE ----------
// x, y = posição no desenho (multiplicado por skillScale; Y invertido na tela). "skill" = id de habilidade ativa; "stat" = atributo (ver SKILL_STATS).
const SKILL_NODES = [
  { id: "S", x: 190, y: 36, skill: "seta_arcana" },
  { id: "a1", x: 190, y: 76, stat: "attack" },
  { id: "a2", x: 190, y: 116, stat: "attack" },
  { id: "IG", x: 190, y: 156, skill: "impacto_igneo" },
  { id: "c1", x: 190, y: 196, stat: "crit" },
  { id: "a3", x: 190, y: 236, stat: "attack" },
  { id: "DE", x: 190, y: 276, skill: "descarga_eletrostatica" },
  { id: "p1", x: 190, y: 316, stat: "penetration" },
  { id: "a4", x: 190, y: 356, stat: "attack" },
  { id: "c2", x: 190, y: 396, stat: "crit" },
  { id: "p2", x: 190, y: 436, stat: "penetration" },
  { id: "a5", x: 190, y: 476, stat: "attack" },
  { id: "EX", x: 190, y: 516, skill: "explosao_arcana" },
  { id: "c3", x: 190, y: 556, stat: "crit" },
  { id: "a6", x: 190, y: 596, stat: "attack" },
  { id: "SO", x: 190, y: 636, skill: "sobrecarga_mistica" },
  { id: "h1", x: 105, y: 76, stat: "hp" },
  { id: "h2", x: 105, y: 116, stat: "hp" },
  { id: "DV", x: 105, y: 156, skill: "dreno_vital" },
  { id: "d1", x: 60, y: 196, stat: "defense" },
  { id: "d2", x: 60, y: 236, stat: "defense" },
  { id: "BM", x: 60, y: 276, skill: "barreira_mana" },
  { id: "rh1", x: 60, y: 316, stat: "hpRegen" },
  { id: "h3", x: 105, y: 356, stat: "hp" },
  { id: "d3", x: 105, y: 396, stat: "defense" },
  { id: "e1", x: 60, y: 436, stat: "dodge" },
  { id: "rh2", x: 60, y: 476, stat: "hpRegen" },
  { id: "PR", x: 105, y: 516, skill: "pulsar_regenerativo" },
  { id: "h4", x: 105, y: 556, stat: "hp" },
  { id: "e2", x: 105, y: 596, stat: "dodge" },
  { id: "m1", x: 275, y: 76, stat: "mana" },
  { id: "m2", x: 275, y: 131, stat: "mana" },
  { id: "LG", x: 275, y: 186, skill: "lanca_gelo" },
  { id: "g1", x: 320, y: 241, stat: "manaRegen" },
  { id: "m3", x: 320, y: 296, stat: "mana" },
  { id: "MR", x: 320, y: 351, skill: "maldicao_ruina" },
  { id: "g2", x: 320, y: 406, stat: "manaRegen" },
  { id: "m4", x: 275, y: 461, stat: "mana" },
  { id: "g3", x: 275, y: 516, stat: "manaRegen" },
  { id: "g4", x: 275, y: 571, stat: "manaRegen" }
];

// Ligações entre nós (um nó só pode ser liberado se estiver ligado a outro já liberado)
const SKILL_EDGES = [
  ["S", "a1"],
  ["a1", "a2"],
  ["a2", "IG"],
  ["IG", "c1"],
  ["c1", "a3"],
  ["a3", "DE"],
  ["DE", "p1"],
  ["p1", "a4"],
  ["a4", "c2"],
  ["c2", "p2"],
  ["p2", "a5"],
  ["a5", "EX"],
  ["EX", "c3"],
  ["c3", "a6"],
  ["a6", "SO"],
  ["S", "h1"],
  ["h1", "h2"],
  ["h2", "DV"],
  ["DV", "d1"],
  ["d1", "d2"],
  ["d2", "BM"],
  ["BM", "rh1"],
  ["rh1", "h3"],
  ["h3", "d3"],
  ["d3", "e1"],
  ["e1", "rh2"],
  ["rh2", "PR"],
  ["PR", "h4"],
  ["h4", "e2"],
  ["e2", "SO"],
  ["S", "m1"],
  ["m1", "m2"],
  ["m2", "LG"],
  ["LG", "g1"],
  ["g1", "m3"],
  ["m3", "MR"],
  ["MR", "g2"],
  ["g2", "m4"],
  ["m4", "g3"],
  ["g3", "g4"],
  ["g4", "SO"]
];

function skillNodeById(id) {
  return SKILL_NODES.find(n => n.id === id) || null;
}

function skillNodeCost(node) {
  return node.skill ? SKILL_COST_ACTIVE : SKILL_COST_STAT;
}

function skillNeighbors(id) {
  const out = [];
  SKILL_EDGES.forEach(e => {
    if (e[0] === id) out.push(e[1]);
    else if (e[1] === id) out.push(e[0]);
  });
  return out;
}

// ---------- PONTOS E DESBLOQUEIO ----------

function isSkillUnlocked(id) {
  return !!(state.skills && state.skills[id]);
}

function skillPointsTotal() {
  return Math.max(0, state.level - 1); // 1 ponto por nível (nível 1 não dá ponto)
}

function skillPointsSpent() {
  let spent = 0;
  SKILL_NODES.forEach(n => { if (isSkillUnlocked(n.id)) spent += skillNodeCost(n); });
  return spent;
}

function skillPointsFree() {
  return skillPointsTotal() - skillPointsSpent();
}

// Retorna { ok, reason }
function canUnlockSkillNode(node) {
  if (isSkillUnlocked(node.id)) return { ok: false, reason: "Já liberado" };
  if (node.id === SKILL_ROOT_ID) {
    if (state.level < SKILL_ROOT_LEVEL) return { ok: false, reason: "Requer nível " + SKILL_ROOT_LEVEL };
  } else if (!skillNeighbors(node.id).some(isSkillUnlocked)) {
    return { ok: false, reason: "Libere um nó vizinho antes" };
  }
  const cost = skillNodeCost(node);
  if (skillPointsFree() < cost) return { ok: false, reason: "Pontos insuficientes (custa " + cost + ")" };
  return { ok: true, reason: "" };
}

function unlockSkillNode(id) {
  const node = skillNodeById(id);
  if (!node) return false;
  if (!canUnlockSkillNode(node).ok) return false;
  state.skills[id] = true;
  recalcStats();
  saveState();
  render();
  return true;
}

// Bônus total de atributo vindo dos nós pequenos liberados (chaves iguais às de equipmentBonus)
function skillBonus(statKey) {
  const def = SKILL_STATS[statKey];
  if (!def || !state.skills) return 0;
  let count = 0;
  SKILL_NODES.forEach(n => { if (n.stat === statKey && state.skills[n.id]) count++; });
  return count * def.amount;
}

// Habilidades ativas liberadas, na ordem da lista ACTIVE_SKILLS
function unlockedActiveSkills() {
  return ACTIVE_SKILLS.filter(s => SKILL_NODES.some(n => n.skill === s.id && isSkillUnlocked(n.id)));
}

async function resetSkills() {
  if (skillPointsSpent() === 0) { showToast("Você ainda não gastou pontos."); return; }
  if (state.essence < SKILL_RESET_COST) {
    showToast("Resetar custa " + SKILL_RESET_COST + " 💎 Essência Arcana.");
    return;
  }
  if (!confirm("Resetar todos os pontos de habilidade por " + SKILL_RESET_COST + " Essência Arcana?")) return;
  if (cloudEnabled()) {
    if (!(await walletSpend("respec"))) return; // o servidor desconta a Essência
  } else {
    state.essence -= SKILL_RESET_COST; // teste fora do Telegram
  }
  state.skills = {};
  selectedSkillNodeId = null;
  recalcStats();
  saveState();
  render();
  renderSkillTree();
  showToast("↺ Pontos resetados. Você recuperou " + skillPointsTotal() + " pontos.");
}

// ---------- TELA DA ÁRVORE ----------

const SKILL_W = 380;              // largura do desenho (unidades)
const SKILL_H = 672;              // altura do desenho; o eixo Y é invertido (Seta Arcana embaixo, Sobrecarga no topo)

let selectedSkillNodeId = null;
let skillScale = 0.85;            // calculado em openSkills para a árvore caber inteira na tela

function skillPx(node) {
  return { x: node.x * skillScale, y: (SKILL_H - node.y) * skillScale };
}

function openSkills() {
  hideAllScreens();
  document.getElementById("habilidadesScreen").classList.remove("hidden");
  const box = document.getElementById("skillTreeBox");
  const w = box.getBoundingClientRect().width || 340;
  skillScale = Math.max(0.6, Math.min(w / SKILL_W, 1.0));
  const W = Math.ceil(SKILL_W * skillScale), H = Math.ceil((SKILL_H - 6) * skillScale);
  box.style.height = H + "px";
  const canvas = document.getElementById("skillCanvas");
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  canvas.style.left = Math.max(0, (w - W) / 2) + "px";
  const edges = document.getElementById("skillEdges");
  edges.setAttribute("width", W);
  edges.setAttribute("height", H);
  box.style.setProperty("--sk-small", Math.round(30 * skillScale) + "px");
  box.style.setProperty("--sk-big", Math.round(44 * skillScale) + "px");
  renderSkillTree();
}

function renderSkillTree() {
  const free = skillPointsFree();
  document.getElementById("skillPointsText").textContent =
    "Pontos: " + free + " livres · " + skillPointsSpent() + " gastos (nível " + state.level + ")";

  const edgesSvg = document.getElementById("skillEdges");
  edgesSvg.innerHTML = "";
  SKILL_EDGES.forEach(e => {
    const a = skillNodeById(e[0]);
    const b = skillNodeById(e[1]);
    const pa = skillPx(a);
    const pb = skillPx(b);
    const on = isSkillUnlocked(a.id) && isSkillUnlocked(b.id);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pa.x);
    line.setAttribute("y1", pa.y);
    line.setAttribute("x2", pb.x);
    line.setAttribute("y2", pb.y);
    line.setAttribute("stroke", on ? "rgba(232,193,90,0.9)" : "rgba(255,255,255,0.18)");
    line.setAttribute("stroke-width", on ? "3" : "2");
    edgesSvg.appendChild(line);
  });

  const wrap = document.getElementById("skillNodes");
  wrap.innerHTML = "";
  SKILL_NODES.forEach(n => {
    const p = skillPx(n);
    const unlocked = isSkillUnlocked(n.id);
    const available = !unlocked && canUnlockSkillNode(n).ok;
    const reachable = !unlocked && (n.id === SKILL_ROOT_ID || skillNeighbors(n.id).some(isSkillUnlocked));
    const def = n.skill ? activeSkillDef(n.skill) : SKILL_STATS[n.stat];
    const el = document.createElement("div");
    let cls = "skill-node" + (n.skill ? " big" : "");
    if (unlocked) cls += " unlocked";
    else if (available) cls += " available";
    else if (reachable) cls += " reachable";
    if (selectedSkillNodeId === n.id) cls += " selected";
    el.className = cls;
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
    el.dataset.id = n.id;
    el.innerHTML = def.icon;
    el.onclick = function () { selectSkillNode(n.id); };
    wrap.appendChild(el);
  });
  renderSkillPanel();
}

function selectSkillNode(id) {
  selectedSkillNodeId = id;
  renderSkillTree();
}

function renderSkillPanel() {
  const panel = document.getElementById("skillNodePanel");
  const node = selectedSkillNodeId ? skillNodeById(selectedSkillNodeId) : null;
  const btn0 = document.getElementById("skillNodeBtn");
  if (!node) {
    document.getElementById("skillNodeTitle").textContent = "Árvore de habilidades";
    document.getElementById("skillNodeDesc").innerHTML = "Toque num nó da árvore para ver os detalhes e liberar.";
    btn0.classList.add("hidden");
    return;
  }
  btn0.classList.remove("hidden");

  const cost = skillNodeCost(node);
  const unlocked = isSkillUnlocked(node.id);
  const check = canUnlockSkillNode(node);
  let title, body;

  if (node.skill) {
    const s = activeSkillDef(node.skill);
    title = s.icon + " " + s.name;
    body =
      '<b>' + s.type + '</b><br>' +
      '🔵 Custo: ' + s.cost + ' Mana · Dano: ' + s.formula + '<br>' +
      s.effect + '<br><i>' + s.desc + '</i>';
  } else {
    const s = SKILL_STATS[node.stat];
    title = s.icon + " +" + s.amount + s.suffix + " " + s.label;
    body = "Bônus permanente de atributo.";
  }
  body += '<br>Custo: ' + cost + ' ponto' + (cost > 1 ? "s" : "");

  document.getElementById("skillNodeTitle").textContent = title;
  document.getElementById("skillNodeDesc").innerHTML = body;
  const btn = document.getElementById("skillNodeBtn");
  if (unlocked) {
    btn.textContent = "✅ Liberado";
    btn.disabled = true;
  } else if (check.ok) {
    btn.textContent = "Liberar (" + cost + " ponto" + (cost > 1 ? "s" : "") + ")";
    btn.disabled = false;
  } else {
    btn.textContent = "🔒 " + check.reason;
    btn.disabled = true;
  }
}

function unlockSelectedSkill() {
  if (!selectedSkillNodeId) return;
  const node = skillNodeById(selectedSkillNodeId);
  if (unlockSkillNode(node.id)) {
    const def = node.skill ? activeSkillDef(node.skill) : null;
    showToast(def ? "✨ Habilidade liberada: " + def.name : "✅ Atributo liberado: " + SKILL_STATS[node.stat].label);
  }
  renderSkillTree();
}
