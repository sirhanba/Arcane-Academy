// ============================================================
// outcome.js — Resultado do combate: recompensas de vitória, tela de vitória, derrota e reviver.
// ============================================================

function grantVictoryRewards(baseXp, baseGold) {
  const powerMult = 1 + (state.upgrades.power || 0) * 0.2 + houseBonusMultiplier("power");
  const goldMult = 1 + houseBonusMultiplier("gold");
  const xpGain = Math.round(baseXp * powerMult);
  const goldGain = Math.round(baseGold * powerMult * goldMult);
  state.xp += xpGain;
  state.gold += goldGain;

  const result = { xpGain: xpGain, goldGain: goldGain, droppedItem: null, leveledUp: false, newLevel: null };

  const luckBonus = (state.luck || 0) / 100;
  const droppedItem = rollItemDrop(luckBonus);
  if (droppedItem) {
    state.inventory[droppedItem.id] = (state.inventory[droppedItem.id] || 0) + 1;
    result.droppedItem = droppedItem;
  }

  if (state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = Math.round(state.xpToNext * 1.25);
    recalcStats();
    state.mana = state.manaMax;
    state.hp = state.hpMax;
    state.essence += 1; // recompensa de nível: essência arcana
    result.leveledUp = true;
    result.newLevel = state.level;
  }

  saveState();
  render();

  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }
  return result;
}

function winCombat() {
  const rewards = grantVictoryRewards(combat.xp, combat.gold);
  const wasBoss = combat.isBoss;

  if (wasBoss) {
    state.bossCooldowns[combat.locationId] = Date.now() + combat.cooldownMs;
  } else {
    registerQuestKill(combat.locationId, combat.id);
  }

  saveState();
  combat = null;
  showVictoryScreen(rewards, wasBoss);
}

function showVictoryScreen(rewards, wasBoss) {
  hideAllScreens();
  document.getElementById("victoryScreen").classList.remove("hidden");

  let rewardsHtml =
    '<div class="reward-line">✨ +' + rewards.xpGain + ' XP</div>' +
    '<div class="reward-line">🪙 +' + rewards.goldGain + ' Moedas de Cobre</div>';

  if (rewards.droppedItem) {
    rewardsHtml += '<div class="reward-line">' + rewards.droppedItem.icon + ' Encontrou: ' + rewards.droppedItem.name + '</div>';
  }
  if (rewards.leveledUp) {
    rewardsHtml += '<div class="reward-line level-up">🎉 Subiu para o nível ' + rewards.newLevel + '! (+1 💎 Essência Arcana)</div>';
  }

  document.getElementById("victoryRewards").innerHTML = rewardsHtml;

  const actions = document.getElementById("victoryActions");
  if (wasBoss) {
    actions.innerHTML = '<button class="zone-btn" style="grid-column:span 2;" onclick="openMap()"><span class="zicon">🗺️</span>Mapa</button>';
  } else {
    actions.innerHTML =
      '<button class="zone-btn" onclick="openHuntSelect(huntLocationId)"><span class="zicon">🗡️</span>Caçar Novamente</button>' +
      '<button class="zone-btn" onclick="openMap()"><span class="zicon">🗺️</span>Mapa</button>';
  }
}

const DEFEAT_MS = 5 * 1000; // TESTE: 5 segundos (versão final: 2 * 60 * 1000 = 2 minutos)

const DEFEAT_SKIP_COST = 3; // Essência Arcana para reviver na hora

function loseCombat() {
  const goldLoss = Math.min(state.gold, combat.gold);
  state.gold -= goldLoss;
  state.hp = 0;
  state.defeatedUntil = Date.now() + DEFEAT_MS;
  combat = null;
  saveState();
  showDefeatScreen(goldLoss);
}

function isDefeated() {
  return state.defeatedUntil && Date.now() < state.defeatedUntil;
}

function showDefeatScreen(goldLoss) {
  hideAllScreens();
  document.getElementById("defeatScreen").classList.remove("hidden");
  document.getElementById("defeatGoldMsg").textContent =
    goldLoss > 0 ? "Perdeu 🪙 " + goldLoss + " Moedas de Cobre na derrota." : "Nenhuma moeda foi perdida.";
  updateDefeatTimer();
}

function updateDefeatTimer() {
  const timerEl = document.getElementById("defeatTimer");
  const skipBtn = document.getElementById("defeatSkipBtn");
  if (!timerEl) return;
  const remaining = Math.max(0, state.defeatedUntil - Date.now());
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  timerEl.textContent = mm + ":" + ss;
  if (skipBtn) {
    skipBtn.disabled = state.essence < DEFEAT_SKIP_COST;
  }
}

function skipDefeatWithEssence() {
  if (state.essence < DEFEAT_SKIP_COST) {
    log("Essência insuficiente para reviver agora.");
    return;
  }
  state.essence -= DEFEAT_SKIP_COST;
  revivePlayer();
}

function revivePlayer() {
  state.hp = state.hpMax;
  state.defeatedUntil = 0;
  state.currentLocation = "academia";
  state.travelTarget = null;
  state.travelArrivesAt = 0;
  saveState();
  render();
  openMap();
  showToast("Você reviveu na Academia.");
}
