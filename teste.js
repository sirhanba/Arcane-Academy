// ============================================================
// teste.js — SÓ PARA TESTES: botão flutuante "🧪 +1 nível".
// Ao usar, o jogo entra em MODO TESTE: nada é salvo (nem no aparelho, nem no servidor),
// para o servidor não detectar "alteração impossível". Fechar e abrir o jogo volta ao progresso real.
// Para remover o botão: tire "teste" da lista em game.html e apague este arquivo.
// ============================================================
(function () {
  let testMode = false;
  const realSave = saveState;
  saveState = function () { if (testMode) return; realSave(); };

  function enterTestMode() {
    if (testMode) return true;
    if (!confirm("Modo teste: o progresso NÃO será salvo enquanto a janela estiver aberta. Ao reabrir o jogo, volta ao normal. Continuar?")) return false;
    testMode = true;
    cloudReady = false; // nada é enviado ao servidor
    btn.textContent = "🧪 +1 nível (teste)";
    return true;
  }

  function levelUp() {
    if (!enterTestMode()) return;
    if (state.level >= MAX_LEVEL) { showToast("Nível máximo."); return; }
    state.xp = state.xpToNext;
    checkLevelUp();
    recalcStats();
    state.hp = state.hpMax; state.mana = state.manaMax;
    render();
    ["renderSkills", "renderSkillTree", "renderCharacter"].forEach(function (f) { if (typeof window[f] === "function") { try { window[f](); } catch (e) {} } });
    showToast("🧪 Nível " + state.level);
  }

  const btn = document.createElement("button");
  btn.textContent = "🧪 +1 nível";
  btn.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:9990;padding:6px 10px;font-size:0.72rem;border-radius:999px;border:1px solid #888;background:rgba(20,16,36,0.85);color:#fff;opacity:0.85;";
  btn.onclick = levelUp;
  document.body.appendChild(btn);
})();
