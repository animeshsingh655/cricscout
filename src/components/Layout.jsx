import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, Users, Star, TrendingUp, Activity } from 'lucide-react'

const NAV = [
  { to: '/tournaments', icon: LayoutGrid,  label: 'Tournament Hub' },
  { to: '/players',     icon: Users,        label: 'Player Explorer' },
  { to: '/watchlist',   icon: Star,         label: 'Watchlist' },
  { to: '/rising',      icon: TrendingUp,   label: 'Rising Players' },
]

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#080C11] border-r border-border-subtle">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-2 mb-0.5">
            <Activity size={16} className="text-electric" />
            <span className="font-sans font-800 text-xs tracking-widest text-electric uppercase">CricScout</span>
          </div>
          <p className="font-mono text-[9px] text-text-secondary tracking-widest uppercase mt-0.5 ml-6">
            Intelligence · Beta
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          <p className="px-4 py-2 font-mono text-[9px] tracking-widest text-text-secondary uppercase">
            Navigation
          </p>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 font-mono text-[11px] tracking-wide uppercase transition-colors border-l-2 ${
                  isActive
                    ? 'text-electric border-electric bg-electric/5'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-elevated'
                }`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-border-subtle">
          <p className="font-mono text-[9px] text-[#3d4d5c] uppercase tracking-widest">
            Data: Cricsheet
          </p>
          <p className="font-mono text-[9px] text-[#3d4d5c] uppercase tracking-widest mt-0.5">
            © 2026 CricScout India
          </p>
          <p className="font-mono text-[9px] text-[#3d4d5c] uppercase tracking-widest mt-0.5">
            BETA v1.0.4
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-surface-base">
        {children}
      </main>
    </div>
  )
}
