import { useState, useEffect, useRef } from 'react'
import { supabaseAgent } from '../lib/supabase-agent'

export default function OperationLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [filterClient, setFilterClient] = useState('')
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [newLog, setNewLog] = useState({ client_name: '', platform: '', description: '' })
  const exportRef = useRef(null)

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [filterClient, filterMonth])

  async function fetchClients() {
    const { data: d1 } = await supabaseAgent.from('ad_operation_logs').select('client_name')
    const { data: d2 } = await supabaseAgent.from('ad_tasks').select('client_name')
    const all = [...(d1 || []), ...(d2 || [])].map(c => c.client_name)
    setClients([...new Set(all)].sort())
  }

  async function fetchLogs() {
    setLoading(true)
    const [year, month] = filterMonth.split('-').map(Number)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const nextMonth = month + 1 > 12 ? 1 : month + 1
    const nextYear = month + 1 > 12 ? year + 1 : year
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    let query = supabaseAgent
      .from('ad_operation_logs')
      .select('*')
      .gte('operation_date', startDate)
      .lt('operation_date', endDate)
      .order('operation_date', { ascending: false })

    if (filterClient) {
      query = query.eq('client_name', filterClient)
    }

    const { data } = await query
    setLogs(data || [])
    setLoading(false)
  }

  async function handleAddLog() {
    if (!newLog.client_name || !newLog.description) return
    const today = new Date().toLocaleDateString('sv-SE')

    await supabaseAgent.from('ad_operation_logs').insert({
      client_name: newLog.client_name,
      operation_date: today,
      platform: newLog.platform || null,
      description: newLog.description,
      raw_message: `(from web) ${newLog.description}`,
    })

    setNewLog({ client_name: '', platform: '', description: '' })
    setShowAddModal(false)
    fetchLogs()
    fetchClients()
  }

  async function handleDelete(id) {
    if (!confirm('確定要刪除這筆記錄？')) return
    await supabaseAgent.from('ad_operation_logs').delete().eq('id', id)
    fetchLogs()
  }

  async function handleExportPDF() {
    const html2pdf = (await import('html2pdf.js')).default
    const [year, month] = filterMonth.split('-').map(Number)
    const clientLabel = filterClient || '全部客戶'
    await html2pdf()
      .set({
        margin: [15, 15, 15, 15],
        filename: `${clientLabel}_${month}月操作記錄.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(exportRef.current)
      .save()
  }

  function handleExportMD() {
    const [year, month] = filterMonth.split('-').map(Number)
    const clientLabel = filterClient || '全部客戶'

    const grouped = {}
    logs.forEach(log => {
      const d = log.operation_date
      if (!grouped[d]) grouped[d] = []
      grouped[d].push(log)
    })

    let md = `# ${clientLabel} ${month}月操作記錄\n\n`
    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).forEach(([date, items]) => {
      const d = new Date(date)
      md += `## ${d.getMonth() + 1}/${d.getDate()}\n`
      items.forEach(log => {
        const p = log.platform ? `[${log.platform.toUpperCase()}] ` : ''
        md += `- ${p}${log.description}\n`
      })
      md += `\n`
    })
    md += `---\n共 ${logs.length} 筆操作\n`

    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${clientLabel}_${month}月操作記錄.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 按日期分組顯示
  const grouped = {}
  logs.forEach(log => {
    const d = log.operation_date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(log)
  })

  const platformColors = {
    facebook: 'bg-blue-600',
    google: 'bg-red-500',
    line: 'bg-green-500',
    website: 'bg-purple-500',
    other: 'bg-gray-500',
  }

  const platformLabels = {
    facebook: 'FB',
    google: 'Google',
    line: 'LINE',
    website: 'Web',
    other: '其他',
  }

  // 統計
  const platformCount = {}
  logs.forEach(log => {
    const p = log.platform || 'other'
    platformCount[p] = (platformCount[p] || 0) + 1
  })

  const clientCount = {}
  logs.forEach(log => {
    clientCount[log.client_name] = (clientCount[log.client_name] || 0) + 1
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">操作記錄</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">+ 新增記錄</button>
          <button onClick={handleExportMD} disabled={logs.length === 0} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">MD</button>
          <button onClick={handleExportPDF} disabled={logs.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">PDF</button>
        </div>
      </div>

      {/* 篩選 */}
      <div className="flex gap-4 mb-6">
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
          <option value="">全部客戶</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600" />
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">本月操作</p>
          <p className="text-2xl font-bold text-white">{logs.length} 筆</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">涵蓋客戶</p>
          <p className="text-2xl font-bold text-white">{Object.keys(clientCount).length} 位</p>
        </div>
        {Object.entries(platformCount).slice(0, 2).map(([p, count]) => (
          <div key={p} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">{platformLabels[p] || p}</p>
            <p className="text-2xl font-bold text-white">{count} 筆</p>
          </div>
        ))}
      </div>

      {/* 記錄列表 */}
      {loading ? (
        <p className="text-gray-400">載入中...</p>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📝</p>
          <p>還沒有操作記錄</p>
          <p className="text-sm mt-2">在 LINE 跟 AI 說你做了什麼，或點右上角新增</p>
        </div>
      ) : (
        <div ref={exportRef} className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
            const d = new Date(date)
            const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
            return (
              <div key={date}>
                <h3 className="text-gray-400 text-sm font-medium mb-3 sticky top-0 bg-gray-900 py-1">
                  {d.getMonth() + 1}/{d.getDate()} ({weekday}) — {items.length} 筆
                </h3>
                <div className="space-y-2">
                  {items.map(log => (
                    <div key={log.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-start justify-between group">
                      <div className="flex items-start gap-3">
                        {log.platform && (
                          <span className={`${platformColors[log.platform] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded font-medium mt-0.5`}>
                            {platformLabels[log.platform] || log.platform}
                          </span>
                        )}
                        <div>
                          <span className="text-blue-400 font-medium mr-2">{log.client_name}</span>
                          <span className="text-white">{log.description}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(log.id)} className="text-red-400 hover:text-red-300 text-sm opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0">
                        刪除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 新增 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">新增操作記錄</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">客戶</label>
                <input list="client-list" value={newLog.client_name} onChange={e => setNewLog({ ...newLog, client_name: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600" placeholder="輸入客戶名稱" />
                <datalist id="client-list">
                  {clients.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">平台</label>
                <select value={newLog.platform} onChange={e => setNewLog({ ...newLog, platform: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
                  <option value="">不指定</option>
                  <option value="facebook">Facebook</option>
                  <option value="google">Google</option>
                  <option value="line">LINE</option>
                  <option value="website">Website</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">操作內容</label>
                <textarea value={newLog.description} onChange={e => setNewLog({ ...newLog, description: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 h-24 resize-none" placeholder="調整 ROAS 出價從 15 改 20" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <button onClick={handleAddLog} disabled={!newLog.client_name || !newLog.description}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">儲存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
