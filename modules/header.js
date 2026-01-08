// ======================= modules/header.js =======================
export function buildHeader(p, roles) {
  let out = `[${p.id}] = { -- ${p.name}\n`
  out += `    type = "${p.type1}",\n`
  if (p.type2) out += `    type2 = "${p.type2}",\n\n`
  roles.forEach((r, i) => {
    out += `    role${i === 0 ? "" : i + 1} = "${r}",\n`
  })
  out += `\n    name = "${p.name}",\n\n`
  return out
}
