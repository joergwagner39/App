/**
 * Durchlauf gegen eine echte SQLite-Datei: Benutzer anlegen, Demo-Daten laden,
 * Matching rechnen. Aufruf: npx tsx scripts/scouting/smoke.ts
 */
import { createUser, userCount } from '../../src/lib/scouting/auth'
import { getWeights, listAssessments, listClubs, listInjuries, listPlayers, listRumors } from '../../src/lib/scouting/repo'
import { seedDemoData } from '../../src/lib/scouting/sync'
import { matchPlayer } from '../../src/lib/scouting/matching'

async function main() {
  if (userCount() === 0) {
    const user = createUser('chef@example.com', 'Chef', 'geheim1234', 'admin')
    console.log('Benutzer angelegt:', user.email, user.role)
  }
  const user = { id: (await import('../../src/lib/scouting/auth')).listUsers()[0].id }

  const seeded = await seedDemoData()
  console.log(`Demo-Daten: ${seeded.clubs} Vereine, ${seeded.players} Spieler neu angelegt.`)

  const clubs = listClubs()
  const players = listPlayers()
  const weights = getWeights(user.id)
  console.log(`Bestand: ${clubs.length} Vereine, ${players.length} Spieler.\n`)

  for (const player of players) {
    const results = matchPlayer({
      player,
      clubs,
      rumors: listRumors(player.id),
      injuries: listInjuries(player.id),
      assessments: listAssessments({ playerId: player.id }),
      weights,
    })
    const top = results.slice(0, 3)
    console.log(`${player.name} (${player.position}, ${player.age}J, ${player.currentClubName})`)
    for (const r of top) {
      console.log(
        `   ${String(r.percent).padStart(3)}%  Datenbasis ${String(r.confidence).padStart(3)}%  ${r.club.name}` +
          `  [+ ${r.strengths.map((s) => s.label).join(', ') || '—'}]` +
          `  [− ${r.concerns.map((s) => s.label).join(', ') || '—'}]`,
      )
    }
    console.log()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
