// ============================================================
// quests.js — NPCs de missão. Cada local tem vários NPCs; cada NPC dá UMA missão de objetivo único,
// que o jogador pode fazer uma única vez.
// ============================================================

// Tipos de objetivo (exatamente um por missão):
//   hunt    — derrotar `count` monstros do tipo `target` (id do monstro em LOCATION_MONSTERS; `label` = nome no plural)
//   collect — entregar `count` unidades do material `target` (id em ITEMS); elas saem da mochila
//   craft   — entregar 1 equipamento `target` (id em GEAR, fora do corpo); ele sai da mochila. Com `secondary: "stat"`, precisa ter esse atributo secundário
//   boss    — derrotar `count` vezes o chefe `target` (id do chefe em LOCATION_BOSSES)
//   marathon— derrotar monstros de vários mapas: `targets: [{ target, count, label }]`
// `epic: true` = missão épica: só abre depois de cumprir todas as outras do local; `reward.items` = materiais raros de prêmio
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
    { id: "cavernas_e1", npcName: "Capataz Brogar", say: "O Monstro de Magma Estagnado reaquece as paredes da mina toda vez que o derrubamos... só uma surra repetida faz ele recuar. Derrote-o três vezes e a mina volta a ser nossa.", epic: true, type: "boss", target: "patriarca_das_cavernas", count: 3, label: "Monstro de Magma Estagnado", reward: { xp: 400, gold: 280, items: {"cristal_arcano": 5} } },
  ],
  lago: [
    { id: "lago_1", npcName: "Pescador Jonas", say: "Os Peixes Abissais estão atacando minhas redes e assustando a fauna do lago.", type: "hunt", target: "peixe_abissal", count: 6, label: "Peixes Abissais", reward: { xp: 50, gold: 30 } },
    { id: "lago_2", npcName: "Alquimista d'Água Marina", say: "A água pura deste lago é essencial para elixires avançados. Colete algumas gotas para mim.", type: "collect", target: "gota_agua_pura", count: 5, reward: { xp: 70, gold: 45 } },
    { id: "lago_3", npcName: "Guarda Costeiro Eric", say: "O canto das Sereias Corrompidas está desorientando os viajantes. Silencie algumas delas.", type: "hunt", target: "sereia_corrompida", count: 4, label: "Sereias Corrompidas", reward: { xp: 90, gold: 60 } },
    { id: "lago_4", npcName: "Colecionador de Relíquias", say: "As escamas dessas criaturas do lago brilham como joias. Traga-me algumas para minha coleção.", type: "collect", target: "escama_brilhante", count: 3, reward: { xp: 100, gold: 70 } },
    { id: "lago_e1", npcName: "Joalheira Marisa", say: "Quero um colar de ametista runada que traga sorte a quem o usa, e não aceito um qualquer: ele precisa carregar o encanto da Sorte. Forje até sair um assim.", epic: true, type: "craft", target: "colar_ametista", count: 1, secondary: "luck", reward: { xp: 450, gold: 320, items: {"pena_fenix": 3} } },
  ],
  ruinas: [
    { id: "ruinas_1", npcName: "Arqueólogo Corvin", say: "Esqueletos Guerreiros estão vagando pelos corredores do templo antigo. Elimine-os!", type: "hunt", target: "esqueleto_guerreiro", count: 6, label: "Esqueletos Guerreiros", reward: { xp: 100, gold: 70 } },
    { id: "ruinas_2", npcName: "Pesquisador Necromântico", say: "A poeira dos ossos dos mortos-vivos das ruínas retém resquícios de magia antiga. Traga-me amostras.", type: "collect", target: "poeira_de_osso", count: 6, reward: { xp: 110, gold: 75 } },
    { id: "ruinas_3", npcName: "Caçador de Espectros", say: "Os Magos Fantasmas continuam guardando as salas do tesouro. Precisamos destruí-los.", type: "hunt", target: "mago_fantasma", count: 4, label: "Magos Fantasmas", reward: { xp: 130, gold: 90 } },
    { id: "ruinas_4", npcName: "Mestre Templário", say: "Para explorar as profundezas das ruínas, nossa expedição precisa de vestes mágicas reforçadas.", type: "craft", target: "tunica_tecelao", count: 1, reward: { xp: 160, gold: 110 } },
    { id: "ruinas_e1", npcName: "Capitão Desertor Aldous", say: "O Rei Esqueleto Esquecido se levanta toda vez que o enterramos. Quebre a coroa dele três vezes e talvez ele aprenda a ficar deitado.", epic: true, type: "boss", target: "rei_esqueleto", count: 3, label: "Rei Esqueleto Esquecido", reward: { xp: 600, gold: 420, items: {"olho_gorgona": 1} } },
    { id: "ruinas_e2", npcName: "Tecelã Ônix", say: "Procuro uma Túnica do Tecelão Astral tecida com a graça da Esquiva. Não serve qualquer uma: ela precisa ter esse dom. Forje até conseguir.", epic: true, type: "craft", target: "tunica_tecelao", count: 1, secondary: "dodge", reward: { xp: 650, gold: 450, items: {"sangue_dragao": 1} } },
  ],
  biblioteca: [
    { id: "biblioteca_1", npcName: "Bibliotecário Thaddeus", say: "Livros Malditos Voadores estão rasgando seções históricas nas prateleiras superiores!", type: "hunt", target: "livro_maldito", count: 6, label: "Livros Malditos Voadores", reward: { xp: 70, gold: 45 } },
    { id: "biblioteca_2", npcName: "Arquivista Ezra", say: "Preciso de essência sombria para restaurar os tomos de magia proibida corroídos pelo tempo.", type: "collect", target: "essencia_sombria", count: 3, reward: { xp: 100, gold: 65 } },
    { id: "biblioteca_3", npcName: "Guardião dos Tomos", say: "As Gárgulas de Tomo estão destruindo as colunas da biblioteca. Contenha a ameaça!", type: "hunt", target: "gargula_de_tomo", count: 5, label: "Gárgulas de Tomo", reward: { xp: 120, gold: 80 } },
    { id: "biblioteca_4", npcName: "Estudioso Arcano", say: "Estou catalogando anéis mágicos e preciso de um modelo artesanal para finalizar meus estudos.", type: "craft", target: "anel_latao", count: 1, reward: { xp: 140, gold: 95 } },
    { id: "biblioteca_e1", npcName: "Mestre Cartógrafo Ilmar", say: "Meu mapa dos corredores só fica completo se eu souber o que vaga entre a Biblioteca e as Ruínas. Elimine as Gárgulas de Tomo e os Esqueletos Guerreiros e eu lhe pago em raridade.", epic: true, type: "marathon", targets: [{"target": "gargula_de_tomo", "count": 6, "label": "Gárgulas de Tomo"}, {"target": "esqueleto_guerreiro", "count": 6, "label": "Esqueletos Guerreiros"}], reward: { xp: 500, gold: 350, items: {"olho_gorgona": 1} } },
  ],
  cristais: [
    { id: "cristais_1", npcName: "Minador Caelen", say: "Os Escaravelhos Cristalinos estão devorando as jazidas de minério da região!", type: "hunt", target: "escaravelho_cristalino", count: 6, label: "Escaravelhos Cristalinos", reward: { xp: 90, gold: 60 } },
    { id: "cristais_2", npcName: "Lapidador de Gemas", say: "Preciso de fragmentos de quartzo de alta pureza para lapidar novos focos mágicos.", type: "collect", target: "fragmento_quartzo", count: 5, reward: { xp: 120, gold: 85 } },
    { id: "cristais_3", npcName: "Guardião Prismático", say: "Os Elementais de Quartzo ficaram agressivos devido às tempestades de mana. Derrote-os.", type: "hunt", target: "elemental_de_quartzo", count: 5, label: "Elementais de Quartzo", reward: { xp: 150, gold: 105 } },
    { id: "cristais_4", npcName: "Joalheiro do Vale", say: "Preciso de um colar encantado capaz de canalizar a energia vibracional dos cristais.", type: "craft", target: "amuleto_pedras", count: 1, reward: { xp: 180, gold: 130 } },
    { id: "cristais_e1", npcName: "Cartógrafa de Brilhos Lyra", say: "Os cristais do Vale reagem aos bichos que andam por perto. Para calibrar meu instrumento, preciso que você derrote Escaravelhos Cristalinos aqui e Morcegos Cristalinos nas Cavernas.", epic: true, type: "marathon", targets: [{"target": "escaravelho_cristalino", "count": 8, "label": "Escaravelhos Cristalinos"}, {"target": "morcego_cristalino", "count": 8, "label": "Morcegos Cristalinos"}], reward: { xp: 700, gold: 480, items: {"coracao_elemental": 1} } },
    { id: "cristais_e2", npcName: "Mago Prismático Orrin", say: "Quero estudar um Orbe da Neblina Mística com o dom do Crítico. Um orbe comum não me serve: ele precisa ter esse atributo. Forje até sair um.", epic: true, type: "craft", target: "orbe_neblina", count: 1, secondary: "crit", reward: { xp: 750, gold: 520, items: {"coracao_elemental": 1} } },
  ],
  pantano: [
    { id: "pantano_1", npcName: "Caçador das Brumas", say: "Os Lumefogos estão atraindo viajantes para os atoleiros. Elimine essas luzes enganosas.", type: "hunt", target: "lumefogo_enganoso", count: 5, label: "Lumefogos Fata Morgana", reward: { xp: 110, gold: 75 } },
    { id: "pantano_2", npcName: "Bruxa Mística Yaga", say: "Para minhas poções de maldição, preciso do óleo extraído dos olhos das górgonas.", type: "collect", target: "olho_gorgona", count: 2, reward: { xp: 170, gold: 120 } },
    { id: "pantano_3", npcName: "Mercenário do Pântano", say: "As Hidras dos Lodos estão bloqueando a passagem do comboio de suprimentos. Elimine-as!", type: "hunt", target: "hidra_dos_lodos", count: 4, label: "Hidras dos Lodos", reward: { xp: 190, gold: 135 } },
    { id: "pantano_4", npcName: "Alquimista Sombrio", say: "O Sangue de Dragão é um catalisador extremamente poderoso. Traga-me um frasco.", type: "collect", target: "sangue_dragao", count: 1, reward: { xp: 220, gold: 160 } },
    { id: "pantano_e1", npcName: "Anciã Murmuração", say: "A Matriarca das Hidras governa o pântano e engole quem passa. Derrote-a três vezes e as águas lembrarão quem manda aqui.", epic: true, type: "boss", target: "monstro_do_pantano", count: 3, label: "Matriarca das Hidras", reward: { xp: 900, gold: 600, items: {"olho_gorgona": 2} } },
    { id: "pantano_e2", npcName: "Feiticeira Selene da Lama", say: "Preciso de uma Capa da Penumbra que carregue Sorte, para as minhas barganhas com os espíritos. Só uma assim me interessa. Forje até acertar.", epic: true, type: "craft", target: "capa_penumbra", count: 1, secondary: "luck", reward: { xp: 950, gold: 650, items: {"sangue_dragao": 1} } },
    { id: "pantano_e3", npcName: "Barqueiro Nhoque", say: "Para abrir a rota entre o Pântano e o Lago preciso limpar as duas margens. Derrote as Hidras dos Lodos daqui e as Serpentes das Águas de lá.", epic: true, type: "marathon", targets: [{"target": "hidra_dos_lodos", "count": 8, "label": "Hidras dos Lodos"}, {"target": "serpente_das_aguas", "count": 8, "label": "Serpentes das Águas"}], reward: { xp: 1000, gold: 700, items: {"sangue_dragao": 2} } },
  ],
  picos: [
    { id: "picos_1", npcName: "Explorador dos Ventos", say: "Os Grifos das Tempestades estão atacando nossos postos de observação nas montanhas.", type: "hunt", target: "grifo_das_tempestades", count: 5, label: "Grifos das Tempestades", reward: { xp: 200, gold: 140 } },
    { id: "picos_2", npcName: "Mestre Elemental", say: "O núcleo de energia dos elementais das montanhas é valiosíssimo. Traga-me um coração elemental.", type: "collect", target: "coracao_elemental", count: 1, reward: { xp: 250, gold: 180 } },
    { id: "picos_3", npcName: "Guardião do Cume", say: "Os Elementais de Gelo estão congelando os caminhos até o topo da montanha. Destrua-os!", type: "hunt", target: "elemental_do_gelo", count: 5, label: "Elementais de Gelo", reward: { xp: 240, gold: 170 } },
    { id: "picos_4", npcName: "Armadureiro Gélido", say: "O vento nos picos rasga roupas comuns. Preciso de uma túnica reforçada para os guardas.", type: "craft", target: "manto_eclipse", count: 1, reward: { xp: 280, gold: 200 } },
    { id: "picos_e1", npcName: "Vigia dos Ventos Saori", say: "O Senhor dos Ventos Uivantes desvia as tempestades para cima do nosso posto. Enfrente-o três vezes até ele recuar.", epic: true, type: "boss", target: "patriarca_das_tempestades", count: 3, label: "Senhor dos Ventos Uivantes", reward: { xp: 1100, gold: 750, items: {"coracao_elemental": 2} } },
    { id: "picos_e2", npcName: "Astrônomo Zefiro", say: "Um Pendente do Sol Arcano com o dom da Penetração me permitiria alcançar o que os instrumentos comuns não alcançam. Forje um assim.", epic: true, type: "craft", target: "pendente_sol", count: 1, secondary: "penetration", reward: { xp: 1200, gold: 800, items: {"coracao_elemental": 2} } },
    { id: "picos_e3", npcName: "Mensageira das Nuvens Ayla", say: "Meus avisos precisam cruzar os Picos e o Vale sem ser rasgados no caminho. Derrote os Grifos das Tempestades daqui e os Elementais de Quartzo de lá.", epic: true, type: "marathon", targets: [{"target": "grifo_das_tempestades", "count": 8, "label": "Grifos das Tempestades"}, {"target": "elemental_de_quartzo", "count": 8, "label": "Elementais de Quartzo"}], reward: { xp: 1300, gold: 850, items: {"coracao_elemental": 1, "sangue_dragao": 1} } },
  ],
  catacumbas: [
    { id: "catacumbas_1", npcName: "Inquisidor Lucian", say: "Ghouls Famintos profanam os túmulos dos antigos magos. Extermine esses monstros!", type: "hunt", target: "ghoul_faminto", count: 6, label: "Ghouls Famintos", reward: { xp: 180, gold: 130 } },
    { id: "catacumbas_2", npcName: "Colecionador de Ossos", say: "Preciso de poeira de osso concentrada para realizar rituais de purificação nas tumbas.", type: "collect", target: "poeira_de_osso", count: 8, reward: { xp: 210, gold: 150 } },
    { id: "catacumbas_3", npcName: "Paladino do Templo", say: "Os Cavaleiros Remanescentes ainda guardam as catacumbas com suas espadas amaldiçoadas. Derrote-os!", type: "hunt", target: "cavaleiro_remanescente", count: 5, label: "Cavaleiros Remanescentes", reward: { xp: 260, gold: 190 } },
    { id: "catacumbas_4", npcName: "Mestre de Armas", say: "Para enfrentar as forças necromânticas, nossos paladinos precisam de cajados de batalha encantados.", type: "craft", target: "cajado_elementalista", count: 1, reward: { xp: 300, gold: 220 } },
    { id: "catacumbas_e1", npcName: "Sacerdote Cinzento Mortimer", say: "O Arquilich Milenar desperta toda noite e ergue tudo o que enterramos. Derrote-o três vezes e as tumbas terão paz por um tempo.", epic: true, type: "boss", target: "arquilich", count: 3, label: "Arquilich Milenar", reward: { xp: 1500, gold: 1000, items: {"olho_gorgona": 3} } },
    { id: "catacumbas_e2", npcName: "Armeira dos Mortos Vesna", say: "Quero o Cajado do Arcanista Supremo com o dom do Crítico para atingir o ponto fraco dos que não descansam. Forje até obter um assim.", epic: true, type: "craft", target: "cajado_arcanista", count: 1, secondary: "crit", reward: { xp: 1600, gold: 1100, items: {"sangue_dragao": 2} } },
    { id: "catacumbas_e3", npcName: "Coveiro-Mor Balthus", say: "Os mortos das Catacumbas e os das Ruínas se chamam uns aos outros. Calar um lado não basta: derrote os Ghouls Famintos daqui e os Esqueletos Guerreiros de lá.", epic: true, type: "marathon", targets: [{"target": "ghoul_faminto", "count": 8, "label": "Ghouls Famintos"}, {"target": "esqueleto_guerreiro", "count": 8, "label": "Esqueletos Guerreiros"}], reward: { xp: 1800, gold: 1200, items: {"coracao_elemental": 2, "olho_gorgona": 2} } },
  ]
};


let npcLocationId = "jardins";
let npcQuestId = null; // null = lista de NPCs do local; senão, a conversa com o NPC dessa missão

function questList(locId) { return QUESTS[locId] || []; }
function allQuests() { return Object.keys(QUESTS).reduce((a, loc) => a.concat(QUESTS[loc]), []); }
function questById(qid) { return allQuests().find(x => x.id === qid) || null; }

// Progresso de uma missão (cria o registro se ainda não existir): stage none | hunting (aceita) | ready (caça concluída) | done
function questProgress(qid) {
  if (!state.questProgress[qid]) state.questProgress[qid] = { stage: "none", kills: 0 };
  return state.questProgress[qid];
}

// Objetivos de contagem de abate (hunt/boss = 1; maratona = vários)
function questTargets(q) {
  if (q.type === "marathon") return q.targets;
  if (q.type === "hunt" || q.type === "boss") return [{ target: q.target, count: q.count, label: q.label }];
  return [];
}
function questKillsOf(q, t) {
  const p = questProgress(q.id);
  return q.type === "marathon" ? ((p.counts || {})[t.target] || 0) : p.kills;
}
function questKillsDone(q) { return questTargets(q).every(t => questKillsOf(q, t) >= t.count); }

function questAddKill(q, monsterId) {
  const p = questProgress(q.id);
  if (p.stage !== "hunting") return;
  if (q.type === "marathon") {
    const t = q.targets.find(x => x.target === monsterId);
    if (!t) return;
    if (!p.counts) p.counts = {};
    p.counts[monsterId] = Math.min(t.count, (p.counts[monsterId] || 0) + 1);
  } else {
    p.kills += 1;
  }
  if (questKillsDone(q)) p.stage = "ready";
}

// Chamado ao vencer um monstro (não chefe): conta para as missões de caça e maratona aceitas
function registerQuestKill(locId, monsterId) {
  allQuests().forEach(q => {
    if (q.type === "hunt" && q.target === monsterId) questAddKill(q, monsterId);
    else if (q.type === "marathon") questAddKill(q, monsterId);
  });
}
// Chamado ao vencer um chefe: conta para as missões de chefe aceitas
function registerBossKill(bossId) {
  allQuests().forEach(q => { if (q.type === "boss" && q.target === bossId) questAddKill(q, bossId); });
}

// Missão épica: só abre depois de cumprir todas as outras do mesmo local
function questLocked(q) {
  if (!q.epic) return false;
  for (const loc of Object.keys(QUESTS)) {
    if (!QUESTS[loc].includes(q)) continue;
    return QUESTS[loc].some(o => !o.epic && questProgress(o.id).stage !== "done");
  }
  return false;
}

// VIP recebe o dobro de XP e de Cobre nas missões (materiais não dobram)
function questXp(q) { return q.reward.xp * (isVip() ? 2 : 1); }
function questGold(q) { return q.reward.gold * (isVip() ? 2 : 1); }
function questRewardItems(q) { return q.reward.items || {}; }
function itemLabel(id) { const it = ITEMS.find(i => i.id === id); return it ? it.name : id; }

// Texto do objetivo
function questTargetName(q) {
  if (q.type === "collect") return itemLabel(q.target);
  if (q.type === "craft") {
    const d = gearDef(q.target);
    const sec = q.secondary ? " com secundário " + (STAT_LABELS[q.secondary] || [q.secondary])[0] : "";
    return (d ? d.name : q.target) + sec;
  }
  return q.label;
}
function questObjective(q) {
  if (q.type === "hunt") return "Caçar " + q.count + " " + q.label;
  if (q.type === "boss") return "Derrotar o chefe " + q.label + " " + q.count + " vezes";
  if (q.type === "marathon") return "Maratona: " + q.targets.map(t => t.count + " " + t.label).join(" + ");
  if (q.type === "collect") return "Entregar " + q.count + "× " + questTargetName(q);
  return "Entregar 1× " + questTargetName(q) + " (equipamento)";
}
function questIcon(q) {
  if (q.epic) return "⭐";
  if (q.type === "hunt") return "🗡️";
  if (q.type === "collect") { const it = ITEMS.find(i => i.id === q.target); return it ? it.icon : "📦"; }
  const d = gearDef(q.target); return d ? d.icon : "🛡️";
}
function questProgressText(q) {
  const p = questProgress(q.id);
  if (q.type === "boss" || q.type === "hunt") return p.kills + "/" + q.count;
  if (q.type === "marathon") return q.targets.map(t => questKillsOf(q, t) + "/" + t.count + " " + t.label).join(" · ");
  return Math.min(questHave(q), q.count) + "/" + q.count;
}

// Equipamento da missão que pode ser entregue (na mochila, não equipado, com o secundário pedido)
function questGearToDeliver(q) {
  return state.gearInventory.find(g => g.defId === q.target && !isGearEquipped(g.uid) &&
    (!q.secondary || (g.secondaries || []).some(s => s.stat === q.secondary))) || null;
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
  return p.stage === "hunting" && (q.type === "collect" || q.type === "craft") && questHave(q) >= q.count;
}
// Rótulo curto do estado, para a lista
function questStatus(q) {
  const p = questProgress(q.id);
  if (p.stage === "done") return { icon: "✔️", text: "Concluída", rank: 3 };
  if (p.stage === "none" && questLocked(q)) return { icon: "🔒", text: "Bloqueada", rank: 2 };
  if (questCanDeliver(q)) return { icon: "✅", text: "Pronta para entregar", rank: 0 };
  if (p.stage === "hunting") return { icon: "⏳", text: "Em andamento (" + questProgressText(q) + ")", rank: 1 };
  return { icon: "❗", text: "Nova missão", rank: 1 };
}

function renderQuestReward(q) {
  const box = document.getElementById("npcReward");
  if (questProgress(q.id).stage === "done") { box.classList.add("hidden"); return; }
  const mats = Object.keys(questRewardItems(q)).map(id => {
    const it = ITEMS.find(i => i.id === id);
    return '<div class="qr-line">' + (it ? it.icon : "📦") + ' ' + questRewardItems(q)[id] + '× ' + itemLabel(id) + '</div>';
  }).join("");
  box.innerHTML =
    '<div class="qr-title">🎁 Recompensa da missão</div>' +
    '<div class="qr-line">✨ ' + questXp(q) + ' XP' + (isVip() ? ' ⭐ (dobro VIP)' : '') + '</div>' +
    '<div class="qr-line">🪙 ' + questGold(q) + ' Moedas de Cobre' + (isVip() ? ' ⭐ (dobro VIP)' : '') + '</div>' + mats;
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
    row.className = "npc-row" + (e.st.rank === 3 ? " npc-done" : "") + (e.q.epic ? " npc-epic" : "");
    row.onclick = () => openNpcQuest(e.q.id);
    row.innerHTML =
      '<span class="npc-ico">' + questIcon(e.q) + '</span>' +
      '<span class="npc-info"><span class="npc-name">' + e.q.npcName + (e.q.epic ? ' <span class="npc-tag">⭐ Épica</span>' : '') + '</span>' +
      '<span class="npc-obj">' + (e.st.rank === 2 ? "Cumpra as outras missões deste local para liberar" : questObjective(e.q)) + '</span></span>' +
      '<span class="npc-st" title="' + e.st.text + '">' + e.st.icon + '</span>';
    list.appendChild(row);
  });
  document.getElementById("npcCard").classList.add("hidden");
  list.classList.remove("hidden");
}

function deliverQuest(q) {
  const p = questProgress(q.id);
  if (p.stage === "done" || !questCanDeliver(q) || (p.stage === "none" && questLocked(q))) return;
  // materiais de prêmio precisam caber na mochila (1 espaço por tipo que ainda não está nela)
  const rewardIds = Object.keys(questRewardItems(q));
  const needSlots = rewardIds.filter(id => !(state.inventory[id] > 0)).length;
  let freed = 0;
  if (q.type === "collect" && state.inventory[q.target] === q.count && !rewardIds.includes(q.target)) freed = 1;
  if (q.type === "craft") freed = 1;
  const missing = needSlots - bagFree() - freed;
  if (missing > 0) { showToast("🎒 Mochila cheia! Libere " + missing + " espaço(s) para receber os materiais."); return; }
  if (q.type === "collect") {
    state.inventory[q.target] -= q.count;
    if (state.inventory[q.target] <= 0) delete state.inventory[q.target];
  } else if (q.type === "craft") {
    const g = questGearToDeliver(q);
    state.gearInventory = state.gearInventory.filter(x => x.uid !== g.uid);
  }
  rewardIds.forEach(id => { state.inventory[id] = (state.inventory[id] || 0) + questRewardItems(q)[id]; });
  const gotXp = questXp(q), gotGold = questGold(q);
  state.gold += gotGold;
  state.xp += gotXp;
  p.stage = "done";
  addStat("quests"); // conquistas
  const levelsGained = checkLevelUp();
  saveState();
  const matTxt = rewardIds.map(id => ", +" + questRewardItems(q)[id] + " " + itemLabel(id)).join("");
  showToast("✅ Missão entregue! +" + gotXp + " XP, +" + gotGold + " moedas" + matTxt);
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
  document.getElementById("npcTitle").textContent = (q.epic ? "⭐ " : "📜 ") + q.npcName;
  document.getElementById("npcList").classList.add("hidden");
  document.getElementById("npcCard").classList.remove("hidden");
  const locked = p.stage === "none" && questLocked(q);
  document.getElementById("npcObjective").textContent = locked ? "🔒 Missão épica bloqueada" : "🎯 " + questObjective(q);
  renderQuestReward(q);

  if (locked) {
    dialogue.textContent = "Volte quando tiver cumprido as outras missões deste local. Só então confio um trabalho assim a você.";
    btn.textContent = "Bloqueada";
    btn.disabled = true;
  } else if (p.stage === "none") {
    dialogue.textContent = q.say;
    btn.textContent = "Aceitar Missão";
    btn.disabled = false;
    btn.onclick = () => { p.stage = "hunting"; p.kills = 0; p.counts = {}; saveState(); renderNpc(); };
  } else if (p.stage === "done") {
    dialogue.textContent = "Obrigado novamente pela ajuda. Essa missão você já cumpriu.";
    btn.textContent = "Missão concluída";
    btn.disabled = true;
  } else if (questCanDeliver(q)) {
    dialogue.textContent = (q.type === "hunt" || q.type === "boss" || q.type === "marathon") ? "Excelente trabalho! Aqui está sua recompensa."
      : "Era isso que eu precisava! Aqui está sua recompensa.";
    btn.textContent = "Entregar Missão";
    btn.disabled = false;
    btn.onclick = () => deliverQuest(q);
  } else if (q.type === "hunt" || q.type === "boss" || q.type === "marathon") {
    dialogue.textContent = "Progresso: " + questProgressText(q) + (q.type === "hunt" ? " " + q.label + " derrotados" : "") + ". Volte quando terminar.";
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
