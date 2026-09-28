// ============================================================
// stats.js — Atributos do personagem: valores base, bônus de equipamento e cálculo final (recalcStats) + HUD da tela principal.
// ============================================================

function equipmentBonus(statKey) {
  let total = 0;
  EQUIPMENT_SLOTS.forEach(slotDef => {
    const itemId = state.equipment[slotDef.id];
    if (!itemId) return;
    const def = EQUIP_ITEMS.find(i => i.id === itemId);
    if (def && def.stats && def.stats[statKey]) total += def.stats[statKey];
  });
  return total;
}

const BASE_CRIT = 50; // TESTE: 50% (versão final: 5)

const BASE_DODGE = 50; // TESTE: 50% (versão final: 3)

const BASE_PENETRATION = 0;

const BASE_LUCK = 0;

const BASE_HP_REGEN = 2;

const BASE_MANA_REGEN = 1;

const PENETRATION_CAP = 70;

function recalcStats() {
  const lvl = state.level;
  state.baseAttack = 4 + (lvl - 1);
  state.baseDefense = 1 + Math.floor((lvl - 1) / 2);
  state.baseHpMax = 30 + (lvl - 1) * 5;
  state.baseManaMax = 10 + (lvl - 1) * 2;

  const amuletoBonus = state.purchasedItems.amuleto_forca ? 2 : 0;

  state.attack = state.baseAttack + equipmentBonus("attack") + amuletoBonus;
  state.defense = state.baseDefense + equipmentBonus("defense");

  const newHpMax = state.baseHpMax + equipmentBonus("hp");
  const newManaMax = state.baseManaMax + equipmentBonus("mana") + (state.houseManaBonus || 0);
  state.hpMax = newHpMax;
  state.manaMax = newManaMax;
  state.hp = Math.min(state.hp, newHpMax);
  state.mana = Math.min(state.mana, newManaMax);

  state.critChance = BASE_CRIT + equipmentBonus("crit");
  state.dodgeChance = BASE_DODGE + equipmentBonus("dodge");
  state.penetration = Math.min(PENETRATION_CAP, BASE_PENETRATION + equipmentBonus("penetration"));
  state.luck = BASE_LUCK + equipmentBonus("luck") + (state.houseLuckBonus || 0);
  state.hpRegen = BASE_HP_REGEN + equipmentBonus("hpRegen");
  state.manaRegen = BASE_MANA_REGEN + equipmentBonus("manaRegen");
}

function render() {
  const houseObj = HOUSES.find(h => h.id === state.house);
  const tagline = document.getElementById("playerTagline");
  tagline.textContent =
    (state.name || "Aprendiz") + " · " + (state.gender === "f" ? "Feminino" : "Masculino") +
    (houseObj ? " · " + houseObj.icon + " " + houseObj.name : "");
  tagline.style.color = houseObj ? houseObj.color : "";
  document.getElementById("levelVal").textContent = state.level;
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
