import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, TrendingUp, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FormBadge from '../components/FormBadge'
import { getPlayers, getRisingPlayers, getFormColor, toggleWatchlist, isWatchlisted } from '../lib/api'

const ROLES  = ['All', 'Batter', 'Bowler', 'All-rounder', 'WK-Batter']
const AGES   = ['All', 'U19', 'U23', '23-27', '27+']
const TYPES  = ['All', 'Pace', 'Spin']

export default function PlayerExplorer() {
  const navigate = useNavigate()
  const [players, setPlayers]   = useState([])
  const [rising,  setRising]    = useState([])
  const [loading, setLoading]   = useState(true)
  const [role,    setRole]      = useState('All')
  const [age,     setAge]       = useState('All')
  const [type,    setType]      = useState('All')
  const [search,  setSearch]    = useState('')
  const [wl,      setWl]        = useState([])

  useEffect(() => {
    getRisingPlayers(8).then(setRising)
  }, [])

  useEffect(() => {
    setLoading(true)
    const ageRange = { minAge: null, maxAge: null }
    if (age === 'U19')   { ageRange.maxAge = 18 }
    if (age === 'U23')   { ageRange.minAge = 19; ageRange.maxAge = 22 }
    if (age === '23-27') { ageRange.minAge = 23; ageRange.maxAge = 27 }
    if (age === '27+')   { ageRange.minAge = 28 }

    getPlayers({ role, bowlingType: type, search, ...ageRange })
      .then(data => { setPlayers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [role, age, type, search])

  const handleWatchlist = (e, name) => {
    e.stopPropagation()
    setWl(toggleWatchlist(name))
  }

  return (
    <div>
      <PageHeader
        title="Player Explorer"
        subtitle="Top prospects across Indian T20 leagues · Source: Cricsheet"
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

        {/* Rising talent strip */}
        {rising.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="live-dot w-2 h-2 bg-neon inline-block" />
              <h2 className="font-sans font-semibold text-sm tracking-wide text-text-primary uppercase">
                Rising Talent — Last 30 Days
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {rising.map(p => (
                <button
                  key={p.player_name}
                  onClick={() => navigate(`/players/${encodeURIComponent(p.player_name)}`)}
                  className="flex-shrink-0 w-52 bg-surface-elevated border border-border-subtle hover:border-electric/50 transition-all p-4 text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-sans font-semibold text-sm text-text-primary">{p.player_name}</p>
                      <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase">
                        {p.team || '—'} · {p.role}
                      </p>
                    </div>
                    <FormBadge score={p.form_score} size="sm" />
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <TrendingUp size={10} className="text-neon" />
                    <span className="font-mono text-[10px] text-neon">
                      {p.form_score >= 70 ? 'Rising form' : 'Notable'}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-text-secondary mt-1">
                    {p.role === 'Bowler'
                      ? `${p.recent_econ ?? '—'} ER · ${p.recent_wickets ?? '—'} wkts`
                      : `${p.recent_sr ?? '—'} SR · ${p.recent_runs ?? '—'} runs`}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="flex items-center gap-6 flex-wrap">
          <FilterGroup label="ROLE" options={ROLES} value={role} onChange={setRole} />
          <FilterGroup label="AGE"  options={AGES}  value={age}  onChange={setAge} />
          <FilterGroup label="TYPE" options={TYPES} value={type} onChange={setType} />
        </section>

        {/* Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-sans font-semibold text-sm tracking-wide text-text-primary uppercase">
              Top Prospects
            </h2>
            <span className="font-mono text-[10px] text-text-secondary">
              {loading ? 'Loading…' : `${players.length} players`}
            </span>
          </div>

          <div className="border border-border-subtle">
            <div className="grid grid-cols-[2rem_1fr_5rem_5rem_6rem_8rem_4rem_5rem] px-4 py-2 bg-surface-elevated border-b border-border-subtle">
              {['#', 'PLAYER', 'TEAM', 'ROLE', 'FORM', 'RECENT', 'MATS', 'ACTION'].map(h => (
                <span key={h} className="font-mono text-[9px] tracking-widest text-text-secondary uppercase">{h}</span>
              ))}
            </div>

            {loading && (
              <div className="px-4 py-10 text-center font-mono text-[11px] text-text-secondary">Loading…</div>
            )}

            {!loading && players.length === 0 && (
              <div className="px-4 py-10 text-center font-mono text-[11px] text-text-secondary">
                No players found. Run <code className="text-electric">node scripts/seed.js</code> to load Cricsheet data.
              </div>
            )}

            {players.map((p, i) => (
              <PlayerRow
                key={p.player_name}
                player={p}
                rank={i + 1}
                watchlisted={isWatchlisted(p.player_name)}
                onClick={() => navigate(`/players/${encodeURIComponent(p.player_name)}`)}
                onWatchlist={e => handleWatchlist(e, p.player_name)}
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

function PlayerRow({ player: p, rank, watchlisted, onClick, onWatchlist }) {
  const color = getFormColor(p.form_score)
  const isBowler = p.role === 'Bowler'

  return (
    <button
      onClick={onClick}
      className="w-full grid grid-cols-[2rem_1fr_5rem_5rem_6rem_8rem_4rem_5rem] px-4 py-3 border-b border-border-subtle hover:bg-surface-card transition-colors text-left"
    >
      <span className="font-mono text-[11px] text-text-secondary self-center">{rank}</span>

      <div className="self-center">
        <div className="flex items-center gap-2">
          <button onClick={onWatchlist} className="flex-shrink-0">
            <Star size={10} className={watchlisted ? 'text-neon fill-neon' : 'text-border-subtle'} />
          </button>
          <span className="font-sans font-semibold text-sm text-text-primary">{p.player_name}</span>
        </div>
        <span className="font-mono text-[9px] text-text-secondary tracking-wide">
          {p.state || p.team || '—'} {p.age ? `· ${p.age}y` : ''}
        </span>
      </div>

      <span className="font-mono text-[11px] text-text-secondary self-center">{p.team || '—'}</span>
      <span className="font-mono text-[11px] text-text-secondary self-center">{p.role}</span>

      <div className="self-center flex items-center gap-1.5">
        <span className="font-mono text-sm font-bold" style={{ color }}>{Math.round(p.form_score)}</span>
        {p.form_delta !== 0 && (
          <span className="font-mono text-[9px]" style={{ color: p.form_delta > 0 ? '#39FF14' : '#FF3131' }}>
            {p.form_delta > 0 ? '+' : ''}{p.form_delta?.toFixed(1)}
          </span>
        )}
      </div>

      <div className="self-center font-mono text-[10px] text-text-secondary">
        {isBowler
          ? <><span className="text-text-primary">{p.recent_econ ?? '—'}</span> ER · <span className="text-text-primary">{p.recent_wickets ?? '—'}</span> wkts</>
          : <><span className="text-text-primary">{p.recent_sr ?? '—'}</span> SR · <span className="text-text-primary">{p.recent_runs ?? '—'}</span> runs</>
        }
      </div>

      <span className="font-mono text-[11px] text-text-secondary self-center">{p.matches_total ?? '—'}</span>

      <div className="self-center">
        <span className="font-mono text-[9px] border border-electric/40 text-electric px-2 py-0.5">VIEW →</span>
      </div>
    </button>
  )
}
