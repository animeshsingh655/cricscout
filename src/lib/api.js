import { supabase } from './supabase'
export { getFormColor, getFormLabel, getPhaseColor, getRecommendationStyle } from '../data/players'
export { getTierColor, getInterestColor } from '../data/tournaments'

// ── Players / Form Snapshots ───────────────────────────────────────────────

export async function getPlayers({ role, minAge, maxAge, bowlingType, search, limit = 100 } = {}) {
  let q = supabase
    .from('form_snapshots')
    .select('*')
    .order('form_score', { ascending: false })
    .limit(limit)

  if (role && role !== 'All')         q = q.eq('role', role)
  if (bowlingType && bowlingType !== 'All') q = q.eq('bowling_type', bowlingType)
  if (search)                          q = q.ilike('player_name', `%${search}%`)

  const { data, error } = await q
  if (error) throw error

  let rows = data || []
  if (minAge != null) rows = rows.filter(p => p.age == null || p.age >= minAge)
  if (maxAge != null) rows = rows.filter(p => p.age == null || p.age <= maxAge)
  return rows
}

export async function getRisingPlayers(limit = 8) {
  const { data, error } = await supabase
    .from('form_snapshots')
    .select('*')
    .eq('is_rising', true)
    .order('form_score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function getPlayer(name) {
  const { data, error } = await supabase
    .from('form_snapshots')
    .select('*')
    .ilike('player_name', name)
    .single()
  if (error) return null
  return data
}

export async function getPlayerByName(name) {
  const { data, error } = await supabase
    .from('form_snapshots')
    .select('*')
    .eq('player_name', decodeURIComponent(name))
    .maybeSingle()
  if (error) return null
  return data
}

export async function getPlayerBattingHistory(playerName, limit = 20) {
  const { data, error } = await supabase
    .from('batting_stats')
    .select('*, matches(match_date, tournament_id, team1, team2)')
    .eq('player_name', playerName)
    .order('matches(match_date)', { ascending: false })
    .limit(limit)
  if (error) return []
  return data || []
}

export async function getPlayerBowlingHistory(playerName, limit = 20) {
  const { data, error } = await supabase
    .from('bowling_stats')
    .select('*, matches(match_date, tournament_id, team1, team2)')
    .eq('player_name', playerName)
    .order('matches(match_date)', { ascending: false })
    .limit(limit)
  if (error) return []
  return data || []
}

// ── Tournaments ────────────────────────────────────────────────────────────

export async function getTournaments({ status, tier } = {}) {
  let q = supabase
    .from('tournaments')
    .select('*')
    .order('tier', { ascending: true })
    .order('start_date', { ascending: false })

  if (status && status !== 'All') q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw error

  let rows = data || []
  if (tier && tier !== 'All') {
    const tierNum = parseInt(tier.replace('TIER ', ''))
    rows = rows.filter(t => t.tier === tierNum)
  }
  return rows
}

// ── Watchlist (localStorage — no auth required) ────────────────────────────

const WL_KEY = 'cricscout_watchlist'

export function getWatchlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]') }
  catch { return [] }
}

export function toggleWatchlist(playerName) {
  const list = getWatchlist()
  const next = list.includes(playerName)
    ? list.filter(n => n !== playerName)
    : [...list, playerName]
  localStorage.setItem(WL_KEY, JSON.stringify(next))
  return next
}

export function isWatchlisted(playerName) {
  return getWatchlist().includes(playerName)
}

export async function getWatchlistPlayers() {
  const names = getWatchlist()
  if (!names.length) return []
  const { data, error } = await supabase
    .from('form_snapshots')
    .select('*')
    .in('player_name', names)
  if (error) return []
  return data || []
}
