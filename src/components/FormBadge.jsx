import { getFormColor, getFormLabel } from '../data/players'

export default function FormBadge({ score, size = 'md' }) {
  const color = getFormColor(score)
  const label = getFormLabel(score)

  const sizes = {
    sm: { box: 'w-10 h-10', score: 'text-sm', label: 'text-[8px]' },
    md: { box: 'w-14 h-14', score: 'text-xl',  label: 'text-[9px]' },
    lg: { box: 'w-20 h-20', score: 'text-3xl', label: 'text-[10px]' },
  }
  const s = sizes[size] ?? sizes.md

  return (
    <div
      className={`${s.box} flex flex-col items-center justify-center border`}
      style={{ borderColor: color, background: `${color}12` }}
    >
      <span className={`font-mono font-bold ${s.score} leading-none`} style={{ color }}>
        {score}
      </span>
      <span className={`font-mono font-bold ${s.label} tracking-widest mt-0.5`} style={{ color }}>
        {label}
      </span>
    </div>
  )
}
