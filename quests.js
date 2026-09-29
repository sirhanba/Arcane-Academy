// ============================================================
// quests.js — NPCs de missão (quests).
// ============================================================

// ---------- NPC DE MISSÃO ----------

// Recompensa da missão "Ratos Arcanos" (mostrada na tela do NPC e entregue ao concluir)
const QUEST_REWARD = { gold: 30, essence: 2, xp: 25 };

function renderQuestReward() {
  const box = document.getElementById("npcReward");
  if (state.questStage === "done") { box.classList.add("hidden"); return; }
  box.innerHTML =
    '<div class="qr-title">🎁 Recompensa da missão</div>' +
    '<div class="qr-line">✨ ' + QUEST_REWARD.xp + ' XP</div>' +
    '<div class="qr-line">🪙 ' + QUEST_REWARD.gold + ' Moedas de Cobre</div>' +
    '<div class="qr-line">💎 ' + QUEST_REWARD.essence + ' Essência Arcana</div>';
  box.classList.remove("hidden");
}

function openNpc() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("npcScreen").classList.remove("hidden");
  renderNpc();
}

function renderNpc() {
  const dialogue = document.getElementById("npcDialogue");
  const btn = document.getElementById("npcActionBtn");
  renderQuestReward();

  if (state.questStage === "none") {
    dialogue.textContent = 'Aprendiz, os Jardins estão infestados de Ratos Arcanos. Derrote 3 deles e eu te recompenso bem.';
    btn.textContent = "Aceitar Missão";
    btn.disabled = false;
    btn.onclick = () => { state.questStage = "hunting"; state.questKills = 0; saveState(); renderNpc(); };
  } else if (state.questStage === "hunting") {
    dialogue.textContent = "Progresso: " + state.questKills + " / 3 Ratos Arcanos derrotados. Volte quando terminar.";
    btn.textContent = "Voltar para caçar";
    btn.disabled = false;
    btn.onclick = () => openMap();
  } else if (state.questStage === "ready") {
    dialogue.textContent = "Excelente trabalho! Aqui está sua recompensa.";
    btn.textContent = "Entregar Missão";
    btn.disabled = false;
    btn.onclick = () => {
      state.gold += QUEST_REWARD.gold;
      state.essence += QUEST_REWARD.essence;
      state.xp += QUEST_REWARD.xp;
      state.questStage = "done";
      saveState();
      showToast("✅ Missão entregue! +" + QUEST_REWARD.xp + " XP, +" + QUEST_REWARD.gold + " moedas, +" + QUEST_REWARD.essence + " Essência");
      render();
      renderNpc();
    };
  } else {
    dialogue.textContent = "Obrigado novamente pela ajuda, aprendiz. Volte sempre que precisar.";
    btn.textContent = "Sem missões no momento";
    btn.disabled = true;
  }
}
