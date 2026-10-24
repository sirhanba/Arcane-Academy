// ---------- ENCICLOPÉDIA ----------
// 6ª aba do jogo. Duas abas internas: "Guia" (textos explicativos em acordeão)
// e "Bestiário" (registro de monstros — "Em breve", será criado depois da Fase 2).
// Os textos do Guia também serão reaproveitados no tutorial inicial.
// Os textos são estáticos (escritos por nós, não vêm de outros jogadores), por isso usam innerHTML.
// ATENÇÃO: valores citados aqui (preços em Essência, custos, bônus) precisam ser
// atualizados à mão se mudarem no jogo (inventory.js, map.js, outcome.js, pix.js, forge.js, servidor).

const ENC_GUIDE = [
  {
    id: "primeiros_passos",
    icon: "🧭",
    title: "Primeiros passos",
    html:
      "<p><b>Seu objetivo:</b> subir de nível (máx. 50), ficar mais forte e dominar os locais do mapa.</p>" +
      "<ul>" +
      "<li><b>Mapa:</b> toque num local para ver o que há nele. Viajar leva <b>1 minuto</b> (VIP: instantâneo, ou pague 2 💎 para chegar agora).</li>" +
      "<li><b>Caçar:</b> em locais com monstros, escolha o monstro. Cada vitória dá XP, Cobre e, às vezes, um material.</li>" +
      "<li><b>Missões:</b> só com o NPC do local. Dão Cobre e XP.</li>" +
      "<li><b>Mercadores:</b> compram e vendem poções e materiais. Equipamentos só se vendem na Vila dos Mercadores.</li>" +
      "<li><b>Nível:</b> o primeiro nível custa 50 XP, e cada nível seguinte pede 25% a mais (Nv.2→3 ≈ 63 XP). Cada nível cura você por completo.</li>" +
      "<li><b>Habilidades:</b> você ganha 1 ponto por nível (nível − 1). A árvore começa na Seta Arcana, que exige Nível 3.</li>" +
      "<li><b>Casa:</b> dá um bônus permanente (veja “Como funcionam os atributos”).</li>" +
      "</ul>"
  },
  {
    id: "combate",
    icon: "⚔️",
    title: "Como funciona o combate",
    html:
      "<p>O combate é por turnos. No seu turno você escolhe uma ação:</p>" +
      "<ul>" +
      "<li><b>⚔️ Atacar:</b> dano básico.</li>" +
      "<li><b>🔮 Habilidades:</b> gastam Mana e dão efeitos mais fortes.</li>" +
      "<li><b>🧪 Poção:</b> cura HP ou Mana, mas <b>gasta o seu turno</b>.</li>" +
      "<li><b>🏃 Fugir:</b> sai da batalha, sem custo.</li>" +
      "</ul>" +
      "<p><b>Bandos:</b> alguns monstros aparecem em grupo, de <b>2 a 4 inimigos</b> do mesmo tipo (quantidade sorteada ao enfrentar). Cada um é mais fraco que o monstro solo, mas <b>todos atacam a cada turno</b>. Toque num inimigo para escolhê-lo como alvo. XP e Cobre são somados de todos, o drop é 1 sorteio por luta, e cada inimigo morto conta para as missões.</p>" +
      "<p><b>Feitiços em área</b> (Explosão Arcana, Descarga Eletrostática, Lança de Gelo e Maldição da Ruína) atingem vários inimigos de uma vez. Contra um inimigo só, causam o dano normal.</p>" +
      "<p><b>Dano que você causa:</b> <code>Ataque − Defesa do inimigo × (1 − Penetração%)</code>, no mínimo 1.</p>" +
      "<ul>" +
      "<li>Ataque 20 contra Defesa 2: <b>18</b>.</li>" +
      "<li>Com 50% de Penetração: 20 − 2 × 0,5 = <b>19</b>.</li>" +
      "<li><b>Crítico:</b> dobra o dano. Com 18, o crítico dá <b>36</b>.</li>" +
      "<li><b>Habilidade:</b> a Seta Arcana causa Ataque × 1,2 + 5. Com Ataque 20, são 29, menos a Defesa do inimigo (2), igual a <b>27</b>.</li>" +
      "</ul>" +
      "<p><b>Dano que você recebe:</b> <code>Ataque do inimigo − sua Defesa</code>, no mínimo 1 (às vezes +1).</p>" +
      "<ul>" +
      "<li>Lobo (Ataque 7) contra Defesa 3: <b>4 de dano</b>.</li>" +
      "<li>Se sua Defesa for maior que o ataque dele, você leva <b>1</b>.</li>" +
      "</ul>" +
      "<p><b>Esquiva:</b> monstros também têm. Um ataque ou feitiço esquivado não causa dano. Buffs e debuffs ainda funcionam.</p>" +
      "<p><b>Fim de cada rodada:</b> você recupera HP e Mana (Regen), e os efeitos ativos passam um turno.</p>" +
      "<p><b>Derrota:</b> você perde o Cobre que ganharia na vitória e espera <b>5 minutos</b> para reviver na Academia. Para pular a espera, pague <b>5 💎</b>.</p>"
  },
  {
    id: "atributos",
    icon: "📊",
    title: "Como funcionam os atributos",
    html:
      "<p class=\"enc-tip\">💡 Tocar num atributo na aba <b>Personagem</b> também mostra a explicação dele.</p>" +
      "<p>Cada atributo é <b>base (do nível) + bônus (equipamentos, habilidades, casa)</b>.</p>" +
      "<ul>" +
      "<li><b>Ataque:</b> base <code>4 + (nível − 1)</code>. Total = (base + equip. + habilidades + Amuleto) × (1 + bônus da casa).<br>Exemplo, Nv.10 da Vaelunna: (13 + 5 + 6 + 2) × 1,10 = <b>28,6</b>.</li>" +
      "<li><b>Defesa:</b> base <code>1 + (nível − 1) ÷ 2</code>, arredondado para baixo. No Nv.10: 5.</li>" +
      "<li><b>HP máx.:</b> base <code>30 + 5 por nível</code>. No Nv.10: 75.</li>" +
      "<li><b>Mana máx.:</b> base <code>10 + 3 por nível</code>. No Nv.10: 37.</li>" +
      "<li><b>Crítico:</b> base 5%. Equipamento, habilidades e casa somam. Com +4% de equip. e +2% de habilidade, o total é 11%.</li>" +
      "<li><b>Esquiva:</b> base 3%, <b>máximo 50%</b>.</li>" +
      "<li><b>Penetração:</b> ignora parte da Defesa do inimigo, <b>máximo 70%</b>.</li>" +
      "<li><b>Regen HP/Mana:</b> recuperação por rodada de combate. A base é 2 de HP e 1 de Mana.</li>" +
      "<li><b>Sorte:</b> vem só de equipamentos, <b>máximo 100%</b>. Aumenta a chance de drop de material: <code>chance × (1 + Sorte%)</code>.<br>" +
      "Cristal Arcano com 25% de chance e Sorte 40%: 25 × 1,4 = <b>35%</b>.<br>" +
      "O VIP multiplica a Sorte por 1,5. Com Sorte 40%, vira 60%, e a chance sobe para <b>40%</b>.</li>" +
      "</ul>" +
      "<p><b>Bônus das casas:</b></p>" +
      "<ul>" +
      "<li>🐺 Vaelunna: +10% de Ataque.</li>" +
      "<li>🦉 Noctivia: +15% de Mana máx. e +1 Regen de Mana.</li>" +
      "<li>🐍 Sibyra: +8% de Crítico.</li>" +
      "<li>🦌 Cervanthus: +15% de HP máx. e +1 Regen de HP.</li>" +
      "</ul>"
  },
  {
    id: "equipamentos",
    icon: "🔨",
    title: "Criação e status dos equipamentos",
    html:
      "<p><b>Como obter:</b> monstros não dropam equipamentos. Você os <b>fabrica na aba Criação</b>, com materiais de caça e Cobre.</p>" +
      "<p><b>Slots (8):</b> chapéu, roupa, sapatos, capa, colar, anel, arma principal e arma secundária.</p>" +
      "<p><b>Armas:</b> o nome mostra o tipo: <b>(arma principal)</b>, <b>(arma secundária)</b> ou <b>(2 mãos)</b>.</p>" +
      "<p><b>Níveis do item:</b> Nv.1, Nv.5 e Nv.10. O nível só <b>trava o equipar</b>. Você pode fabricar antes de ter o nível.</p>" +
      "<p><b>Status sorteados (RNG):</b> cada peça fabricada é única.</p>" +
      "<ul>" +
      "<li><b>Atributo principal:</b> sorteado dentro de ±30% do valor-base. Com base 10, sai entre <b>7 e 13</b>.</li>" +
      "<li><b>Atributos secundários:</b> sorteados, sem repetir entre si, de uma lista do item. Nv.1 tem <b>1</b>, Nv.5 tem <b>2</b> e Nv.10 tem <b>3</b>.</li>" +
      "<li><b>Variações (armas):</b> cada arma tem 4 versões por nível, com o mesmo atributo principal e secundários diferentes: <b>💥 Canhão de vidro</b> (Crítico, Penetração, Ataque), <b>🔮 Mago de mana</b> (Mana, Regen de Mana), <b>🛡️ Tanque</b> (HP, Defesa, Regen de HP) e <b>🍀 Farmer</b> (Sorte, Regen de HP, Mana). Um secundário pode repetir o atributo principal do item.</li>" +
      "<li><b>Cajado:</b> arma de 2 mãos. Tem 2 principais (Ataque e Defesa) e ocupa <b>as duas vagas de arma</b>.</li>" +
      "</ul>" +
      "<p><b>Custos de fabricação:</b></p>" +
      "<ul>" +
      "<li>Nv.1: 2 Erva + 1 Pó + 20 Cobre.</li>" +
      "<li>Nv.5: 3 Erva + 2 Pó + 1 Cristal + 60 Cobre.</li>" +
      "<li>Nv.10: 4 Erva + 3 Pó + 2 Cristal + 1 Pena + 140 Cobre.</li>" +
      "</ul>" +
      "<p><b>Venda:</b> só na Vila dos Mercadores. Nv.1 vale 50 Cobre, Nv.5 vale 100 e Nv.10 vale 200.</p>" +
      "<p><b>Mochila:</b> começa com 20 espaços e cada peça ocupa 1. Cada espaço extra custa <b>5 💎</b>, sem limite.</p>"
  },
  {
    id: "forja",
    icon: "⚒️",
    title: "Forja: refazer atributos",
    html:
      "<p>Não gostou dos atributos sorteados? O <b>Mestre Garrun</b> refaz um atributo por vez, na <b>Forja da Academia</b>. Funciona em itens da mochila e em itens equipados.</p>" +
      "<ul>" +
      "<li><b>Atributo principal:</b> sorteia um novo valor dentro do mesmo intervalo do item. Pode melhorar ou piorar.<br>Exemplo: Varinha de Bordo, Ataque +10, intervalo 7 a 13. A forja pode dar +8 ou +13.</li>" +
      "<li><b>Atributo secundário:</b> troca aquele atributo por outro da lista do item, nunca repetindo os que o item já tem.<br>Exemplo: Mana +5 vira Crítico +2%.</li>" +
      "<li><b>Antes e depois:</b> você vê os dois resultados e escolhe <b>ficar com o novo</b> ou <b>manter o antigo</b>. O Cobre é gasto nos dois casos.</li>" +
      "</ul>" +
      "<p><b>Custo em Cobre</b> (atributo principal):</p>" +
      "<ul>" +
      "<li>Item Nv.1: 40. Item Nv.5: 120. Item Nv.10: 300.</li>" +
      "<li>Atributo secundário: <b>o dobro</b>.</li>" +
      "<li>Cada re-sorteio no <b>mesmo item</b> sobe o preço em 50% do valor base.</li>" +
      "</ul>" +
      "<p>Exemplo, item Nv.5: 1º re-sorteio do principal = 120, 2º = 180, 3º = 240. Um secundário no 1º re-sorteio custa 240.</p>"
  },
  {
    id: "bazar",
    icon: "🏪",
    title: "Bazar da Vila: vender para outros jogadores",
    html:
      "<p>Na <b>Vila dos Mercadores</b> fica o <b>Bazar da Vila</b>, onde os aventureiros compram e vendem <b>equipamentos</b> entre si. O pagamento é só em <b>Cobre</b> e os anúncios são <b>anônimos</b>.</p>" +
      "<ul>" +
      "<li><b>Vender:</b> escolha um equipamento da mochila (desequipe antes) e defina o preço que quiser, a partir de <b>100 Cobre</b>.</li>" +
      "<li><b>Taxa:</b> o Bazar fica com <b>5%</b> do valor quando o item é vendido.</li>" +
      "<li><b>Limite:</b> até <b>3 anúncios</b> ao mesmo tempo, cada um por <b>3 dias</b>. Você pode cancelar um anúncio quando quiser.</li>" +
      "<li><b>Não vendeu?</b> O equipamento volta para a mochila. Se ela estiver cheia, ele espera no Bazar até você liberar espaço.</li>" +
      "<li><b>Venda feita:</b> o Cobre cai na sua conta ao abrir o jogo e o bot manda um aviso para você conferir.</li>" +
      "<li><b>Comprar:</b> use os filtros de tipo e nível, e ordene por menor preço, maior preço ou mais recentes.</li>" +
      "</ul>"
  },
  {
    id: "estufa",
    icon: "🌱",
    title: "Estufa: plantar e colher materiais",
    html:
      "<p>Nos <b>Jardins da Academia</b> fica a <b>Estufa</b>, onde você transforma poucos materiais em muitos. A planta cresce <b>em tempo real</b>, mesmo com o jogo fechado, e espera por você até a colheita.</p>" +
      "<ul>" +
      "<li><b>Plantar:</b> gasta <b>1 unidade</b> do material (Erva Lunar, Raiz Fibrosa ou Casca Bruta) que você precisa ter na mochila, mais uma <b>taxa em Cobre</b> para o jardineiro (15, 15 e 20).</li>" +
      "<li><b>Tempo:</b> Erva Lunar 30 min, Raiz Fibrosa 45 min, Casca Bruta 1 h.</li>" +
      "<li><b>Colheita:</b> rende de <b>3 a 5</b> unidades (Casca Bruta, de 3 a 6). A quantidade é sorteada na hora de colher. Com a mochila cheia, libere espaço antes de colher.</li>" +
      "<li><b>Regar:</b> 1 <b>Gota d'Água Pura</b> reduz em <b>25%</b> o tempo que falta, uma vez por planta.</li>" +
      "<li><b>Canteiros:</b> você começa com 2. Dá para comprar até 6, com Cobre: 500, 1.500, 4.000 e 10.000.</li>" +
      "</ul>"
  },
  {
    id: "veio",
    icon: "⛏️",
    title: "Veio de Minério: escavar",
    html:
      "<p>Nas <b>Cavernas Ecoantes</b> fica o <b>Veio de Minério</b>. Você escava e leva o que encontrar.</p>" +
      "<ul>" +
      "<li><b>Custo:</b> 30 de Mana por escavada.</li>" +
      "<li><b>Espera:</b> 30 minutos entre uma escavada e outra, contados pelo relógio do celular.</li>" +
      "<li><b>Resultado sorteado:</b> 55% Fragmento de Quartzo (2 a 4), 30% Cristal Arcano (1 a 2), 10% Poeira de Osso (2 a 4) e 5% nada.</li>" +
      "<li>Com a mochila cheia, libere espaço antes de escavar.</li>" +
      "</ul>"
  },
  {
    id: "pesca",
    icon: "🎣",
    title: "Pesca e Cabana do Pescador",
    html:
      "<p>No <b>Lago Sereno</b> você pesca. Sem vara não dá para pescar, e as varas são vendidas na <b>Cabana do Pescador</b>.</p>" +
      "<ul>" +
      "<li><b>Varas:</b> Bambu (1.000 Cobre), Fibra Arcana (5.000) e Cristalina (20.000). O jogo usa sempre a melhor que você tiver, e elas não ocupam espaço na mochila.</li>" +
      "<li><b>Lançamento:</b> espera de 10 minutos pelo relógio do celular. Não gasta Mana.</li>" +
      "<li><b>Quantidade:</b> de 1 a 3 itens por lançamento. Varas melhores pescam mais e melhor.</li>" +
      "<li><b>Peixes:</b> Lambari Prateado, Truta do Lago, Carpa Dourada, Esturjão Arcano e Peixe-Lua. Só servem para vender, e só na <b>Vila dos Mercadores</b>.</li>" +
      "<li>Também podem vir Gota d'Água Pura e Escama Brilhante.</li>" +
      "</ul>"
  },
  {
    id: "altar_mana",
    icon: "🔮",
    title: "Altar de Mana",
    html:
      "<p>No <b>Vale dos Cristais</b> fica o <b>Altar de Mana</b>. Ele restaura <b>100% da sua Mana</b>, de graça.</p>" +
      "<ul>" +
      "<li><b>Espera:</b> 1 uso por hora, contada pelo relógio do celular.</li>" +
      "<li>Só existe neste local.</li>" +
      "</ul>"
  },
  {
    id: "estudos",
    icon: "📚",
    title: "Sala de Estudos",
    html:
      "<p>Na <b>Biblioteca Arcaica</b> você compra um <b>tomo</b> com Cobre e ganha um bônus por <b>1 hora</b> (tempo real). Só 1 tomo ativo por vez.</p>" +
      "<ul>" +
      "<li>📘 <b>Tomo da Sabedoria</b> (300 Cobre): +25% de XP ao vencer monstros e chefes.</li>" +
      "<li>📗 <b>Tomo da Fortuna</b> (400 Cobre): +15% de Sorte, até o teto de 100%.</li>" +
      "<li>📕 <b>Tomo do Poder</b> (300 Cobre): +10% de Ataque.</li>" +
      "<li>O bônus de XP <b>não vale nas missões</b>.</li>" +
      "</ul>"
  },
  {
    id: "transmutacao",
    icon: "⚗️",
    title: "Transmutação (Alquimista Zerak)",
    html:
      "<p>Nas <b>Ruínas Antigas</b>, o alquimista <b>Zerak</b> troca vários materiais iguais por 1 material melhor, mediante uma taxa em Cobre. É instantâneo, sem limite diário e não tem troca reversa.</p>" +
      "<ul>" +
      "<li>6 Poeira de Osso → 1 Essência Sombria (100 Cobre)</li>" +
      "<li>6 Gota d'Água Pura → 1 Escama Brilhante (100)</li>" +
      "<li>6 Pó Estelar → 1 Fragmento de Quartzo (100)</li>" +
      "<li>5 Essência Sombria → 1 Olho de Górgona (500)</li>" +
      "<li>5 Escama Brilhante → 1 Sangue de Dragão (500)</li>" +
      "<li>5 Fragmento de Quartzo → 1 Coração Elemental (500)</li>" +
      "<li>10 Pó Estelar → 1 Cristal Arcano (200)</li>" +
      "<li>10 Cristal Arcano → 1 Pena de Fênix (1.000)</li>" +
      "</ul>"
  },
  {
    id: "portal",
    icon: "🌀",
    title: "Portal Arcano",
    html:
      "<p>Um portal liga as <b>Cavernas Ecoantes</b> à <b>Academia</b>, nos dois sentidos.</p>" +
      "<ul>" +
      "<li><b>Custo:</b> 500 Cobre por travessia.</li>" +
      "<li><b>Espera:</b> 30 minutos entre travessias, pelo relógio do celular.</li>" +
      "<li>A travessia é instantânea.</li>" +
      "</ul>"
  },
  {
    id: "bruxa",
    icon: "🧹",
    title: "Cabana da Bruxa e Vassoura Voadora",
    html:
      "<p>No <b>Pântano dos Murmúrios</b> a bruxa vende a <b>Vassoura Voadora</b> por 20.000 Cobre.</p>" +
      "<ul>" +
      "<li>Ocupa 1 espaço da mochila e funciona só de estar lá.</li>" +
      "<li>Cada viagem vira <b>instantânea</b> e gasta 1 carga. Ela vem com 30.</li>" +
      "<li>Sem cargas, a vassoura se destrói.</li>" +
      "<li>Não pode ser vendida nem anunciada no Bazar.</li>" +
      "</ul>"
  },
  {
    id: "sacrificio",
    icon: "🕯️",
    title: "Altar de Sacrifício",
    html:
      "<p>Nas <b>Catacumbas Subterrâneas</b> um altar sombrio aceita oferendas, mas cobra sangue.</p>" +
      "<ul>" +
      "<li><b>Custo de vida:</b> 25% do seu HP máximo, mesmo quando o altar não retribui. Se o sacrifício te mataria, o botão fica bloqueado.</li>" +
      "<li><b>Oferendas:</b> 1.000 Cobre, 5 materiais comuns iguais (peixes não valem) ou 1 Cristal Arcano. A oferenda é gasta mesmo se vier nada.</li>" +
      "<li><b>Prêmios:</b> materiais incomuns, raros e, com sorte, uma Pena de Fênix. As chances aparecem na tela do altar.</li>" +
      "<li><b>Espera:</b> 30 minutos depois de cada sacrifício, pelo relógio do celular.</li>" +
      "</ul>"
  },
  {
    id: "torre",
    icon: "🗼",
    title: "Torre do Desafio",
    html:
      "<p>Nos <b>Picos Celestiais</b>, a torre tem <b>40 andares</b> de monstros do mundo todo, cada vez mais fortes. Exige <b>Nível 5</b>.</p>" +
      "<ul>" +
      "<li><b>1 tentativa por dia</b>, que reseta à meia-noite (Brasília).</li>" +
      "<li>Cada vitória dá XP, Cobre e drops normais. Os chefes ficam nos andares 4, 8, 12... até o 40.</li>" +
      "<li><b>Vida e Mana não recuperam</b> entre os andares, e não dá para fugir. Entre um andar e outro você pode beber poções.</li>" +
      "<li><b>Desistir</b> entre andares: você guarda tudo o que ganhou.</li>" +
      "<li><b>Derrota:</b> perde metade do Cobre ganho na torre naquela tentativa. XP e itens ficam. Fechar o jogo no meio da luta conta como derrota.</li>" +
      "<li><b>Baús</b> nos andares 10 (1 incomum), 20 (2 incomuns), 30 (1 raro) e 40 (2 raros e 1 Pena de Fênix). É preciso ter espaço na mochila para abrir, e o baú bloqueia o próximo andar.</li>" +
      "<li>A torre não conta para missões.</li>" +
      "</ul>"
  },
  {
    id: "essencia",
    icon: "💎",
    title: "Como conseguir Essência Arcana",
    html:
      "<p><b>Grátis:</b> <b>+1 💎 por nível ganho</b>, do Nv.2 ao Nv.50 (49 no total). Missões <b>não</b> dão Essência.</p>" +
      "<p><b>Comprando (Pix):</b></p>" +
      "<ul>" +
      "<li>25 💎 por R$ 5,00.</li>" +
      "<li>50 💎 por R$ 10,00.</li>" +
      "<li>100 💎 por R$ 15,00.</li>" +
      "</ul>" +
      "<p>Toque no <b>+</b> ao lado da Essência. O pagamento é confirmado automaticamente.</p>" +
      "<p><b>⭐ VIP (R$ 10,00 por 30 dias):</b></p>" +
      "<ul>" +
      "<li><b>+2 💎</b> por nível ganho durante o VIP.</li>" +
      "<li>Viagens instantâneas.</li>" +
      "<li>Sorte ×1,5.</li>" +
      "<li>Missões dão o dobro de Cobre e de XP.</li>" +
      "<li>⭐ ao lado do seu nome.</li>" +
      "<li>Comprar com o VIP ativo <b>soma</b> os dias.</li>" +
      "</ul>" +
      "<p><b>Para que serve:</b></p>" +
      "<ul>" +
      "<li>Reviver na hora: 5 💎.</li>" +
      "<li>Chegar agora numa viagem: 2 💎.</li>" +
      "<li>Espaço de mochila: 5 💎.</li>" +
      "<li>Amuleto da Força: 5 💎 (compra única, +2 Ataque).</li>" +
      "<li>Resetar habilidades: 20 💎.</li>" +
      "<li>Resetar conta (apaga o progresso, mantém Essência restante, mochila, Amuleto e VIP): 50 💎.</li>" +
      "</ul>"
  }
];

let encRendered = false;

function openEncyclopedia() {
  hideAllScreens();
  document.getElementById("enciclopediaScreen").classList.remove("hidden");
  if (!encRendered) {
    renderEncGuide();
    encRendered = true;
  }
  encTab("guia");
}

function renderEncGuide() {
  const box = document.getElementById("encGuideList");
  box.innerHTML = "";
  ENC_GUIDE.forEach(topic => {
    const item = document.createElement("details");
    item.className = "enc-item";
    item.id = "enc_" + topic.id;
    const head = document.createElement("summary");
    head.textContent = topic.icon + " " + topic.title;
    const body = document.createElement("div");
    body.className = "enc-body";
    body.innerHTML = topic.html;
    item.appendChild(head);
    item.appendChild(body);
    box.appendChild(item);
  });
}

function encTab(name) {
  document.getElementById("encGuidePane").classList.toggle("hidden", name !== "guia");
  document.getElementById("encBestiaryPane").classList.toggle("hidden", name !== "bestiario");
  document.getElementById("encTabGuia").classList.toggle("active", name === "guia");
  document.getElementById("encTabBestiario").classList.toggle("active", name === "bestiario");
  if (name === "bestiario") renderBestiary();
}

// ---------- BESTIÁRIO ----------
// Contador de mortes por monstro (state.bestiary). Monstros: 10 mortes = atributos, 20 = fraqueza, 30 = drops.
// Chefes: 3, 6 e 10. Fraqueza = skill de dano que causa +20% (só skills; a fraqueza só aparece aqui, nunca em combate).
const BEST_STEPS = [10, 20, 30];
const BEST_STEPS_BOSS = [3, 6, 10];
const BEST_WEAKNESS = {
  rato_arcano: "seta_arcana", corvo_selvagem: "descarga_eletrostatica", aranha_sombria: "impacto_igneo",
  lobo_cinzento: "descarga_eletrostatica", javali_espinhoso: "dreno_vital", cogumelo_sombrio: "impacto_igneo",
  morcego_cristalino: "descarga_eletrostatica", gargula_menor: "explosao_arcana", veia_animada: "lanca_gelo",
  peixe_abissal: "descarga_eletrostatica", sereia_corrompida: "maldicao_ruina", serpente_das_aguas: "impacto_igneo",
  esqueleto_guerreiro: "explosao_arcana", mago_fantasma: "seta_arcana", golem_de_pedra_antigo: "lanca_gelo",
  livro_maldito: "impacto_igneo", gargula_de_tomo: "lanca_gelo", arquivista_sombrio: "maldicao_ruina",
  escaravelho_cristalino: "explosao_arcana", elemental_de_quartzo: "descarga_eletrostatica", colosso_prismatico: "seta_arcana",
  lumefogo_enganoso: "lanca_gelo", hidra_dos_lodos: "impacto_igneo", bruxa_das_neblinas: "seta_arcana",
  grifo_das_tempestades: "seta_arcana", elemental_do_gelo: "impacto_igneo", dragao_menor_das_neves: "descarga_eletrostatica",
  ghoul_faminto: "impacto_igneo", cavaleiro_remanescente: "descarga_eletrostatica", lich_menor: "explosao_arcana",
  // chefes
  corvo_ancestral: "descarga_eletrostatica", ent_ancestral: "dreno_vital", patriarca_das_cavernas: "lanca_gelo",
  leviata_do_lago: "descarga_eletrostatica", rei_esqueleto: "impacto_igneo", arquimago_corrompido: "descarga_eletrostatica",
  rainha_de_cristal: "explosao_arcana", monstro_do_pantano: "impacto_igneo", patriarca_das_tempestades: "explosao_arcana",
  arquilich: "seta_arcana"
};

function bestiaryWeakness(id) { return BEST_WEAKNESS[id] || null; }
function bestiaryKill(id, n) {
  if (!id) return;
  if (!state.bestiary) state.bestiary = {};
  const isBoss = Object.keys(LOCATION_BOSSES).some(l => LOCATION_BOSSES[l].id === id);
  const max = (isBoss ? BEST_STEPS_BOSS : BEST_STEPS)[2];
  state.bestiary[id] = Math.min(max, (state.bestiary[id] || 0) + (n || 1));
}

function bestiaryEntries() {
  const out = [];
  Object.keys(LOCATION_MONSTERS).forEach(loc => {
    LOCATION_MONSTERS[loc].forEach(m => out.push({ def: m, boss: false, loc: loc }));
    if (LOCATION_BOSSES[loc]) out.push({ def: LOCATION_BOSSES[loc], boss: true, loc: loc });
  });
  return out;
}

function renderBestiary() {
  const list = document.getElementById("encBestiaryList");
  if (!list) return;
  const entries = bestiaryEntries();
  let done = 0, html = "", lastLoc = null;
  entries.forEach(en => {
    const m = en.def, steps = en.boss ? BEST_STEPS_BOSS : BEST_STEPS, max = steps[2];
    const n = Math.min(max, (state.bestiary && state.bestiary[m.id]) || 0);
    if (n >= max) done++;
    if (en.loc !== lastLoc) { const L = locById(en.loc); html += '<div class="best-map">' + L.icon + ' ' + L.name + '</div>'; lastLoc = en.loc; }
    const st = m.pack ? packStats(m) : m;
    const q = "??????";
    const attrs = n >= steps[0]
      ? "❤️ " + st.hp + " · ⚔️ " + st.attack + " · 🛡️ " + (st.defense || 0) + " · 💨 " + (m.dodge || 0) + "% · 🎁 " + st.xp + " XP / " + st.gold + " Cobre" + (m.pack ? " (cada um)" : "")
      : "❤️ " + q + " · ⚔️ " + q + " · 🛡️ " + q + " · 💨 " + q;
    const sk = BEST_WEAKNESS[m.id] && activeSkillDef(BEST_WEAKNESS[m.id]);
    const weak = n >= steps[1] ? (sk ? sk.icon + " " + sk.name + " (+20% de dano)" : "Nenhuma") : q;
    const drops = n >= steps[2]
      ? (m.drops || []).map(d => { const it = ITEMS.find(i => i.id === d.item); return it ? it.icon + " " + it.name : d.item; }).join(", ") || "Nenhum"
      : q;
    html += '<div class="best-card' + (n >= max ? ' done' : '') + '">' +
      '<div class="best-head"><span class="bicon">' + m.icon + '</span><span class="bname">' + (m.pack || m.name) + '</span>' +
      '<span class="bcount">' + (en.boss ? 'Chefe' : 'Nv. ' + m.level) + ' · ' + n + '/' + max + '</span></div>' +
      '<div class="binfo">Atributos: ' + attrs + '<br>Fraqueza: ' + weak + '<br>Drops: ' + drops + '</div></div>';
  });
  document.getElementById("encBestiarySummary").textContent = "Monstros completos: " + done + "/" + entries.length + " · Monstros: 10, 20 e 30 mortes revelam atributos, fraqueza e drops. Chefes: 3, 6 e 10.";
  list.innerHTML = html;
}
