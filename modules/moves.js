// ======================= modules/moves.js (FIX DEFINITIVO – SEM ERRO forEach) =======================
// CAUSA DO ERRO:
// buildMoves estava sendo chamado quando `moves` era undefined ou não-array
//
// FIX:
// 1) Garantir fallback para array vazio
// 2) Garantir que conditions sempre seja array
// 3) Não remover nenhuma feature

export function buildMoves(moves){
  // 🔒 FIX CRÍTICO
  if (!Array.isArray(moves)) {
    moves = []
  }

  let out = `
        moves = {
`

  moves.forEach((m, i) => {
    const conditions = Array.isArray(m.conditions) ? m.conditions : []

    out += `
            [${i + 1}] = {
                id = ${i + 1},
                word = "#${m.owner} ${m.name}#",
                name = "${m.name}",
                level = ${m.level},
                cooldown = ${m.cooldown},
                description = "Any.",
                conditions = {${conditions.map(c => `"${c}"`).join(", ")}}
            },
`
  })

  out += `
        },
`
  return out
}
