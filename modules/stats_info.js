// ======================= modules/stats_info.js =======================

export function buildStatsInfo(data) {
  const category =
    data.category.startsWith("Category:")
      ? data.category
      : `Category: ${data.category}`

  return `    stats = {
        health = ${data.hp},
        attack = ${data.attack},
        defense = ${data.defense},
        speed = ${data.speed}
    },
    information = {
        linha1 = "${category}",
        linha2 = "Abilities: ${data.abilities.join(", ")}",
        linha3 = "Height: ${data.height} m",
        linha4 = "Weight: ${data.weight} kg",
        linha5 = "${data.description}",
    },
`
}
