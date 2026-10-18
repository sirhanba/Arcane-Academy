// ============================================================
// quests.js — NPCs de missão. Cada local tem vários NPCs; cada NPC dá UMA missão de objetivo único,
// que o jogador pode fazer uma única vez.
// ============================================================

// Tipos de objetivo (exatamente um por missão):
//   hunt    — derrotar `count` monstros do tipo `target` (id do monstro em LOCATION_MONSTERS; `label` = nome no plural)
//   collect — entregar `count` unidades do material `target` (id em ITEMS); elas saem da mochila
//   craft   — entregar 1 equipamento `target` (id em GEAR, fora do corpo); ele sai da mochila
// `id` identifica a missão no save (state.questProgress[id]). Os ids "jardins" e "floresta" são as missões antigas.
// Para criar uma missão nova: adicione uma linha no local certo, com um id que nunca se repita.
const QUESTS = {
  jardins: [
    { id: "jardins", npcName: "Mestre Aldric", say: "Aprendiz, os Jardins estão infestados de Ratos Arcanos. Derrote 3 deles e eu te recompenso bem.", type: "hunt", target: "rato_arcano", count: 3, label: "Ratos Arcanos", reward: { xp: 25, gold: 30 } },
    { id: "jardins_1", npcName: "Jardineiro Vane", say: "Os Ratos Arcanos estão roendo as raízes das minhas flores mágicas! Ajude-me a espantá-los.", type: "hunt", target: "rato_arcano", count: 5, label: "Ratos Arcanos", reward: { xp: 25, gold: 15 } },
    { id: "jardins_2", npcName: "Alquimista Aprendiz Clara", say: "Estou preparando poções simples de cura e preciso de ervas frescas dos jardins.", type: "collect", target: "erva_lunar", count: 3, reward: { xp: 20, gold: 10 } },
    { id: "jardins_3", npcName: "Patrulheiro Silas", say: "Os Corvos Selvagens estão atacando os alunos mais novos. Precisamos diminuir o número deles.", type: "hunt", target: "corvo_selvagem", count: 4, label: "Corvos Selvagens", reward: { xp: 35, gold: 20 } },
    { id: "jardins_4", npcName: "Artesã Mestra Elena", say: "Preciso de fibras resistentes para consertar os sacos de suprimentos da Academia.", type: "collect", target: "raiz_fibrosa", count: 4, reward: { xp: 40, gold: 25 } },
  ],
  floresta: [
    { id: "floresta", npcName: "Guarda-florestal Thalen", say: "Viajante, os lobos cinzentos andam atacando quem cruza a trilha. Derrote 5 deles e eu te recompenso bem.", type: "hunt", target: "lobo_cinzento", count: 5, label: "Lobos Cinzentos", reward: { xp: 80, gold: 70 } },
    { id: "floresta_1", npcName: "Caçador Grim", say: "Alcateias de Lobos Cinzentos foram vistas perto da trilha principal. Vá e elimine a ameaça.", type: "hunt", target: "lobo_cinzento", count: 6, label: "Lobos Cinzentos", reward: { xp: 55, gold: 30 } },
    { id: "floresta_2", npcName: "Botânica Alyssa", say: "A casca das árvores infectadas da floresta possui propriedades únicas. Traga-me algumas amostras.", type: "collect", target: "casca_bruta", count: 5, reward: { xp: 60, gold: 35 } },
    { id: "floresta_3", npcName: "Patrulheiro Kael", say: "Os Cogumelos Sombrios estão espalhando esporos tóxicos pela floresta. Destrua-os!", type: "hunt", target: "cogumelo_sombrio", count: 5, label: "Cogumelos Sombrios", reward: { xp: 75, gold: 45 } },
    { id: "floresta_4", npcName: "Armadureiro Boris", say: "Preciso de uma capa reforçada para me proteger do frio da noite na floresta. Fabrique uma para mim.", type: "craft", target: "capa_viajante", count: 1, reward: { xp: 90, gold: 60 } },
  ],
  cavernas: [
    { id: "cavernas_1", npcName: "Mineração Orin", say: "Os Morcegos Cristalinos não param de sobrevoar as picaretas dos meus trabalhadores. Elimine alguns!", type: "hunt", target: "morcego_cristalino", count: 5, label: "Morcegos Cristalinos", reward: { xp: 65, gold: 40 } },
    { id: "cavernas_2", npcName: "Gemólogo Torin", say: "Encontrei veias de minério raras, mas preciso de fragmentos brutos de quartzo para análise.", type: "collect", target: "fragmento_quartzo", count: 4, reward: { xp: 85, gold: 55 } },
    { id: "cavernas_3", npcName: "Guardião da Mina", say: "As Gárgulas Menores estão bloqueando a entrada do túnel oeste. Abra caminho!", type: "hunt", target: "gargula_menor", count: 4, label: "Gárgulas Menores", reward: { xp: 95, gold: 65 } },
    { id: "cavernas_4", npcName: "Ferreiro da Caverna", say: "Estou sem armas reservas no posto avançado das cavernas. Fabrique um cajado para nossa defesa.", type: "craft", target: "cajado_aprendiz", count: 1, reward: { xp: 110, gold: 80 } },
  ],
  lago: [
    { id: "lago_1", npcName: "Pescador Jonas", say: "Os Peixes Abissais estão atacando minhas redes e assustando a fauna do lago.", type: "hunt", target: "peixe_abissal", count: 6, label: "Peixes Abissais", reward: { xp: 50, gold: 30 } },
    { id: "lago_2", npcName: "Alquimista d'Água Marina", say: "A água pura deste lago é essencial para elixires avançados. Colete algumas gotas para mim.", type: "collect", target: "gota_agua_pura", count: 5, reward: { xp: 70, gold: 45 } },
    { id: "lago_3", npcName: "Guarda Costeiro Eric", say: "O canto das Sereias Corrompidas está desorientando os viajantes. Silencie algumas delas.", type: "hunt", target: "sereia_corrompida", count: 4, label: "Sereias Corrompidas", reward: { xp: 90, gold: 60 } },
    { id: "lago_4", npcName: "Colecionador de Relíquias", say: "As escamas dessas criaturas do lago brilham como joias. Traga-me algumas para minha coleção.", type: "collect", target: "escama_brilhante", count: 3, reward: { xp: 100, gold: 70 } },
  ],
  ruinas: [
    { id: "ruinas_1", npcName: "Arqueólogo Corvin", say: "Esqueletos Guerreiros estão vagando pelos corredores do templo antigo. Elimine-os!", type: "hunt", target: "esqueleto_guerreiro", count: 6, label: "Esqueletos Guerreiros", reward: { xp: 100, gold: 70 } },
    { id: "ruinas_2", npcName: "Pesquisador Necromântico", say: "A poeira dos ossos dos mortos-vivos das ruínas retém resquícios de magia antiga. Traga-me amostras.", type: "collect", target: "poeira_de_osso", count: 6, reward: { xp: 110, gold: 75 } },
    { id: "ruinas_3", npcName: "Caçador de Espectros", say: "Os Magos Fantasmas continuam guardando as salas do tesouro. Precisamos destruí-los.", type: "hunt", target: "mago_fantasma", count: 4, label: "Magos Fantasmas", reward: { xp: 130, gold: 90 } },
    { id: "ruinas_4", npcName: "Mestre Templário", say: "Para explorar as profundezas das ruínas, nossa expedição precisa de vestes mágicas reforçadas.", type: "craft", target: "tunica_tecelao", count: 1, reward: { xp: 160, gold: 110 } },
  ],
  biblioteca: [
    { id: "biblioteca_1", npcName: "Bibliotecário Thaddeus", say: "Livros Malditos Voadores estão rasgando seções históricas nas prateleiras superiores!", type: "hunt", target: "livro_maldito", count: 6, label: "Livros Malditos Voadores", reward: { xp: 70, gold: 45 } },
    { id: "biblioteca_2", npcName: "Arquivista Ezra", say: "Preciso de essência sombria para restaurar os tomos de magia proibida corroídos pelo tempo.", type: "collect", target: "essencia_sombria", count: 3, reward: { xp: 100, gold: 65 } },
    { id: "biblioteca_3", npcName: "Guardião dos Tomos", say: "As Gárgulas de Tomo estão destruindo as colunas da biblioteca. Contenha a ameaça!", type: "hunt", target: "gargula_de_tomo", count: 5, label: "Gárgulas de Tomo", reward: { xp: 120, gold: 80 } },
    { id: "biblioteca_4", npcName: "Estudioso Arcano", say: "Estou catalogando anéis mágicos e preciso de um modelo artesanal para finalizar meus estudos.", type: "craft", target: "anel_latao", count: 1, reward: { xp: 140, gold: 95 } },
  ],
  cristais: [
    { id: "cristais_1", npcName: "Minador Caelen", say: "Os Escaravelhos Cristalinos estão devorando as jazidas de minério da região!", type: "hunt", target: "escaravelho_cristalino", count: 6, label: "Escaravelhos Cristalinos", reward: { xp: 90, gold: 60 } },
    { id: "cristais_2", npcName: "Lapidador de Gemas", say: "Preciso de fragmentos de quartzo de alta pureza para lapidar novos focos mágicos.", type: "collect", target: "fragmento_quartzo", count: 5, reward: { xp: 120, gold: 85 } },
    { id: "cristais_3", npcName: "Guardião Prismático", say: "Os Elementais de Quartzo ficaram agressivos devido às tempestades de mana. Derrote-os.", type: "hunt", target: "elemental_de_quartzo", count: 5, label: "Elementais de Quartzo", reward: { xp: 150, gold: 105 } },
    { id: "cristais_4", npcName: "Joalheiro do Vale", say: "Preciso de um colar encantado capaz de canalizar a energia vibracional dos cristais.", type: "craft", target: "amuleto_pedras", count: 1, reward: { xp: 180, gold: 130 } },
  ],
  pantano: [
    { id: "pantano_1", npcName: "Caçador das Brumas", say: "Os Lumefogos estão atraindo viajantes para os atoleiros. Elimine essas luzes enganosas.", type: "hunt", target: "lumefogo_enganoso", count: 5, label: "Lumefogos Fata Morgana", reward: { xp: 110, gold: 75 } },
    { id: "pantano_2", npcName: "Bruxa Mística Yaga", say: "Para minhas poções de maldição, preciso do óleo extraído dos olhos das górgonas.", type: "collect", target: "olho_gorgona", count: 2, reward: { xp: 170, gold: 120 } },
    { id: "pantano_3", npcName: "Mercenário do Pântano", say: "As Hidras dos Lodos estão bloqueando a passagem do comboio de suprimentos. Elimine-as!", type: "hunt", target: "hidra_dos_lodos", count: 4, label: "Hidras dos Lodos", reward: { xp: 190, gold: 135 } },
    { id: "pantano_4", npcName: "Alquimista Sombrio", say: "O Sangue de Dragão é um catalisador extremamente poderoso. Traga-me um frasco.", type: "collect", target: "sangue_dragao", count: 1, reward: { xp: 220, gold: 160 } },
  ],
  picos: [
    { id: "picos_1", npcName: "Explorador dos Ventos", say: "Os Grifos das Tempestades estão atacando nossos postos de observação nas montanhas.", type: "hunt", target: "grifo_das_tempestades", count: 5, label: "Grifos das Tempestades", reward: { xp: 200, gold: 140 } },
    { id: "picos_2", npcName: "Mestre Elemental", say: "O núcleo de energia dos elementais das montanhas é valiosíssimo. Traga-me um coração elemental.", type: "collect", target: "coracao_elemental", count: 1, reward: { xp: 250, gold: 180 } },
    { id: "picos_3", npcName: "Guardião do Cume", say: "Os Elementais de Gelo estão congelando os caminhos até o topo da montanha. Destrua-os!", type: "hunt", target: "elemental_do_gelo", count: 5, label: "Elementais de Gelo", reward: { xp: 240, gold: 170 } },
    { id: "picos_4", npcName: "Armadureiro Gélido", say: "O vento nos picos rasga roupas comuns. Preciso de uma túnica reforçada para os guardas.", type: "craft", target: "manto_eclipse", count: 1, reward: { xp: 280, gold: 200 } },
  ],
  catacumbas: [
    { id: "catacumbas_1", npcName: "Inquisidor Lucian", say: "Ghouls Famintos profanam os túmulos dos antigos magos. Extermine esses monstros!", type: "hunt", target: "ghoul_faminto", count: 6, label: "Ghouls Famintos", reward: { xp: 180, gold: 130 } },
    { id: "catacumbas_2", npcName: "Colecionador de Ossos", say: "Preciso de poeira de osso concentrada para realizar rituais de purificação nas tumbas.", type: "collect", target: "poeira_de_osso", count: 8, reward: { xp: 210, gold: 150 } },
    { id: "catacumbas_3", npcName: "Paladino do Templo", say: "Os Cavaleiros Remanescentes ainda guardam as catacumbas com suas espadas amaldiçoadas. Derrote-os!", type: "hunt", target: "cavaleiro_remanescente", count: 5, label: "Cavaleiros Remanescentes", reward: { xp: 260, gold: 190 } },
    { id: "catacumbas_4", npcName: "Mestre de Armas", say: "Para enfrentar as forças necromânticas, nossos paladinos precisam de cajados de batalha encantados.", type: "craft", target: "cajado_elementalista", count: 1, reward: { xp: 300, gold: 220 } },
  ]
};

let npcLocationId = "jardins";
let npcQuestId = null; // null = lista de NPCs do local; senão, a conversa com o NPC dessa missão

function questList(locId) { return QUESTS[locId] || []; }
function questById(qid) {
  for (const loc of Object.keys(QUESTS)) {
    const q = QUESTS[loc].find(x => x.id === qid);
    if (q) return q;
  }
  return null;
}

// Progresso de uma missão (cria o registro se ainda não existir): stage none | hunting (aceita) | ready (caça concluída) | done
function questProgress(qid) {
  if (!state.questProgress[qid]) state.questProgress[qid] = { stage: "none", kills: 0 };
  return state.questProgress[qid];
}

// Chamado ao vencer um monstro (não chefe): conta para todas as missões de caça aceitas no local
function registerQuestKill(locId, monsterId) {
  questList(locId).forEach(q => {
    if (q.type !== "hunt" || q.target !== monsterId) return;
    const p = questProgress(q.id);
    if (p.stage !== "hunting") return;
    p.kills += 1;
    if (p.kills >= q.count) p.stage = "ready";
  });
}

// VIP recebe o dobro de XP e de Cobre nas missões
function questXp(q) { return q.reward.xp * (isVip() ? 2 : 1); }
function questGold(q) { return q.reward.gold * (isVip() ? 2 : 1); }

// Texto do objetivo
function questTargetName(q) {
  if (q.type === "hunt") return q.label;
  if (q.type === "collect") { const it = ITEMS.find(i => i.id === q.target); return it ? it.name : q.target; }
  const d = gearDef(q.target); return d ? d.name : q.target;
}
function questObjective(q) {
  if (q.type === "hunt") return "Caçar " + q.count + " " + q.label;
  if (q.type === "collect") return "Entregar " + q.count + "× " + questTargetName(q);
  return "Entregar 1× " + questTargetName(q) + " (equipamento)";
}
function questIcon(q) {
  if (q.type === "hunt") return "🗡️";
  if (q.type === "collect") { const it = ITEMS.find(i => i.id === q.target); return it ? it.icon : "📦"; }
  const d = gearDef(q.target); return d ? d.icon : "🛡️";
}

// Equipamento da missão que pode ser entregue (na mochila, não equipado)
function questGearToDeliver(q) {
  return state.gearInventory.find(g => g.defId === q.target && !isGearEquipped(g.uid)) || null;
}
// Quanto o jogador já tem para entregar (collect/craft)
function questHave(q) {
  if (q.type === "collect") return state.inventory[q.target] || 0;
  if (q.type === "craft") return questGearToDeliver(q) ? 1 : 0;
  return 0;
}
// Pode entregar agora?
function questCanDeliver(q) {
  const p = questProgress(q.id);
  if (p.stage === "ready") return true;
  return p.stage === "hunting" && q.type !== "hunt" && questHave(q) >= q.count;
}
// Rótulo curto do estado, para a lista
function questStatus(q) {
  const p = questProgress(q.id);
  if (p.stage === "done") return { icon: "✔️", text: "Concluída", rank: 3 };
  if (questCanDeliver(q)) return { icon: "✅", text: "Pronta para entregar", rank: 0 };
  if (p.stage === "hunting") {
    const prog = q.type === "hunt" ? p.kills + "/" + q.count : Math.min(questHave(q), q.count) + "/" + q.count;
    return { icon: "⏳", text: "Em andamento (" + prog + ")", rank: 1 };
  }
  return { icon: "❗", text: "Nova missão", rank: 1 };
}

function renderQuestReward(q) {
  const box = document.getElementById("npcReward");
  if (questProgress(q.id).stage === "done") { box.classList.add("hidden"); return; }
  box.innerHTML =
    '<div class="qr-title">🎁 Recompensa da missão</div>' +
    '<div class="qr-line">✨ ' + questXp(q) + ' XP' + (isVip() ? ' ⭐ (dobro VIP)' : '') + '</div>' +
    '<div class="qr-line">🪙 ' + questGold(q) + ' Moedas de Cobre' + (isVip() ? ' ⭐ (dobro VIP)' : '') + '</div>';
  box.classList.remove("hidden");
}

function openNpc(locId) {
  if (isDefeated()) { showDefeatScreen(0); return; }
  npcLocationId = locId || "jardins";
  npcQuestId = null;
  hideAllScreens();
  document.getElementById("npcScreen").classList.remove("hidden");
  renderNpc();
}

function npcBack() {
  if (npcQuestId) { npcQuestId = null; renderNpc(); }
  else openMap();
}

function openNpcQuest(qid) { npcQuestId = qid; renderNpc(); }

function renderNpcList() {
  const loc = LOCATIONS.find(l => l.id === npcLocationId);
  document.getElementById("npcBackBtn").textContent = "‹ Voltar ao mapa";
  document.getElementById("npcTitle").textContent = "📜 NPCs de Missão" + (loc ? " — " + loc.name : "");
  const list = document.getElementById("npcList");
  const items = questList(npcLocationId).map((q, i) => ({ q: q, i: i, st: questStatus(q) }))
    .sort((a, b) => a.st.rank - b.st.rank || a.i - b.i);
  list.innerHTML = "";
  items.forEach(e => {
    const row = document.createElement("button");
    row.className = "npc-row" + (e.st.rank === 3 ? " npc-done" : "");
    row.onclick = () => openNpcQuest(e.q.id);
    row.innerHTML =
      '<span class="npc-ico">' + questIcon(e.q) + '</span>' +
      '<span class="npc-info"><span class="npc-name">' + e.q.npcName + '</span>' +
      '<span class="npc-obj">' + questObjective(e.q) + '</span></span>' +
      '<span class="npc-st" title="' + e.st.text + '">' + e.st.icon + '</span>';
    list.appendChild(row);
  });
  document.getElementById("npcCard").classList.add("hidden");
  list.classList.remove("hidden");
}

function deliverQuest(q) {
  const p = questProgress(q.id);
  if (p.stage === "done" || !questCanDeliver(q)) return;
  if (q.type === "collect") {
    state.inventory[q.target] -= q.count;
    if (state.inventory[q.target] <= 0) delete state.inventory[q.target];
  } else if (q.type === "craft") {
    const g = questGearToDeliver(q);
    state.gearInventory = state.gearInventory.filter(x => x.uid !== g.uid);
  }
  const gotXp = questXp(q), gotGold = questGold(q);
  state.gold += gotGold;
  state.xp += gotXp;
  p.stage = "done";
  addStat("quests"); // conquistas
  const levelsGained = checkLevelUp();
  saveState();
  showToast("✅ Missão entregue! +" + gotXp + " XP, +" + gotGold + " moedas");
  if (levelsGained > 0) showToast("🎉 Subiu para o nível " + state.level + "! (+" + (levelsGained * levelEssence()) + " 💎 Essência)");
  render();
  renderNpc();
}

function renderNpc() {
  if (!npcQuestId) { renderNpcList(); return; }
  const q = questById(npcQuestId);
  if (!q) { npcQuestId = null; renderNpcList(); return; }
  const p = questProgress(q.id);
  const dialogue = document.getElementById("npcDialogue");
  const btn = document.getElementById("npcActionBtn");
  document.getElementById("npcBackBtn").textContent = "‹ Voltar aos NPCs";
  document.getElementById("npcTitle").textContent = "📜 " + q.npcName;
  document.getElementById("npcList").classList.add("hidden");
  document.getElementById("npcCard").classList.remove("hidden");
  document.getElementById("npcObjective").textContent = "🎯 " + questObjective(q);
  renderQuestReward(q);

  if (p.stage === "none") {
    dialogue.textContent = q.say;
    btn.textContent = "Aceitar Missão";
    btn.disabled = false;
    btn.onclick = () => { p.stage = "hunting"; p.kills = 0; saveState(); renderNpc(); };
  } else if (p.stage === "done") {
    dialogue.textContent = "Obrigado novamente pela ajuda. Essa missão você já cumpriu.";
    btn.textContent = "Missão concluída";
    btn.disabled = true;
  } else if (questCanDeliver(q)) {
    dialogue.textContent = q.type === "hunt" ? "Excelente trabalho! Aqui está sua recompensa."
      : "Era isso que eu precisava! Aqui está sua recompensa.";
    btn.textContent = "Entregar Missão";
    btn.disabled = false;
    btn.onclick = () => deliverQuest(q);
  } else if (q.type === "hunt") {
    dialogue.textContent = "Progresso: " + p.kills + " / " + q.count + " " + q.label + " derrotados. Volte quando terminar.";
    btn.textContent = "Voltar para caçar";
    btn.disabled = false;
    btn.onclick = () => openMap();
  } else {
    dialogue.textContent = "Você tem " + Math.min(questHave(q), q.count) + " / " + q.count + " — " + questTargetName(q) +
      (q.type === "craft" ? " (precisa estar na mochila, sem estar equipado)" : "") + ". Volte quando tiver tudo.";
    btn.textContent = "Entregar (ainda falta)";
    btn.disabled = true;
  }
}
