// --- BASE DE DADOS DE ITENS E RECEITAS ---

function potionIconSvg(color) {
  return '<svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align:middle">' +
    '<path d="M9 2h6v3l4 8v6a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-6l4-8V2z" fill="none" stroke="' + color + '" stroke-width="1.5"/>' +
    '<path d="M6 14.5h12v3.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-3.5z" fill="' + color + '"/>' +
    '</svg>';
}
const POTION_ICON_HEAL = potionIconSvg("#e5615a");
const POTION_ICON_MANA = potionIconSvg("#4a90e2");

const POTIONS = [
  { id: "pocao_vida_p", name: "Poção de Vida Pequena", icon: POTION_ICON_HEAL, type: "heal", amount: 40, cost: 8, currency: "gold" },
  { id: "pocao_vida_g", name: "Poção de Vida Grande", icon: POTION_ICON_HEAL, type: "heal", amount: 80, cost: 16, currency: "gold" },
  { id: "pocao_vida_e", name: "Poção de Vida Enorme", icon: POTION_ICON_HEAL, type: "heal", amount: 150, cost: 30, currency: "gold" },
  { id: "pocao_mana_p", name: "Poção de Mana Pequena", icon: POTION_ICON_MANA, type: "mana", amount: 10, cost: 6, currency: "gold" },
  { id: "pocao_mana_g", name: "Poção de Mana Grande", icon: POTION_ICON_MANA, type: "mana", amount: 20, cost: 12, currency: "gold" },
  { id: "pocao_mana_e", name: "Poção de Mana Enorme", icon: POTION_ICON_MANA, type: "mana", amount: 35, cost: 22, currency: "gold" }
];

const ITEMS = [
  { id: "erva_lunar",    name: "Erva Lunar",     icon: "🌿", rarity: "comum", weight: 50 },
  { id: "po_estelar",    name: "Pó Estelar",     icon: "✨", rarity: "comum", weight: 30 },
  { id: "cristal_arcano",name: "Cristal Arcano", icon: "🔹", rarity: "raro",  weight: 15 },
  { id: "pena_fenix",    name: "Pena de Fênix",  icon: "🪶", rarity: "epico", weight: 5  }
];

const EQUIP_ITEMS = [
  // CHAPÉUS
  { id: "chapeu_aprendiz", name: "Chapéu de Aprendiz", icon: "🎩", slot: "chapeu", reqLevel: 1, stats: { defense: 1 } },
  { id: "chapeu_mago", name: "Gorro do Conjurador", icon: "🧙‍♂️", slot: "chapeu", reqLevel: 5, stats: { defense: 3, mana: 5 } },
  { id: "diadema_arcana", name: "Diadema Astral", icon: "👑", slot: "chapeu", reqLevel: 10, stats: { defense: 6, mana: 15, crit: 5 } },

  // ROUPAS
  { id: "tunica_simples", name: "Túnica Simples", icon: "👕", slot: "roupa", reqLevel: 1, stats: { defense: 2 } },
  { id: "veste_reforcada", name: "Veste Arcana", icon: "🥋", slot: "roupa", reqLevel: 5, stats: { defense: 5, hp: 10 } },
  { id: "manto_tecelao", name: "Manto das Sombras", icon: "🥻", slot: "roupa", reqLevel: 10, stats: { defense: 10, hp: 25, dodge: 5 } },

  // SAPATOS
  { id: "botas_surradas", name: "Botas Surradas", icon: "👢", slot: "sapatos", reqLevel: 1, stats: { dodge: 2 } },
  { id: "botas_couro", name: "Passos de Vento", icon: "👟", slot: "sapatos", reqLevel: 5, stats: { dodge: 5, defense: 2 } },
  { id: "botas_runicas", name: "Botas Rúnicas", icon: "🥾", slot: "sapatos", reqLevel: 10, stats: { dodge: 10, defense: 5, hpRegen: 1 } },

  // CAPAS
  { id: "capa_iniciante", name: "Capa de Iniciante", icon: "🧣", slot: "capa", reqLevel: 1, stats: { penetration: 3 } },
  { id: "capa_misterio", name: "Manto Estelar", icon: "🧥", slot: "capa", reqLevel: 5, stats: { penetration: 7, attack: 2 } },
  { id: "capa_fenix", name: "Capa do Sábio", icon: "🦹", slot: "capa", reqLevel: 10, stats: { penetration: 12, attack: 5, manaRegen: 1 } },

  // COLARES
  { id: "colar_simples", name: "Colar Simples", icon: "📿", slot: "colar", reqLevel: 1, stats: { luck: 3 } },
  { id: "colar_cristal", name: "Amuleto de Cristal", icon: "💎", slot: "colar", reqLevel: 5, stats: { luck: 7, mana: 10 } },
  { id: "colar_oculto", name: "Medalhão Celestial", icon: "🥇", slot: "colar", reqLevel: 10, stats: { luck: 15, mana: 20, hp: 15 } },

  // ANÉIS
  { id: "anel_cobre", name: "Anel de Cobre", icon: "💍", slot: "anel", reqLevel: 1, stats: { crit: 3 } },
  { id: "anel_prata", name: "Anel de Prata", icon: "🪙", slot: "anel", reqLevel: 5, stats: { crit: 7, attack: 2 } },
  { id: "anel_ouro_arcano", name: "Anel do Eclipse", icon: "🔮", slot: "anel", reqLevel: 10, stats: { crit: 12, attack: 5, penetration: 5 } },

  // 1. CAJADOS (ARMA PRINCIPAL - 2 MÃOS / EQUILIBRADO)
  { id: "cajado_madeira", name: "Cajado de Madeira", icon: "🧹", slot: "arma_principal", twoHanded: true, reqLevel: 1, stats: { attack: 3, defense: 2, hp: 5 } },
  { id: "cajado_bosque", name: "Cajado do Bosque", icon: "🪄", slot: "arma_principal", twoHanded: true, reqLevel: 5, stats: { attack: 7, defense: 5, hp: 15, mana: 10 } },
  { id: "cajado_arquimago", name: "Cajado do Arquimago", icon: "🔱", slot: "arma_principal", twoHanded: true, reqLevel: 10, stats: { attack: 14, defense: 10, hp: 30, mana: 20 } },

  // 2. VARINHAS (ARMA PRINCIPAL - OFENSIVO)
  { id: "varinha_salgueiro", name: "Varinha de Salgueiro", icon: "🪄", slot: "arma_principal", reqLevel: 1, stats: { attack: 2, crit: 3 } },
  { id: "varinha_cristal", name: "Varinha de Cristal", icon: "🪄", slot: "arma_principal", reqLevel: 5, stats: { attack: 5, mana: 10, penetration: 5, crit: 5 } },
  { id: "varinha_meteoro", name: "Varinha do Meteoro", icon: "⚡", slot: "arma_principal", reqLevel: 10, stats: { attack: 11, mana: 20, penetration: 10, crit: 10 } },

  // 3. TOTENS (ARMA PRINCIPAL - DEFENSIVO)
  { id: "totem_pedra", name: "Totem de Pedra", icon: "🗿", slot: "arma_principal", reqLevel: 1, stats: { attack: 1, defense: 2, hp: 10 } },
  { id: "totem_espirito", name: "Totem do Espírito", icon: "🪵", slot: "arma_principal", reqLevel: 5, stats: { attack: 3, defense: 5, hp: 20, dodge: 4 } },
  { id: "totem_guardiao", name: "Totem Guardião", icon: "🛕", slot: "arma_principal", reqLevel: 10, stats: { attack: 7, defense: 10, hp: 45, dodge: 8 } },

  // 4. GRIMÓRIOS (ARMA SECUNDÁRIA - REGEN / SUPORTE)
  { id: "grimorio_amarelado", name: "Grimório Amarelado", icon: "📜", slot: "arma_secundaria", reqLevel: 1, stats: { defense: 1, manaRegen: 1 } },
  { id: "grimorio_sabio", name: "Grimório do Sábio", icon: "📘", slot: "arma_secundaria", reqLevel: 5, stats: { defense: 3, hp: 15, mana: 10, hpRegen: 1, manaRegen: 1 } },
  { id: "codex_vital", name: "Codéx Vital", icon: "📕", slot: "arma_secundaria", reqLevel: 10, stats: { defense: 6, hp: 30, mana: 20, hpRegen: 2, manaRegen: 2 } },

  // 5. ORBES MÁGICOS (ARMA SECUNDÁRIA - CRÍTICO / PENETRAÇÃO)
  { id: "orbe_vidro", name: "Orbe de Vidro", icon: "🔮", slot: "arma_secundaria", reqLevel: 1, stats: { crit: 3, penetration: 3 } },
  { id: "orbe_plasma", name: "Orbe de Plasma", icon: "⚛️", slot: "arma_secundaria", reqLevel: 5, stats: { attack: 2, crit: 7, penetration: 7 } },
  { id: "orbe_singularidade", name: "Orbe da Singularity", icon: "🌌", slot: "arma_secundaria", reqLevel: 10, stats: { attack: 5, crit: 12, penetration: 12 } }
];

const CRAFT_RECIPES = [
  // POÇÕES
  { id: "pocao_vida_p", category: "potions", name: "Poção de Vida Pequena", icon: "🧪", desc: "Restaura 40 HP", reqs: { erva_lunar: 2 } },
  { id: "pocao_mana_p", category: "potions", name: "Poção de Mana Pequena", icon: "🧪", desc: "Restaura 10 Mana", reqs: { po_estelar: 2 } },
  { id: "pocao_vida_g", category: "potions", name: "Poção de Vida Grande", icon: "🧪", desc: "Restaura 80 HP", reqs: { erva_lunar: 4, cristal_arcano: 1 } },
  { id: "pocao_mana_g", category: "potions", name: "Poção de Mana Grande", icon: "🧪", desc: "Restaura 20 Mana", reqs: { po_estelar: 4, cristal_arcano: 1 } },

  // EQUIPAMENTOS E ARMAS NV. 1
  { id: "chapeu_aprendiz", category: "equip", name: "Chapéu de Aprendiz", icon: "🎩", desc: "Nv. 1 · Defesa +1", reqs: { erva_lunar: 2 } },
  { id: "tunica_simples", category: "equip", name: "Túnica Simples", icon: "👕", desc: "Nv. 1 · Defesa +2", reqs: { erva_lunar: 3 } },
  { id: "botas_surradas", category: "equip", name: "Botas Surradas", icon: "👢", desc: "Nv. 1 · Esquiva +2%", reqs: { erva_lunar: 2 } },
  { id: "capa_iniciante", category: "equip", name: "Capa de Iniciante", icon: "🧣", desc: "Nv. 1 · Penetração +3%", reqs: { po_estelar: 2 } },
  { id: "colar_simples", category: "equip", name: "Colar Simples", icon: "📿", desc: "Nv. 1 · Sorte +3%", reqs: { po_estelar: 2 } },
  { id: "anel_cobre", category: "equip", name: "Anel de Cobre", icon: "💍", desc: "Nv. 1 · Crítico +3%", reqs: { po_estelar: 2 } },
  { id: "cajado_madeira", category: "equip", name: "Cajado de Madeira", icon: "🧹", desc: "Nv. 1 (2 Mãos) · Ataque +3, Defesa +2, HP +5", reqs: { erva_lunar: 3, po_estelar: 2 } },
  { id: "varinha_salgueiro", category: "equip", name: "Varinha de Salgueiro", icon: "🪄", desc: "Nv. 1 · Ataque +2, Crítico +3%", reqs: { po_estelar: 3 } },
  { id: "totem_pedra", category: "equip", name: "Totem de Pedra", icon: "🗿", desc: "Nv. 1 · Ataque +1, Defesa +2, HP +10", reqs: { erva_lunar: 4 } },
  { id: "grimorio_amarelado", category: "equip", name: "Grimório Amarelado", icon: "📜", desc: "Nv. 1 · Defesa +1, Regen Mana +1", reqs: { po_estelar: 3 } },
  { id: "orbe_vidro", category: "equip", name: "Orbe de Vidro", icon: "🔮", desc: "Nv. 1 · Crítico +3%, Penetração +3%", reqs: { po_estelar: 3 } },

  // EQUIPAMENTOS E ARMAS NV. 5
  { id: "chapeu_mago", category: "equip", name: "Gorro do Conjurador", icon: "🧙‍♂️", desc: "Nv. 5 · Defesa +3, Mana +5", reqs: { po_estelar: 4, cristal_arcano: 1 } },
  { id: "veste_reforcada", category: "equip", name: "Veste Arcana", icon: "🥋", desc: "Nv. 5 · Defesa +5, HP +10", reqs: { erva_lunar: 5, cristal_arcano: 1 } },
  { id: "botas_couro", category: "equip", name: "Passos de Vento", icon: "👟", desc: "Nv. 5 · Esquiva +5%, Defesa +2", reqs: { erva_lunar: 4, po_estelar: 3 } },
  { id: "capa_misterio", category: "equip", name: "Manto Estelar", icon: "🧥", desc: "Nv. 5 · Penetração +7%, Ataque +2", reqs: { po_estelar: 5, cristal_arcano: 1 } },
  { id: "colar_cristal", category: "equip", name: "Amuleto de Cristal", icon: "💎", desc: "Nv. 5 · Sorte +7%, Mana +10", reqs: { cristal_arcano: 2, erva_lunar: 3 } },
  { id: "anel_prata", category: "equip", name: "Anel de Prata", icon: "🪙", desc: "Nv. 5 · Crítico +7%, Ataque +2", reqs: { cristal_arcano: 2, po_estelar: 3 } },
  { id: "cajado_bosque", category: "equip", name: "Cajado do Bosque", icon: "🪄", desc: "Nv. 5 (2 Mãos) · Ataque +7, Defesa +5, HP +15, Mana +10", reqs: { erva_lunar: 5, cristal_arcano: 2 } },
  { id: "varinha_cristal", category: "equip", name: "Varinha de Cristal", icon: "🪄", desc: "Nv. 5 · Ataque +5, Mana +10, Penetração +5%, Crítico +5%", reqs: { po_estelar: 5, cristal_arcano: 2 } },
  { id: "totem_espirito", category: "equip", name: "Totem do Espírito", icon: "🪵", desc: "Nv. 5 · Ataque +3, Defesa +5, HP +20, Esquiva +4%", reqs: { erva_lunar: 6, cristal_arcano: 1 } },
  { id: "grimorio_sabio", category: "equip", name: "Grimório do Sábio", icon: "📘", desc: "Nv. 5 · Defesa +3, HP +15, Mana +10, Regen HP/Mana +1", reqs: { cristal_arcano: 2, po_estelar: 4 } },
  { id: "orbe_plasma", category: "equip", name: "Orbe de Plasma", icon: "⚛️", desc: "Nv. 5 · Ataque +2, Crítico +7%, Penetração +7%", reqs: { cristal_arcano: 2, po_estelar: 4 } },

  // EQUIPAMENTOS E ARMAS NV. 10
  { id: "diadema_arcana", category: "equip", name: "Diadema Astral", icon: "👑", desc: "Nv. 10 · Defesa +6, Mana +15, Crítico +5%", reqs: { cristal_arcano: 3, pena_fenix: 1 } },
  { id: "manto_tecelao", category: "equip", name: "Manto das Sombras", icon: "🥻", desc: "Nv. 10 · Defesa +10, HP +25, Esquiva +5%", reqs: { cristal_arcano: 4, pena_fenix: 1 } },
  { id: "botas_runicas", category: "equip", name: "Botas Rúnicas", icon: "🥾", desc: "Nv. 10 · Esquiva +10%, Defesa +5, Regen HP +1", reqs: { cristal_arcano: 3, pena_fenix: 1 } },
  { id: "capa_fenix", category: "equip", name: "Capa do Sábio", icon: "🦹", desc: "Nv. 10 · Penetração +12%, Ataque +5, Regen Mana +1", reqs: { po_estelar: 6, pena_fenix: 1 } },
  { id: "colar_oculto", category: "equip", name: "Medalhão Celestial", icon: "🥇", desc: "Nv. 10 · Sorte +15%, Mana +20, HP +15", reqs: { cristal_arcano: 3, pena_fenix: 2 } },
  { id: "anel_ouro_arcano", category: "equip", name: "Anel do Eclipse", icon: "🔮", desc: "Nv. 10 · Crítico +12%, Ataque +5, Penetração +5%", reqs: { cristal_arcano: 3, pena_fenix: 2 } },
  { id: "cajado_arquimago", category: "equip", name: "Cajado do Arquimago", icon: "🔱", desc: "Nv. 10 (2 Mãos) · Ataque +14, Defesa +10, HP +30, Mana +20", reqs: { cristal_arcano: 5, pena_fenix: 2 } },
  { id: "varinha_meteoro", category: "equip", name: "Varinha do Meteoro", icon: "⚡", desc: "Nv. 10 · Ataque +11, Mana +20, Penetração +10%, Crítico +10%", reqs: { po_estelar: 8, pena_fenix: 2 } },
  { id: "totem_guardiao", category: "equip", name: "Totem Guardião", icon: "🛕", desc: "Nv. 10 · Ataque +7, Defesa +10, HP +45, Esquiva +8%", reqs: { erva_lunar: 8, pena_fenix: 2 } },
  { id: "codex_vital", category: "equip", name: "Codéx Vital", icon: "📕", desc: "Nv. 10 · Defesa +6, HP +30, Mana +20, Regen HP/Mana +2", reqs: { cristal_arcano: 4, pena_fenix: 2 } },
  { id: "orbe_singularidade", category: "equip", name: "Orbe da Singularity", icon: "🌌", desc: "Nv. 10 · Ataque +5, Crítico +12%, Penetração +12%", reqs: { cristal_arcano: 4, pena_fenix: 2 } }
];

const SHOP_ITEMS = [
  ...POTIONS.map(p => ({
    id: p.id, name: p.name, icon: p.icon,
    desc: "Restaura " + p.amount + " de " + (p.type === "heal" ? "HP" : "Mana") + " (vai pra mochila)",
    cost: p.cost, currency: p.currency
  })),
  { id: "amuleto_forca", name: "Amuleto da Força", icon: "🔱", desc: "+2 de Ataque permanente", cost: 5, currency: "essence" }
];
    
