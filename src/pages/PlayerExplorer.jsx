import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FormBadge from '../components/FormBadge'
import PhaseBar from '../components/PhaseBar'
import { PLAYERS, getFormColor } from '../data/players'

const ROLES   = ['All', 'Batter', 'Bowler', 'All-rounder', 'WK-Batter']
const AGES    = ['All', 'U19', 'U23', '23-27', '27+']
const TYPES   = ['All', 'Pace', 'Spin']

const RISING = PLAYERS.filter(p => p.risingPlayer)

export default function PlayerExplorer() {
  const navigate = useNavigate()
  const [roleFilter, setRoleFilter] = useState('All')
  const [ageFilter,  setAgeFilter]  = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [search,     setSearch]     = useState('')

  const filtered = PLAYERS.filter(p => {
    if (roleFilter !== 'All' && p.role !== roleFilter) return false
    if (typeFilter !== 'All' && p.bowlingType !== typeFilter) return false
    if (ageFilter === 'U19'   && p.age >= 19) return false
    if (ageFilter === 'U23'   && p.age >= 23) return false
    if (ageFilter === '23-27' && (p.age < 23 || p.age > 27)) return false
    if (ageFilter === '27+'   && p.age <= 27) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <PageHeader
        title="Player Explorer"
        subtitle={`Top prospects across Indian T20 leagues · Data: Cricsheet · Updated 4h ago`}
      >
        <div className="flex items-center gap-2 border border-border-subtle bg-surface-elevated px-3 py-1.5">
          <Search size={12} className="text-text-secondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            className="bg-transparent font-mono text-[11px] text-text-primary placeholder-text-secondary outline-none w-40"
          />
        </div>
      </PageHeader>

      <div className="px-8 py-6 space-y-8">
        {/* Rising Talent Strip */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="live-dot w-2 h-2 bg-neon inline-block" />
            <h2 className="font-sans font-semibold text-sm tracking-wide text-text-primary uppercase">
              Rising Talent — Last 30 Days
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {RISING.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/players/${p.id}`)}
                className="flex-shrink-0 w-52 bg-surface-elevated border border-border-subtle hover:border-electric/50 hover:glow-blue transition-all p-4 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-sans font-semibold text-sm text-text-primary">{p.shortName}</p>
                    <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">
                      {p.team} · {p.role}
                    </p>
                  </div>
                  <FormBadge score={p.formScore} size="sm" />
                </div>
                <div className="flex items-center gap-1 mt-3">
                  <TrendingUp size={10} className="text-neon" />
                  <span className="font-mono text-[10px] text-neon">
                    +{p.formDelta} pts
                  </span>
                </div>
                <p className="font-mono text-[10px] text-text-secondary mt-1">
                  {p.role === 'Bowler'
                    ? `${p.recentEcon} ER · ${p.recentWkts} wkts`
                    : `${p.recentSR} SR · ${p.boundaryPct}% BDY`}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section>
          <div className="flex items-center gap-6 flex-wrap">
            <FilterGroup label="ROLE" options={ROLES} value={roleFilter} onChange={setRoleFilter} />
            <FilterGroup label="AGE"  options={AGES}  value={ageFilter}  onChange={setAgeFilter} />
            <FilterGroup label="TYPE" options={TYPES} value={typeFilter} onChange={setTypeFilter} />
          </div>
        </section>

        {/* Player Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sans font-semibold text-sm tracking-wide text-text-primary uppercase">
              Top Prospects — Global Pool
            </h2>
            <span className="font-mono text-[10px] text-text-secondary">{filtered.length} players</span>
          </div>

          <div className="border border-border-subtle">
            {/* Table header */}
            <div className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_8rem_4rem_5rem] gap-0 border-b border-border-subtle bg-surface-elevated px-4 py-2">
              {['#', 'PLAYER', 'TEAM', 'ROLE', 'FORM', 'RECENT', 'MATS', 'ACTION'].map(h => (
                <span key={h} className="font-mono text-[9px] tracking-widest text-text-secondary uppercase">{h}</span>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center font-mono text-[11px] text-text-secondary">
                No players match the current filters.
              </div>
            )}

            {filtered.map((p, i) => (
              <PlayerRow
                key={p.id}
                player={p}
                rank={i + 1}
                onClick={() => navigate(`/players/${p.id}`)}
              />
            ))}
          </div>
        </section>
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

function PlayerRow({ player: p, rank, onClick }) {
  const color = getFormColor(p.formScore)

  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[2rem_1fr_5rem_5rem_6rem_8rem_4rem_5rem] gap-0 px-4 py-3 border-b border-border-subtle hover:bg-surface-card transition-colors text-left"
    >
      <span className="font-mono text-[11px] text-text-secondary self-center">{rank}</span>

      <div className="self-center">
        <div className="flex items-center gap-2">
          {p.watchlisted && <Star size={10} className="text-neon fill-neon flex-shrink-0" />}
          <span className="font-sans font-semibold text-sm text-text-primary">{p.name}</span>
        </div>
        <span className="font-mono text-[9px] text-text-secondary tracking-wide">{p.state} · {p.age}y</span>
      </div>

      <span className="font-mono text-[11px] text-text-secondary self-center">{p.team}</span>
      <span className="font-mono text-[11px] text-text-secondary self-center">{p.role}</span>

      <div className="self-center">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-bold" style={{ color }}>{p.formScore}</span>
          <span className="font-mono text-[9px]" style={{ color }}>
            {p.formDelta > 0 ? '+' : ''}{p.formDelta}
          </span>
        </div>
      </div>

      <div className="self-center font-mono text-[10px] text-text-secondary">
        {p.role === 'Bowler'
          ? <><span className="text-text-primary">{p.econ}</span> ER · <span className="text-text-primary">{p.wickets}</span> wkts</>
          : <><span className="text-text-primary">{p.sr}</span> SR · <span className="text-text-primary">{p.runs}</span> runs</>}
      </div>

      <span className="font-mono text-[11px] text-text-secondary self-center">{p.matches}</span>

      <div className="self-center">
        <span className="font-mono text-[9px] border border-electric/40 text-electric px-2 py-0.5">
          VIEW →
        </span>
      </div>
    </button>
  )
}
