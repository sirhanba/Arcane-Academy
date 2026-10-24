// ============================================================
// combat.js — Caça e combate por turnos: monstros, chefe, ataques, habilidades, poções em combate e log.
// ============================================================

// ---------- INIMIGOS ----------

const LOCATION_MONSTERS = {
  jardins: [
    { id: "rato_arcano", dodge: 0, name: "Rato Arcano", icon: "🐀", level: 1, hp: 14, attack: 3, defense: 0, xp: 8, gold: 3, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 25 }, { item: "po_estelar", chance: 5 }, { item: "raiz_fibrosa", chance: 35 }] },
    { id: "corvo_selvagem", dodge: 5, name: "Corvo Selvagem", icon: "🐦", level: 2, hp: 20, attack: 4, defense: 1, xp: 12, gold: 5, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 22 }, { item: "po_estelar", chance: 8 }, { item: "casca_bruta", chance: 30 }] },
    { id: "aranha_sombria", dodge: 8, name: "Aranha Sombria", icon: "🕷️", level: 3, hp: 28, attack: 5, defense: 2, xp: 18, gold: 8, requiredLevel: 3, drops: [{ item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 5 }, { item: "raiz_fibrosa", chance: 35 }] }
  ],
  floresta: [
    { id: "lobo_cinzento", pack: "Alcateia de Lobos", dodge: 8, name: "Lobo Cinzento", icon: "🐺", level: 4, hp: 38, attack: 7, defense: 2, xp: 24, gold: 10, requiredLevel: 4, drops: [{ item: "po_estelar", chance: 22 }, { item: "cristal_arcano", chance: 8 }, { item: "casca_bruta", chance: 40 }] },
    { id: "javali_espinhoso", dodge: 6, name: "Javali Espinhoso", icon: "🐗", level: 5, hp: 52, attack: 9, defense: 3, xp: 34, gold: 14, requiredLevel: 5, drops: [{ item: "cristal_arcano", chance: 20 }, { item: "pena_fenix", chance: 2 }, { item: "casca_bruta", chance: 40 }] },
    { id: "cogumelo_sombrio", dodge: 10, name: "Cogumelo Sombrio", icon: "🍄", level: 6, hp: 62, attack: 10, defense: 3, xp: 46, gold: 18, requiredLevel: 6, drops: [{ item: "cristal_arcano", chance: 25 }, { item: "pena_fenix", chance: 4 }, { item: "essencia_sombria", chance: 18 }] }
  ],
  cavernas: [
    { id: "morcego_cristalino", pack: "Revoada de Morcegos", dodge: 12, name: "Morcego Cristalino", icon: "🦇", level: 3, hp: 26, attack: 5, defense: 1, xp: 16, gold: 7, requiredLevel: 2, drops: [{ item: "erva_lunar", chance: 20 }, { item: "cristal_arcano", chance: 10 }, { item: "poeira_de_osso", chance: 35 }] },
    { id: "gargula_menor", dodge: 4, name: "Gárgula Menor", icon: "🗿", level: 6, hp: 60, attack: 11, defense: 4, xp: 44, gold: 17, requiredLevel: 5, drops: [{ item: "cristal_arcano", chance: 22 }, { item: "pena_fenix", chance: 3 }, { item: "fragmento_quartzo", chance: 25 }] },
    { id: "veia_animada", dodge: 2, name: "Veia de Minério Viva", icon: "🪨", level: 7, hp: 75, attack: 13, defense: 5, xp: 55, gold: 22, requiredLevel: 6, drops: [{ item: "cristal_arcano", chance: 30 }, { item: "pena_fenix", chance: 5 }, { item: "fragmento_quartzo", chance: 25 }] }
  ],
  lago: [
    { id: "peixe_abissal", dodge: 10, name: "Peixe Abissal", icon: "🐟", level: 2, hp: 22, attack: 4, defense: 1, xp: 12, gold: 5, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 25 }, { item: "po_estelar", chance: 5 }, { item: "gota_agua_pura", chance: 40 }] },
    { id: "sereia_corrompida", dodge: 15, name: "Sereia Corrompida", icon: "🧜‍♀️", level: 5, hp: 48, attack: 9, defense: 2, xp: 32, gold: 13, requiredLevel: 4, drops: [{ item: "po_estelar", chance: 25 }, { item: "cristal_arcano", chance: 10 }, { item: "escama_brilhante", chance: 22 }] },
    { id: "serpente_das_aguas", pack: "Ninho de Serpentes", dodge: 8, name: "Serpente das Águas", icon: "🐍", level: 9, hp: 95, attack: 16, defense: 6, xp: 80, gold: 35, requiredLevel: 8, drops: [{ item: "cristal_arcano", chance: 28 }, { item: "pena_fenix", chance: 6 }, { item: "gota_agua_pura", chance: 35 }] }
  ],
  ruinas: [
    { id: "esqueleto_guerreiro", pack: "Esquadrão de Esqueletos", dodge: 5, name: "Esqueleto Guerreiro", icon: "💀", level: 5, hp: 50, attack: 10, defense: 3, xp: 35, gold: 15, requiredLevel: 4, drops: [{ item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 10 }, { item: "poeira_de_osso", chance: 45 }] },
    { id: "mago_fantasma", dodge: 12, name: "Mago Fantasma", icon: "👻", level: 8, hp: 80, attack: 15, defense: 4, xp: 70, gold: 30, requiredLevel: 7, drops: [{ item: "cristal_arcano", chance: 25 }, { item: "pena_fenix", chance: 5 }, { item: "essencia_sombria", chance: 25 }] },
    { id: "golem_de_pedra_antigo", dodge: 2, name: "Golem de Pedra Antigo", icon: "🛡️", level: 13, hp: 160, attack: 24, defense: 10, xp: 150, gold: 75, requiredLevel: 11, drops: [{ item: "cristal_arcano", chance: 35 }, { item: "pena_fenix", chance: 10 }, { item: "poeira_de_osso", chance: 45 }] }
  ],
  biblioteca: [
    { id: "livro_maldito", dodge: 8, name: "Livro Maldito Voador", icon: "📖", level: 2, hp: 18, attack: 5, defense: 0, xp: 10, gold: 4, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 30 }, { item: "po_estelar", chance: 10 }, { item: "poeira_de_osso", chance: 30 }] },
    { id: "gargula_de_tomo", pack: "Guarda de Gárgulas", dodge: 6, name: "Gárgula de Tomo", icon: "🏛️", level: 7, hp: 70, attack: 12, defense: 5, xp: 52, gold: 20, requiredLevel: 6, drops: [{ item: "po_estelar", chance: 22 }, { item: "cristal_arcano", chance: 15 }, { item: "poeira_de_osso", chance: 30 }] },
    { id: "arquivista_sombrio", dodge: 14, name: "Arquivista Sombrio", icon: "📜", level: 10, hp: 110, attack: 18, defense: 7, xp: 95, gold: 42, requiredLevel: 9, drops: [{ item: "cristal_arcano", chance: 30 }, { item: "pena_fenix", chance: 7 }, { item: "olho_gorgona", chance: 6 }] }
  ],
  cristais: [
    { id: "escaravelho_cristalino", pack: "Enxame de Escaravelhos", dodge: 10, name: "Escaravelho Cristalino", icon: "🪲", level: 4, hp: 35, attack: 8, defense: 3, xp: 22, gold: 9, requiredLevel: 3, drops: [{ item: "po_estelar", chance: 25 }, { item: "cristal_arcano", chance: 12 }, { item: "fragmento_quartzo", chance: 35 }] },
    { id: "elemental_de_quartzo", dodge: 8, name: "Elemental de Quartzo", icon: "💎", level: 7, hp: 65, attack: 13, defense: 6, xp: 50, gold: 21, requiredLevel: 6, drops: [{ item: "cristal_arcano", chance: 30 }, { item: "pena_fenix", chance: 4 }, { item: "fragmento_quartzo", chance: 35 }] },
    { id: "colosso_prismatico", dodge: 4, name: "Colosso Prismático", icon: "💠", level: 11, hp: 130, attack: 20, defense: 9, xp: 115, gold: 55, requiredLevel: 10, drops: [{ item: "cristal_arcano", chance: 40 }, { item: "pena_fenix", chance: 8 }, { item: "coracao_elemental", chance: 4 }] }
  ],
  pantano: [
    { id: "lumefogo_enganoso", pack: "Bando de Lumefogos", dodge: 18, name: "Lumefogo Fata Morgana", icon: "🏮", level: 6, hp: 55, attack: 11, defense: 2, xp: 40, gold: 16, requiredLevel: 5, drops: [{ item: "erva_lunar", chance: 35 }, { item: "po_estelar", chance: 15 }, { item: "gota_agua_pura", chance: 35 }] },
    { id: "hidra_dos_lodos", dodge: 7, name: "Hidra dos Lodos", icon: "🐉", level: 9, hp: 100, attack: 17, defense: 5, xp: 85, gold: 38, requiredLevel: 8, drops: [{ item: "cristal_arcano", chance: 25 }, { item: "pena_fenix", chance: 6 }, { item: "gota_agua_pura", chance: 35 }] },
    { id: "bruxa_das_neblinas", dodge: 15, name: "Bruxa das Neblinas", icon: "🧙‍♀️", level: 14, hp: 175, attack: 26, defense: 8, xp: 170, gold: 85, requiredLevel: 12, drops: [{ item: "cristal_arcano", chance: 35 }, { item: "pena_fenix", chance: 12 }, { item: "sangue_dragao", chance: 5 }] }
  ],
  picos: [
    { id: "grifo_das_tempestades", pack: "Bando de Grifos", dodge: 14, name: "Grifo das Tempestades", icon: "🦅", level: 10, hp: 115, attack: 19, defense: 6, xp: 100, gold: 45, requiredLevel: 9, drops: [{ item: "po_estelar", chance: 30 }, { item: "cristal_arcano", chance: 20 }, { item: "fragmento_quartzo", chance: 30 }] },
    { id: "elemental_do_gelo", dodge: 6, name: "Elemental de Gelo", icon: "❄️", level: 12, hp: 140, attack: 22, defense: 8, xp: 130, gold: 60, requiredLevel: 11, drops: [{ item: "cristal_arcano", chance: 35 }, { item: "pena_fenix", chance: 8 }, { item: "fragmento_quartzo", chance: 30 }] },
    { id: "dragao_menor_das_neves", dodge: 10, name: "Dragão Menor das Neves", icon: "🐲", level: 16, hp: 220, attack: 32, defense: 12, xp: 220, gold: 110, requiredLevel: 14, drops: [{ item: "cristal_arcano", chance: 50 }, { item: "pena_fenix", chance: 15 }, { item: "coracao_elemental", chance: 5 }] }
  ],
  catacumbas: [
    { id: "ghoul_faminto", pack: "Matilha de Ghouls", dodge: 8, name: "Ghoul Faminto", icon: "🧟", level: 8, hp: 75, attack: 14, defense: 3, xp: 65, gold: 28, requiredLevel: 7, drops: [{ item: "erva_lunar", chance: 20 }, { item: "cristal_arcano", chance: 15 }, { item: "poeira_de_osso", chance: 50 }] },
    { id: "cavaleiro_remanescente", pack: "Pelotão de Cavaleiros", dodge: 5, name: "Cavaleiro Remanescente", icon: "⚔️", level: 11, hp: 125, attack: 21, defense: 9, xp: 110, gold: 50, requiredLevel: 10, drops: [{ item: "cristal_arcano", chance: 30 }, { item: "pena_fenix", chance: 7 }, { item: "olho_gorgona", chance: 7 }] },
    { id: "lich_menor", dodge: 16, name: "Lich Menor", icon: "🧙‍♂️", level: 15, hp: 190, attack: 28, defense: 10, xp: 190, gold: 95, requiredLevel: 13, drops: [{ item: "cristal_arcano", chance: 40 }, { item: "pena_fenix", chance: 14 }, { item: "sangue_dragao", chance: 6 }] }
  ]
};

// Um chefe por local (cooldown individual, guardado em state.bossCooldowns[idDoLocal])
const LOCATION_BOSSES = {
  jardins: { id: "corvo_ancestral", dodge: 8, name: "Corvo Ancestral", icon: "🐦‍⬛", hp: 60, attack: 7, defense: 3, xp: 40, gold: 25, cooldownMs: 20 * 60 * 1000, drops: [{ item: "erva_lunar", chance: 25 }, { item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 5 }] },
  floresta: { id: "ent_ancestral", dodge: 10, name: "Ent Ancestral", icon: "🌳", hp: 130, attack: 13, defense: 6, xp: 110, gold: 60, cooldownMs: 30 * 60 * 1000, drops: [{ item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 25 }, { item: "pena_fenix", chance: 5 }] },
  cavernas: { id: "patriarca_das_cavernas", dodge: 6, name: "Monstro de Magma Estagnado", icon: "🌋", hp: 160, attack: 17, defense: 7, xp: 140, gold: 70, cooldownMs: 30 * 60 * 1000, drops: [{ item: "cristal_arcano", chance: 35 }, { item: "pena_fenix", chance: 8 }] },
  lago: { id: "leviata_do_lago", dodge: 10, name: "Leviatã do Lago Sereno", icon: "🌊", hp: 200, attack: 22, defense: 8, xp: 180, gold: 90, cooldownMs: 35 * 60 * 1000, drops: [{ item: "cristal_arcano", chance: 40 }, { item: "pena_fenix", chance: 10 }] },
  ruinas: { id: "rei_esqueleto", dodge: 8, name: "Rei Esqueleto Esquecido", icon: "👑", hp: 250, attack: 29, defense: 11, xp: 250, gold: 130, cooldownMs: 40 * 60 * 1000, drops: [{ item: "cristal_arcano", chance: 50 }, { item: "pena_fenix", chance: 15 }] },
  biblioteca: { id: "arquimago_corrompido", dodge: 15, name: "Espectro do Arquimago", icon: "👁️", hp: 190, attack: 24, defense: 8, xp: 170, gold: 85, cooldownMs: 30 * 60 * 1000, drops: [{ item: "po_estelar", chance: 30 }, { item: "pena_fenix", chance: 10 }] },
  cristais: { id: "rainha_de_cristal", dodge: 12, name: "Rainha de Cristal", icon: "💎", hp: 210, attack: 25, defense: 10, xp: 200, gold: 100, cooldownMs: 35 * 60 * 1000, drops: [{ item: "cristal_arcano", chance: 45 }, { item: "pena_fenix", chance: 12 }] },
  pantano: { id: "monstro_do_pantano", dodge: 8, name: "Matriarca das Hidras", icon: "🐍", hp: 270, attack: 31, defense: 11, xp: 270, gold: 140, cooldownMs: 40 * 60 * 1000, drops: [{ item: "cristal_arcano", chance: 50 }, { item: "pena_fenix", chance: 16 }] },
  picos: { id: "patriarca_das_tempestades", dodge: 14, name: "Senhor dos Ventos Uivantes", icon: "🌪️", hp: 320, attack: 38, defense: 14, xp: 350, gold: 180, cooldownMs: 45 * 60 * 1000, drops: [{ item: "cristal_arcano", chance: 60 }, { item: "pena_fenix", chance: 20 }] },
  catacumbas: { id: "arquilich", dodge: 18, name: "Arquilich Milenar", icon: "💀", hp: 300, attack: 35, defense: 12, xp: 320, gold: 160, cooldownMs: 45 * 60 * 1000, drops: [{ item: "cristal_arcano", chance: 55 }, { item: "pena_fenix", chance: 18 }] }
};

let combat = null; // { enemies: [...], target, isBoss, ... }

// Bandos (monstros com "pack"): 2 a 4 inimigos do mesmo tipo, mais fracos que o solo. Valores provisórios (Fase 4).
const PACK_MIN = 2, PACK_MAX = 4;
const PACK_HP_MULT = 0.55, PACK_ATK_MULT = 0.55, PACK_DEF_MULT = 0.8, PACK_REWARD_MULT = 0.6;

let huntLocationId = null;

function openHuntSelect(locationId) {
  if (isDefeated()) { showDefeatScreen(0); return; }
  huntLocationId = locationId;
  hideAllScreens();
  document.getElementById("huntSelectScreen").classList.remove("hidden");
  renderHuntSelect();
}

function packStats(m) {
  // Bando: cada inimigo é mais fraco que o monstro solo (valores provisórios — Fase 4 revisa)
  return {
    hp: Math.max(1, Math.round(m.hp * PACK_HP_MULT)),
    attack: Math.max(1, Math.round(m.attack * PACK_ATK_MULT)),
    defense: Math.round((m.defense || 0) * PACK_DEF_MULT),
    xp: Math.max(1, Math.round(m.xp * PACK_REWARD_MULT)),
    gold: Math.max(1, Math.round(m.gold * PACK_REWARD_MULT))
  };
}

function renderHuntSelect() {
  const loc = locById(huntLocationId);
  document.getElementById("huntSelectTitle").textContent = loc.icon + " Monstros — " + loc.name;
  const list = document.getElementById("huntMonsterList");
  list.innerHTML = "";
  const monsters = LOCATION_MONSTERS[huntLocationId] || [];

  monsters.forEach(m => {
    const locked = state.level < m.requiredLevel;
    const card = document.createElement("div");
    card.className = "monster-card" + (locked ? " locked" : "");
    card.innerHTML =
      '<div class="monster-icon">' + m.icon + '</div>' +
      '<div class="monster-info">' +
        '<span class="mname">' + (m.pack || m.name) + '</span><span class="mlevel">Nv. ' + m.level + '</span>' +
        (m.pack ? '<div class="mstats">👥 2 a 4 inimigos</div>' : '') +
      '</div>' +
      (locked
        ? '<button class="monster-fight-btn" disabled>🔒 Nv. ' + m.requiredLevel + '</button>'
        : '<button class="monster-fight-btn" onclick="selectMonster(\'' + m.id + '\')">Enfrentar</button>');
    list.appendChild(card);
  });
}

function selectMonster(monsterId) {
  const monsters = LOCATION_MONSTERS[huntLocationId] || [];
  const m = monsters.find(x => x.id === monsterId);
  if (!m || state.level < m.requiredLevel) return;
  beginCombat(m, false, huntLocationId);
}

function startBoss(locationId) {
  if (isDefeated()) { showDefeatScreen(0); return; }
  const boss = LOCATION_BOSSES[locationId];
  if (!boss) return;
  if ((state.bossCooldowns[locationId] || 0) > Date.now()) return;
  beginCombat(boss, true, locationId);
}

function newEnemy(base, name, icon, st) {
  return { id: base.id, name: name, icon: icon, hpMax: st.hp, hp: st.hp, attack: st.attack, defense: st.defense || 0, dodge: base.dodge || 0, curse: null, dodgeDown: null };
}

function beginCombat(def, isBoss, locationId) {
  const enemies = [];
  let title = def.name, xp = def.xp, gold = def.gold;
  if (def.pack && !isBoss) {
    const n = PACK_MIN + Math.floor(Math.random() * (PACK_MAX - PACK_MIN + 1));
    const st = packStats(def);
    for (let i = 0; i < n; i++) enemies.push(newEnemy(def, def.name + " " + (i + 1), def.icon, st));
    title = def.pack; xp = st.xp * n; gold = st.gold * n;
  } else {
    enemies.push(newEnemy(def, def.name, def.icon, def));
  }
  combat = {
    id: def.id,
    locationId: locationId,
    cooldownMs: def.cooldownMs || 0,
    drops: def.drops || [],
    title: title,
    icon: def.icon,
    enemies: enemies,
    target: 0,
    curse: null,
    barrier: null,    // { bonus, turns }  (buff do jogador)
    regen: null,      // { amount, turns } (buff do jogador)
    overload: null,   // { turns }         (buff do jogador)
    xp: xp,
    gold: gold,
    isBoss: isBoss
  };
  combatLogEntries = [];
  hideAllScreens();
  document.getElementById("combatScreen").classList.remove("hidden");
  document.getElementById("combatPotionList").classList.add("hidden");
  document.getElementById("combatSkillList").classList.add("hidden");
  document.getElementById("enemyName").textContent = combat.title;
  document.getElementById("combatBackBtn").classList.remove("hidden");
  { const f = document.getElementById("fleeBtn"); if (f) f.classList.remove("hidden"); }
  if (locationId === "torre" && typeof towerCombatSetup === "function") towerCombatSetup();
  renderCombat();
  combatLog(enemies.length > 1 ? "Um grupo de " + enemies.length + " " + combat.icon + " apareceu: " + combat.title + "!" : "Um " + combat.icon + " " + enemies[0].name + " apareceu!", "system");
}

function aliveEnemies() { return combat.enemies.filter(e => e.hp > 0); }
function currentTarget() {
  let e = combat.enemies[combat.target];
  if (!e || e.hp <= 0) { e = aliveEnemies()[0]; combat.target = combat.enemies.indexOf(e); }
  return e;
}
function setTarget(i) {
  if (!combat || !combat.enemies[i] || combat.enemies[i].hp <= 0) return;
  combat.target = i;
  renderCombat();
}
function renderEnemyGroup() {
  const box = document.getElementById("enemyGroup");
  const tgt = currentTarget();
  box.className = "enemy-group" + (combat.enemies.length === 1 ? " solo" : "");
  box.innerHTML = combat.enemies.map((e, i) => {
    const dead = e.hp <= 0;
    return '<div class="enemy-card' + (dead ? ' dead' : '') + (e === tgt && !dead ? ' targeted' : '') + '"' + (dead ? '' : ' onclick="setTarget(' + i + ')"') + '>' +
      '<div class="cicon">' + e.icon + '</div>' +
      '<div class="cname">' + e.name + (e.curse ? ' ☠️' : '') + (e.dodgeDown ? ' ❄️' : '') + '</div>' +
      '<div class="bar-outer hp-bar" style="max-width:120px;margin:0 auto;"><div class="bar-inner" style="width:' + Math.max(0, e.hp / e.hpMax * 100) + '%"></div></div>' +
      '<div class="combat-stat-text">' + Math.max(0, e.hp) + '/' + e.hpMax + '</div></div>';
  }).join("");
}

function renderCombat() {
  if (!combat) return;
  document.getElementById("combatPlayerHpBar").style.width = Math.max(0, (state.hp / state.hpMax) * 100) + "%";
  document.getElementById("combatPlayerHpText").textContent = Math.max(0, state.hp) + "/" + state.hpMax;
  document.getElementById("combatPlayerManaBar").style.width = Math.max(0, (state.mana / state.manaMax) * 100) + "%";
  document.getElementById("combatPlayerManaText").textContent = Math.max(0, state.mana) + "/" + state.manaMax;
  renderEnemyGroup();
  document.getElementById("spellBtn").disabled = unlockedActiveSkills().length === 0;
  renderCombatStatus();
  if (!document.getElementById("combatSkillList").classList.contains("hidden")) renderCombatSkillList();
  const hasPotions = POTIONS.some(p => (state.inventory[p.id] || 0) > 0);
  document.getElementById("potionBtn").disabled = !hasPotions;
}

function toggleCombatPotionList() {
  const panel = document.getElementById("combatPotionList");
  if (!panel.classList.contains("hidden")) {
    panel.classList.add("hidden");
    return;
  }
  renderCombatPotionList();
  document.getElementById("combatSkillList").classList.add("hidden");
  panel.classList.remove("hidden");
}

function renderCombatPotionList() {
  const panel = document.getElementById("combatPotionList");
  const owned = POTIONS.filter(p => (state.inventory[p.id] || 0) > 0);
  if (owned.length === 0) {
    panel.innerHTML = '<div class="hint">Nenhuma poção na mochila.</div>';
    return;
  }
  panel.innerHTML = owned.map(p =>
    '<div class="combat-potion-row">' +
      '<span>' + p.icon + ' ' + p.name + ' (x' + state.inventory[p.id] + ')</span>' +
      '<button onclick="drinkPotionInCombat(\'' + p.id + '\')">Usar</button>' +
    '</div>'
  ).join("");
}

function drinkPotionInCombat(id) {
  if (!combat) return;
  const result = applyPotionEffect(id);
  if (!result) return;
  combatLog("🧪 Você bebeu " + result.def.name + " e recuperou " + result.amountApplied + " de " + (result.def.type === "heal" ? "HP" : "Mana") + ".", "player");
  document.getElementById("combatPotionList").classList.add("hidden");
  performEnemyTurn();
  renderCombat();
  saveState();
}

let combatLogEntries = [];

function combatLog(msg, type) {
  combatLogEntries.push({ msg: msg, type: type || "system" });
  const el = document.getElementById("combatLog");
  el.innerHTML = combatLogEntries
    .map(e => '<div class="log-entry entry-' + e.type + '">' + e.msg + '</div>')
    .join("");
  el.scrollTop = el.scrollHeight;
}

function computeDamageVsDefense(baseDmg, enemyDefense, extraPen) {
  const pen = Math.min(PENETRATION_CAP, state.penetration + (extraPen || 0));
  const effectiveDefense = enemyDefense * (1 - pen / 100);
  return Math.max(1, Math.round(baseDmg - effectiveDefense));
}

// ---------- Buffs / debuffs de combate ----------
function effectiveAttack() {
  return state.attack * (combat && combat.overload ? 1.3 : 1);
}

function effectiveCritChance(bonus) {
  return state.critChance + (bonus || 0) + (combat && combat.overload ? 10 : 0);
}

function rollCritical(bonus) {
  return Math.random() * 100 < effectiveCritChance(bonus);
}

function effectivePlayerDefense() {
  return state.defense + (combat && combat.barrier ? combat.barrier.bonus : 0);
}

function enemyDodgeNow(e) {
  const down = e.dodgeDown ? e.dodgeDown.amount : 0;
  return Math.max(0, e.dodge - down);
}

function rollEnemyDodge(e) {
  return Math.random() * 100 < enemyDodgeNow(e);
}

function skillManaCost(def) {
  if (combat && combat.overload && def.id !== "sobrecarga_mistica") return Math.ceil(def.cost * 1.5);
  return def.cost;
}

function renderCombatStatus() {
  const el = document.getElementById("combatStatus");
  if (!el || !combat) return;
  const chips = [];
  if (combat.barrier) chips.push("🔰 Barreira +" + combat.barrier.bonus + " DEF · " + combat.barrier.turns + "t");
  if (combat.regen) chips.push("💖 Regen +" + combat.regen.amount + " · " + combat.regen.turns + "t");
  if (combat.overload) chips.push("🌀 Sobrecarga · " + combat.overload.turns + "t");
  const cursed = aliveEnemies().filter(e => e.curse);
  if (cursed.length) chips.push("☠️ Malditos +" + cursed[0].curse.pct + "% · " + Math.max.apply(null, cursed.map(e => e.curse.turns)) + "t" + (combat.enemies.length > 1 ? " (" + cursed.length + ")" : ""));
  const slowed = aliveEnemies().filter(e => e.dodgeDown);
  if (slowed.length) chips.push("❄️ Esquiva inimiga −" + slowed[0].dodgeDown.amount + "% · " + Math.max.apply(null, slowed.map(e => e.dodgeDown.turns)) + "t" + (combat.enemies.length > 1 ? " (" + slowed.length + ")" : ""));
  el.innerHTML = chips.map(c => '<span class="status-chip">' + c + '</span>').join("");
}

const BUFF_NAMES = { barrier: "Barreira de Mana", regen: "Pulsar Regenerativo", overload: "Sobrecarga Mística", curse: "Maldição da Ruína", dodgeDown: "Lança de Gelo" };

function tickCombatEffects() {
  ["barrier", "regen", "overload"].forEach(k => {
    if (!combat[k]) return;
    combat[k].turns -= 1;
    if (combat[k].turns <= 0) {
      combat[k] = null;
      combatLog("⌛ " + BUFF_NAMES[k] + " terminou.", "system");
    }
  });
  ["curse", "dodgeDown"].forEach(k => {
    let ended = false;
    combat.enemies.forEach(e => {
      if (!e[k]) return;
      e[k].turns -= 1;
      if (e[k].turns <= 0) { e[k] = null; ended = true; }
    });
    if (ended) combatLog("⌛ " + BUFF_NAMES[k] + " terminou.", "system");
  });
}

// ---------- Habilidades em combate ----------
function toggleCombatSkillList() {
  const panel = document.getElementById("combatSkillList");
  if (!panel.classList.contains("hidden")) {
    panel.classList.add("hidden");
    return;
  }
  document.getElementById("combatPotionList").classList.add("hidden");
  renderCombatSkillList();
  panel.classList.remove("hidden");
}

function renderCombatSkillList() {
  const panel = document.getElementById("combatSkillList");
  const skills = unlockedActiveSkills();
  if (skills.length === 0) {
    panel.innerHTML = '<div class="hint">Nenhuma habilidade liberada.</div>';
    return;
  }
  panel.innerHTML = skills.map(def => {
    const cost = skillManaCost(def);
    const can = state.mana >= cost;
    return '<div class="combat-skill-row">' +
      '<div class="sk-info"><div class="sk-name">' + def.icon + ' ' + def.name + ' · ' + cost + ' 💧</div>' +
      '<div class="sk-desc">' + def.effect + '</div></div>' +
      '<button ' + (can ? '' : 'disabled ') + 'onclick="castSkill(\'' + def.id + '\')">Usar</button>' +
    '</div>';
  }).join("");
}

function endPlayerAction() {
  performEnemyTurn();
  renderCombat();
  saveState();
}

function enemyDefeated(e) { combatLog("☠️ " + e.name + " foi derrotado!", "system"); }

function checkCombatWon() {
  if (aliveEnemies().length === 0) { winCombat(); return true; }
  return false;
}

function playerAttack() {
  if (!combat) return;
  document.getElementById("combatSkillList").classList.add("hidden");
  const e = currentTarget();
  if (rollEnemyDodge(e)) {
    combatLog("💨 " + e.name + " esquivou do seu ataque!", "player");
    endPlayerAction();
    return;
  }
  let dmg = effectiveAttack() + Math.floor(Math.random() * 3) - 1;
  let dmgLabel = "⚔️ Você atacou";
  if (rollCritical()) {
    dmg = Math.round(dmg * 2);
    dmgLabel = "💥 Crítico! Você atacou";
  }
  dmg = computeDamageVsDefense(dmg, e.defense);
  e.hp -= dmg;
  combatLog(dmgLabel + " " + e.name + " e causou " + dmg + " de dano.", "player");
  if (e.hp <= 0) enemyDefeated(e);
  if (checkCombatWon()) return;
  endPlayerAction();
}

function castSkill(id) {
  if (!combat) return;
  const def = activeSkillDef(id);
  if (!def || !unlockedActiveSkills().some(s => s.id === id)) return;
  const cost = skillManaCost(def);
  if (state.mana < cost) { showToast("Mana insuficiente."); return; }
  state.mana -= cost;
  document.getElementById("combatSkillList").classList.add("hidden");

  // Buffs próprios
  if (def.barrier) {
    const bonus = Math.floor(equipmentBonus("defense") * 0.5) + 10;
    combat.barrier = { bonus: bonus, turns: def.barrier.turns };
    combatLog(def.icon + " " + def.name + ": Defesa +" + bonus + " por " + def.barrier.turns + " turnos.", "player");
  }
  if (def.regen) {
    const amount = Math.round(state.attack * 0.4 + 8);
    combat.regen = { amount: amount, turns: def.regen.turns };
    const hpBefore = state.hp;
    state.hp = Math.min(state.hpMax, state.hp + amount);
    combatLog(def.icon + " " + def.name + ": +" + (state.hp - hpBefore) + " HP agora e +" + amount + " HP no início dos próximos " + def.regen.turns + " turnos.", "player");
  }
  if (def.overload) {
    combat.overload = { turns: def.overload.turns + 1 };
    combatLog(def.icon + " " + def.name + ": Ataque +30%, Crítico +10% por " + def.overload.turns + " turnos (outros feitiços +50% de mana).", "player");
  }

  // Feitiços com dano
  if (def.power) {
    const tgt = currentTarget();
    const alive = aliveEnemies();
    const aoe = !!def.aoe; // skill de área sempre causa o dano reduzido, mesmo contra 1 inimigo (de propósito)
    const targets = aoe ? [tgt].concat(alive.filter(x => x !== tgt)) : [tgt];
    targets.forEach(e => {
      if (e.hp <= 0) return;
      const pct = !aoe ? 100 : (e === tgt ? def.aoe.main : def.aoe.other);
      if (rollEnemyDodge(e)) {
        combatLog("💨 " + e.name + " esquivou de " + def.name + "!", "player");
      } else {
        let dmg = def.power(effectiveAttack()) * pct / 100;
        let crit = rollCritical(def.critBonus || 0);
        if (crit) dmg *= 2;
        if (e.curse) dmg *= 1 + e.curse.pct / 100;
        if (typeof bestiaryWeakness === "function" && bestiaryWeakness(e.id) === def.id) dmg *= 1.2; // fraqueza (só skills; revelada no Bestiário)
        dmg = computeDamageVsDefense(Math.round(dmg), e.defense, def.extraPen || 0);
        e.hp -= dmg;
        combatLog((crit ? "💥 Crítico! " : "") + def.icon + " " + def.name + " causou " + dmg + " de dano em " + e.name + ".", "player");
        if (def.lifesteal) {
          const heal = Math.max(1, Math.round(dmg * def.lifesteal));
          const before = state.hp;
          state.hp = Math.min(state.hpMax, state.hp + heal);
          if (state.hp > before) combatLog("🩸 Você drenou " + (state.hp - before) + " HP.", "player");
        }
      }
      // Efeitos no inimigo valem mesmo se ele esquivar do dano
      if (def.dodgeDown) e.dodgeDown = { amount: def.dodgeDown.amount, turns: def.dodgeDown.turns + 1 };
      if (def.curse) e.curse = { pct: def.curse.pct, turns: def.curse.turns + 1 };
      if (e.hp <= 0) enemyDefeated(e);
    });
    if (def.dodgeDown) combatLog("❄️ Esquiva reduzida em " + def.dodgeDown.amount + "%" + (aoe ? " em todos os inimigos." : " em " + tgt.name + "."), "player");
    if (def.curse) combatLog("☠️ " + (aoe ? "Todos os inimigos receberão" : tgt.name + " receberá") + " +" + def.curse.pct + "% de dano de feitiços.", "player");
    if (checkCombatWon()) return;
  }
  endPlayerAction();
}

function performEnemyTurn() {
  for (const e of aliveEnemies()) {
    if (Math.random() * 100 < state.dodgeChance) {
      combatLog("🌀 Você esquivou do ataque de " + e.name + "!", "enemy");
    } else {
      const dmg = Math.max(1, e.attack - effectivePlayerDefense() + Math.floor(Math.random() * 2));
      state.hp -= dmg;
      combatLog(e.icon + " " + e.name + " revidou e causou " + dmg + " de dano.", "enemy");
      if (state.hp <= 0) {
        state.hp = 0;
        loseCombat();
        return;
      }
    }
  }

  const pulsar = combat.regen ? combat.regen.amount : 0;
  if (state.hpRegen > 0 || state.manaRegen > 0 || pulsar > 0) {
    const hpBefore = state.hp;
    const manaBefore = state.mana;
    state.hp = Math.min(state.hpMax, state.hp + state.hpRegen + pulsar);
    state.mana = Math.min(state.manaMax, state.mana + state.manaRegen);
    const hpGain = state.hp - hpBefore;
    const manaGain = state.mana - manaBefore;
    if (hpGain > 0 || manaGain > 0) {
      combatLog("✨ Regeneração: +" + hpGain + " HP, +" + manaGain + " Mana.", "system");
    }
  }
  tickCombatEffects();
}

function fleeCombat() {
  if (combat && combat.tower) return; // na Torre não dá para fugir
  combat = null;
  backToMain();
  log("Você fugiu do combate.");
}
