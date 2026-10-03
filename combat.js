// ============================================================
// combat.js — Caça e combate por turnos: monstros, chefe, ataques, habilidades, poções em combate e log.
// ============================================================

// ---------- INIMIGOS ----------

const LOCATION_MONSTERS = {
  jardins: [
    { id: "rato_arcano", dodge: 0, name: "Rato Arcano", icon: "🐀", level: 1, hp: 14, attack: 3, defense: 0, xp: 8, gold: 3, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 25 }, { item: "po_estelar", chance: 5 }] },
    { id: "corvo_selvagem", dodge: 5, name: "Corvo Selvagem", icon: "🐦", level: 2, hp: 20, attack: 4, defense: 1, xp: 12, gold: 5, requiredLevel: 1, drops: [{ item: "erva_lunar", chance: 22 }, { item: "po_estelar", chance: 8 }] },
    { id: "aranha_sombria", dodge: 8, name: "Aranha Sombria", icon: "🕷️", level: 3, hp: 28, attack: 5, defense: 2, xp: 18, gold: 8, requiredLevel: 3, drops: [{ item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 5 }] }
  ],
  floresta: [
    { id: "lobo_cinzento", dodge: 8, name: "Lobo Cinzento", icon: "🐺", level: 4, hp: 38, attack: 7, defense: 2, xp: 24, gold: 10, requiredLevel: 4, drops: [{ item: "po_estelar", chance: 22 }, { item: "cristal_arcano", chance: 8 }] },
    { id: "javali_espinhoso", dodge: 6, name: "Javali Espinhoso", icon: "🐗", level: 5, hp: 52, attack: 9, defense: 3, xp: 34, gold: 14, requiredLevel: 5, drops: [{ item: "cristal_arcano", chance: 20 }, { item: "pena_fenix", chance: 2 }] },
    { id: "cogumelo_sombrio", dodge: 10, name: "Cogumelo Sombrio", icon: "🍄", level: 6, hp: 62, attack: 10, defense: 3, xp: 46, gold: 18, requiredLevel: 6, drops: [{ item: "cristal_arcano", chance: 25 }, { item: "pena_fenix", chance: 4 }] }
  ]
};

// Um chefe por local (cooldown individual, guardado em state.bossCooldowns[idDoLocal])
const LOCATION_BOSSES = {
  jardins: { id: "corvo_ancestral", dodge: 8, name: "Corvo Ancestral", icon: "🐦‍⬛", hp: 60, attack: 7, defense: 3, xp: 40, gold: 25, cooldownMs: 20 * 60 * 1000, drops: [{ item: "erva_lunar", chance: 25 }, { item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 5 }] },
  floresta: { id: "ent_ancestral", dodge: 10, name: "Ent Ancestral", icon: "🌳", hp: 130, attack: 13, defense: 6, xp: 110, gold: 60, cooldownMs: 30 * 60 * 1000, drops: [{ item: "po_estelar", chance: 20 }, { item: "cristal_arcano", chance: 25 }, { item: "pena_fenix", chance: 5 }] }
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
        '<div class="mstats">❤️ ' + m.hp + ' · ⚔️ ' + m.attack + ' · 💨 ' + (m.dodge || 0) + '% · 🎁 ' + m.xp + ' XP / ' + m.gold + ' moedas</div>' +
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
    dodge: def.dodge || 0,
    curse: null,      // { pct, turns }
    dodgeDown: null,  // { amount, turns }
    barrier: null,    // { bonus, turns }  (buff do jogador)
    regen: null,      // { amount, turns } (buff do jogador)
    overload: null,   // { turns }         (buff do jogador)
    xp: def.xp,
    gold: def.gold,
    isBoss: isBoss
  };
  combatLogEntries = [];
  hideAllScreens();
  document.getElementById("combatScreen").classList.remove("hidden");
  document.getElementById("combatPotionList").classList.add("hidden");
  document.getElementById("combatSkillList").classList.add("hidden");
  document.getElementById("enemyName").textContent = combat.name;
  document.getElementById("enemyIcon").textContent = combat.icon;
  document.getElementById("combatBackBtn").classList.remove("hidden");
  renderCombat();
  combatLog("Um " + combat.icon + " " + combat.name + " apareceu!", "system");
}

function renderCombat() {
  if (!combat) return;
  document.getElementById("combatPlayerHpBar").style.width = Math.max(0, (state.hp / state.hpMax) * 100) + "%";
  document.getElementById("combatPlayerHpText").textContent = Math.max(0, state.hp) + "/" + state.hpMax;
  document.getElementById("combatPlayerManaBar").style.width = Math.max(0, (state.mana / state.manaMax) * 100) + "%";
  document.getElementById("combatPlayerManaText").textContent = Math.max(0, state.mana) + "/" + state.manaMax;
  document.getElementById("enemyHpBar").style.width = Math.max(0, (combat.hp / combat.hpMax) * 100) + "%";
  document.getElementById("enemyHpText").textContent = Math.max(0, combat.hp) + "/" + combat.hpMax;
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

function enemyDodgeNow() {
  const down = combat.dodgeDown ? combat.dodgeDown.amount : 0;
  return Math.max(0, combat.dodge - down);
}

function rollEnemyDodge() {
  return Math.random() * 100 < enemyDodgeNow();
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
  if (combat.curse) chips.push("☠️ Inimigo maldito +" + combat.curse.pct + "% · " + combat.curse.turns + "t");
  if (combat.dodgeDown) chips.push("❄️ Esquiva inimiga −" + combat.dodgeDown.amount + "% · " + combat.dodgeDown.turns + "t");
  el.innerHTML = chips.map(c => '<span class="status-chip">' + c + '</span>').join("");
}

const BUFF_NAMES = { barrier: "Barreira de Mana", regen: "Pulsar Regenerativo", overload: "Sobrecarga Mística", curse: "Maldição da Ruína", dodgeDown: "Lança de Gelo" };

function tickCombatEffects() {
  ["barrier", "regen", "overload", "curse", "dodgeDown"].forEach(k => {
    if (!combat[k]) return;
    combat[k].turns -= 1;
    if (combat[k].turns <= 0) {
      combat[k] = null;
      combatLog("⌛ " + BUFF_NAMES[k] + " terminou.", "system");
    }
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

function playerAttack() {
  if (!combat) return;
  document.getElementById("combatSkillList").classList.add("hidden");
  if (rollEnemyDodge()) {
    combatLog("💨 " + combat.name + " esquivou do seu ataque!", "player");
    endPlayerAction();
    return;
  }
  let dmg = effectiveAttack() + Math.floor(Math.random() * 3) - 1;
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
    const dodged = rollEnemyDodge();
    if (dodged) {
      combatLog("💨 " + combat.name + " esquivou de " + def.name + "!", "player");
    } else {
      let dmg = def.power(effectiveAttack());
      let crit = rollCritical(def.critBonus || 0);
      if (crit) dmg *= 2;
      if (combat.curse) dmg *= 1 + combat.curse.pct / 100;
      dmg = computeDamageVsDefense(Math.round(dmg), combat.defense, def.extraPen || 0);
      combat.hp -= dmg;
      combatLog((crit ? "💥 Crítico! " : "") + def.icon + " " + def.name + " causou " + dmg + " de dano.", "player");
      if (def.lifesteal) {
        const heal = Math.max(1, Math.round(dmg * def.lifesteal));
        const before = state.hp;
        state.hp = Math.min(state.hpMax, state.hp + heal);
        if (state.hp > before) combatLog("🩸 Você drenou " + (state.hp - before) + " HP.", "player");
      }
    }
    // Efeitos no inimigo valem mesmo se ele esquivar do dano
    if (def.dodgeDown) {
      combat.dodgeDown = { amount: def.dodgeDown.amount, turns: def.dodgeDown.turns + 1 };
      combatLog("❄️ Esquiva de " + combat.name + " reduzida em " + def.dodgeDown.amount + "%.", "player");
    }
    if (def.curse) {
      combat.curse = { pct: def.curse.pct, turns: def.curse.turns + 1 };
      combatLog("☠️ " + combat.name + " receberá +" + def.curse.pct + "% de dano de feitiços.", "player");
    }
    if (combat.hp <= 0) {
      winCombat();
      return;
    }
  }
  endPlayerAction();
}

function performEnemyTurn() {
  if (Math.random() * 100 < state.dodgeChance) {
    combatLog("🌀 Você esquivou do ataque de " + combat.name + "!", "enemy");
  } else {
    const dmg = Math.max(1, combat.attack - effectivePlayerDefense() + Math.floor(Math.random() * 2));
    state.hp -= dmg;
    combatLog(combat.icon + " " + combat.name + " revidou e causou " + dmg + " de dano.", "enemy");
    if (state.hp <= 0) {
      state.hp = 0;
      loseCombat();
      return;
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
  combat = null;
  backToMain();
  log("Você fugiu do combate.");
}
