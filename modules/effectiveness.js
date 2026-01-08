// ======================= modules/effectiveness.js =======================
export function buildEffectiveness(eff) {
  let out = `
    effectiveness = {
`
  Object.entries(eff).forEach(([k, v]) => {
    if (v.length)
      out += `        ["${k}"] = "${v.join(", ")}",\n`
  })
  out += `    },\n`
  return out
}
