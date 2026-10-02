// ============================================================
// quests.js — NPCs de missão (quests), um por local.
// ============================================================

// Para criar a missão de um novo local, basta adicionar uma entrada aqui (chave = id do local em LOCATIONS).
// targetId = id do monstro (LOCATION_MONSTERS) que conta para a missão.
const QUESTS = {
  jardins: {
    npcName: "📜 Mestre Aldric",
    targetId: "rato_arcano", targetName: "Ratos Arcanos", goal: 3,
    intro: "Aprendiz, os Jardins estão infestados de Ratos Arcanos. Derrote 3 deles e eu te recompenso bem.",
    ready: "Excelente trabalho! Aqui está sua recompensa.",
    done: "Obrigado novamente pela ajuda, aprendiz. Volte sempre que precisar.",
    reward: { gold: 30, essence: 2, xp: 25 }
  },
  floresta: {
    npcName: "🏹 Guarda-florestal Thalen",
    targetId: "lobo_cinzento", targetName: "Lobos Cinzentos", goal: 5,
    intro: "Viajante, os lobos cinzentos andam atacando quem cruza a trilha. Derrote 5 deles e eu te recompenso bem.",
    ready: "Esses lobos não vão mais incomodar ninguém. Aqui está sua recompensa.",
    done: "A trilha está mais segura graças a você. Volte sempre que precisar.",
    reward: { gold: 70, essence: 3, xp: 80 }
  }
};

let npcLocationId = "jardins";

// Progresso da missão de um local (cria o registro se ainda não existir)
function questProgress(locId) {
  if (!state.questProgress[locId]) state.questProgress[locId] = { stage: "none", kills: 0 };
  return state.questProgress[locId];
}

// Chamado ao vencer um monstro (não chefe): conta para a missão do local, se for o alvo
function registerQuestKill(locId, monsterId) {
  const q = QUESTS[locId];
  if (!q) return;
  const p = questProgress(locId);
  if (p.stage !== "hunting" || monsterId !== q.targetId) return;
  p.kills += 1;
  if (p.kills >= q.goal) p.stage = "ready";
}

function renderQuestReward() {
  const q = QUESTS[npcLocationId];
  const box = document.getElementById("npcReward");
  if (questProgress(npcLocationId).stage === "done") { box.classList.add("hidden"); return; }
  box.innerHTML =
    '<div class="qr-title">🎁 Recompensa da missão</div>' +
    '<div class="qr-line">✨ ' + q.reward.xp + ' XP</div>' +
    '<div class="qr-line">🪙 ' + q.reward.gold + ' Moedas de Cobre</div>' +
    '<div class="qr-line">💎 ' + q.reward.essence + ' Essência Arcana</div>';
  box.classList.remove("hidden");
}

function openNpc(locId) {
  if (isDefeated()) { showDefeatScreen(0); return; }
  npcLocationId = locId || "jardins";
  hideAllScreens();
  document.getElementById("npcScreen").classList.remove("hidden");
  renderNpc();
}

function renderNpc() {
  const q = QUESTS[npcLocationId];
  const p = questProgress(npcLocationId);
  const dialogue = document.getElementById("npcDialogue");
  const btn = document.getElementById("npcActionBtn");
  document.querySelector("#npcScreen .zone-title").textContent = q.npcName;
  renderQuestReward();

  if (p.stage === "none") {
    dialogue.textContent = q.intro;
    btn.textContent = "Aceitar Missão";
    btn.disabled = false;
    btn.onclick = () => { p.stage = "hunting"; p.kills = 0; saveState(); renderNpc(); };
  } else if (p.stage === "hunting") {
    dialogue.textContent = "Progresso: " + p.kills + " / " + q.goal + " " + q.targetName + " derrotados. Volte quando terminar.";
    btn.textContent = "Voltar para caçar";
    btn.disabled = false;
    btn.onclick = () => openMap();
  } else if (p.stage === "ready") {
    dialogue.textContent = q.ready;
    btn.textContent = "Entregar Missão";
    btn.disabled = false;
    btn.onclick = () => {
      state.gold += q.reward.gold;
      state.essence += q.reward.essence;
      state.xp += q.reward.xp;
      p.stage = "done";
      const levelsGained = checkLevelUp();
      saveState();
      showToast("✅ Missão entregue! +" + q.reward.xp + " XP, +" + q.reward.gold + " moedas, +" + q.reward.essence + " Essência");
      if (levelsGained > 0) showToast("🎉 Subiu para o nível " + state.level + "! (+" + levelsGained + " 💎 Essência)");
      render();
      renderNpc();
    };
  } else {
    dialogue.textContent = q.done;
    btn.textContent = "Sem missões no momento";
    btn.disabled = true;
  }
}
