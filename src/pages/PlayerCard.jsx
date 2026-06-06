import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import FormBadge from '../components/FormBadge'
import { PLAYERS, getFormColor, getPhaseColor, getRecommendationStyle } from '../data/players'

export default function PlayerCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const p = PLAYERS.find(pl => pl.id === id)

  if (!p) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary font-mono text-sm">
        <p>Player not found.</p>
        <button onClick={() => navigate('/players')} className="mt-4 text-electric underline text-xs">
          ← Back to Explorer
        </button>
      </div>
    )
  }

  const isBowler = p.role === 'Bowler'
  const recStyle = getRecommendationStyle(p.recommendation)

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
        {/* Hero row */}
        <div className="flex items-start gap-6">
          {/* Avatar placeholder */}
          <div className="w-20 h-20 bg-surface-card border border-border-subtle flex items-center justify-center flex-shrink-0">
            <span className="font-sans font-bold text-2xl text-text-secondary">
              {p.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-sans font-bold text-2xl text-text-primary">{p.name}</h1>
              {p.watchlisted && <Star size={14} className="text-neon fill-neon" />}
              <span
                className="font-mono text-[9px] px-2 py-0.5 tracking-widest uppercase"
                style={{ color: recStyle.color, background: recStyle.bg, border: `1px solid ${recStyle.color}40` }}
              >
                {p.recommendation}
              </span>
            </div>
            <p className="font-mono text-[11px] text-text-secondary tracking-wide">
              {p.team} · {p.state} · {p.age} yrs · {p.role}
              {p.bowlingType ? ` · ${p.bowlingType}` : ''} · {p.hand}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 bg-neon inline-block" />
              <span className="font-mono text-[10px] text-neon tracking-widest uppercase">{p.status}</span>
              <span className="font-mono text-[10px] text-text-secondary">· IPL 2026</span>
            </div>
          </div>

          <FormBadge score={p.formScore} size="lg" />
        </div>

        {/* Stat snapshot */}
        <div className="grid grid-cols-4 gap-px bg-border-subtle border border-border-subtle">
          {isBowler ? (
            <>
              <StatBox label="Wickets (Last 10)" value={p.recentWkts} unit="wkts" highlight />
              <StatBox label="Economy" value={p.econ?.toFixed(2)} unit="ER" />
              <StatBox label="Strike Rate" value={p.sr?.toFixed(1)} unit="SR" />
              <StatBox label="Form Delta" value={`+${p.formDelta}`} unit="pts" color="#39FF14" />
            </>
          ) : (
            <>
              <StatBox label="Runs (Season)" value={p.runs} unit="runs" highlight />
              <StatBox label="Strike Rate" value={p.sr?.toFixed(1)} unit="SR" />
              <StatBox label="Average" value={p.avg?.toFixed(1)} unit="avg" />
              <StatBox label="Form Delta" value={`+${p.formDelta}`} unit="pts" color="#39FF14" />
            </>
          )}
        </div>

        {/* Percentile */}
        <div className="border border-border-subtle bg-surface-elevated px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] text-text-secondary tracking-widest uppercase">
              Percentile Rank · Active T20 {isBowler ? 'Pace Bowlers' : 'Batters'} (248 total)
            </p>
            <span className="font-mono text-xl font-bold text-electric">{p.percentile}%</span>
          </div>
          <div className="h-1.5 bg-border-subtle relative">
            <div
              className="h-full bg-electric"
              style={{ width: `${p.percentile}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-4 bg-electric"
              style={{ left: `calc(${p.percentile}% - 4px)` }}
            />
          </div>
          <p className="font-mono text-[9px] text-text-secondary mt-2">
            Better than {p.percentile}% of active {isBowler ? 'pace bowlers' : 'T20 batters'} this season
          </p>
        </div>

        {/* Phase performance */}
        <div>
          <h2 className="font-sans font-semibold text-sm text-text-primary uppercase tracking-wide mb-3">
            Phase-Split Performance
          </h2>
          <div className="grid grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
            {[
              { key: 'powerplay', label: 'Powerplay', sub: 'Overs 1-6' },
              { key: 'middle',    label: 'Middle',    sub: 'Overs 7-15' },
              { key: 'death',     label: 'Death',     sub: 'Overs 16-20' },
            ].map(({ key, label, sub }) => {
              const ph    = p.phase[key]
              const color = getPhaseColor(ph.label)
              return (
                <div key={key} className="bg-surface-base p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-sans font-semibold text-sm text-text-primary">{label}</p>
                      <p className="font-mono text-[9px] text-text-secondary">{sub}</p>
                    </div>
                    <span
                      className="font-mono text-[8px] tracking-widest uppercase px-2 py-0.5"
                      style={{ color, border: `1px solid ${color}50`, background: `${color}10` }}
                    >
                      {ph.label}
                    </span>
                  </div>
                  {isBowler ? (
                    <div className="space-y-2">
                      <StatLine label="Economy" value={ph.econ?.toFixed(2)} color={color} />
                      <StatLine label="Strike Rate" value={ph.sr?.toFixed(1)} color={color} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <StatLine label="Strike Rate" value={ph.sr?.toFixed(1)} color={color} />
                      <StatLine label="Average" value={ph.avg?.toFixed(1)} color={color} />
                    </div>
                  )}
                  {/* Phase bar */}
                  <div className="mt-3 h-0.5 bg-border-subtle">
                    <div
                      className="h-full"
                      style={{
                        width: isBowler
                          ? `${Math.max(5, 100 - ((ph.econ - 4) / 8) * 100)}%`
                          : `${Math.min(100, (ph.sr / 250) * 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scout intelligence */}
        <div className="border border-border-subtle bg-surface-elevated px-6 py-4 flex items-start gap-4">
          <Zap size={14} className="text-electric flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-1">Scout Intelligence</p>
            <p className="font-sans text-sm text-text-primary leading-relaxed">{p.scoutNote}</p>
          </div>
        </div>

        {/* Tournament history */}
        <div>
          <h2 className="font-sans font-semibold text-sm text-text-primary uppercase tracking-wide mb-3">
            Tournament History
          </h2>
          <div className="border border-border-subtle">
            <div className="grid grid-cols-[1fr_4rem_4rem_5rem_5rem] px-4 py-2 bg-surface-elevated border-b border-border-subtle">
              {['TOURNAMENT', 'MATS', isBowler ? 'WKTS' : 'RUNS', isBowler ? 'ECON' : 'SR', isBowler ? 'OVERS' : 'AVG'].map(h => (
                <span key={h} className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">{h}</span>
              ))}
            </div>
            {p.tournaments.map((t, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_4rem_4rem_5rem_5rem] px-4 py-3 border-b border-border-subtle last:border-b-0 hover:bg-surface-card transition-colors"
              >
                <span className="font-sans text-sm text-text-primary">{t.name}</span>
                <span className="font-mono text-[11px] text-text-secondary">{t.matches}</span>
                <span className="font-mono text-[11px] text-electric">{isBowler ? t.wickets : t.runs}</span>
                <span className="font-mono text-[11px] text-text-secondary">{isBowler ? t.econ?.toFixed(2) : t.sr?.toFixed(1)}</span>
                <span className="font-mono text-[11px] text-text-secondary">{isBowler ? t.overs : t.avg?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, unit, highlight, color }) {
  return (
    <div className="bg-surface-base px-5 py-4">
      <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-2">{label}</p>
      <p
        className="font-mono text-3xl font-bold"
        style={{ color: color ?? (highlight ? '#00F0FF' : '#F7FAFC') }}
      >
        {value}
      </p>
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
