import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, TrendingUp, AlertTriangle, CheckCircle, Download, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FormBadge from '../components/FormBadge'
import { PLAYERS, getFormColor, getPhaseColor, getRecommendationStyle } from '../data/players'

const WATCHLISTED = PLAYERS.filter(p => p.watchlisted)

export default function Watchlist() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Watchlist Intelligence"
        subtitle={`${WATCHLISTED.length} players tracked · AI-assisted scouting analysis`}
      >
        <button className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary border border-border-subtle px-3 py-1.5 hover:text-text-primary hover:border-electric/40 transition-colors uppercase tracking-widest">
          <Download size={11} /> Export
        </button>
        <button className="flex items-center gap-1.5 font-mono text-[10px] text-electric border border-electric/40 px-3 py-1.5 hover:bg-electric/10 transition-colors uppercase tracking-widest">
          <Plus size={11} /> Add Player
        </button>
      </PageHeader>

      <div className="px-8 py-6 space-y-6">
        {/* Comparison grid */}
        <div className="grid grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
          {WATCHLISTED.map(p => (
            <WatchCard key={p.id} player={p} onNavigate={() => navigate(`/players/${p.id}`)} />
          ))}
        </div>

        {/* Phase comparison table */}
        <div>
          <h2 className="font-sans font-semibold text-sm text-text-primary uppercase tracking-wide mb-3">
            Phase Heatmap Comparison
          </h2>
          <div className="border border-border-subtle">
            {/* Header */}
            <div className="grid grid-cols-[8rem_1fr_1fr_1fr] bg-surface-elevated border-b border-border-subtle">
              <div className="px-4 py-2 font-mono text-[9px] text-text-secondary tracking-widest uppercase">Phase</div>
              {WATCHLISTED.map(p => (
                <div key={p.id} className="px-4 py-2 font-mono text-[9px] text-text-secondary tracking-widest uppercase">
                  {p.shortName}
                </div>
              ))}
            </div>
            {[
              { key: 'powerplay', label: 'Powerplay' },
              { key: 'middle',    label: 'Middle' },
              { key: 'death',     label: 'Death' },
            ].map(({ key, label }) => (
              <div key={key} className="grid grid-cols-[8rem_1fr_1fr_1fr] border-b border-border-subtle last:border-b-0">
                <div className="px-4 py-3 font-mono text-[10px] text-text-secondary uppercase tracking-wide self-center">
                  {label}
                </div>
                {WATCHLISTED.map(p => {
                  const ph    = p.phase[key]
                  const color = getPhaseColor(ph.label)
                  const isBowler = p.role === 'Bowler'
                  const stat = isBowler
                    ? `${ph.econ?.toFixed(2)} ER`
                    : `${ph.sr?.toFixed(1)} SR`
                  return (
                    <div
                      key={p.id}
                      className="px-4 py-3 flex items-center gap-2"
                      style={{ background: `${color}08` }}
                    >
                      <div className="w-1.5 h-6 flex-shrink-0" style={{ background: color }} />
                      <div>
                        <p className="font-mono text-sm font-bold" style={{ color }}>{stat}</p>
                        <p className="font-mono text-[8px] uppercase tracking-widest" style={{ color: `${color}99` }}>
                          {ph.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WatchCard({ player: p, onNavigate }) {
  const isBowler = p.role === 'Bowler'
  const recStyle  = getRecommendationStyle(p.recommendation)
  const isPositive = p.formDelta >= 0

  return (
    <div className="bg-surface-base p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star size={11} className="text-neon fill-neon" />
            <h3 className="font-sans font-semibold text-base text-text-primary">{p.name}</h3>
          </div>
          <p className="font-mono text-[10px] text-text-secondary tracking-wide mt-0.5">
            {p.team} · {p.state} · {p.role}
          </p>
        </div>
        <FormBadge score={p.formScore} size="md" />
      </div>

      {/* Form delta */}
      <div className="flex items-center gap-2">
        {isPositive
          ? <TrendingUp size={12} className="text-neon" />
          : <AlertTriangle size={12} className="text-alert" />}
        <span
          className="font-mono text-sm font-bold"
          style={{ color: isPositive ? '#39FF14' : '#FF3131' }}
        >
          {isPositive ? '+' : ''}{p.formDelta} pts (30d)
        </span>
      </div>

      {/* Key stat */}
      <div className="bg-surface-card border border-border-subtle p-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">
            {isBowler ? 'Economy' : 'Strike Rate'}
          </p>
          <p className="font-mono text-xl font-bold text-electric">
            {isBowler ? p.econ?.toFixed(2) : p.sr?.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">
            {isBowler ? 'Wickets' : 'Runs'}
          </p>
          <p className="font-mono text-xl font-bold text-text-primary">
            {isBowler ? p.wickets : p.runs}
          </p>
        </div>
      </div>

      {/* Percentile bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="font-mono text-[9px] text-text-secondary uppercase tracking-widest">Percentile</span>
          <span className="font-mono text-[10px] text-electric font-bold">{p.percentile}%</span>
        </div>
        <div className="h-0.5 bg-border-subtle">
          <div className="h-full bg-electric" style={{ width: `${p.percentile}%` }} />
        </div>
      </div>

      {/* Scout note */}
      <div className="border-l-2 border-electric pl-3">
        <p className="font-mono text-[9px] text-text-secondary uppercase tracking-widest mb-1">Scout Note</p>
        <p className="font-sans text-[11px] text-text-primary leading-relaxed">{p.scoutNote}</p>
      </div>

      {/* Recommendation + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
        <span
          className="font-mono text-[9px] px-2 py-1 tracking-widest uppercase"
          style={{ color: recStyle.color, background: recStyle.bg, border: `1px solid ${recStyle.color}40` }}
        >
          {p.recommendation}
        </span>
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
