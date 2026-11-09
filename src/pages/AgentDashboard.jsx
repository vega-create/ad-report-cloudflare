import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function AgentDashboard() {
  const [employeeStats, setEmployeeStats] = useState([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    // 每位員工任務數／今日完成數＋未回覆訊息數，由 /api/agent/stats 算好
    const d = await api.agent.stats().catch(() => ({ employeeStats: [], unreadMessages: 0 }))
    setEmployeeStats(d.employeeStats || [])
    setUnreadMessages(d.unreadMessages || 0)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-10 text-gray-400">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">主管總覽</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400">未讀訊息</p>
          <p className="text-3xl font-bold text-red-400">{unreadMessages}</p>
        </div>
        {employeeStats.map((emp) => (
          <div key={emp.name} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-sm text-gray-400">{emp.name} 今日</p>
            <p className="text-3xl font-bold text-white">{emp.completed}/{emp.total}</p>
            <p className="text-xs text-gray-500">{emp.rate}% 完成</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-5 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">員工今日進度</h2>
        </div>
        <div className="p-5 space-y-4">
          {employeeStats.map((emp) => (
            <div key={emp.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-300">{emp.name}</span>
                <span className="text-gray-500">{emp.completed}/{emp.total} ({emp.rate}%)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500 bg-blue-500"
                  style={{ width: Math.min(emp.rate, 100) + '%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/agent/messages" className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:bg-gray-750 transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
            <span className="text-2xl">💬</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">客戶訊息</p>
            <p className="text-sm text-gray-400">{unreadMessages} 則未回覆</p>
          </div>
        </Link>
        <Link to="/agent/tasks" className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:bg-gray-750 transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">任務管理</p>
            <p className="text-sm text-gray-400">查看所有任務</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
