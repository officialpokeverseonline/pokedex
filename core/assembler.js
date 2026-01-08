// ======================= core/assembler.js (FINAL ESTÁVEL) =======================

import { buildHeader } from "../modules/header.js"
import { buildStatsInfo } from "../modules/stats_info.js"
import { buildEffectiveness } from "../modules/effectiveness.js"
import { buildLoot } from "../modules/loot.js"
import { buildMoves } from "../modules/moves.js"

/* ======================= HELPERS ======================= */
function normalize(str){
  return str.toLowerCase().replace(/-/g," ").replace(/\s+/g," ").trim()
}

function cleanNumber(n){
  return Number.isInteger(n) ? n : Number(n.toFixed(1))
}

function roundCooldown(n){
  const f = Math.floor(n)
  return (n - f) >= 0.5 ? f + 1 : f
}

function calcCooldown({ power, pp, acc, level, isStatus }){
  let cd =
    Math.pow(power || 0, 1.2) / (pp || 1) +
    (100 - (acc ?? 100)) * 0.3 +
    level * 0.4
  if(isStatus) cd += 10
  return roundCooldown(cd)
}

/* ======================= LOAD ITEMS ======================= */
async function loadItems(){
  const res = await fetch("/data/items.xml")
  if(!res.ok) throw new Error("data/items.xml não encontrado")

  const txt = await res.text()
  const xml = new DOMParser().parseFromString(txt,"application/xml")

  const items={}
  xml.querySelectorAll("item").forEach(i=>{
    const name=normalize(i.getAttribute("name"))
    items[name]={
      id:Number(i.getAttribute("id")),
      desc:(i.querySelector('attribute[key="description"]')?.getAttribute("value")||"").toLowerCase()
    }
  })
  return items
}

/* ======================= EXCLUSIVE ======================= */
function extractExclusive(items, pokemonName){
  const target=normalize(pokemonName)
  for(const [name,obj] of Object.entries(items)){
    if(!obj.desc.includes("exclusively dropped by")) continue
    const allowed=obj.desc.split("by")[1]?.replace(".","")
      .split(/,|and/).map(n=>normalize(n.trim()))
    if(allowed?.includes(target)) return {name,id:obj.id}
  }
  return null
}

/* ======================= EVOLUTION ======================= */
function getAllPaths(node,path=[],paths=[]){
  const p=[...path,normalize(node.species.name)]
  if(node.evolves_to.length===0) paths.push(p)
  else node.evolves_to.forEach(e=>getAllPaths(e,p,paths))
  return paths
}

/* ======================= ABILITIES ======================= */
function extractAbilities(pokemon){
  const MAP={cut:"Cut",surf:"Surf",fly:"Fly",dig:"Dig","rock smash":"Rock Smash",headbutt:"Headbutt"}
  const set=new Set()
  pokemon.moves.forEach(m=>{
    const n=normalize(m.move.name)
    if(MAP[n]) set.add(MAP[n])
  })
  if(pokemon.types.some(t=>t.type.name==="flying")) set.add("Fly")
  return [...set]
}

/* ======================= MOVES HEURÍSTICA ======================= */
const ROLE_RULES={
  Balanced:{8:{atk:5,status:2},9:{atk:5,status:3},10:{atk:6,status:3}},
  Assault:{8:{atk:6,status:1},9:{atk:6,status:2},10:{atk:7,status:2}},
  Endurance:{8:{atk:4,status:3},9:{atk:4,status:4},10:{atk:5,status:4}}
}

const LEVEL_SLOTS={
  8:[1,5,15,25,35,45,55,1],
  9:[1,5,15,25,35,45,55,65,1],
  10:[1,5,15,25,35,45,55,65,80,1]
}

const BAD_MOVES=["splash","struggle","celebrate","hold hands"]

async function buildMovesData(p, role, evoTotal, stage){
  const total =
    evoTotal===3 && stage===1 ? 8 :
    evoTotal===3 && stage===2 ? 9 :
    evoTotal===2 ? 9 : 10

  const mainType=p.types[0].type.name
  const raw=[]

  p.moves.forEach(m=>{
    const vg=m.version_group_details.find(v=>v.move_learn_method.name==="level-up")
    if(!vg) return
    const name=normalize(m.move.name)
    if(BAD_MOVES.includes(name)) return
    raw.push({name:m.move.name.replace(/-/g," "),level:vg.level_learned_at||1,url:m.move.url})
  })

  for(const m of raw){
    const d=await fetch(m.url).then(r=>r.json())
    m.power=d.power||0
    m.pp=d.pp||1
    m.acc=d.accuracy??100
    m.category=d.damage_class.name==="status"?"Status":"Damage"
    m.type=d.type.name.charAt(0).toUpperCase()+d.type.name.slice(1)
  }

  const atk=raw.filter(m=>m.category==="Damage").sort((a,b)=>b.power-a.power)
  const status=raw.filter(m=>m.category==="Status").sort((a,b)=>a.level-b.level)

  const rule=ROLE_RULES[role][total]
  const chosen=[...atk.slice(0,rule.atk),...status.slice(0,rule.status)]
    .sort((a,b)=>a.level-b.level)

  const levels=LEVEL_SLOTS[total]
  const list=[]

  chosen.forEach((m,i)=>{
    list.push({
      owner:p.name,
      name:m.name,
      level:levels[i],
      cooldown:calcCooldown({
        power:m.power,pp:m.pp,acc:m.acc,
        level:levels[i],isStatus:m.category==="Status"
      }),
      conditions:[m.category==="Status"?"Buff":"Damage",m.type]
    })
  })

  const passive=p.abilities.find(a=>!a.is_hidden)?.ability.name||"Passive"
  list.push({
    owner:p.name,
    name:passive.replace(/-/g," "),
    level:1,
    cooldown:0,
    conditions:["Passive","Buff",mainType.charAt(0).toUpperCase()+mainType.slice(1)]
  })

  return list
}

/* ======================= MAIN ======================= */
export async function assemblePokemon(id){
  const items=await loadItems()
  const p=await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r=>r.json())
  const s=await fetch(p.species.url).then(r=>r.json())

  const stat=n=>p.stats.find(x=>x.stat.name===n).base_stat
  const attack=Math.round((stat("attack")+stat("special-attack"))/2)
  const defense=Math.round((stat("defense")+stat("special-defense"))/2)

  const diff=attack-defense
  const baseRole=diff<-5.41?"Endurance":diff<=10.167?"Balanced":"Assault"

  const evo=await fetch(s.evolution_chain.url).then(r=>r.json())
  const paths=getAllPaths(evo.chain)

  let evoTotal=1,stage=1
  for(const path of paths){
    const idx=path.indexOf(normalize(p.name))
    if(idx!==-1){evoTotal=path.length;stage=idx+1;break}
  }

  const movesData=await buildMovesData(p,baseRole,evoTotal,stage)

  let lua=""
  lua+=buildHeader({name:p.name},[baseRole])
  lua+=buildMoves(Array.isArray(movesData)?movesData:[])
  lua+=buildStatsInfo({})
  lua+=buildEffectiveness({})
  lua+=buildLoot({},items)
  lua+="},"

  return lua
}
