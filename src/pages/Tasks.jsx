import { useEffect, useState } from 'react'
import { supabaseAgent as supabase } from '../lib/supabase-agent'
import { supabase as supabaseAd } from '../lib/supabase'

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

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = (firstDay.getDay() + 6) % 7 // Monday = 0
  const days = []
  for (let i = -startPad; i <= lastDay.getDate() - 1; i++) {
    const d = new Date(year, month, i + 1)
    days.push(d)
  }
  // pad to complete last week
  while (days.length % 7 !== 0) {
    const d = new Date(days[days.length - 1])
    d.setDate(d.getDate() + 1)
    days.push(d)
  }
  return days
}

const priorityEmoji = { red: '🔴', yellow: '🟡', green: '🟢' }
const categoryLabel = { facebook: 'FB', google: 'Google', client: '客戶', keyword: '關鍵字' }

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('week') // 'week' | 'month'
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthDate, setMonthDate] = useState(new Date())

  // MD 解析
  const [showParser, setShowParser] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [clientName, setClientName] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [parsedTasks, setParsedTasks] = useState([])
  const [isParsing, setIsParsing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // 完成任務
  // 完成任務
  const [completingTask, setCompletingTask] = useState(null)
  const [outcomeNote, setOutcomeNote] = useState('')

  // 客戶列表（從 clients 表讀取）
  const [clients, setClients] = useState([])

  // 計算日期範圍
  const monday = getMonday(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })

  const monthDays = getMonthDays(monthDate.getFullYear(), monthDate.getMonth())
  const currentMonth = monthDate.getMonth()

  // 根據 viewMode 計算查詢範圍
  const queryStart = viewMode === 'week' ? formatDate(weekDays[0]) : formatDate(monthDays[0])
  const queryEnd = viewMode === 'week' ? formatDate(weekDays[4]) : formatDate(monthDays[monthDays.length - 1])

  async function loadTasks() {
    setLoading(true)
    let query = supabase
      .from('ad_tasks')
      .select('*')
      .gte('scheduled_date', queryStart)
      .lte('scheduled_date', queryEnd)
      .order('scheduled_date')
      .order('scheduled_time')

    if (selectedClient !== 'all') query = query.eq('client_name', selectedClient)
    if (statusFilter === 'pending') query = query.eq('status', 'pending')
    if (statusFilter === 'done') query = query.eq('status', 'done')

    const { data } = await query
    setTasks(data || [])
    setLoading(false)
  }

  async function loadClients() {
    const { data } = await supabaseAd.from('clients').select('name').order('name')
    setClients((data || []).map(c => c.name))
  }

  useEffect(() => { loadClients() }, [])
  useEffect(() => { loadTasks() }, [queryStart, queryEnd, selectedClient, statusFilter])

  function getTasksForDay(date) {
    const dateStr = formatDate(date)
    return tasks.filter(t => t.scheduled_date === dateStr)
  }

  function getDayTotal(date) {
    return getTasksForDay(date).reduce((sum, t) => sum + (t.estimated_minutes || 0), 0)
  }

  // 統計
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const pendingTasks = totalTasks - doneTasks
  const totalMinutes = tasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0)
  const doneMinutes = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimated_minutes || 0), 0)

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

  // 導覽
  function handlePrev() {
    if (viewMode === 'week') setWeekOffset(w => w - 1)
    else setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function handleNext() {
    if (viewMode === 'week') setWeekOffset(w => w + 1)
    else setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }
  function handleToday() {
    if (viewMode === 'week') setWeekOffset(0)
    else setMonthDate(new Date())
  }

  const dateLabel = viewMode === 'week'
    ? `${weekDays[0].toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} – ${weekDays[4].toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}`
    : `${monthDate.getFullYear()} 年 ${monthDate.getMonth() + 1} 月`

  const dayNames = ['週一', '週二', '週三', '週四', '週五']
  const monthDayNames = ['一', '二', '三', '四', '五', '六', '日']

  // 任務卡片元件
  function TaskCard({ task, compact }) {
    const isDone = task.status === 'done'
    return (
      <div
        onClick={() => { if (!isDone) { setCompletingTask(task); setOutcomeNote('') } }}
        className={`rounded-lg p-2 text-xs transition ${
          isDone
            ? 'bg-green-900/20 border border-green-700/50 cursor-default'
            : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-1">
          {isDone ? <span>✅</span> : <span>{priorityEmoji[task.priority]}</span>}
          {!compact && <span className="text-gray-400">{task.scheduled_time?.slice(0, 5)}</span>}
          {task.category && <span className="text-gray-500 ml-auto">{categoryLabel[task.category] || task.category}</span>}
        </div>
        <p className={`font-medium mt-0.5 ${isDone ? 'text-green-400' : 'text-white'}`}>
          {compact ? task.client_name : `[${task.client_name}]`}
        </p>
        <p className={`${isDone ? 'text-green-400/60 line-through' : 'text-gray-300'}`}>
          {task.task}
        </p>
        {!compact && <p className="text-gray-500">{task.estimated_minutes}min</p>}
        {isDone && task.outcome_note && (
          <p className="text-green-400 mt-1 border-t border-green-800/50 pt-1">
            📊 {task.outcome_note}
          </p>
        )}
        {isDone && task.completed_at && (
          <p className="text-green-600 text-[10px] mt-0.5">
            {new Date(task.completed_at).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 完成
          </p>
        )}
      </div>
    )
  }

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

      {/* 統計摘要 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalTasks}</p>
          <p className="text-xs text-gray-400">總任務</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{doneTasks}</p>
          <p className="text-xs text-gray-400">已完成</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pendingTasks}</p>
          <p className="text-xs text-gray-400">待處理</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{doneMinutes}/{totalMinutes}</p>
          <p className="text-xs text-gray-400">分鐘</p>
        </div>
      </div>

      {/* MD 解析區 */}
      {showParser && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
          <h2 className="font-semibold text-white">解析廣告操作 Markdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">客戶名稱</label>
              <select value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">請選擇客戶</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
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

      {/* 導覽 + 切換 + 篩選 */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 週/月切換 */}
        <div className="flex bg-gray-700 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm transition ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            週
          </button>
          <button onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-sm transition ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            月
          </button>
        </div>

        <button onClick={handlePrev}
          className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">◀</button>
        <span className="text-white font-medium min-w-[140px] text-center">{dateLabel}</span>
        <button onClick={handleNext}
          className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">▶</button>
        <button onClick={handleToday}
          className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-600 text-sm">今天</button>

        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white ml-auto">
          <option value="all">全部客戶</option>
          {clients.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white">
          <option value="all">全部狀態</option>
          <option value="pending">待處理</option>
          <option value="done">已完成</option>
        </select>
      </div>

      {/* 時程表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : viewMode === 'week' ? (
        /* ========== 週檢視 ========== */
        <div className="grid grid-cols-5 gap-3">
          {weekDays.map((day, di) => {
            const dayTasks = getTasksForDay(day)
            const totalMin = getDayTotal(day)
            const isToday = formatDate(day) === formatDate(new Date())
            const doneCount = dayTasks.filter(t => t.status === 'done').length
            return (
              <div key={di} className={`bg-gray-800 rounded-xl border ${isToday ? 'border-blue-500' : 'border-gray-700'} overflow-hidden`}>
                <div className={`px-3 py-2 text-center border-b ${isToday ? 'border-blue-500 bg-blue-600/10' : 'border-gray-700'}`}>
                  <p className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>{dayNames[di]}</p>
                  <p className="text-xs text-gray-500">
                    {day.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
                  </p>
                  {dayTasks.length > 0 && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <p className={`text-xs ${totalMin > 120 ? 'text-red-400' : 'text-gray-500'}`}>
                        {totalMin}min
                      </p>
                      {doneCount > 0 && (
                        <p className="text-xs text-green-500">{doneCount}/{dayTasks.length}✓</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-4">無任務</p>
                  ) : (
                    dayTasks.map(task => <TaskCard key={task.id} task={task} compact={false} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ========== 月檢視 ========== */
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {/* 星期標頭 */}
          <div className="grid grid-cols-7 border-b border-gray-700">
            {monthDayNames.map(name => (
              <div key={name} className="px-2 py-2 text-center text-xs font-semibold text-gray-400">
                {name}
              </div>
            ))}
          </div>
          {/* 日期格子 */}
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              const dayTasks = getTasksForDay(day)
              const isToday = formatDate(day) === formatDate(new Date())
              const isCurrentMonth = day.getMonth() === currentMonth
              const doneCount = dayTasks.filter(t => t.status === 'done').length
              const pendingCount = dayTasks.length - doneCount
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              return (
                <div key={i} className={`min-h-[100px] border-b border-r border-gray-700 p-1.5 ${
                  !isCurrentMonth ? 'bg-gray-800/50' : ''
                } ${isToday ? 'bg-blue-900/10' : ''} ${isWeekend ? 'bg-gray-800/30' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${
                      isToday ? 'bg-blue-600 text-white px-1.5 py-0.5 rounded-full'
                      : isCurrentMonth ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {day.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {doneCount > 0 && <span className="text-green-500">{doneCount}✓</span>}
                        {pendingCount > 0 && <span className="text-yellow-500 ml-1">{pendingCount}</span>}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <TaskCard key={task.id} task={task} compact={true} />
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[10px] text-gray-500 text-center">+{dayTasks.length - 3} 更多</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
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
              <p className="text-xs text-gray-500 mt-1">有填備註會自動帶入下次報告</p>
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
