// ======================= modules/loot.js (FINAL – QTMAX CORRIGIDO) =======================

const ELEMENTAL = {
  normal:["rubber ball","bitten apple"],
  fire:["fire essence","pot of lava"],
  water:["water gem","water pendant"],
  electric:["screw","electric box"],
  grass:["seed","leaves"],
  ice:["snow ball","ice orb"],
  fighting:["band aid","martial art scroll"],
  poison:["bottle of poison","poison pendant"],
  ground:["earth ball","sandbag"],
  flying:["straw","claw nail"],
  psychic:["enchanted gem","future orb"],
  bug:["bug gosme","bag of pollem"],
  rock:["small stone","giant rock"],
  ghost:["ghost essence","traces of ghost"],
  dragon:["dragon scale","dragon tooth"],
  dark:["dark gem","dark orb"],
  steel:["piece of steel","steel emblem"],
  fairy:["fairy ball","fairy crystal"]
}

const CONFIG = {
  three:{1:{plus:"8%",excl:"0.1%"},2:{plus:"11%",excl:"0.2%"},3:{plus:"17.75%",excl:"0.43%"}},
  two:{1:{plus:"11%",excl:"0.2%"},2:{plus:"35.5%",excl:"0.43%"}},
  single:{1:{plus:"35.5%",excl:"0.43%"}}
}

const cap = s => s.replace(/\b\w/g,c=>c.toUpperCase())
const normalize = s => s.toLowerCase().replace(/-/g," ").trim()

function getExclusiveItem(items, pokemon){
  const rx = new RegExp(`\\b${pokemon}\\b`, "i")
  for(const [name,obj] of Object.entries(items)){
    if(obj.desc.includes("exclusively dropped by") && rx.test(obj.desc)){
      return { id: obj.id, name }
    }
  }
  return null
}

/* ======================= QTMAX RULE ======================= */
function getElementalQtMax({ evoTotal, stage, dual }) {
  // sem evolução OU última evolução
  if (evoTotal === 1 || stage === evoTotal) {
    return dual ? 20 : 40
  }

  // primeira forma de linha com 3
  if (evoTotal === 3 && stage === 1) {
    return dual ? 5 : 10
  }

  // linha de 2 OU forma intermediária
  return dual ? 10 : 20
}

/* ======================= BUILD LOOT ======================= */
export function buildLoot(data, items){
  const out=[]
  let i=1
  const dual = data.types.length === 2

  const cfg =
    data.evoTotal === 3 ? CONFIG.three[data.stage] :
    data.evoTotal === 2 ? CONFIG.two[data.stage] :
    CONFIG.single[1]

  const elemQtMax = getElementalQtMax({
    evoTotal: data.evoTotal,
    stage: data.stage,
    dual
  })

  /* ===== ELEMENTAL BASE ===== */
  data.types.forEach(t=>{
    const base = ELEMENTAL[t]?.[0]
    if(!base || !items[base]) return
    out.push({
      id: items[base].id,
      min: 1,
      max: elemQtMax,
      pct: "80%",
      name: base
    })
  })

  /* ===== ELEMENTAL PLUS ===== */
  data.types.forEach(t=>{
    const plus = ELEMENTAL[t]?.[1]
    if(!plus || !items[plus]) return
    out.push({
      id: items[plus].id,
      min: 1,
      max: 1,
      pct: cfg.plus,
      name: plus
    })
  })

  /* ===== EXCLUSIVE ===== */
  const exclusive = getExclusiveItem(items, normalize(data.name))
  if(exclusive){
    out.push({
      id: exclusive.id,
      min: 1,
      max: 1,
      pct: cfg.excl,
      name: exclusive.name
    })
  }

  /* ===== TOKEN ===== */
  const token = `${normalize(data.name)} token`
  if(items[token]){
    out.push({
      id: items[token].id,
      min: 1,
      max: 1,
      pct: "0.05%",
      name: token
    })
  }

  return {
    lua: `    loot = {
${out.map(l=>`        [${i++}] = {Itemid = ${l.id}, Qtmin = ${l.min}, Qtmax = ${l.max}, Pct = "${l.pct}" }, -- ${cap(l.name)}`).join("\n")}
    },
`
  }
}
