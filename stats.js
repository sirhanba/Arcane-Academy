// ============================================================
// stats.js — Atributos do personagem: valores base, bônus de equipamento e cálculo final (recalcStats) + HUD da tela principal.
// ============================================================

function equipmentBonus(statKey) {
  let total = 0;
  const countedUids = new Set(); // evita contar a arma de 2 mãos duas vezes (ocupa 2 slots)
  EQUIPMENT_SLOTS.forEach(slotDef => {
    const uid = state.equipment[slotDef.id];
    if (!uid || countedUids.has(uid)) return;
    countedUids.add(uid);
    const instance = findGearInstance(uid);
    if (!instance) return;
    if (instance.primary[statKey] !== undefined) total += instance.primary[statKey];
    instance.secondaries.forEach(s => { if (s.stat === statKey) total += s.amount; });
  });
  return total;
}

const BASE_CRIT = 5;

const BASE_DODGE = 3;

const BASE_PENETRATION = 0;

const BASE_LUCK = 0;

const BASE_HP_REGEN = 2;

const BASE_MANA_REGEN = 1;

const PENETRATION_CAP = 70;

const DODGE_CAP = 50; // teto de 50% na Esquiva

function recalcStats() {
  const lvl = state.level;
  state.baseAttack = 4 + (lvl - 1);
  state.baseDefense = 1 + Math.floor((lvl - 1) / 2);
  state.baseHpMax = 30 + (lvl - 1) * 5;
  state.baseManaMax = 10 + (lvl - 1) * 2;

  const amuletoBonus = state.purchasedItems.amuleto_forca ? 2 : 0;

  state.attack = Math.round((state.baseAttack + equipmentBonus("attack") + amuletoBonus) * (1 + houseBonus("attackPct") / 100));
  state.defense = state.baseDefense + equipmentBonus("defense");

  const newHpMax = Math.round((state.baseHpMax + equipmentBonus("hp")) * (1 + houseBonus("hpPct") / 100));
  const newManaMax = state.baseManaMax + equipmentBonus("mana") + houseBonus("mana");
  state.hpMax = newHpMax;
  state.manaMax = newManaMax;
  state.hp = Math.min(state.hp, newHpMax);
  state.mana = Math.min(state.mana, newManaMax);

  state.critChance = BASE_CRIT + equipmentBonus("crit") + houseBonus("crit");
  state.dodgeChance = Math.min(DODGE_CAP, BASE_DODGE + equipmentBonus("dodge"));
  state.penetration = Math.min(PENETRATION_CAP, BASE_PENETRATION + equipmentBonus("penetration"));
  state.luck = BASE_LUCK + equipmentBonus("luck");
  state.hpRegen = BASE_HP_REGEN + equipmentBonus("hpRegen") + houseBonus("hpRegen");
  state.manaRegen = BASE_MANA_REGEN + equipmentBonus("manaRegen") + houseBonus("manaRegen");
}

function render() {
  const houseObj = HOUSES.find(h => h.id === state.house);
  const tagline = document.getElementById("playerTagline");
  tagline.textContent =
    (state.name || "Aprendiz") +
    (houseObj ? " · " + houseObj.icon + " " + houseObj.name : "") +
    " · Nível " + state.level;
  tagline.style.color = houseObj ? houseObj.color : "";
  document.getElementById("xpText").textContent = state.xp + " / " + state.xpToNext + " XP";
  document.getElementById("xpBar").style.width = Math.min(100, (state.xp / state.xpToNext) * 100) + "%";
  document.getElementById("hpText").textContent = state.hp + " / " + state.hpMax;
  document.getElementById("hpBar").style.width = (state.hp / state.hpMax) * 100 + "%";
  document.getElementById("manaText").textContent = state.mana + " / " + state.manaMax;
  document.getElementById("manaBar").style.width = (state.mana / state.manaMax) * 100 + "%";
  document.getElementById("goldVal").textContent = state.gold;
  document.getElementById("essenceVal").textContent = state.essence;

  renderInventory();
}
