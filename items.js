// --- BASE DE DADOS DE ITENS E RECEITAS ---

function potionIconSvg(color) {
    return '<svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align:middle">' +
        '<path d="M9 2h6v3l4 8v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6l4-8V2z" fill="none" stroke="' + color + '" stroke-width="1.5"/>' +
        '<path d="M6 14.5h12v3.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3.5z" fill="' + color + '"/>' +
        '</svg>';
}

var POTION_ICON_HEAL = potionIconSvg("#e5615a");
var POTION_ICON_MANA = potionIconSvg("#4a90e2");

var POTIONS = [
    { id: "pocao_vida_p", name: "Poção de Vida Pequena", icon: POTION_ICON_HEAL, type: "heal", amount: 40, cost: 8, currency: "gold", description: "Restaura 40 de Vida imediatamente." },
    { id: "pocao_vida_g", name: "Poção de Vida Grande", icon: POTION_ICON_HEAL, type: "heal", amount: 80, cost: 16, currency: "gold", description: "Restaura 80 de Vida imediatamente." },
    { id: "pocao_mana_p", name: "Poção de Mana Pequena", icon: POTION_ICON_MANA, type: "mana", amount: 20, cost: 8, currency: "gold", description: "Restaura 20 de Mana imediatamente." },
    { id: "pocao_mana_g", name: "Poção de Mana Grande", icon: POTION_ICON_MANA, type: "mana", amount: 45, cost: 16, currency: "gold", description: "Restaura 45 de Mana imediatamente." }
];

var WEAPONS = [
    { id: "cajado_treino", name: "Cajado de Treino", attack: 3, defense: 0, rarity: "comum", cost: 0, currency: "gold", description: "Feito de madeira simples. Ideal para praticar feitiços básicos." },
    { id: "cajado_aprendiz", name: "Cajado de Aprendiz", attack: 6, defense: 1, rarity: "comum", cost: 15, currency: "gold", description: "Possui uma pequena pedra de quartzo na ponta que canaliza mana melhor." },
    { id: "cajado_runico", name: "Cajado Rúnico", attack: 12, defense: 3, rarity: "raro", cost: 45, currency: "gold", description: "Entalhado com runas de proteção e ataque avançado." },
    { id: "varinha_cristal", name: "Varinha de Cristal", attack: 18, defense: 4, rarity: "raro", cost: 90, currency: "gold", description: "Forjada com cristal puro da Academia Arcanum." },
    { id: "cajado_arcano", name: "Cajado Arcano Supremo", attack: 28, defense: 8, rarity: "epico", cost: 200, currency: "gold", description: "Um artefato de grande poder, capaz de devastar inimigos." }
];

var ARMORS = [
    { id: "tunica_novato", name: "Túnica de Novato", attack: 0, defense: 2, maxHpBonus: 5, rarity: "comum", cost: 0, currency: "gold", description: "Roupa padrão entregue a todos os novos estudantes da Academia." },
    { id: "tunica_tecida", name: "Túnica Tecida", attack: 0, defense: 5, maxHpBonus: 15, rarity: "comum", cost: 15, currency: "gold", description: "Tecido reforçado com fios de seda encantada para absorver impactos." },
    { id: "manto_protetor", name: "Manto Protetor", attack: 1, defense: 10, maxHpBonus: 30, rarity: "raro", cost: 45, currency: "gold", description: "Oferece uma barreira mágica passiva contra ataques físicos." },
    { id: "veste_elemental", name: "Veste Elemental", attack: 3, defense: 16, maxHpBonus: 50, rarity: "raro", cost: 90, currency: "gold", description: "Encantada com elementos defensivos para proteger o usuário." },
    { id: "manto_arcano", name: "Manto do Arquimago", attack: 5, defense: 25, maxHpBonus: 90, rarity: "epico", cost: 200, currency: "gold", description: "Uma vestimenta lendária usada apenas pelos maiores magos." }
];

var MATERIALS = [
    { id: "essencia_magica", name: "Essência Mágica", icon: "✨", description: "Gota de magia pura extraída durante combates ou exploração." },
    { id: "po_cristal", name: "Pó de Cristal", icon: "💎", description: "Resíduo brilhante de cristais mágicos moídos." },
    { id: "fragmento_runico", name: "Fragmento Rúnico", icon: "🪨", description: "Pedaço de uma antiga pedra encantada contendo energia residual." },
    { id: "erva_curativa", name: "Erva Curativa", icon: "🌿", description: "Planta medicinal com propriedades restauradoras de vida." },
    { id: "flor_mana", name: "Flor de Mana", icon: "🌸", description: "Rara flor azulada recheada de energia mágica concentrada." }
];

var RECIPES = [
    {
        id: "craft_pocao_vida_p",
        resultId: "pocao_vida_p",
        resultType: "potion",
        name: "Poção de Vida Pequena",
        materialsNeeded: [
            { id: "erva_curativa", amount: 2 },
            { id: "essencia_magica", amount: 1 }
        ]
    },
    {
        id: "craft_pocao_mana_p",
        resultId: "pocao_mana_p",
        resultType: "potion",
        name: "Poção de Mana Pequena",
        materialsNeeded: [
            { id: "flor_mana", amount: 2 },
            { id: "essencia_magica", amount: 1 }
        ]
    },
    {
        id: "craft_cajado_aprendiz",
        resultId: "cajado_aprendiz",
        resultType: "weapon",
        name: "Cajado de Aprendiz",
        materialsNeeded: [
            { id: "po_cristal", amount: 3 },
            { id: "essencia_magica", amount: 2 }
        ]
    },
    {
        id: "craft_tunica_tecida",
        resultId: "tunica_tecida",
        resultType: "armor",
        name: "Túnica Tecida",
        materialsNeeded: [
            { id: "po_cristal", amount: 2 },
            { id: "essencia_magica", amount: 3 }
        ]
    }
];
