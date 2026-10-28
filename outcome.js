// ============================================================
// outcome.js — Resultado do combate: recompensas de vitória, tela de vitória, derrota e reviver.
// ============================================================

// Sobe de nível enquanto houver XP suficiente (vale para qualquer fonte de XP: combate, missão...).
// Retorna quantos níveis foram ganhos. Cada nível dá +1 Essência e restaura HP/Mana.
function checkLevelUp() {
  let gained = 0;
  while (state.level < MAX_LEVEL && state.xp >= state.xpToNext) {
    state.xp -= state.xpToNext;
    state.level += 1;
    state.xpToNext = Math.round(state.xpToNext * 1.25);
    state.essence += levelEssence(); // recompensa de nível: Essência Arcana (VIP ganha o dobro)
    gained += 1;
  }
  if (state.level >= MAX_LEVEL) state.xp = 0; // nível máximo: XP excedente é descartado
  if (gained > 0) {
    recalcStats();
    state.mana = state.manaMax;
    state.hp = state.hpMax;
  }
  return gained;
}

function grantVictoryRewards(baseXp, baseGold, drops, isBoss) {
  const powerMult = 1 + (state.upgrades.power || 0) * 0.2;
  const xpGain = Math.round(baseXp * powerMult * (typeof studyActiveId === "function" && studyActiveId() === "sabedoria" ? STUDY_XP_MULT : 1)); // Tomo da Sabedoria
  const goldGain = Math.round(baseGold * powerMult);
  state.xp += xpGain;
  state.gold += goldGain;

  const result = { xpGain: xpGain, goldGain: goldGain, droppedItem: null, leveledUp: false, newLevel: null };

  const droppedItem = rollMonsterDrop(drops, state.luck, isBoss);
  if (droppedItem && !bagCanHold(droppedItem.id)) {
    result.lostItem = droppedItem; // mochila cheia: o drop se perde
  } else if (droppedItem) {
    state.inventory[droppedItem.id] = (state.inventory[droppedItem.id] || 0) + 1;
    result.droppedItem = droppedItem;
  }

  const levelsGained = checkLevelUp();
  if (levelsGained > 0) {
    result.leveledUp = true;
    result.newLevel = state.level;
    result.levelsGained = levelsGained;
  }

  saveState();
  render();

  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred("light");
  }
  return result;
}

function winCombat() {
  const rewards = grantVictoryRewards(combat.xp, combat.gold, combat.drops, combat.isBoss);
  const wasBoss = combat.isBoss;

  bestiaryKill(combat.id, wasBoss ? 1 : combat.enemies.length); // Bestiário

  if (combat.tower) { towerWin(rewards); return; } // Torre: não conta para missões nem cooldown de chefe

  if (wasBoss) {
    state.bossCooldowns[combat.locationId] = Date.now() + combat.cooldownMs;
    registerBossKill(combat.id);
  } else {
    for (let i = 0; i < combat.enemies.length; i++) registerQuestKill(combat.locationId, combat.id); // cada inimigo do bando conta 1
  }

  addStat(wasBoss ? "bosses" : "kills", wasBoss ? 1 : combat.enemies.length); // conquistas
  saveState();
  combat = null;
  showVictoryScreen(rewards, wasBoss);
}

// Número que sobe de 0 até o valor (efeito de contagem)
function countUpTo(el, to, ms, delay) {
  const start = Date.now() + (delay || 0);
  (function step() {
    const t = (Date.now() - start) / ms;
    if (t < 0) { requestAnimationFrame(step); return; }
    const k = Math.min(1, t);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  })();
}

// Chuva de brilhos (subir de nível / chefe)
function spawnConfetti(n) {
  const pieces = ["✨", "⭐", "🌟", "💫"];
  for (let i = 0; i < n; i++) {
    const s = document.createElement("div");
    s.className = "confetti";
    s.textContent = pieces[i % pieces.length];
    s.style.left = (Math.random() * 100) + "vw";
    s.style.animationDuration = (1.6 + Math.random() * 1.4) + "s";
    s.style.animationDelay = (Math.random() * 0.8) + "s";
    s.style.fontSize = (0.9 + Math.random() * 1) + "rem";
    s.addEventListener("animationend", function () { s.remove(); });
    document.body.appendChild(s);
  }
}

function showVictoryScreen(rewards, wasBoss) {
  hideAllScreens();
  document.getElementById("victoryScreen").classList.remove("hidden");

  // Linhas de recompensa entram uma a uma; XP e Cobre "contam" até o valor.
  let n = 0;
  const line = function (html, cls) { return '<div class="reward-line reward-anim ' + (cls || "") + '" style="animation-delay:' + (0.55 + 0.35 * n++) + 's">' + html + '</div>'; };
  let rewardsHtml =
    line('✨ +<span class="count-up" data-to="' + rewards.xpGain + '">0</span> XP') +
    line('🪙 +<span class="count-up" data-to="' + rewards.goldGain + '">0</span> Moedas de Cobre');

  if (rewards.lostItem) {
    rewardsHtml += line('🎒 Mochila cheia! Não coube: ' + rewards.lostItem.icon + ' ' + rewards.lostItem.name);
  }
  if (rewards.droppedItem) {
    rewardsHtml += line(rewards.droppedItem.icon + ' Encontrou: ' + rewards.droppedItem.name, "item-found");
  }
  if (rewards.leveledUp) {
    rewardsHtml += line('🎉 Subiu para o nível ' + rewards.newLevel + '! (+' + (rewards.levelsGained || 1) * levelEssence() + ' 💎 Essência Arcana)', "level-up level-up-glow");
  }

  document.getElementById("victoryRewards").innerHTML = rewardsHtml;
  document.querySelectorAll("#victoryRewards .count-up").forEach(function (el, i) { countUpTo(el, Number(el.dataset.to), 700, 550 + 350 * i); });
  if (rewards.leveledUp || wasBoss) spawnConfetti(rewards.leveledUp ? 36 : 22);

  const actions = document.getElementById("victoryActions");
  if (wasBoss) {
    actions.innerHTML = '<button class="zone-btn" style="grid-column:span 2;" onclick="openMap()"><span class="zicon">🗺️</span>Mapa</button>';
  } else {
    actions.innerHTML =
      '<button class="zone-btn" onclick="openHuntSelect(huntLocationId)"><span class="zicon">🗡️</span>Caçar Novamente</button>' +
      '<button class="zone-btn" onclick="openMap()"><span class="zicon">🗺️</span>Mapa</button>';
  }
}

const DEFEAT_MS = 5 * 60 * 1000; // 5 minutos

const DEFEAT_SKIP_COST = 5; // Essência Arcana para reviver na hora (1 Essência por minuto de espera)

function loseCombat() {
  if (combat && combat.tower) { towerFail(); return; }
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
    skipBtn.textContent = "💎 Reviver agora (" + DEFEAT_SKIP_COST + " Essência)";
    skipBtn.disabled = state.essence < DEFEAT_SKIP_COST;
  }
}

async function skipDefeatWithEssence() {
  if (state.essence < DEFEAT_SKIP_COST) {
    log("Essência insuficiente para reviver agora.");
    return;
  }
  if (cloudEnabled()) {
    if (!(await walletSpend("revive"))) return; // o servidor desconta a Essência
  } else {
    state.essence -= DEFEAT_SKIP_COST; // teste fora do Telegram
  }
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
