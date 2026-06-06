import { getPhaseColor } from '../data/players'

export default function PhaseBar({ phase, role = 'batter' }) {
  const phases = [
    { key: 'powerplay', label: 'PP' },
    { key: 'middle',    label: 'MID' },
    { key: 'death',     label: 'DTH' },
  ]

  return (
    <div className="flex gap-1">
      {phases.map(({ key, label }) => {
        const p = phase[key]
        if (!p) return null
        const color = getPhaseColor(p.label)
        const stat = role === 'bowler'
          ? `${p.econ?.toFixed(2)} ER`
          : `${p.sr?.toFixed(1)} SR`

        return (
          <div
            key={key}
            className="flex flex-col items-center gap-0.5 px-2 py-1 border"
            style={{ borderColor: `${color}40`, background: `${color}0D` }}
          >
            <span className="font-mono text-[8px] tracking-widest text-text-secondary uppercase">{label}</span>
            <span className="font-mono text-[10px] font-bold" style={{ color }}>{stat}</span>
          </div>
        )
      })}
    </div>
  )
}
