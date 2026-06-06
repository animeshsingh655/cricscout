export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between px-8 pt-7 pb-5 border-b border-border-subtle">
      <div>
        <h1 className="font-sans font-bold text-2xl tracking-tight text-text-primary">{title}</h1>
        {subtitle && (
          <p className="font-mono text-[11px] text-text-secondary mt-1 tracking-wide">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
