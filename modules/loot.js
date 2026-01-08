// ======================= modules/loot.js =======================
// FINAL – exclusivo correto POR DESCRIÇÃO (SEM HERANÇA)

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
  three:{
    1:{elem:5,  plus:"8%",     excl:"0.1%"},
    2:{elem:10, plus:"11%",    excl:"0.2%"},
    3:{elem:20, plus:"17.75%", excl:"0.43%"}
  },
  two:{
    1:{elem:20, plus:"11%",    excl:"0.2%"},
    2:{elem:40, plus:"35.5%",  excl:"0.43%"}
  },
  single:{
    1:{elem:40, plus:"35.5%",  excl:"0.43%"}
  }
}

const cap = s => s.replace(/\b\w/g,c=>c.toUpperCase())

export function buildLoot(data, items){
  let out=[]
  let i=1
  const dual = data.types.length===2

  const cfg =
    data.evoTotal===3 ? CONFIG.three[data.stage] :
    data.evoTotal===2 ? CONFIG.two[data.stage] :
    CONFIG.single[1]

  // ================= ELEMENTAL =================
  data.types.forEach(t=>{
    const base = ELEMENTAL[t][0]
    if(!items[base]) return
    out.push({
      id: items[base].id,
      min:1,
      max: dual ? cfg.elem/2 : cfg.elem,
      pct:"80%",
      name: base
    })
  })

  // ================= ELEMENTAL PLUS =================
  data.types.forEach(t=>{
    const plus = ELEMENTAL[t][1]
    if(!items[plus]) return
    out.push({
      id: items[plus].id,
      min:1,
      max:1,
      pct: cfg.plus,
      name: plus
    })
  })

  // ================= EXCLUSIVE (APENAS SE EXISTIR NO XML) =================
  if (data.exclusiveItem) {
    out.push({
      id: data.exclusiveItem.id,
      min:1,
      max:1,
      pct: cfg.excl,
      name: data.exclusiveItem.name
    })
  }

  // ================= TOKEN =================
  const token = `${data.name.toLowerCase()} token`
  if (items[token]) {
    out.push({
      id: items[token].id,
      min:1,
      max:1,
      pct:"0.05%",
      name: token
    })
  }

  return `
    loot = {
${out.map(l=>`        [${i++}] = {Itemid = ${l.id}, Qtmin = ${l.min}, Qtmax = ${l.max}, Pct = "${l.pct}" }, -- ${cap(l.name)}`).join("\n")}
    },
`
}
