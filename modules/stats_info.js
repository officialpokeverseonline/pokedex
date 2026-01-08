// ======================= modules/stats_info.js =======================
export function buildStatsInfo(data) {
  return `
    stats = {
        health = ${data.hp},
        attack = ${data.attack},
        defense = ${data.defense},
        speed = ${data.speed}
    },

    information = {
        linha1 = "${data.category}",
        linha2 = "Abilities: ${data.abilities.join(", ")}",
        linha3 = "Height: ${data.height} m",
        linha4 = "Weight: ${data.weight} kg",
        linha5 = "${data.description}",
    },
`
}
