// ======================= modules/effectiveness.js (FINAL – FULL TYPE EFFECTIVENESS) =======================

export function buildEffectiveness(eff){
  let out = `        effectiveness = {\n`

  Object.entries(eff || {}).forEach(([k,v])=>{
    if(Array.isArray(v) && v.length){
      out += `            ["${k}"] = "${v.join(", ")}",\n`
    }
  })

  out += `        },\n`
  return out
}
