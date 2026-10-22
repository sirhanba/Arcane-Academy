// ============================================================
// transmuta.js — Alquimista Zerak (Ruínas Antigas): troca N materiais iguais + taxa em Cobre por 1 material de nível acima.
// Instantâneo, sem limite diário e sem troca reversa.
// ============================================================
const TRANSMUTES = [
  { from: "poeira_de_osso",    qty: 6,  fee: 100,  to: "essencia_sombria" },
  { from: "gota_agua_pura",    qty: 6,  fee: 100,  to: "escama_brilhante" },
  { from: "po_estelar",        qty: 6,  fee: 100,  to: "fragmento_quartzo" },
  { from: "essencia_sombria",  qty: 5,  fee: 500,  to: "olho_gorgona" },
  { from: "escama_brilhante",  qty: 5,  fee: 500,  to: "sangue_dragao" },
  { from: "fragmento_quartzo", qty: 5,  fee: 500,  to: "coracao_elemental" },
  { from: "po_estelar",        qty: 10, fee: 200,  to: "cristal_arcano" },
  { from: "cristal_arcano",    qty: 10, fee: 1000, to: "pena_fenix" }
];

function tmItem(id) { return ITEMS.find(i => i.id === id) || { name: id, icon: "📦" }; }

function openTransmute() {
  if (isDefeated()) { showDefeatScreen(0); return; }
  hideAllScreens();
  document.getElementById("transmutaScreen").classList.remove("hidden");
  renderTransmute();
}

function renderTransmute() {
  const list = document.getElementById("transmutaList");
  list.innerHTML = "";
  TRANSMUTES.forEach((t, i) => {
    const a = tmItem(t.from), b = tmItem(t.to), have = state.inventory[t.from] || 0;
    const ok = have >= t.qty && state.gold >= t.fee;
    const row = document.createElement("div");
    row.className = "upgrade-row";
    row.innerHTML =
      '<span class="upgrade-icon">' + b.icon + '</span>' +
      '<div class="upgrade-info"><div class="uname">' + t.qty + '× ' + a.icon + ' ' + a.name + ' → 1× ' + b.icon + ' ' + b.name + '</div>' +
      '<div class="udesc">🪙 ' + t.fee.toLocaleString("pt-BR") + ' · Você tem ' + have + '</div></div>' +
      '<button class="upgrade-buy" ' + (ok ? "" : "disabled ") + 'onclick="doTransmute(' + i + ')">Trocar</button>';
    list.appendChild(row);
  });
}

function doTransmute(i) {
  const t = TRANSMUTES[i];
  if (!t) return;
  if ((state.inventory[t.from] || 0) < t.qty) { showToast("Você não tem " + t.qty + "× " + tmItem(t.from).name + "."); return; }
  if (state.gold < t.fee) { showToast("Cobre insuficiente para a taxa."); return; }
  const needSlot = state.inventory[t.to] > 0 ? 0 : 1;
  const freed = state.inventory[t.from] === t.qty && t.from !== t.to ? 1 : 0;
  if (needSlot > bagFree() + freed) { showToast("🎒 Mochila cheia! Libere espaço para receber o material."); return; }
  state.inventory[t.from] -= t.qty;
  if (state.inventory[t.from] <= 0) delete state.inventory[t.from];
  state.gold -= t.fee;
  state.inventory[t.to] = (state.inventory[t.to] || 0) + 1;
  saveState();
  render();
  renderTransmute();
  showToast("⚗️ Transmutou: +1 " + tmItem(t.to).name);
}
