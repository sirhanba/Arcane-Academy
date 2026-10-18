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
      "<li><b>Atributos secundários:</b> sorteados sem repetição de uma lista do item. Nv.1 tem <b>1</b>, Nv.5 tem <b>2</b> e Nv.10 tem <b>3</b>.</li>" +
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
}
