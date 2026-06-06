/**
 * CricScout Intelligence — Cricsheet Data Pipeline
 *
 * Downloads IPL + SMAT match JSONs from Cricsheet, parses ball-by-ball data,
 * computes form scores & phase splits, then upserts everything to Supabase.
 *
 * Usage:
 *   node scripts/seed.js           — full reseed (all seasons)
 *   node scripts/seed.js --ipl     — IPL only
 *   node scripts/seed.js --smat    — SMAT only
 */

import { createClient } from '@supabase/supabase-js'
import AdmZip from 'adm-zip'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = join(__dirname, 'data')
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// ── Sources ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const ALL_SOURCES = [
  {
    key: 'ipl',
    url: 'https://cricsheet.org/downloads/ipl_json.zip',
    name: 'Indian Premier League',
    shortName: 'IPL',
    tier: 1,
    level: 'National',
  },
  {
    key: 'smat',
    url: 'https://cricsheet.org/downloads/smat_json.zip',
    name: 'Syed Mushtaq Ali Trophy',
    shortName: 'SMAT',
    tier: 2,
    level: 'National',
  },
]
const SOURCES = args.includes('--ipl')  ? ALL_SOURCES.filter(s => s.key === 'ipl')
               : args.includes('--smat') ? ALL_SOURCES.filter(s => s.key === 'smat')
               : ALL_SOURCES

// Non-batting dismissals (don't credit the bowler)
const FIELDING_DISMISSALS = new Set(['run out', 'retired hurt', 'obstructing the field', 'handled the ball', 'hit the ball twice'])

// ── Phase helpers ──────────────────────────────────────────────────────────
function getPhase(overIndex) {
  if (overIndex <= 5)  return 'pp'
  if (overIndex <= 14) return 'mid'
  return 'death'
}

// ── Download ───────────────────────────────────────────────────────────────
async function downloadZip(url) {
  console.log(`  ↓ Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const buf = await res.arrayBuffer()
  return Buffer.from(buf)
}

// ── Parse one Cricsheet JSON match ─────────────────────────────────────────
function parseMatch(json, source) {
  const info = json.info
  if (!info || info.match_type !== 'T20' || info.gender !== 'male') return null

  const teams   = info.teams || []
  const dateStr = info.dates?.[0] || '2000-01-01'
  const season  = String(info.season || dateStr.slice(0, 4))
  const tId     = `${source.key}_${season}`
  const matchId = `${source.key}_${dateStr}_${teams.join('_v_').replace(/\s+/g, '')}`

  const matchData = {
    id: matchId,
    tournament_id: tId,
    match_date: dateStr,
    season,
    venue: info.venue || info.city || 'Unknown',
    team1: teams[0] || null,
    team2: teams[1] || null,
    winner: info.outcome?.winner || null,
    player_of_match: info.player_of_match?.[0] || null,
  }

  const registry = info.registry?.people || {}

  const battingMap = {}  // name → stats
  const bowlingMap = {}

  for (const inningsObj of (json.innings || [])) {
    const battingTeam = inningsObj.team
    const bowlingTeam = teams.find(t => t !== battingTeam) || null
    const inningsNum  = (json.innings.indexOf(inningsObj)) + 1

    for (const over of (inningsObj.overs || [])) {
      const overIdx = over.over
      const phase   = getPhase(overIdx)

      for (const d of (over.deliveries || [])) {
        const batter = d.batter
        const bowler = d.bowler
        if (!batter || !bowler) continue

        const batterRuns = d.runs?.batter ?? 0
        const totalRuns  = d.runs?.total  ?? 0
        const isWide     = !!d.extras?.wides
        const isNoBall   = !!d.extras?.noballs

        // ─ Batting ─
        if (!battingMap[batter]) {
          battingMap[batter] = {
            player_id:   registry[batter]?.identifier || batter.toLowerCase().replace(/\s+/g, '_'),
            player_name: batter,
            team:        battingTeam,
            innings_num: inningsNum,
            runs: 0, balls: 0, fours: 0, sixes: 0, is_out: false,
            pp_runs: 0,    pp_balls: 0,
            mid_runs: 0,   mid_balls: 0,
            death_runs: 0, death_balls: 0,
          }
        }
        const bat = battingMap[batter]
        bat.runs += batterRuns
        bat[`${phase}_runs`] += batterRuns
        if (!isWide) {                 // wides don't count as balls faced
          bat.balls++
          bat[`${phase}_balls`]++
        }
        if (batterRuns === 4) bat.fours++
        if (batterRuns === 6) bat.sixes++
        if (d.wickets) {
          for (const w of d.wickets) {
            if (w.player_out === batter) bat.is_out = true
          }
        }

        // ─ Bowling ─
        if (!bowlingMap[bowler]) {
          bowlingMap[bowler] = {
            player_id:    registry[bowler]?.identifier || bowler.toLowerCase().replace(/\s+/g, '_'),
            player_name:  bowler,
            team:         bowlingTeam,
            innings_num:  inningsNum,
            balls: 0, runs_conceded: 0, wickets: 0,
            pp_balls: 0,    pp_runs: 0,    pp_wickets: 0,
            mid_balls: 0,   mid_runs: 0,   mid_wickets: 0,
            death_balls: 0, death_runs: 0, death_wickets: 0,
          }
        }
        const bowl = bowlingMap[bowler]
        if (!isWide && !isNoBall) {
          bowl.balls++
          bowl[`${phase}_balls`]++
        }
        bowl.runs_conceded += totalRuns
        bowl[`${phase}_runs`] += totalRuns
        if (d.wickets) {
          for (const w of d.wickets) {
            if (!FIELDING_DISMISSALS.has(w.kind)) {
              bowl.wickets++
              bowl[`${phase}_wickets`]++
            }
          }
        }
      }
    }
  }

  return {
    source,
    match:   matchData,
    batting: Object.values(battingMap),
    bowling: Object.values(bowlingMap),
    players: [
      ...Object.values(battingMap).map(b => ({ id: b.player_id, name: b.player_name, team: b.team })),
      ...Object.values(bowlingMap).map(b => ({ id: b.player_id, name: b.player_name, team: b.team })),
    ],
  }
}

// ── Form score computation ─────────────────────────────────────────────────
function phaseLabel(value, isBowler) {
  if (isBowler) {
    // Economy rate: lower = better
    if (value === null || value === undefined) return 'average'
    if (value < 6.5)  return 'elite'
    if (value < 8.0)  return 'high'
    if (value < 9.5)  return 'average'
    if (value < 11.0) return 'low'
    return 'critical'
  } else {
    // Strike rate: higher = better
    if (value === null || value === undefined) return 'average'
    if (value > 175) return 'elite'
    if (value > 150) return 'high'
    if (value > 120) return 'average'
    if (value > 100) return 'low'
    return 'critical'
  }
}

function calcSR(runs, balls)    { return balls > 0 ? +((runs / balls) * 100).toFixed(2) : null }
function calcEcon(runs, balls)  { return balls > 0 ? +((runs / balls) * 6).toFixed(2) : null }
function calcAvg(runs, outs)    { return outs > 0  ? +(runs / outs).toFixed(2) : runs > 0 ? runs : null }
function clamp(v, lo, hi)       { return Math.max(lo, Math.min(hi, v)) }

function computeFormScore(recentBat, recentBowl, role) {
  const isBowler = role === 'Bowler'

  if (isBowler && recentBowl.length > 0) {
    const totalBalls   = recentBowl.reduce((s, r) => s + r.balls, 0)
    const totalRuns    = recentBowl.reduce((s, r) => s + r.runs_conceded, 0)
    const totalWickets = recentBowl.reduce((s, r) => s + r.wickets, 0)
    if (totalBalls < 6) return 40  // not enough data

    const econ       = (totalRuns / totalBalls) * 6
    const wktsMatch  = totalWickets / recentBowl.length
    const econNorm   = clamp((12 - econ) / (12 - 4), 0, 1)
    const wktsNorm   = clamp(wktsMatch / 4, 0, 1)
    return clamp(Math.round((econNorm * 0.55 + wktsNorm * 0.45) * 100), 0, 100)
  }

  if (!isBowler && recentBat.length > 0) {
    const totalRuns  = recentBat.reduce((s, r) => s + r.runs, 0)
    const totalBalls = recentBat.reduce((s, r) => s + r.balls, 0)
    const totalOuts  = recentBat.reduce((s, r) => s + (r.is_out ? 1 : 0), 0)
    const totalFours = recentBat.reduce((s, r) => s + r.fours, 0)
    const totalSixes = recentBat.reduce((s, r) => s + r.sixes, 0)
    if (totalBalls < 6) return 40

    const sr       = (totalRuns / totalBalls) * 100
    const avg      = totalOuts > 0 ? totalRuns / totalOuts : totalRuns
    const bdyPct   = (totalFours + totalSixes) / totalBalls
    const srNorm   = clamp((sr - 80) / (220 - 80), 0, 1)
    const avgNorm  = clamp((avg - 10) / (60 - 10), 0, 1)
    return clamp(Math.round((srNorm * 0.45 + avgNorm * 0.30 + bdyPct * 0.25) * 100), 0, 100)
  }

  // All-rounder: use whichever side has more data
  if (recentBat.length >= recentBowl.length && recentBat.length > 0) {
    return computeFormScore(recentBat, [], 'Batter')
  }
  if (recentBowl.length > 0) {
    return computeFormScore([], recentBowl, 'Bowler')
  }
  return 40
}

// ── Batch upsert helper ────────────────────────────────────────────────────
async function upsert(table, rows, conflict) {
  if (!rows.length) return
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict, ignoreDuplicates: false })
    if (error) console.error(`  ✗ upsert ${table}:`, error.message)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏏 CricScout Data Pipeline\n')

  // Accumulate across sources
  const allPlayers     = {}   // name → latest team
  const allTournaments = {}   // id → tournament
  const allMatches     = {}   // id → match
  const allBatting     = []
  const allBowling     = []

  for (const source of SOURCES) {
    console.log(`\n── ${source.name} ──`)

    let zipBuf
    try {
      zipBuf = await downloadZip(source.url)
    } catch (e) {
      console.error(`  ✗ Download failed: ${e.message}`)
      continue
    }

    const zip     = new AdmZip(zipBuf)
    const entries = zip.getEntries().filter(e => e.entryName.endsWith('.json') && !e.entryName.includes('README'))
    console.log(`  ✓ ${entries.length} match files`)

    let parsed = 0
    let seasons = {}

    for (const entry of entries) {
      try {
        const json  = JSON.parse(entry.getData().toString('utf8'))
        const result = parseMatch(json, source)
        if (!result) continue

        const { match, batting, bowling, players } = result
        const season = match.season
        const tId    = `${source.key}_${season}`

        // Build tournament record
        if (!allTournaments[tId]) {
          allTournaments[tId] = {
            id:            tId,
            name:          `${source.name} ${season}`,
            short_name:    source.shortName,
            tier:          source.tier,
            level:         source.level,
            status:        'COMPLETED',
            total_matches: 0,
            matches_played: 0,
          }
        }
        allTournaments[tId].matches_played++
        allTournaments[tId].total_matches++

        allMatches[match.id] = match
        for (const p of players) {
          allPlayers[p.name] = { id: p.id, name: p.name, team: p.team }
        }

        for (const b of batting) allBatting.push({ match_id: match.id, ...b })
        for (const b of bowling) allBowling.push({ match_id: match.id, ...b })

        parsed++
      } catch (_) { /* skip malformed */ }
    }

    console.log(`  ✓ ${parsed} matches parsed`)
  }

  // ── Upsert base tables ──
  console.log('\n── Upserting to Supabase ──')

  const playerRows = Object.values(allPlayers).map(p => ({
    id:   p.id,
    name: p.name,
    team: p.team,
    role: 'Batter',  // will be updated by form computation
    is_active: true,
    updated_at: new Date().toISOString(),
  }))
  console.log(`  players:     ${playerRows.length}`)
  await upsert('players', playerRows, 'id')

  const tournamentRows = Object.values(allTournaments)
  console.log(`  tournaments: ${tournamentRows.length}`)
  await upsert('tournaments', tournamentRows, 'id')

  const matchRows = Object.values(allMatches)
  console.log(`  matches:     ${matchRows.length}`)
  await upsert('matches', matchRows, 'id')

  console.log(`  batting:     ${allBatting.length}`)
  await upsert('batting_stats', allBatting, 'match_id,player_name,innings_num')

  console.log(`  bowling:     ${allBowling.length}`)
  await upsert('bowling_stats', allBowling, 'match_id,player_name,innings_num')

  // ── Compute form snapshots ──
  console.log('\n── Computing form snapshots ──')

  // Group batting/bowling by player
  const batByPlayer  = {}
  const bowlByPlayer = {}

  for (const b of allBatting) {
    if (!batByPlayer[b.player_name])  batByPlayer[b.player_name]  = []
    batByPlayer[b.player_name].push(b)
  }
  for (const b of allBowling) {
    if (!bowlByPlayer[b.player_name]) bowlByPlayer[b.player_name] = []
    bowlByPlayer[b.player_name].push(b)
  }

  // Get match dates for sorting
  const matchDates = {}
  for (const m of Object.values(allMatches)) matchDates[m.id] = m.match_date

  const now30 = new Date()
  now30.setDate(now30.getDate() - 30)

  // Infer roles
  const roleMap = {}
  for (const name of Object.keys(allPlayers)) {
    const hasBat  = (batByPlayer[name]?.length  || 0) >= 2
    const hasBowl = (bowlByPlayer[name]?.length || 0) >= 2
    if (hasBat && hasBowl) roleMap[name] = 'All-rounder'
    else if (hasBowl)      roleMap[name] = 'Bowler'
    else                   roleMap[name] = 'Batter'
  }

  const allNames = new Set([...Object.keys(batByPlayer), ...Object.keys(bowlByPlayer)])
  const snapshots = []

  for (const name of allNames) {
    const role   = roleMap[name] || 'Batter'
    const p      = allPlayers[name] || { id: name.toLowerCase().replace(/\s+/g, '_'), team: null }
    const batRows = (batByPlayer[name]  || []).sort((a, b) => (matchDates[b.match_id] || '').localeCompare(matchDates[a.match_id] || ''))
    const bowRows = (bowlByPlayer[name] || []).sort((a, b) => (matchDates[b.match_id] || '').localeCompare(matchDates[a.match_id] || ''))

    const recentBat  = batRows.slice(0, 10)
    const recentBowl = bowRows.slice(0, 10)

    // Total batting phase stats (recent 10)
    const totBat = recentBat.reduce((acc, r) => ({
      runs: acc.runs + r.runs, balls: acc.balls + r.balls,
      outs: acc.outs + (r.is_out ? 1 : 0),
      fours: acc.fours + r.fours, sixes: acc.sixes + r.sixes,
      pp_r:  acc.pp_r  + r.pp_runs,    pp_b:  acc.pp_b  + r.pp_balls,
      mid_r: acc.mid_r + r.mid_runs,   mid_b: acc.mid_b + r.mid_balls,
      d_r:   acc.d_r   + r.death_runs, d_b:   acc.d_b   + r.death_balls,
    }), { runs: 0, balls: 0, outs: 0, fours: 0, sixes: 0, pp_r: 0, pp_b: 0, mid_r: 0, mid_b: 0, d_r: 0, d_b: 0 })

    // Total bowling phase stats (recent 10)
    const totBowl = recentBowl.reduce((acc, r) => ({
      balls: acc.balls + r.balls, runs: acc.runs + r.runs_conceded, wkts: acc.wkts + r.wickets,
      pp_b:  acc.pp_b  + r.pp_balls,    pp_r:  acc.pp_r  + r.pp_runs,    pp_w:  acc.pp_w  + r.pp_wickets,
      mid_b: acc.mid_b + r.mid_balls,   mid_r: acc.mid_r + r.mid_runs,   mid_w: acc.mid_w + r.mid_wickets,
      d_b:   acc.d_b   + r.death_balls, d_r:   acc.d_r   + r.death_runs, d_w:   acc.d_w   + r.death_wickets,
    }), { balls: 0, runs: 0, wkts: 0, pp_b: 0, pp_r: 0, pp_w: 0, mid_b: 0, mid_r: 0, mid_w: 0, d_b: 0, d_r: 0, d_w: 0 })

    const ppSR    = calcSR(totBat.pp_r,  totBat.pp_b)
    const midSR   = calcSR(totBat.mid_r, totBat.mid_b)
    const deathSR = calcSR(totBat.d_r,   totBat.d_b)
    const ppEcon    = calcEcon(totBowl.pp_r,  totBowl.pp_b)
    const midEcon   = calcEcon(totBowl.mid_r, totBowl.mid_b)
    const deathEcon = calcEcon(totBowl.d_r,   totBowl.d_b)

    const isBowler  = role === 'Bowler'
    const ppLabel   = isBowler ? phaseLabel(ppEcon,    true)  : phaseLabel(ppSR,    false)
    const midLabel  = isBowler ? phaseLabel(midEcon,   true)  : phaseLabel(midSR,   false)
    const deathLabel= isBowler ? phaseLabel(deathEcon, true)  : phaseLabel(deathSR, false)

    const formScore = computeFormScore(recentBat, recentBowl, role)

    // Rough last_30 counts
    const matches30Bat  = batRows.filter(r => matchDates[r.match_id] >= now30.toISOString().slice(0,10)).length
    const matches30Bowl = bowRows.filter(r => matchDates[r.match_id] >= now30.toISOString().slice(0,10)).length
    const matches30 = Math.max(matches30Bat, matches30Bowl)

    snapshots.push({
      player_name:    name,
      player_id:      p.id,
      role,
      team:           p.team,
      form_score:     formScore,
      form_delta:     0,         // computed in second pass below
      percentile:     0,         // computed in second pass below
      is_rising:      false,
      recent_sr:      calcSR(totBat.runs,  totBat.balls),
      recent_runs:    totBat.runs || null,
      recent_avg:     calcAvg(totBat.runs, totBat.outs),
      boundary_pct:   totBat.balls > 0 ? +((totBat.fours + totBat.sixes) / totBat.balls * 100).toFixed(2) : null,
      matches_total:  Math.max(batRows.length, bowRows.length),
      matches_last_30: matches30,
      recent_econ:    calcEcon(totBowl.runs, totBowl.balls),
      recent_wickets: totBowl.wkts || null,
      recent_bowl_sr: totBowl.wkts > 0 ? +((totBowl.balls / totBowl.wkts).toFixed(2)) : null,
      pp_sr: ppSR,    mid_sr: midSR,    death_sr: deathSR,
      pp_avg: calcAvg(totBat.pp_r, batRows.filter(r=>r.pp_balls>0).length),
      mid_avg: calcAvg(totBat.mid_r, batRows.filter(r=>r.mid_balls>0).length),
      death_avg: calcAvg(totBat.d_r, batRows.filter(r=>r.death_balls>0).length),
      pp_econ: ppEcon,    mid_econ: midEcon,    death_econ: deathEcon,
      pp_bowl_sr: totBowl.pp_w > 0   ? +((totBowl.pp_b  / totBowl.pp_w).toFixed(2))  : null,
      mid_bowl_sr: totBowl.mid_w > 0 ? +((totBowl.mid_b / totBowl.mid_w).toFixed(2)) : null,
      death_bowl_sr: totBowl.d_w > 0 ? +((totBowl.d_b   / totBowl.d_w).toFixed(2))   : null,
      pp_label: ppLabel, mid_label: midLabel, death_label: deathLabel,
      updated_at: new Date().toISOString(),
    })
  }

  // Second pass: percentiles and rising flag
  const scores = snapshots.map(s => s.form_score).sort((a, b) => a - b)
  for (const s of snapshots) {
    const rank = scores.filter(v => v <= s.form_score).length
    s.percentile = Math.round((rank / scores.length) * 100)
    s.is_rising  = s.form_score >= 70 && s.matches_last_30 >= 3
  }

  console.log(`  form snapshots: ${snapshots.length}`)
  await upsert('form_snapshots', snapshots, 'player_name')

  // Update tournament top performers
  console.log('\n── Updating tournament top performers ──')
  for (const tId of Object.keys(allTournaments)) {
    const tMatchIds = Object.values(allMatches).filter(m => m.tournament_id === tId).map(m => m.id)

    // Top batter by runs
    const batAgg = {}
    for (const b of allBatting.filter(b => tMatchIds.includes(b.match_id))) {
      if (!batAgg[b.player_name]) batAgg[b.player_name] = 0
      batAgg[b.player_name] += b.runs
    }
    const topBatter = Object.entries(batAgg).sort((a,b) => b[1]-a[1])[0]

    // Top bowler by wickets
    const bowlAgg = {}
    for (const b of allBowling.filter(b => tMatchIds.includes(b.match_id))) {
      if (!bowlAgg[b.player_name]) bowlAgg[b.player_name] = 0
      bowlAgg[b.player_name] += b.wickets
    }
    const topBowler = Object.entries(bowlAgg).sort((a,b) => b[1]-a[1])[0]

    await supabase.from('tournaments').update({
      top_batter_name: topBatter?.[0] || null,
      top_batter_stat: topBatter ? `${topBatter[1]} runs` : null,
      top_bowler_name: topBowler?.[0] || null,
      top_bowler_stat: topBowler ? `${topBowler[1]} wkts` : null,
    }).eq('id', tId)
  }

  console.log('\n✅ Pipeline complete!\n')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
