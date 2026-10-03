// ============================================================
// cloud.js — Salvamento na nuvem (Supabase): carrega o progresso ao abrir e salva em segundo plano.
// O servidor confere a conta do Telegram (initData); sem Telegram (teste no navegador) a nuvem fica desligada.
// ============================================================

const CLOUD_URL = "https://zhiiynrfhddmvzaqfmvf.supabase.co/functions/v1/sync";
const CLOUD_KEY = "sb_publishable_BX-QKzfEUQ66NV3O3AHSKA_S74EkX2U"; // chave pública (pode ficar no código)
const CLOUD_SAVE_DELAY_MS = 3000;

let cloudReady = false;       // só envia depois de comparar com o servidor
let cloudSaveTimer = null;
let cloudSaving = false;
let cloudDirty = false;

function cloudInitData() {
  return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) || "";
}

function cloudEnabled() {
  return !!cloudInitData();
}

async function cloudCall(action, extra, keepalive) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(CLOUD_URL, {
      method: "POST",
      keepalive: !!keepalive,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "apikey": CLOUD_KEY, "Authorization": "Bearer " + CLOUD_KEY },
      body: JSON.stringify(Object.assign({ initData: cloudInitData(), action: action }, extra || {}))
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Ao abrir o jogo: compara o save do servidor com o do aparelho e fica com o mais novo.
async function cloudInit() {
  if (!cloudEnabled()) { showToast("☁️ Nuvem desligada: sem dados do Telegram"); return; }
  try {
    const r = await cloudCall("load");
    const server = r.save;
    const localSavedAt = state.characterCreated ? (state.savedAt || 0) : -1;
    const serverHasGame = server && server.characterCreated;
    if (serverHasGame && (server.savedAt || 0) > localSavedAt) {
      // Servidor tem progresso mais novo (ou este aparelho está vazio): usa o do servidor.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(server));
      location.reload();
      return;
    }
    cloudReady = true;
    if (state.characterCreated && (!serverHasGame || localSavedAt > (server.savedAt || 0))) {
      await cloudPushNow();
    }
    showToast("☁️ Progresso sincronizado");
  } catch (e) {
    // Sem internet ou servidor fora: segue jogando localmente e tenta de novo ao voltar pro jogo.
    cloudReady = false;
    showToast("☁️ Erro na nuvem: " + (e && e.message ? e.message : e));
  }
}

function cloudScheduleSave() {
  if (!cloudEnabled() || !cloudReady || !state.characterCreated) return;
  cloudDirty = true;
  if (cloudSaveTimer) return;
  cloudSaveTimer = setTimeout(() => {
    cloudSaveTimer = null;
    cloudPushNow();
  }, CLOUD_SAVE_DELAY_MS);
}

async function cloudPushNow(keepalive) {
  if (!cloudEnabled() || !cloudReady || !state.characterCreated) return;
  if (cloudSaving) { cloudDirty = true; return; }
  cloudSaving = true;
  cloudDirty = false;
  try {
    await cloudCall("save", { save: state }, keepalive);
  } catch (e) {
    cloudDirty = true; // tenta de novo no próximo salvamento
  } finally {
    cloudSaving = false;
  }
  if (cloudDirty && !cloudSaveTimer) cloudScheduleSave();
}

// Ao sair/minimizar o jogo, envia na hora o que ainda não foi salvo.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    if (cloudSaveTimer) { clearTimeout(cloudSaveTimer); cloudSaveTimer = null; }
    if (cloudDirty) cloudPushNow(true);
  } else if (!cloudReady) {
    cloudInit();
  }
});
