import { useEffect, useState } from 'react'
import { supabaseAgent as supabase } from '../lib/supabase-agent'

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatDate(d) {
  return d.toISOString().split('T')[0]
}

const priorityEmoji = { red: '🔴', yellow: '🟡', green: '🟢' }
const priorityLabel = { red: '緊急', yellow: '重要', green: '優化' }
const categoryLabel = { facebook: 'Facebook', google: 'Google', client: '客戶', keyword: '關鍵字' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [weekOffset, setWeekOffset] = useState(0)

  // MD 解析
  const [showParser, setShowParser] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [clientName, setClientName] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [parsedTasks, setParsedTasks] = useState([])
  const [isParsing, setIsParsing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // 完成任務
  const [completingTask, setCompletingTask] = useState(null)
  const [outcomeNote, setOutcomeNote] = useState('')

  const monday = getMonday(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
  const weekStart = formatDate(weekDays[0])
  const weekEnd = formatDate(weekDays[4])

  async function loadTasks() {
    setLoading(true)
    let query = supabase
      .from('ad_tasks')
      .select('*')
      .gte('scheduled_date', weekStart)
      .lte('scheduled_date', weekEnd)
      .order('scheduled_date')
      .order('scheduled_time')

    if (selectedClient !== 'all') query = query.eq('client_name', selectedClient)
    if (statusFilter === 'pending') query = query.eq('status', 'pending')
    if (statusFilter === 'done') query = query.eq('status', 'done')

    const { data } = await query
    setTasks(data || [])
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [weekOffset, selectedClient, statusFilter])

  const clients = [...new Set(tasks.map(t => t.client_name))]

  function getTasksForDay(date) {
    const dateStr = formatDate(date)
    return tasks.filter(t => t.scheduled_date === dateStr)
  }

  function getDayTotal(date) {
    return getTasksForDay(date).reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  }

  // MD 解析
  async function handleParse() {
    if (!markdown.trim() || !clientName.trim()) return
    setIsParsing(true)
    try {
      const res = await fetch('/api/parse-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown, client_name: clientName, report_date: reportDate }),
      })
      const data = await res.json()
      if (data.tasks) {
        setParsedTasks(data.tasks)
        setShowConfirm(true)
      } else {
        alert('解析失敗：' + (data.error || '未知錯誤'))
      }
    } catch (e) {
      alert('解析失敗：' + e.message)
    }
    setIsParsing(false)
  }

  async function handleConfirmSave() {
    const rows = parsedTasks.map(t => ({
      client_name: clientName,
      report_date: reportDate || new Date().toISOString().split('T')[0],
      task: t.task,
      category: t.category,
      priority: t.priority,
      estimated_minutes: t.estimated_minutes,
      scheduled_date: t.scheduled_date,
      scheduled_time: t.scheduled_time,
      status: 'pending',
    }))
    await supabase.from('ad_tasks').insert(rows)
    setParsedTasks([])
    setShowConfirm(false)
    setShowParser(false)
    setMarkdown('')
    setClientName('')
    loadTasks()
  }

  // 完成任務
  async function handleComplete(taskId) {
    await supabase.from('ad_tasks').update({
      status: 'done',
      completed_at: new Date().toISOString(),
      outcome_note: outcomeNote || null,
      include_in_next_report: outcomeNote ? true : false,
    }).eq('id', taskId)
    setCompletingTask(null)
    setOutcomeNote('')
    loadTasks()
  }

  const dayNames = ['週一', '週二', '週三', '週四', '週五']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">廣告任務</h1>
        <button
          onClick={() => setShowParser(!showParser)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showParser ? '收起' : '+ 解析 MD 排程'}
        </button>
      </div>

      {/* MD 解析區 */}
      {showParser && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-white">解析廣告操作 Markdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">客戶名稱</label>
              <input type="text" value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：寵樂芙" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">報告日期</label>
              <input type="date" value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">操作規劃 Markdown</label>
            <textarea value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              rows={8}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="貼上廣告操作規劃 Markdown..." />
          </div>
          <button onClick={handleParse} disabled={isParsing || !markdown.trim() || !clientName.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {isParsing ? '解析中...' : '解析並排程'}
          </button>
        </div>
      )}

      {/* 解析結果確認 */}
      {showConfirm && parsedTasks.length > 0 && (
        <div className="bg-gray-800 rounded-xl border border-blue-500 p-5 space-y-4">
          <h2 className="font-semibold text-white">確認解析結果（{parsedTasks.length} 個任務）</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {parsedTasks.map((t, i) => (
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
          <div className="flex space-x-2">
            <button onClick={handleConfirmSave}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              確認存入
            </button>
            <button onClick={() => { setShowConfirm(false); setParsedTasks([]) }}
              className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 週導覽 + 篩選 */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-600">◀</button>
        <span className="text-white font-medium">
          {weekDays[0].toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
          {' – '}
          {weekDays[4].toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
        </span>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-600">▶</button>
        <button onClick={() => setWeekOffset(0)}
          className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-600 text-sm">本週</button>

        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white ml-auto">
          <option value="all">全部客戶</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
          <option value="all">全部狀態</option>
          <option value="pending">待處理</option>
          <option value="done">已完成</option>
        </select>
      </div>

      {/* 週時程表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {weekDays.map((day, di) => {
            const dayTasks = getTasksForDay(day)
            const totalMin = getDayTotal(day)
            const isToday = formatDate(day) === formatDate(new Date())
            return (
              <div key={di} className={`bg-gray-800 rounded-xl border ${isToday ? 'border-blue-500' : 'border-gray-700'} overflow-hidden`}>
                <div className={`px-3 py-2 text-center border-b ${isToday ? 'border-blue-500 bg-blue-600/10' : 'border-gray-700'}`}>
                  <p className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>{dayNames[di]}</p>
                  <p className="text-xs text-gray-500">
                    {day.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                  </p>
                  {totalMin > 0 && (
                    <p className={`text-xs mt-1 ${totalMin > 120 ? 'text-red-400' : 'text-gray-500'}`}>
                      {totalMin} 分鐘
                    </p>
                  )}
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-4">無任務</p>
                  ) : (
                    dayTasks.map(task => (
                      <div key={task.id}
                        onClick={() => { if (task.status !== 'done') { setCompletingTask(task); setOutcomeNote('') } }}
                        className={`rounded-lg p-2 text-xs cursor-pointer transition ${
                          task.status === 'done'
                            ? 'bg-green-900/20 border border-green-800'
                            : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                        }`}>
                        <div className="flex items-center gap-1 mb-1">
                          <span>{priorityEmoji[task.priority]}</span>
                          <span className="text-gray-400">{task.scheduled_time?.slice(0, 5)}</span>
                        </div>
                        <p className={`font-medium ${task.status === 'done' ? 'text-green-400 line-through' : 'text-white'}`}>
                          [{task.client_name}]
                        </p>
                        <p className={`${task.status === 'done' ? 'text-green-400/70' : 'text-gray-300'}`}>
                          {task.task}
                        </p>
                        <p className="text-gray-500">{task.estimated_minutes}min</p>
                        {task.status === 'done' && task.outcome_note && (
                          <p className="text-green-400 mt-1">📊 {task.outcome_note}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 完成任務 Modal */}
      {completingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCompletingTask(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">✅ 標記完成</h3>
            <p className="text-gray-300 mb-1">
              {priorityEmoji[completingTask.priority]} [{completingTask.client_name}] {completingTask.task}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {completingTask.scheduled_date} {completingTask.scheduled_time?.slice(0, 5)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">成效備註（選填）</label>
              <input type="text" value={outcomeNote}
                onChange={(e) => setOutcomeNote(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例：ROAS 從 19 升到 23"
                autoFocus />
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleComplete(completingTask.id)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                確認完成
              </button>
              <button onClick={() => setCompletingTask(null)}
                className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
