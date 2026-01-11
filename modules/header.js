// ======================= modules/header.js =======================
export function buildHeader(p, roles) {
  let out = `[${p.id}] = { -- ${p.name}\n`

  if (p.type2) {
    out += `    type2 = "${p.type1}",\n`
    out += `    type = "${p.type2}",\n`
  } else {
    out += `    type = "${p.type1}",\n`
  }

  roles.forEach((r, i) => {
    out += `    role${i === 0 ? "" : i + 1} = "${r}",\n`
  })

  out += `    name = "${p.name}",\n`

  return out
}
