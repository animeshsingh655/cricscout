import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Zap } from 'lucide-react'
import FormBadge from '../components/FormBadge'
import { getPlayerByName, getPlayerBattingHistory, getPlayerBowlingHistory, toggleWatchlist, isWatchlisted, getPhaseColor, getRecommendationStyle } from '../lib/api'

export default function PlayerCard() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const name       = decodeURIComponent(id)
  const [p,        setP]        = useState(null)
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [watchlisted, setWl]    = useState(false)

  useEffect(() => {
    setLoading(true)
    setWl(isWatchlisted(name))
    getPlayerByName(name).then(async data => {
      setP(data)
      if (data) {
        const hist = data.role === 'Bowler'
          ? await getPlayerBowlingHistory(name)
          : await getPlayerBattingHistory(name)
        setHistory(hist)
      }
      setLoading(false)
    })
  }, [name])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-mono text-[11px] text-text-secondary">
        Loading…
      </div>
    )
  }

  if (!p) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="font-mono text-text-secondary text-sm">Player not found.</p>
        <button onClick={() => navigate('/players')} className="mt-4 text-electric font-mono text-xs underline">
          ← Back to Explorer
        </button>
      </div>
    )
  }

  const isBowler  = p.role === 'Bowler'
  const recStyle  = getRecommendationStyle(p.form_score >= 85 ? 'Essential Acquire' : p.form_score >= 70 ? 'Priority Watch' : 'Monitor')

  const phases = [
    {
      key: 'pp',
      label: 'Powerplay', sub: 'Overs 1–6',
      sr: p.pp_sr, avg: p.pp_avg, econ: p.pp_econ, bowlSR: p.pp_bowl_sr,
      phaseLabel: p.pp_label,
    },
    {
      key: 'mid',
      label: 'Middle', sub: 'Overs 7–15',
      sr: p.mid_sr, avg: p.mid_avg, econ: p.mid_econ, bowlSR: p.mid_bowl_sr,
      phaseLabel: p.mid_label,
    },
    {
      key: 'death',
      label: 'Death', sub: 'Overs 16–20',
      sr: p.death_sr, avg: p.death_avg, econ: p.death_econ, bowlSR: p.death_bowl_sr,
      phaseLabel: p.death_label,
    },
  ]

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-4 px-8 pt-6 pb-4 border-b border-border-subtle">
        <button
          onClick={() => navigate('/players')}
          className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary hover:text-electric transition-colors tracking-widest uppercase"
        >
          <ArrowLeft size={11} /> Back
        </button>
        <span className="text-border-subtle">|</span>
        <span className="font-mono text-[10px] text-text-secondary tracking-widest uppercase">Player Card</span>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Hero */}
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-surface-card border border-border-subtle flex items-center justify-center flex-shrink-0">
            <span className="font-sans font-bold text-2xl text-text-secondary">
              {p.player_name.split(' ').map(n => n[0]).join('').slice(0,2)}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-sans font-bold text-2xl text-text-primary">{p.player_name}</h1>
              <button onClick={() => setWl(toggleWatchlist(p.player_name).includes(p.player_name))}>
                <Star size={14} className={watchlisted ? 'text-neon fill-neon' : 'text-border-subtle hover:text-neon'} />
              </button>
            </div>
            <p className="font-mono text-[11px] text-text-secondary tracking-wide">
              {[p.team, p.state, p.age ? `${p.age} yrs` : null, p.role, p.bowling_type, p.hand].filter(Boolean).join(' · ')}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 bg-neon inline-block" />
              <span className="font-mono text-[10px] text-neon tracking-widest uppercase">ACTIVE</span>
            </div>
          </div>
          <FormBadge score={Math.round(p.form_score)} size="lg" />
        </div>

        {/* Stat snapshot */}
        <div className="grid grid-cols-4 gap-px bg-border-subtle border border-border-subtle">
          {isBowler ? (
            <>
              <StatBox label="Wickets (Recent)" value={p.recent_wickets ?? '—'} unit="wkts" highlight />
              <StatBox label="Economy"           value={p.recent_econ   ?? '—'} unit="ER" />
              <StatBox label="Bowl Strike Rate"  value={p.recent_bowl_sr ?? '—'} unit="SR" />
              <StatBox label="Total Matches"     value={p.matches_total ?? '—'} unit="matches" />
            </>
          ) : (
            <>
              <StatBox label="Runs (Recent)"  value={p.recent_runs ?? '—'} unit="runs" highlight />
              <StatBox label="Strike Rate"    value={p.recent_sr   ?? '—'} unit="SR" />
              <StatBox label="Average"        value={p.recent_avg  ?? '—'} unit="avg" />
              <StatBox label="Total Matches"  value={p.matches_total ?? '—'} unit="matches" />
            </>
          )}
        </div>

        {/* Percentile */}
        <div className="border border-border-subtle bg-surface-elevated px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] text-text-secondary tracking-widest uppercase">
              Percentile Rank · Active T20 {isBowler ? 'Bowlers' : 'Batters'}
            </p>
            <span className="font-mono text-xl font-bold text-electric">{p.percentile ?? '—'}%</span>
          </div>
          <div className="h-1.5 bg-border-subtle relative">
            <div className="h-full bg-electric" style={{ width: `${p.percentile ?? 0}%` }} />
          </div>
          <p className="font-mono text-[9px] text-text-secondary mt-2">
            Better than {p.percentile ?? '—'}% of active T20 players this season
          </p>
        </div>

        {/* Phase performance */}
        <div>
          <h2 className="font-sans font-semibold text-sm text-text-primary uppercase tracking-wide mb-3">
            Phase-Split Performance
          </h2>
          <div className="grid grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
            {phases.map(ph => {
              const color = getPhaseColor(ph.phaseLabel || 'average')
              return (
                <div key={ph.key} className="bg-surface-base p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-sans font-semibold text-sm text-text-primary">{ph.label}</p>
                      <p className="font-mono text-[9px] text-text-secondary">{ph.sub}</p>
                    </div>
                    <span
                      className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5"
                      style={{ color, border: `1px solid ${color}50`, background: `${color}10` }}
                    >
                      {ph.phaseLabel || 'N/A'}
                    </span>
                  </div>
                  {isBowler ? (
                    <div className="space-y-2">
                      <StatLine label="Economy"      value={ph.econ   ?? '—'} color={color} />
                      <StatLine label="Strike Rate"  value={ph.bowlSR ?? '—'} color={color} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <StatLine label="Strike Rate"  value={ph.sr  ?? '—'} color={color} />
                      <StatLine label="Average"      value={ph.avg ?? '—'} color={color} />
                    </div>
                  )}
                  <div className="mt-3 h-0.5 bg-border-subtle">
                    <div
                      className="h-full"
                      style={{
                        width: isBowler
                          ? `${ph.econ  != null ? Math.max(5, 100 - ((ph.econ - 4) / 8) * 100) : 0}%`
                          : `${ph.sr   != null ? Math.min(100, (ph.sr / 250) * 100) : 0}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Match history */}
        {history.length > 0 && (
          <div>
            <h2 className="font-sans font-semibold text-sm text-text-primary uppercase tracking-wide mb-3">
              Recent Match History
            </h2>
            <div className="border border-border-subtle">
              <div className={`grid px-4 py-2 bg-surface-elevated border-b border-border-subtle ${isBowler ? 'grid-cols-[1fr_4rem_4rem_4rem_4rem]' : 'grid-cols-[1fr_4rem_4rem_4rem_4rem]'}`}>
                {isBowler
                  ? ['DATE', 'BALLS', 'RUNS', 'WKTS', 'ECON'].map(h => (
                      <span key={h} className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">{h}</span>
                    ))
                  : ['DATE', 'RUNS', 'BALLS', 'SR', 'FOURS'].map(h => (
                      <span key={h} className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">{h}</span>
                    ))
                }
              </div>
              {history.slice(0, 10).map((row, i) => (
                <div
                  key={i}
                  className={`grid px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-card transition-colors ${isBowler ? 'grid-cols-[1fr_4rem_4rem_4rem_4rem]' : 'grid-cols-[1fr_4rem_4rem_4rem_4rem]'}`}
                >
                  <span className="font-mono text-[10px] text-text-secondary">
                    {row.matches?.match_date || row.match_id?.slice(-10)}
                  </span>
                  {isBowler ? (
                    <>
                      <span className="font-mono text-[11px] text-text-secondary">{row.balls}</span>
                      <span className="font-mono text-[11px] text-text-secondary">{row.runs_conceded}</span>
                      <span className="font-mono text-[11px] text-electric">{row.wickets}</span>
                      <span className="font-mono text-[11px] text-text-secondary">
                        {row.balls > 0 ? ((row.runs_conceded / row.balls) * 6).toFixed(2) : '—'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-[11px] text-electric">{row.runs}</span>
                      <span className="font-mono text-[11px] text-text-secondary">{row.balls}</span>
                      <span className="font-mono text-[11px] text-text-secondary">
                        {row.balls > 0 ? ((row.runs / row.balls) * 100).toFixed(1) : '—'}
                      </span>
                      <span className="font-mono text-[11px] text-text-secondary">{row.fours}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value, unit, highlight }) {
  return (
    <div className="bg-surface-base px-5 py-4">
      <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-2">{label}</p>
      <p className="font-mono text-3xl font-bold" style={{ color: highlight ? '#00F0FF' : '#F7FAFC' }}>{value}</p>
      <p className="font-mono text-[9px] text-text-secondary mt-0.5 uppercase tracking-widest">{unit}</p>
    </div>
  )
}

function StatLine({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wide">{label}</span>
      <span className="font-mono text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  )
}
