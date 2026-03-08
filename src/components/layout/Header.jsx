import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '홈', emoji: '🏠' },
  { to: '/worldcup', label: '월드컵', emoji: '🏆' },
  { to: '/bracket', label: '대진표', emoji: '📊' },
  { to: '/results', label: '결과', emoji: '🥇' },
]

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-black text-white text-lg">
          <span>⛈️</span>
          <span>소나기 &amp; 소낙눈 &amp; 돌풍</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ to, label, emoji }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === to
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{emoji}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
