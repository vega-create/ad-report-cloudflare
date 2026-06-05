import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const navGroups = [
    { label: '總覽', items: [
      { path: '/', label: '首頁', icon: '🏠' },
      { path: '/daily-plans', label: '每日計畫', icon: '🎯' },
    ]},
    { label: '廣告業務', items: [
      { path: '/clients', label: '客戶管理', icon: '👥' },
      { path: '/tasks', label: '廣告任務', icon: '📋' },
      { path: '/reports', label: '報告列表', icon: '📊' },
      { path: '/reports/new', label: '建立報告', icon: '➕' },
      { path: '/proposals', label: '提案', icon: '📑' },
    ]},
    { label: 'AI 助理', items: [
      { path: '/agent', label: '智慧媽咪', icon: '🤖' },
      { path: '/agent/tasks', label: '員工任務', icon: '👩‍💼' },
    ]},
    { label: '其他', items: [
      { path: '/guide', label: '使用說明', icon: '📖' },
      { path: 'https://short-url.quickhub.cc/vega888admin', label: '短網址', icon: '🔗', external: true },
    ]},
  ]
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">📈 AdReport</h1>
          <p className="text-sm text-gray-400 mt-1">廣告報告系統</p>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    {item.external ? (
                      <a href={item.path} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 text-sm">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <Link to={item.path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">v1.0.0 · Made with ❤️</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8"><Outlet /></div>
      </main>
    </div>
  )
}
