// ============================================================
// combat.js — Caça e combate por turnos: monstros, chefe, ataques, feitiços, poções em combate e log.
// ============================================================

// ---------- INIMIGOS ----------

const LOCATION_MONSTERS = {
  jardins: [
    { id: "rato_arcano", name: "Rato Arcano", icon: "🐀", level: 1, hp: 14, attack: 3, defense: 0, xp: 8, gold: 3, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 25 }, { item: "po_estelar", chance: 5 }] },
    { id: "corvo_selvagem", name: "Corvo Selvagem", icon: "🐦", level: 2, hp: 20, attack: 4, defense: 1, xp: 12, gold: 5, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 22 }, { item: "po_estelar", chance: 7 }, { item: "cristal_arcano", chance: 1 }] },
    { id: "aranha_sombria", name: "Aranha Sombria", icon: "🕷️", level: 3, hp: 28, attack: 5, defense: 2, xp: 18, gold: 8, requiredLevel: 3, drops: [{ item: "erva_lunar", chance: 20 }, { item: "po_estelar", chance: 8 }, { item: "cristal_arcano", chance: 3 }] }
  ],
  floresta: [
    { id: "lobo_cinzento", name: "Lobo Cinzento", icon: "🐺", level: 4, hp: 38, attack: 7, defense: 2, xp: 24, gold: 10, requiredLevel: 4, drops: [{ item: "erva_lunar", chance: 20 }, { item: "po_estelar", chance: 10 }, { item: "cristal_arcano", chance: 5 }] },
    { id: "javali_espinhoso", name: "Javali Espinhoso", icon: "🐗", level: 5, hp: 52, attack: 9, defense: 3, xp: 34, gold: 14, requiredLevel: 5, drops: [{ item: "erva_lunar", chance: 18 }, { item: "po_estelar", chance: 12 }, { item: "cristal_arcano", chance: 6 }, { item: "pena_fenix", chance: 1 }] },
    { id: "cogumelo_sombrio", name: "Cogumelo Sombrio", icon: "🍄", level: 6, hp: 62, attack: 10, defense: 3, xp: 46, gold: 18, requiredLevel: 6, drops: [{ item: "erva_lunar", chance: 15 }, { item: "po_estelar", chance: 14 }, { item: "cristal_arcano", chance: 8 }, { item: "pena_fenix", chance: 2 }] }
  ]
};

// Um chefe por local (cooldown individual, guardado em state.bossCooldowns[idDoLocal])
const LOCATION_BOSSES = {
  jardins: { id: "corvo_ancestral", name: "Corvo Ancestral", icon: "🐦‍⬛", hp: 60, attack: 7, defense: 3, xp: 40, gold: 25, cooldownMs: 20 * 60 * 1000, drops: [{ item: "erva_lunar", chance: 40 }, { item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 5 }] },
  floresta: { id: "ent_ancestral", name: "Ent Ancestral", icon: "🌳", hp: 130, attack: 13, defense: 6, xp: 110, gold: 60, cooldownMs: 30 * 60 * 1000, drops: [{ item: "erva_lunar", chance: 25 }, { item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 15 }, { item: "pena_fenix", chance: 5 }] }
};

let combat = null; // { enemy, enemyHp, isBoss }

let huntLocationId = null;

function openHuntSelect(locationId) {
  if (isDefeated()) { showDefeatScreen(0); return; }
  huntLocationId = locationId;
  hideAllScreens();
  document.getElementById("huntSelectScreen").classList.remove("hidden");
  renderHuntSelect();
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
        '<span class="mname">' + m.name + '</span><span class="mlevel">Nv. ' + m.level + '</span>' +
        '<div class="mstats">❤️ ' + m.hp + ' · ⚔️ ' + m.attack + ' · 🎁 ' + m.xp + ' XP / ' + m.gold + ' moedas</div>' +
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

function beginCombat(def, isBoss, locationId) {
  combat = {
    id: def.id,
    locationId: locationId,
    cooldownMs: def.cooldownMs || 0,
    drops: def.drops || [],
    name: def.name,
    icon: def.icon,
    hpMax: def.hp,
    hp: def.hp,
    attack: def.attack,
    defense: def.defense || 0,
    xp: def.xp,
    gold: def.gold,
    isBoss: isBoss
  };
  combatLogEntries = [];
  hideAllScreens();
  document.getElementById("combatScreen").classList.remove("hidden");
  document.getElementById("combatPotionList").classList.add("hidden");
  document.getElementById("enemyName").textContent = combat.name;
  document.getElementById("enemyIcon").textContent = combat.icon;
  document.getElementById("combatBackBtn").classList.remove("hidden");
  renderCombat();
  combatLog("Um " + combat.icon + " " + combat.name + " apareceu!", "system");
}

function renderCombat() {
  document.getElementById("combatPlayerHpBar").style.width = Math.max(0, (state.hp / state.hpMax) * 100) + "%";
  document.getElementById("combatPlayerHpText").textContent = Math.max(0, state.hp) + "/" + state.hpMax;
  document.getElementById("combatPlayerManaBar").style.width = Math.max(0, (state.mana / state.manaMax) * 100) + "%";
  document.getElementById("combatPlayerManaText").textContent = Math.max(0, state.mana) + "/" + state.manaMax;
  document.getElementById("enemyHpBar").style.width = Math.max(0, (combat.hp / combat.hpMax) * 100) + "%";
  document.getElementById("enemyHpText").textContent = Math.max(0, combat.hp) + "/" + combat.hpMax;
  document.getElementById("spellBtn").disabled = state.mana < 3;
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

function computeDamageVsDefense(baseDmg, enemyDefense) {
  const effectiveDefense = enemyDefense * (1 - state.penetration / 100);
  return Math.max(1, Math.round(baseDmg - effectiveDefense));
}

function rollCritical() {
  return Math.random() * 100 < state.critChance;
}

function playerAttack() {
  if (!combat) return;
  let dmg = state.attack + Math.floor(Math.random() * 3) - 1;
  let dmgLabel = "⚔️ Você atacou";
  if (rollCritical()) {
    dmg = Math.round(dmg * 2);
    dmgLabel = "💥 Crítico! Você atacou";
  }
  dmg = computeDamageVsDefense(dmg, combat.defense);
  combat.hp -= dmg;
  combatLog(dmgLabel + " e causou " + dmg + " de dano.", "player");

  if (combat.hp <= 0) {
    winCombat();
    return;
  }
  performEnemyTurn();
  renderCombat();
  saveState();
}

function playerCastSpell() {
  if (!combat || state.mana < 3) return;
  state.mana -= 3;
  let dmg = Math.round((state.attack + 4) * 1.4);
  let dmgLabel = "🔮 Você conjurou um feitiço";
  if (rollCritical()) {
    dmg = Math.round(dmg * 2);
    dmgLabel = "💥 Crítico! Seu feitiço";
  }
  dmg = computeDamageVsDefense(dmg, combat.defense);
  combat.hp -= dmg;
  combatLog(dmgLabel + " e causou " + dmg + " de dano.", "player");

  if (combat.hp <= 0) {
    winCombat();
    return;
  }
  performEnemyTurn();
  renderCombat();
  saveState();
}

function performEnemyTurn() {
  if (Math.random() * 100 < state.dodgeChance) {
    combatLog("🌀 Você esquivou do ataque de " + combat.name + "!", "enemy");
  } else {
    const dmg = Math.max(1, combat.attack - state.defense + Math.floor(Math.random() * 2));
    state.hp -= dmg;
    combatLog(combat.icon + " " + combat.name + " revidou e causou " + dmg + " de dano.", "enemy");
    if (state.hp <= 0) {
      state.hp = 0;
      loseCombat();
      return;
    }
  }

  if (state.hpRegen > 0 || state.manaRegen > 0) {
    const hpBefore = state.hp;
    const manaBefore = state.mana;
    state.hp = Math.min(state.hpMax, state.hp + state.hpRegen);
    state.mana = Math.min(state.manaMax, state.mana + state.manaRegen);
    const hpGain = state.hp - hpBefore;
    const manaGain = state.mana - manaBefore;
    if (hpGain > 0 || manaGain > 0) {
      combatLog("✨ Regeneração: +" + hpGain + " HP, +" + manaGain + " Mana.", "system");
    }
  }
}

function fleeCombat() {
  combat = null;
  backToMain();
  log("Você fugiu do combate.");
}
