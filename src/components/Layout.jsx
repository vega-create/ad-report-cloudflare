import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Layout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [location.pathname]) // 換頁自動收起
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
      {/* 手機頂欄 */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
        <span className="text-white font-bold">📈 AdReport</span>
        <button type="button" onClick={() => setOpen(o => !o)} aria-label="選單"
          className="text-gray-200 text-2xl leading-none px-2 py-1 rounded hover:bg-gray-700">{open ? '✕' : '☰'}</button>
      </header>
      {/* 手機遮罩 */}
      {open && <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />}
      <aside className={`w-64 bg-gray-800 border-r border-gray-700 flex flex-col fixed md:static inset-y-0 left-0 z-50 transform transition-transform md:transform-none ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
      <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0">
        <div className="p-4 sm:p-6 md:p-8"><Outlet /></div>
      </main>
    </div>
  )
}
