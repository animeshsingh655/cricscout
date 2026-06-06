import { useState } from 'react'
import { Clock, Trophy, ChevronRight, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { TOURNAMENTS, getTierColor, getInterestColor } from '../data/tournaments'

const STATUS_FILTERS = ['All', 'ONGOING', 'UPCOMING', 'COMPLETED']
const TIER_FILTERS   = ['All', 'TIER 1', 'TIER 2', 'TIER 3']

export default function TournamentHub() {
  const [statusFilter, setStatusFilter] = useState('All')
  const [tierFilter,   setTierFilter]   = useState('All')

  const ongoing   = TOURNAMENTS.filter(t => t.status === 'ONGOING')
  const upcoming  = TOURNAMENTS.filter(t => t.status === 'UPCOMING')
  const completed = TOURNAMENTS.filter(t => t.status === 'COMPLETED')

  const filtered = TOURNAMENTS.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false
    if (tierFilter   !== 'All' && t.tierLabel !== tierFilter) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Tournament Hub"
        subtitle={`${ongoing.length + upcoming.length} Active & Upcoming Indian T20 Leagues`}
      />

      <div className="px-8 py-6 space-y-8">
        {/* Summary chips */}
        <div className="flex gap-4">
          {[
            { label: 'ONGOING',   value: ongoing.length,   color: '#39FF14' },
            { label: 'UPCOMING',  value: upcoming.length,  color: '#00F0FF' },
            { label: 'COMPLETED', value: completed.length, color: '#94A3B8' },
          ].map(({ label, value, color }) => (
            <div key={label} className="border border-border-subtle bg-surface-elevated px-4 py-2 flex items-center gap-3">
              <span className="font-mono text-2xl font-bold" style={{ color }}>{value}</span>
              <span className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">{label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-6">
          <FilterGroup label="STATUS" options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
          <FilterGroup label="TIER"   options={TIER_FILTERS}   value={tierFilter}   onChange={setTierFilter} />
        </div>

        {/* Tournament Grid */}
        <div className="grid grid-cols-1 gap-px bg-border-subtle border border-border-subtle">
          {filtered.map(t => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
          {filtered.length === 0 && (
            <div className="bg-surface-base px-6 py-10 text-center font-mono text-[11px] text-text-secondary">
              No tournaments match the filters.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TournamentCard({ tournament: t }) {
  const tierColor = getTierColor(t.tier)
  const progress  = t.totalMatches ? (t.matchesPlayed / t.totalMatches) * 100 : 0

  return (
    <div className="bg-surface-base hover:bg-surface-elevated transition-colors px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {t.status === 'ONGOING' && (
              <span className="flex items-center gap-1">
                <span className="live-dot w-1.5 h-1.5 bg-neon inline-block" />
                <span className="font-mono text-[8px] text-neon tracking-widest uppercase">Live</span>
              </span>
            )}
            {t.status === 'UPCOMING' && (
              <span className="font-mono text-[8px] text-electric tracking-widest uppercase">Upcoming</span>
            )}
            {t.status === 'COMPLETED' && (
              <span className="font-mono text-[8px] text-text-secondary tracking-widest uppercase">Completed</span>
            )}
            <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: tierColor }}>
              {t.tierLabel}
            </span>
            <span className="font-mono text-[8px] text-text-secondary tracking-widest uppercase">· {t.level}</span>
          </div>

          <h3 className="font-sans font-semibold text-base text-text-primary">{t.name}</h3>

          <div className="flex items-center gap-4 mt-1">
            <span className="font-mono text-[10px] text-text-secondary">
              {t.startDate} — {t.endDate}
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-text-secondary">
              <Users size={9} />
              {t.teams} teams
            </span>
          </div>

          {/* Progress bar */}
          {t.status !== 'UPCOMING' && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-0.5 bg-border-subtle">
                <div
                  className="h-full transition-all"
                  style={{ width: `${progress}%`, background: t.status === 'COMPLETED' ? '#3d4d5c' : '#00F0FF' }}
                />
              </div>
              <span className="font-mono text-[9px] text-text-secondary whitespace-nowrap">
                {t.matchesPlayed}/{t.totalMatches} matches
              </span>
            </div>
          )}

          {t.status === 'UPCOMING' && t.countdown && (
            <div className="flex items-center gap-1.5 mt-2">
              <Clock size={10} className="text-electric" />
              <span className="font-mono text-[10px] text-electric">Starts in {t.countdown}</span>
            </div>
          )}
        </div>

        {/* Right: stats */}
        <div className="flex-shrink-0 flex gap-6">
          {t.status === 'COMPLETED' && t.winner && (
            <div className="text-right">
              <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">Winner</p>
              <div className="flex items-center gap-1">
                <Trophy size={10} className="text-[#FFD700]" />
                <span className="font-mono text-[11px] text-text-primary">{t.winner}</span>
              </div>
              <p className="font-mono text-[9px] text-text-secondary mt-0.5">MVP: {t.mvp}</p>
            </div>
          )}

          {t.topBatter && (
            <div className="text-right">
              <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">Top Bat</p>
              <p className="font-mono text-[11px] text-text-primary">{t.topBatter.name}</p>
              <p className="font-mono text-[10px]" style={{ color: '#00F0FF' }}>{t.topBatter.stat}</p>
            </div>
          )}

          {t.topBowler && (
            <div className="text-right">
              <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">Top Bowl</p>
              <p className="font-mono text-[11px] text-text-primary">{t.topBowler.name}</p>
              <p className="font-mono text-[10px]" style={{ color: '#ADFF2F' }}>{t.topBowler.stat}</p>
            </div>
          )}

          <div className="text-right">
            <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mb-0.5">Scout ∆</p>
            <p className="font-mono text-sm font-bold" style={{ color: getInterestColor(t.scoutInterest) }}>
              {t.scoutPoints.toLocaleString()}
            </p>
            <p className="font-mono text-[9px] text-text-secondary">{t.scoutInterest}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">{label}</span>
      <div className="flex">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 font-mono text-[10px] tracking-wide border border-r-0 last:border-r transition-colors ${
              value === opt
                ? 'bg-electric/10 text-electric border-electric/50'
                : 'bg-surface-elevated text-text-secondary border-border-subtle hover:text-text-primary'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
