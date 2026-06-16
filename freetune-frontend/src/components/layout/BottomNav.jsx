import { useNavigate, useLocation } from 'react-router-dom'

const TABS = [
  { path: '/', label: 'Home',
    icon: a => <svg viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
  { path: '/search', label: 'Search',
    icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg> },
  { path: '/library', label: 'Library',
    icon: a => <svg viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg> },
]

export default function BottomNav() {
  const navigate = useNavigate(), loc = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-subtle flex items-center justify-around h-16">
      {TABS.map(({ path, label, icon }) => {
        const active = loc.pathname === path
        return (
          <button key={path} onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-1 py-2 px-8 transition-colors ${active ? 'text-green' : 'text-muted'}`}>
            {icon(active)}
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
