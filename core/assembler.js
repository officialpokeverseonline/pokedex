// ======================= core/assembler.js (FINAL – LOOT CORRETO POR EVOLUÇÃO) =======================

import { buildHeader } from "../modules/header.js"
import { buildStatsInfo } from "../modules/stats_info.js"
import { buildEffectiveness } from "../modules/effectiveness.js"
import { buildLoot } from "../modules/loot.js"

/* ======================= HELPERS ======================= */
const cap = s => s.replace(/\b\w/g, c => c.toUpperCase())
const normalize = s => s.toLowerCase().replace(/-/g, " ").trim()

/* ======================= LOAD ITEMS ======================= */
async function loadItems(){
  const res = await fetch(
  new URL("../data/items.xml", import.meta.url)
)
  if(!res.ok) return {}

  const txt = await res.text()
  const xml = new DOMParser().parseFromString(txt, "application/xml")

  const items = {}
  xml.querySelectorAll("item").forEach(i => {
    const name = normalize(i.getAttribute("name"))
    items[name] = {
      id: Number(i.getAttribute("id")),
      desc: (i.querySelector('attribute[key="description"]')?.getAttribute("value") || "").toLowerCase()
    }
  })
  return items
}

/* ======================= EVOLUTION PATH ======================= */
function getAllPaths(node, path = [], paths = []) {
  const p = [...path, normalize(node.species.name)]
  if (!node.evolves_to.length) {
    paths.push(p)
  } else {
    node.evolves_to.forEach(e => getAllPaths(e, p, paths))
  }
  return paths
}

/* ======================= TYPE EFFECTIVENESS ======================= */
const ALL_TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"
]

async function getTypeEffectiveness(types){
  const mult = {}
  ALL_TYPES.forEach(t => mult[t] = 1)

  for (const t of types) {
    const d = await fetch(`https://pokeapi.co/api/v2/type/${t}`).then(r => r.json())
    d.damage_relations.double_damage_from.forEach(x => mult[x.name] *= 2)
    d.damage_relations.half_damage_from.forEach(x => mult[x.name] *= 0.5)
    d.damage_relations.no_damage_from.forEach(x => mult[x.name] = 0)
  }

  const out = {
    "Super Weak (4x)": [],
    "Weak (2x)": [],
    "Normal (1x)": [],
    "Resistant (0.5x)": [],
    "Super Resistant (0.25x)": [],
    "Imune (0x)": []
  }

  Object.entries(mult).forEach(([t, v]) => {
    if (v >= 4) out["Super Weak (4x)"].push(cap(t))
    else if (v >= 2) out["Weak (2x)"].push(cap(t))
    else if (v === 1) out["Normal (1x)"].push(cap(t))
    else if (v === 0.5) out["Resistant (0.5x)"].push(cap(t))
    else if (v === 0.25) out["Super Resistant (0.25x)"].push(cap(t))
    else if (v === 0) out["Imune (0x)"].push(cap(t))
  })

  return out
}

/* ======================= MAIN ======================= */
export async function assemblePokemon(id){
  const items = await loadItems()

  const p = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json())
  const s = await fetch(p.species.url).then(r => r.json())

  /* ===== EVOLUTION INFO (CRÍTICO PARA O LOOT) ===== */
  const evoChain = await fetch(s.evolution_chain.url).then(r => r.json())
  const paths = getAllPaths(evoChain.chain)

  let evoTotal = 1
  let stage = 1

  for (const path of paths) {
    const idx = path.indexOf(normalize(p.name))
    if (idx !== -1) {
      evoTotal = path.length
      stage = idx + 1
      break
    }
  }

  /* ===== STATS ===== */
  const stat = n => p.stats.find(x => x.stat.name === n).base_stat
  const attack = (stat("attack") + stat("special-attack")) / 2
  const defense = (stat("defense") + stat("special-defense")) / 2

  const roles = []
  roles.push(attack - defense < -5 ? "Endurance" : attack - defense < 10 ? "Balanced" : "Assault")
  if (p.weight / 10 >= 100) roles.push("Heavy")
  if (stat("speed") >= 100) roles.push("Faster")
  if (s.is_legendary) roles.push("Legendary")
  if (s.is_mythical) roles.push("Mythic")

  const types = p.types
  .sort((a, b) => a.slot - b.slot)
  .map(t => t.type.name)
  const effectiveness = await getTypeEffectiveness(types)

  /* ===== ABILITIES ===== */
  const abilities = []
  p.moves.forEach(m => {
    const n = m.move.name
    if (n === "cut") abilities.push("Cut")
    if (n === "headbutt") abilities.push("Headbutt")
    if (n === "surf") abilities.push("Surf")
    if (n === "dig") abilities.push("Dig")
    if (n === "rock-smash") abilities.push("Rock Smash")
  })
  if (types.includes("flying")) abilities.push("Fly")

  let lua = ""

  lua += buildHeader({
  id: p.id,
  name: cap(p.name),
  type1: cap(types[0]),
  type2: types[1] ? cap(types[1]) : null
}, roles)

  lua += buildStatsInfo({
    hp: stat("hp"),
    attack: Math.round(attack * 10) / 10,
    defense: Math.round(defense * 10) / 10,
    speed: stat("speed"),
    category: `Category: ${s.genera.find(g => g.language.name === "en").genus.replace(" Pokémon"," Pokemon")}`,
    abilities,
    height: (p.height / 10).toFixed(1),
    weight: (p.weight / 10).toFixed(1),
    description: s.flavor_text_entries
      .find(f => f.language.name === "en")
      .flavor_text.replace(/\n|\f/g, " ")
  })

  lua += buildEffectiveness(effectiveness)

  /* ===== LOOT (AGORA FUNCIONA DE VERDADE) ===== */
  const lootData = buildLoot({
    name: p.name,
    types,
    evoTotal,
    stage
  }, items)

  lua += lootData.lua

  lua += `        moves = {
            [1] = {id = 1, word = "#Any#", name = "Tackle", level = 1, cooldown = 4, description = "Any.", conditions = {"Target", "Damage", "Tackle"}},
        },
        pokeevolve = {
            Req1 = {{itemid = 28882, qnt = 10}, {itemid = 28880, qnt = 10}},
            Req2 = {{itemid = 28551, qnt = 1}}
    }
},
        pokeevolve = {
            Req1 = {{vocation_id = 2, lvl = 32}, {itemid = 28884, qnt = 10}, {itemid = 29026, qnt = 100}}, 
            Req2 = {{vocation_id = 2, lvl = 32}, {itemid = 28549, qnt = 1}}
        }
    },
`

  return lua
}