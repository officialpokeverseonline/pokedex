// ======================= modules/evolution.js (COMPLETO – POKEEVOLVE FINAL) =======================

function normalize(str){
  return str.toLowerCase().replace(/-/g," ").replace(/\s+/g," ").trim()
}

function cap(s){
  return s.replace(/\b\w/g,c=>c.toUpperCase())
}

/*
REGRAS IMPLEMENTADAS:
- Req2 = SEMPRE token do próprio Pokémon
- Req1 = SEMPRE os drops do próprio Pokémon
- Se for PRIMEIRA evolução ou Pokémon SEM evolução:
    Req1 = itens dropados
    Req2 = token
- Se for EVOLUÇÃO:
    Req1 = vocation_id + lvl + itens dropados
    Req2 = vocation_id + lvl + token
- lvl:
    - se existir min_level na API → usa
    - se NÃO existir (stone, trade, etc) → lvl = 1
*/

export function buildPokeEvolve({
  pokemonId,
  pokemonName,
  stage,
  evoTotal,
  drops,        // array [{id,name}]
  tokenId,
  evoLevel      // number | null
}) {

  const isBaseOrSingle = stage === 1

  const req1 = []
  const req2 = []

  if (!isBaseOrSingle) {
    req1.push(`{vocation_id = ${pokemonId}, lvl = ${evoLevel || 1}}`)
    req2.push(`{vocation_id = ${pokemonId}, lvl = ${evoLevel || 1}}`)
  }

  // Req1 = TODOS os drops (quantidades fixas)
  drops.forEach(d=>{
    const qnt =
      d.name.includes("essence") || d.name.includes("gem") || d.name.includes("ball")
        ? 10
        : d.name.includes("pendant") || d.name.includes("lava") || d.name.includes("orb")
          ? 10
          : 100

    req1.push(`{itemid = ${d.id}, qnt = ${qnt}}`)
  })

  // Req2 = TOKEN
  req2.push(`{itemid = ${tokenId}, qnt = 1}`)

  return `
        pokeevolve = {
            Req1 = {${req1.join(", ")}},
            Req2 = {${req2.join(", ")}}
        }
`
}