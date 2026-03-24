import { useEffect, useState } from 'react'
import { supabaseAgent as supabase } from '../lib/supabase-agent'
import { supabase as supabaseAd } from '../lib/supabase'

const priorityEmoji = { red: '🔴', yellow: '🟡', green: '🟢' }
const categoryLabel = { facebook: 'FB', google: 'Google', client: '客戶', keyword: '關鍵字' }

export default function QuickLogs() {
  const [logs, setLogs] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  // 篩選
  const [clientFilter, setClientFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('30')

  // MD 解析模式
  const [showParser, setShowParser] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedResult, setParsedResult] = useState(null)

  // 手動填表模式
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    period_start: '',
    period_end: '',
    fb_spend: '',
    fb_metrics: '',
    google_spend: '',
    google_metrics: '',
    next_actions: '',
    notes: '',
  })

  // 載入資料
  async function loadLogs() {
    setLoading(true)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateFilter))

    let query = supabase
      .from('ad_quick_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (clientFilter !== 'all') {
      query = query.eq('client_name', clientFilter)
    }

    const { data } = await query
    setLogs(data || [])
    setLoading(false)
  }

  async function loadClients() {
    const { data } = await supabaseAd.from('clients').select('name').order('name')
    setClients((data || []).map(c => c.name))
  }

  useEffect(() => { loadClients() }, [])
  useEffect(() => { loadLogs() }, [clientFilter, dateFilter])

  // === MD 解析流程 ===
  async function handleParseMD() {
    if (!markdown.trim()) return
    setIsParsing(true)
    try {
      const res = await fetch('/api/parse-quick-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      })
      const data = await res.json()
      if (data.error) {
        alert('解析失敗：' + data.error)
      } else {
        setParsedResult(data)
      }
    } catch (e) {
      alert('解析失敗：' + e.message)
    }
    setIsParsing(false)
  }

  async function handleConfirmParsed() {
    if (!parsedResult) return
    try {
      // 1. 存入 ad_quick_logs
      const logRow = {
        client_name: parsedResult.client_name,
        period_start: parsedResult.period_start,
        period_end: parsedResult.period_end,
        spend_summary: parsedResult.spend_summary,
        next_actions: parsedResult.next_actions || '',
        notes: parsedResult.notes || '',
        raw_markdown: markdown,
      }

      // 嘗試找到 client_id
      const { data: clientData } = await supabaseAd
        .from('clients')
        .select('id')
        .eq('name', parsedResult.client_name)
        .single()
      if (clientData) logRow.client_id = clientData.id

      await supabase.from('ad_quick_logs').insert([logRow])

      // 2. 如果有 tasks，存入 ad_tasks
      if (parsedResult.tasks && parsedResult.tasks.length > 0) {
        const taskRows = parsedResult.tasks.map(t => ({
          client_name: parsedResult.client_name,
          report_date: parsedResult.period_end || new Date().toISOString().split('T')[0],
          task: t.task,
          category: t.category,
          priority: t.priority,
          estimated_minutes: t.estimated_minutes,
          scheduled_date: t.scheduled_date,
          scheduled_time: t.scheduled_time,
          status: 'pending',
        }))
        await supabase.from('ad_tasks').insert(taskRows)
      }

      // 重置
      setParsedResult(null)
      setShowParser(false)
      setMarkdown('')
      loadLogs()
    } catch (e) {
      alert('儲存失敗：' + e.message)
    }
  }

  // === 手動填表流程 ===
  async function handleFormSave() {
    const { client_name, period_start, period_end } = formData
    if (!client_name || !period_start || !period_end) {
      alert('請填寫客戶名稱和廣告期間')
      return
    }

    const spend_summary = []
    if (formData.fb_spend) {
      spend_summary.push({
        platform: 'Facebook',
        amount: parseInt(formData.fb_spend.replace(/,/g, '')) || 0,
        metrics: formData.fb_metrics || '-',
      })
    }
    if (formData.google_spend) {
      spend_summary.push({
        platform: 'Google',
        amount: parseInt(formData.google_spend.replace(/,/g, '')) || 0,
        metrics: formData.google_metrics || '-',
      })
    }

    const logRow = {
      client_name,
      period_start,
      period_end,
      spend_summary,
      next_actions: formData.next_actions || '',
      notes: formData.notes || '',
    }

    const { data: clientData } = await supabaseAd
      .from('clients')
      .select('id')
      .eq('name', client_name)
      .single()
    if (clientData) logRow.client_id = clientData.id

    await supabase.from('ad_quick_logs').insert([logRow])

    setFormData({
      client_name: '', period_start: '', period_end: '',
      fb_spend: '', fb_metrics: '', google_spend: '', google_metrics: '',
      next_actions: '', notes: '',
    })
    setShowForm(false)
    loadLogs()
  }

  // 計算總花費
  function getTotalSpend(spendSummary) {
    if (!spendSummary || !Array.isArray(spendSummary)) return 0
    return spendSummary.reduce((sum, s) => sum + (s.amount || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* 標題 + 按鈕 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">快速記錄</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowParser(!showParser); setShowForm(false) }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showParser ? '收起' : '📋 貼 MD 記錄'}
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowParser(false) }}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            {showForm ? '收起' : '✏️ 手動填寫'}
          </button>
        </div>
      </div>

      {/* === MD 解析區 === */}
      {showParser && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-white">貼入快速記錄 Markdown</h2>
          <p className="text-sm text-gray-400">
            用 Claude 的 ad-quick-log skill 產出的 MD，直接貼在這裡解析
          </p>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={10}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`# 快速記錄：寵樂芙 | 2026-03-01 ~ 2026-03-15\n\n## 花費摘要\n| 平台 | 花費 | 主要指標 |\n|------|------|----------|\n| Facebook | NT$8,000 | ROAS 2.3 |\n\n## 下次調整\n- 🟡 FB 受眾年齡調高到 30-45`}
          />
          <button
            onClick={handleParseMD}
            disabled={isParsing || !markdown.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isParsing ? '解析中...' : '解析記錄'}
          </button>
        </div>
      )}

      {/* === 解析結果確認 === */}
      {parsedResult && (
        <div className="bg-gray-800 rounded-xl border border-blue-500 p-5 space-y-4">
          <h2 className="font-semibold text-white">確認解析結果</h2>

          {/* 基本資訊 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">客戶</p>
              <p className="text-white font-medium">{parsedResult.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">期間</p>
              <p className="text-white">{parsedResult.period_start} ~ {parsedResult.period_end}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">總花費</p>
              <p className="text-white font-medium">
                NT${getTotalSpend(parsedResult.spend_summary).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 花費明細 */}
          {parsedResult.spend_summary?.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">花費明細</p>
              <div className="space-y-1">
                {parsedResult.spend_summary.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-700 rounded-lg px-3 py-2">
                    <span className="text-white font-medium w-20">{s.platform}</span>
                    <span className="text-blue-400">NT${(s.amount || 0).toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">{s.metrics}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 任務預覽 */}
          {parsedResult.tasks?.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">
                將自動建立 {parsedResult.tasks.length} 個任務
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {parsedResult.tasks.map((t, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-3 flex items-start gap-3">
                    <span className="text-lg">{priorityEmoji[t.priority] || '🟡'}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{t.task}</p>
                      <p className="text-sm text-gray-400">
                        {categoryLabel[t.category] || t.category} · {t.scheduled_date} {t.scheduled_time} · {t.estimated_minutes}分鐘
                      </p>
                      {t.reasoning && <p className="text-xs text-gray-500 mt-1">{t.reasoning}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 備註 */}
          {parsedResult.notes && (
            <div>
              <p className="text-sm text-gray-400">備註</p>
              <p className="text-gray-300">{parsedResult.notes}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={handleConfirmParsed}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              確認儲存
            </button>
            <button
              onClick={() => setParsedResult(null)}
              className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* === 手動填表區 === */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-white">手動填寫記錄</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">客戶名稱 *</label>
              <select
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">請選擇</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">開始日期 *</label>
              <input
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">結束日期 *</label>
              <input
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* FB 花費 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Facebook 花費</label>
              <input
                type="text"
                value={formData.fb_spend}
                onChange={(e) => setFormData({ ...formData, fb_spend: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：8000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">FB 指標</label>
              <input
                type="text"
                value={formData.fb_metrics}
                onChange={(e) => setFormData({ ...formData, fb_metrics: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：ROAS 2.3, CPA $120"
              />
            </div>
          </div>

          {/* Google 花費 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Google 花費</label>
              <input
                type="text"
                value={formData.google_spend}
                onChange={(e) => setFormData({ ...formData, google_spend: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：4000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Google 指標</label>
              <input
                type="text"
                value={formData.google_metrics}
                onChange={(e) => setFormData({ ...formData, google_metrics: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：CPC $8.5, CTR 3.2%"
              />
            </div>
          </div>

          {/* 下次調整 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">下次調整</label>
            <textarea
              value={formData.next_actions}
              onChange={(e) => setFormData({ ...formData, next_actions: e.target.value })}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：FB 受眾年齡調高、Google 加關鍵字..."
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">備註</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="額外備註..."
            />
          </div>

          <button
            onClick={handleFormSave}
            disabled={!formData.client_name || !formData.period_start || !formData.period_end}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            儲存記錄
          </button>
        </div>
      )}

      {/* === 篩選列 === */}
      <div className="flex items-center gap-3">
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="all">全部客戶</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="7">最近 7 天</option>
          <option value="30">最近 30 天</option>
          <option value="90">最近 90 天</option>
          <option value="365">最近一年</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          共 {logs.length} 筆記錄
        </span>
      </div>

      {/* === 記錄列表 === */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : logs.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-10 text-center">
          <p className="text-gray-400 text-lg mb-2">還沒有快速記錄</p>
          <p className="text-gray-500 text-sm">用 Claude 的 ad-quick-log skill 產出 MD，貼在這裡解析</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id
            const totalSpend = getTotalSpend(log.spend_summary)
            return (
              <div
                key={log.id}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
              >
                {/* 摘要列 */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-750 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">{log.client_name}</span>
                      <span className="text-sm text-gray-400">
                        {log.period_start} ~ {log.period_end}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400 font-medium">
                      NT${totalSpend.toLocaleString()}
                    </p>
                    {log.spend_summary?.map((s, i) => (
                      <span key={i} className="text-xs text-gray-500 ml-2">
                        {s.platform}: ${(s.amount || 0).toLocaleString()}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* 展開詳情 */}
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-gray-700 pt-4 space-y-3">
                    {/* 花費明細 */}
                    {log.spend_summary?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">花費明細</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {log.spend_summary.map((s, i) => (
                            <div key={i} className="bg-gray-700 rounded-lg px-3 py-2 flex items-center gap-3">
                              <span className="text-white font-medium">{s.platform}</span>
                              <span className="text-blue-400">NT${(s.amount || 0).toLocaleString()}</span>
                              <span className="text-gray-400 text-sm">{s.metrics}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 下次調整 */}
                    {log.next_actions && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">下次調整</p>
                        <div className="text-gray-300 text-sm whitespace-pre-wrap bg-gray-700 rounded-lg px-3 py-2">
                          {log.next_actions}
                        </div>
                      </div>
                    )}

                    {/* 備註 */}
                    {log.notes && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">備註</p>
                        <p className="text-gray-300 text-sm">{log.notes}</p>
                      </div>
                    )}

                    {/* 建立時間 */}
                    <p className="text-xs text-gray-500">
                      記錄於 {new Date(log.created_at).toLocaleString('zh-TW')}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
