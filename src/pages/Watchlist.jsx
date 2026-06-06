import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, TrendingUp, AlertTriangle, Download, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FormBadge from '../components/FormBadge'
import { getWatchlistPlayers, getFormColor, getPhaseColor, toggleWatchlist } from '../lib/api'

export default function Watchlist() {
  const navigate       = useNavigate()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = () => {
    setLoading(true)
    getWatchlistPlayers().then(data => { setPlayers(data); setLoading(false) })
  }

  useEffect(() => { reload() }, [])

  const handleRemove = (name) => {
    toggleWatchlist(name)
    setPlayers(prev => prev.filter(p => p.player_name !== name))
  }

  return (
    <div>
      <PageHeader
        title="Watchlist Intelligence"
        subtitle={`${players.length} players tracked · AI-assisted scouting analysis`}
      >
        <button
          onClick={() => navigate('/players')}
          className="flex items-center gap-1.5 font-mono text-[10px] text-electric border border-electric/40 px-3 py-1.5 hover:bg-electric/10 transition-colors uppercase tracking-widest"
        >
          <Plus size={11} /> Add Players
        </button>
      </PageHeader>

      <div className="px-8 py-6">
        {loading && (
          <div className="text-center font-mono text-[11px] text-text-secondary py-10">Loading…</div>
        )}

        {!loading && players.length === 0 && (
          <div className="border border-border-subtle p-10 text-center">
            <p className="font-mono text-[11px] text-text-secondary">No players on your watchlist yet.</p>
            <p className="font-mono text-[10px] text-text-secondary mt-1">
              Click the ★ icon on any player in the Explorer to add them.
            </p>
            <button
              onClick={() => navigate('/players')}
              className="mt-4 font-mono text-[10px] text-electric border border-electric/40 px-3 py-1.5 hover:bg-electric/10 transition-colors uppercase tracking-widest"
            >
              Go to Explorer →
            </button>
          </div>
        )}

        {players.length > 0 && (
          <div className="space-y-8">
            {/* Comparison cards */}
            <div className={`grid gap-px bg-border-subtle border border-border-subtle ${players.length === 1 ? 'grid-cols-1' : players.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {players.map(p => (
                <WatchCard
                  key={p.player_name}
                  player={p}
                  onNavigate={() => navigate(`/players/${encodeURIComponent(p.player_name)}`)}
                  onRemove={() => handleRemove(p.player_name)}
                />
              ))}
            </div>

            {/* Phase comparison table */}
            {players.length > 1 && (
              <div>
                <h2 className="font-sans font-semibold text-sm text-text-primary uppercase tracking-wide mb-3">
                  Phase Heatmap Comparison
                </h2>
                <div className="border border-border-subtle">
                  <div
                    className="bg-surface-elevated border-b border-border-subtle"
                    style={{ display: 'grid', gridTemplateColumns: `8rem repeat(${players.length}, 1fr)` }}
                  >
                    <div className="px-4 py-2 font-mono text-[9px] text-text-secondary tracking-widest uppercase">Phase</div>
                    {players.map(p => (
                      <div key={p.player_name} className="px-4 py-2 font-mono text-[9px] text-text-secondary tracking-widest uppercase truncate">
                        {p.player_name.split(' ').slice(-1)[0]}
                      </div>
                    ))}
                  </div>
                  {[
                    { key: 'pp',    label: 'Powerplay' },
                    { key: 'mid',   label: 'Middle' },
                    { key: 'death', label: 'Death' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="border-b border-border-subtle last:border-b-0"
                      style={{ display: 'grid', gridTemplateColumns: `8rem repeat(${players.length}, 1fr)` }}
                    >
                      <div className="px-4 py-3 font-mono text-[10px] text-text-secondary uppercase tracking-wide self-center">
                        {label}
                      </div>
                      {players.map(p => {
                        const isBowler = p.role === 'Bowler'
                        const val   = isBowler ? p[`${key}_econ`]  : p[`${key}_sr`]
                        const lbl   = p[`${key}_label`] || 'average'
                        const color = getPhaseColor(lbl)
                        const stat  = val != null ? (isBowler ? `${val} ER` : `${val} SR`) : '—'
                        return (
                          <div key={p.player_name} className="px-4 py-3 flex items-center gap-2" style={{ background: `${color}08` }}>
                            <div className="w-1.5 h-6 flex-shrink-0" style={{ background: color }} />
                            <div>
                              <p className="font-mono text-sm font-bold" style={{ color }}>{stat}</p>
                              <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: `${color}99` }}>{lbl}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function WatchCard({ player: p, onNavigate, onRemove }) {
  const isBowler   = p.role === 'Bowler'
  const isPositive = (p.form_delta ?? 0) >= 0

  return (
    <div className="bg-surface-base p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star size={11} className="text-neon fill-neon" />
            <h3 className="font-sans font-semibold text-base text-text-primary">{p.player_name}</h3>
          </div>
          <p className="font-mono text-[10px] text-text-secondary tracking-wide mt-0.5">
            {[p.team, p.role].filter(Boolean).join(' · ')}
          </p>
        </div>
        <FormBadge score={Math.round(p.form_score)} size="md" />
      </div>

      <div className="flex items-center gap-2">
        {isPositive
          ? <TrendingUp size={12} className="text-neon" />
          : <AlertTriangle size={12} className="text-alert" />}
        <span className="font-mono text-sm font-bold" style={{ color: isPositive ? '#39FF14' : '#FF3131' }}>
          {isPositive ? '+' : ''}{(p.form_delta ?? 0).toFixed(1)} pts (30d)
        </span>
      </div>

      <div className="bg-surface-card border border-border-subtle p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">
            {isBowler ? 'Economy' : 'Strike Rate'}
          </p>
          <p className="font-mono text-xl font-bold text-electric">
            {isBowler ? (p.recent_econ ?? '—') : (p.recent_sr ?? '—')}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">
            {isBowler ? 'Wickets' : 'Runs'}
          </p>
          <p className="font-mono text-xl font-bold text-text-primary">
            {isBowler ? (p.recent_wickets ?? '—') : (p.recent_runs ?? '—')}
          </p>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <span className="font-mono text-[9px] text-text-secondary uppercase tracking-widest">Percentile</span>
          <span className="font-mono text-[10px] text-electric font-bold">{p.percentile ?? '—'}%</span>
        </div>
        <div className="h-0.5 bg-border-subtle">
          <div className="h-full bg-electric" style={{ width: `${p.percentile ?? 0}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
        <button
          onClick={onRemove}
          className="font-mono text-[9px] text-text-secondary border border-border-subtle px-2.5 py-1 hover:text-alert hover:border-alert/40 transition-colors uppercase tracking-widest"
        >
          Remove
        </button>
        <button
          onClick={onNavigate}
          className="font-mono text-[9px] text-electric border border-electric/40 px-2.5 py-1 hover:bg-electric/10 transition-colors uppercase tracking-widest"
        >
          Full Profile →
        </button>
      </div>
    </div>
  )
}
