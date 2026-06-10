import { useEffect, useState, useRef } from 'react'
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
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  const [activeTab, setActiveTab] = useState('logs') // 'logs' | 'schedule'
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('week') // 'week' | 'month'
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthDate, setMonthDate] = useState(new Date())

  // 操作記錄 state
  const [opLogs, setOpLogs] = useState([])
  const [opLoading, setOpLoading] = useState(false)
  const [opFilterClient, setOpFilterClient] = useState('')
  const [opViewMode, setOpViewMode] = useState('week') // 'week' | 'month' | 'custom'
  const [opWeekOffset, setOpWeekOffset] = useState(0)
  const [opMonthDate, setOpMonthDate] = useState(new Date())
  const [opCustomStart, setOpCustomStart] = useState(formatDate(new Date()))
  const [opCustomEnd, setOpCustomEnd] = useState(formatDate(new Date()))
  const [opClients, setOpClients] = useState([])
  const [showOpAdd, setShowOpAdd] = useState(false)
  const [newOp, setNewOp] = useState({ client_name: '', platforms: [], description: '', date: formatDate(new Date()) })
  const [editingOp, setEditingOp] = useState(null)
  const [editForm, setEditForm] = useState({ client_name: '', platforms: [], description: '', date: '' })
  const [opSaving, setOpSaving] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)
  const exportRef = useRef(null)

  // 操作記錄日曆計算
  const opMonday = getMonday(new Date())
  opMonday.setDate(opMonday.getDate() + opWeekOffset * 7)
  const opWeekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(opMonday); d.setDate(d.getDate() + i); return d
  })
  const opMonthDays = getMonthDays(opMonthDate.getFullYear(), opMonthDate.getMonth())
  const opCurrentMonth = opMonthDate.getMonth()
  const opQueryStart = opViewMode === 'custom' ? opCustomStart : opViewMode === 'week' ? formatDate(opWeekDays[0]) : formatDate(opMonthDays[0])
  const opQueryEnd = opViewMode === 'custom' ? opCustomEnd : opViewMode === 'week' ? formatDate(opWeekDays[4]) : formatDate(opMonthDays[opMonthDays.length - 1])
  const opDateLabel = opViewMode === 'custom'
    ? `${opCustomStart} ~ ${opCustomEnd}`
    : opViewMode === 'week'
    ? `${opWeekDays[0].getMonth() + 1}/${opWeekDays[0].getDate()} – ${opWeekDays[4].getMonth() + 1}/${opWeekDays[4].getDate()}`
    : `${opMonthDate.getFullYear()} 年 ${opMonthDate.getMonth() + 1} 月`

  // MD 解析
  const [showParser, setShowParser] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [clientName, setClientName] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [parsedTasks, setParsedTasks] = useState([])
  const [isParsing, setIsParsing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // 快速新增任務
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickTask, setQuickTask] = useState('')
  const [quickPriority, setQuickPriority] = useState('yellow')
  const [quickCategory, setQuickCategory] = useState('facebook')
  const [quickDate, setQuickDate] = useState(formatDate(new Date()))
  const [quickTime, setQuickTime] = useState('10:00')
  const [quickMinutes, setQuickMinutes] = useState(30)
  const [quickClient, setQuickClient] = useState('')
  const [quickNote, setQuickNote] = useState('')

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
    if (statusFilter === 'cancelled') query = query.eq('status', 'cancelled')

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
  const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length
  const pendingTasks = totalTasks - doneTasks - cancelledTasks
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
    if (taskSaving) return
    setTaskSaving(true)
    try {
      const rows = parsedTasks.map(t => ({
        client_name: clientName,
        report_date: reportDate || formatDate(new Date()),
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
    } finally { setTaskSaving(false) }
  }

  // 快速新增任務
  async function handleQuickAdd() {
    if (!quickTask.trim() || !quickClient.trim() || taskSaving) return
    setTaskSaving(true)
    try {
      const row = {
        client_name: quickClient,
        report_date: quickDate,
        task: quickTask,
        category: quickCategory,
        priority: quickPriority,
        estimated_minutes: quickMinutes,
        scheduled_date: quickDate,
        scheduled_time: quickTime,
        status: 'pending',
        outcome_note: quickNote || null,
      }
      await supabase.from('ad_tasks').insert([row])
      setShowQuickAdd(false)
      setQuickTask('')
      setQuickNote('')
      loadTasks()
    } finally { setTaskSaving(false) }
  }

  // 完成任務
  async function handleComplete(taskId) {
    if (taskSaving) return
    setTaskSaving(true)
    try {
      await supabase.from('ad_tasks').update({
        status: 'done',
        completed_at: new Date().toISOString(),
        outcome_note: outcomeNote || null,
        include_in_next_report: outcomeNote ? true : false,
      }).eq('id', taskId)
      setCompletingTask(null)
      setOutcomeNote('')
      loadTasks()
    } finally { setTaskSaving(false) }
  }

  // 取消任務
  async function handleCancel(taskId) {
    if (taskSaving) return
    setTaskSaving(true)
    try {
      await supabase.from('ad_tasks').update({ status: 'cancelled' }).eq('id', taskId)
      setCompletingTask(null)
      setOutcomeNote('')
      loadTasks()
    } finally { setTaskSaving(false) }
  }

  // 延後任務到明天
  async function handlePostpone(taskId) {
    if (taskSaving) return
    setTaskSaving(true)
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return
      const date = new Date(task.scheduled_date)
      date.setDate(date.getDate() + 1)
      const newDate = formatDate(date)
      await supabase.from('ad_tasks').update({ scheduled_date: newDate }).eq('id', taskId)
      setCompletingTask(null)
      setOutcomeNote('')
      loadTasks()
    } finally { setTaskSaving(false) }
  }

  // 修改任務日期
  async function handleReschedule(taskId, newDate) {
    await supabase.from('ad_tasks').update({ scheduled_date: newDate }).eq('id', taskId)
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
    const isCancelled = task.status === 'cancelled'
    const isClickable = !isDone && !isCancelled
    return (
      <div
        onClick={() => { if (isClickable) { setCompletingTask(task); setOutcomeNote('') } }}
        className={`rounded-lg p-2 text-xs transition ${
          isCancelled
            ? 'bg-red-900/10 border border-red-800/30 cursor-default opacity-50'
            : isDone
            ? 'bg-green-900/20 border border-green-700/50 cursor-default'
            : 'bg-gray-700 hover:bg-gray-600 border border-gray-600 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-1">
          {isCancelled ? <span>🗑️</span> : isDone ? <span>✅</span> : <span>{priorityEmoji[task.priority]}</span>}
          {!compact && <span className="text-gray-400">{task.scheduled_time?.slice(0, 5)}</span>}
          {task.category && <span className="text-gray-500 ml-auto">{categoryLabel[task.category] || task.category}</span>}
        </div>
        <p className={`font-medium mt-0.5 ${isCancelled ? 'text-red-400/60' : isDone ? 'text-green-400' : 'text-white'}`}>
          {compact ? task.client_name : `[${task.client_name}]`}
        </p>
        <p className={`${isCancelled ? 'text-red-400/40 line-through' : isDone ? 'text-green-400/60 line-through' : 'text-gray-300'}`}>
          {task.task}
        </p>
        {!compact && !isCancelled && <p className="text-gray-500">{task.estimated_minutes}min</p>}
        {isCancelled && <p className="text-red-500 text-[10px] mt-0.5">已取消</p>}
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

  // === 操作記錄相關函式 ===
  const opPlatformColors = { facebook: 'bg-blue-600', google: 'bg-red-500', line: 'bg-green-500', website: 'bg-purple-500', other: 'bg-gray-500' }
  const opPlatformLabels = { facebook: 'Meta', google: 'Google', line: 'LINE', website: 'Web', other: '其他' }
  const platformOptions = ['facebook', 'google', 'line', 'website', 'other']

  function PlatformPicker({ selected, onChange }) {
    return (
      <div className="flex flex-wrap gap-2">
        {platformOptions.map(p => (
          <button key={p} type="button" onClick={() => {
            if (selected.includes(p)) onChange(selected.filter(x => x !== p))
            else onChange([...selected, p])
          }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selected.includes(p) ? opPlatformColors[p] + ' text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
            {opPlatformLabels[p]}
          </button>
        ))}
      </div>
    )
  }

  // 解析 platform 欄位（可能是 "facebook,google" 或 "facebook"）
  function parsePlatforms(p) {
    if (!p) return []
    return p.split(',').map(x => x.trim()).filter(Boolean)
  }

  useEffect(() => {
    if (activeTab === 'logs') { fetchOpClients(); fetchOpLogs() }
  }, [activeTab, opFilterClient, opWeekOffset, opViewMode, opMonthDate, opCustomStart, opCustomEnd])

  async function fetchOpClients() {
    const { data: d1 } = await supabase.from('ad_operation_logs').select('client_name')
    const { data: d2 } = await supabase.from('ad_tasks').select('client_name')
    const { data: d3 } = await supabaseAd.from('clients').select('name')
    const all = [
      ...(d1 || []).map(c => c.client_name),
      ...(d2 || []).map(c => c.client_name),
      ...(d3 || []).map(c => c.name),
    ]
    setOpClients([...new Set(all)].filter(Boolean).sort())
  }

  async function fetchOpLogs() {
    setOpLoading(true)
    let query = supabase.from('ad_operation_logs').select('*')
      .gte('operation_date', opQueryStart).lte('operation_date', opQueryEnd)
      .order('operation_date').order('created_at')
    if (opFilterClient) query = query.eq('client_name', opFilterClient)
    const { data } = await query
    setOpLogs(data || [])
    setOpLoading(false)
  }

  async function handleOpAdd() {
    if (!newOp.client_name || !newOp.description || opSaving) return
    setOpSaving(true)
    try {
      await supabase.from('ad_operation_logs').insert({
        client_name: newOp.client_name, operation_date: newOp.date,
        platform: newOp.platforms.length > 0 ? newOp.platforms.join(',') : null,
        description: newOp.description, raw_message: `(from web) ${newOp.description}`,
      })
      setNewOp({ client_name: '', platforms: [], description: '', date: formatDate(new Date()) })
      setShowOpAdd(false)
      fetchOpLogs(); fetchOpClients()
    } finally { setOpSaving(false) }
  }

  function handleOpClick(log) {
    setEditingOp(log)
    const platforms = log.platform ? log.platform.split(',').map(p => p.trim()) : []
    setEditForm({ client_name: log.client_name, platforms, description: log.description, date: log.operation_date })
  }

  function togglePlatform(list, setList, value) {
    if (list.includes(value)) setList(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== value) }))
    else setList(prev => ({ ...prev, platforms: [...prev.platforms, value] }))
  }

  async function handleOpUpdate() {
    if (!editingOp || !editForm.description || opSaving) return
    setOpSaving(true)
    try {
      await supabase.from('ad_operation_logs').update({
        client_name: editForm.client_name, platform: editForm.platforms.length > 0 ? editForm.platforms.join(',') : null,
        description: editForm.description, operation_date: editForm.date,
      }).eq('id', editingOp.id)
      setEditingOp(null)
      fetchOpLogs()
    } finally { setOpSaving(false) }
  }

  async function handleOpDelete(id) {
    if (!confirm('確定要刪除？') || opSaving) return
    setOpSaving(true)
    try {
      await supabase.from('ad_operation_logs').delete().eq('id', id)
      setEditingOp(null)
      fetchOpLogs()
    } finally { setOpSaving(false) }
  }

  async function handleOpExportMD() {
    const clientLabel = opFilterClient || '全部客戶'
    const grouped = {}
    opLogs.forEach(l => { if (!grouped[l.operation_date]) grouped[l.operation_date] = []; grouped[l.operation_date].push(l) })
    let md = `# ${clientLabel} 操作記錄（${opDateLabel}）\n\n`
    Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).forEach(([date, items]) => {
      const d = new Date(date)
      md += `## ${d.getMonth() + 1}/${d.getDate()}\n`
      items.forEach(l => { md += `- ${l.platform ? `[${l.platform.toUpperCase()}] ` : ''}${l.client_name}：${l.description}\n` })
      md += '\n'
    })
    md += `---\n共 ${opLogs.length} 筆操作\n`
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${clientLabel}_${opDateLabel}_操作記錄.md`; a.click()
  }

  async function handleOpExportPDF() {
    const html2pdf = (await import('html2pdf.js')).default
    const clientLabel = opFilterClient || '全部客戶'
    await html2pdf().set({
      margin: [15, 15, 15, 15], filename: `${clientLabel}_${opDateLabel}_操作記錄.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    }).from(exportRef.current).save()
  }

  // 操作記錄按日期分組
  const opGrouped = {}
  opLogs.forEach(l => { if (!opGrouped[l.operation_date]) opGrouped[l.operation_date] = []; opGrouped[l.operation_date].push(l) })
  const opClientCount = {}; opLogs.forEach(l => { opClientCount[l.client_name] = (opClientCount[l.client_name] || 0) + 1 })
  const opPlatformCount = {}; opLogs.forEach(l => { const p = l.platform || 'other'; opPlatformCount[p] = (opPlatformCount[p] || 0) + 1 })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">廣告任務</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowQuickAdd(true); setQuickClient(''); setQuickDate(formatDate(new Date())) }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            + 快速新增
          </button>
          <button
            onClick={() => setShowParser(!showParser)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showParser ? '收起' : '+ 解析 MD 排程'}
          </button>
        </div>
      </div>

      {/* Tab 切換 */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          📝 操作記錄
        </button>
        <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          📋 排程任務
        </button>
      </div>

      {/* ===== 操作記錄 Tab ===== */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* 導覽列 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-700 rounded-lg overflow-hidden">
              <button onClick={() => setOpViewMode('week')} className={`px-3 py-1.5 text-sm transition ${opViewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>週</button>
              <button onClick={() => setOpViewMode('month')} className={`px-3 py-1.5 text-sm transition ${opViewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>月</button>
              <button onClick={() => setOpViewMode('custom')} className={`px-3 py-1.5 text-sm transition ${opViewMode === 'custom' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>自訂</button>
            </div>

            {opViewMode === 'custom' ? (
              <>
                <input type="date" value={opCustomStart} onChange={e => setOpCustomStart(e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm" />
                <span className="text-gray-400">~</span>
                <input type="date" value={opCustomEnd} onChange={e => setOpCustomEnd(e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm" />
              </>
            ) : (
              <>
                <button onClick={() => { if (opViewMode === 'week') setOpWeekOffset(p => p - 1); else setOpMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n }) }} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">◀</button>
                <span className="text-white font-medium min-w-[160px] text-center">{opDateLabel}</span>
                <button onClick={() => { if (opViewMode === 'week') setOpWeekOffset(p => p + 1); else setOpMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n }) }} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">▶</button>
                <button onClick={() => { setOpWeekOffset(0); setOpMonthDate(new Date()) }} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-600 text-sm">今天</button>
              </>
            )}

            <select value={opFilterClient} onChange={e => setOpFilterClient(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white ml-auto">
              <option value="">全部客戶</option>
              {opClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setShowOpAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm">+ 新增</button>
            <button onClick={handleOpExportMD} disabled={opLogs.length === 0} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">MD</button>
            <button onClick={handleOpExportPDF} disabled={opLogs.length === 0} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">PDF</button>
          </div>

          {/* 週曆 */}
          {opLoading ? <div className="text-center py-10 text-gray-400">載入中...</div> :
          opViewMode === 'custom' ? (
            /* 自訂日期 - 列表格式 */
            opLogs.length === 0 ? <div className="text-center py-20 text-gray-500"><p className="text-4xl mb-4">📝</p><p>此範圍無記錄</p></div> : (
            <div ref={exportRef} className="space-y-4">
              {Object.entries(opGrouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => {
                const d = new Date(date)
                const weekday = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
                return (
                  <div key={date}>
                    <h3 className="text-gray-400 text-sm font-medium mb-2">{d.getMonth() + 1}/{d.getDate()} ({weekday}) — {items.length} 筆</h3>
                    <div className="space-y-1.5">
                      {items.map(log => (
                        <div key={log.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-start justify-between cursor-pointer hover:bg-gray-750" onClick={() => handleOpClick(log)}>
                          <div className="flex items-start gap-2">
                            {parsePlatforms(log.platform).map(p => <span key={p} className={`${opPlatformColors[p]} text-white text-xs px-1.5 py-0.5 rounded`}>{opPlatformLabels[p]}</span>)}
                            <span className="text-blue-400 font-medium">{log.client_name}</span>
                            <span className="text-white">{log.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              <div className="text-center text-gray-500 text-sm pt-2">共 {opLogs.length} 筆</div>
            </div>)
          ) :
          opViewMode === 'week' ? (
            <div ref={exportRef} className="grid grid-cols-5 gap-3">
              {opWeekDays.map((day, di) => {
                const dayStr = formatDate(day)
                const dayLogs = opLogs.filter(l => l.operation_date === dayStr)
                const isToday = dayStr === formatDate(new Date())
                return (
                  <div key={di} className={`bg-gray-800 rounded-xl border ${isToday ? 'border-blue-500' : 'border-gray-700'} overflow-hidden`}>
                    <div className={`px-3 py-2 text-center border-b ${isToday ? 'border-blue-500 bg-blue-600/10' : 'border-gray-700'}`}>
                      <p className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>{dayNames[di]}</p>
                      <p className="text-xs text-gray-500">{day.getMonth() + 1}/{day.getDate()}</p>
                      {dayLogs.length > 0 && <p className="text-xs text-blue-400 mt-0.5">{dayLogs.length} 筆</p>}
                    </div>
                    <div className="p-2 space-y-1.5 min-h-[120px]">
                      {dayLogs.length === 0 ? (
                        <p className="text-xs text-gray-600 text-center py-4">無記錄</p>
                      ) : dayLogs.map(log => (
                        <div key={log.id} className="bg-gray-700 hover:bg-gray-600 rounded-lg p-2 cursor-pointer text-xs group" onClick={() => handleOpClick(log)}>
                          <div className="flex items-center gap-1 flex-wrap">
                            {parsePlatforms(log.platform).map(p => <span key={p} className={`${opPlatformColors[p] || 'bg-gray-500'} text-white px-1.5 py-0.5 rounded text-[10px]`}>{opPlatformLabels[p] || p}</span>)}
                            <span className="text-blue-400 font-medium">{log.client_name}</span>
                          </div>
                          <p className="text-gray-300 mt-0.5 leading-tight">{log.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* 月曆 */
            <div ref={exportRef} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-700">
                {['一', '二', '三', '四', '五', '六', '日'].map(name => (
                  <div key={name} className="px-2 py-2 text-center text-xs font-semibold text-gray-400">{name}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {opMonthDays.map((day, i) => {
                  const dayStr = formatDate(day)
                  const dayLogs = opLogs.filter(l => l.operation_date === dayStr)
                  const isToday = dayStr === formatDate(new Date())
                  const isCurrentMonth = day.getMonth() === opCurrentMonth
                  return (
                    <div key={i} className={`min-h-[90px] border-b border-r border-gray-700 p-1.5 ${!isCurrentMonth ? 'bg-gray-800/50' : ''} ${isToday ? 'bg-blue-900/10' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs ${isToday ? 'text-blue-400 font-bold' : isCurrentMonth ? 'text-gray-400' : 'text-gray-600'}`}>{day.getDate()}</span>
                        {dayLogs.length > 0 && <span className="text-[10px] text-blue-400">{dayLogs.length}筆</span>}
                      </div>
                      <div className="space-y-0.5">
                        {dayLogs.slice(0, 3).map(log => (
                          <div key={log.id} className="bg-gray-700/80 rounded px-1 py-0.5 text-[10px] text-gray-300 truncate cursor-pointer hover:bg-gray-600" onClick={() => handleOpClick(log)}>
                            {parsePlatforms(log.platform).map(p => <span key={p} className={`${opPlatformColors[p]} text-white px-1 rounded text-[8px] mr-0.5`}>{opPlatformLabels[p]}</span>)}
                            <span className="text-blue-400">{log.client_name}</span> {log.description}
                          </div>
                        ))}
                        {dayLogs.length > 3 && <p className="text-[10px] text-gray-500 text-center">+{dayLogs.length - 3} 更多</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 編輯 Modal */}
          {editingOp && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingOp(null)}>
              <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-white mb-4">編輯操作記錄</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">客戶</label>
                      <select value={editForm.client_name} onChange={e => setEditForm({ ...editForm, client_name: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
                        <option value="">選擇客戶</option>
                        {opClients.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">日期</label>
                      <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">平台</label>
                    <PlatformPicker selected={editForm.platforms} onChange={p => setEditForm({ ...editForm, platforms: p })} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">操作內容</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 h-24 resize-none" />
                  </div>
                </div>
                <div className="flex justify-between mt-6">
                  <button onClick={() => handleOpDelete(editingOp.id)} disabled={opSaving} className="px-4 py-2 text-red-400 hover:text-red-300 disabled:opacity-50">🗑️ 刪除</button>
                  <div className="flex gap-3">
                    <button onClick={() => setEditingOp(null)} disabled={opSaving} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                    <button onClick={handleOpUpdate} disabled={!editForm.description || opSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">{opSaving ? '儲存中...' : '儲存'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 新增 Modal */}
          {showOpAdd && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowOpAdd(false)}>
              <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-white mb-4">新增操作記錄</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">客戶</label>
                      <select value={newOp.client_name} onChange={e => setNewOp({ ...newOp, client_name: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
                        <option value="">選擇客戶</option>
                        {opClients.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-1">日期</label>
                      <input type="date" value={newOp.date} onChange={e => setNewOp({ ...newOp, date: e.target.value })}
                        className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">平台</label>
                    <PlatformPicker selected={newOp.platforms} onChange={p => setNewOp({ ...newOp, platforms: p })} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">操作內容</label>
                    <textarea value={newOp.description} onChange={e => setNewOp({ ...newOp, description: e.target.value })}
                      className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 h-24 resize-none" placeholder="調整 ROAS 出價從 15 改 20" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowOpAdd(false)} disabled={opSaving} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                  <button onClick={handleOpAdd} disabled={!newOp.client_name || !newOp.description || opSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">{opSaving ? '儲存中...' : '儲存'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== 排程任務 Tab ===== */}
      {activeTab === 'schedule' && <>

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
            <button onClick={handleConfirmSave} disabled={taskSaving}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              {taskSaving ? '存入中...' : '確認存入'}
            </button>
            <button onClick={() => { setShowConfirm(false); setParsedTasks([]) }} disabled={taskSaving}
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
          <option value="cancelled">已取消</option>
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

      {/* 快速新增 Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQuickAdd(false)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white">快速新增任務</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">客戶</label>
              <select value={quickClient} onChange={e => setQuickClient(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                <option value="">請選擇</option>
                {clients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">任務內容</label>
              <input type="text" value={quickTask} onChange={e => setQuickTask(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="例：調整 ROAS 出價" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">日期</label>
                <input type="date" value={quickDate} onChange={e => setQuickDate(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">時間</label>
                <input type="time" value={quickTime} onChange={e => setQuickTime(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">優先級</label>
                <select value={quickPriority} onChange={e => setQuickPriority(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  <option value="red">🔴 緊急</option>
                  <option value="yellow">🟡 重要</option>
                  <option value="green">🟢 優化</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">分類</label>
                <select value={quickCategory} onChange={e => setQuickCategory(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  <option value="facebook">FB</option>
                  <option value="google">Google</option>
                  <option value="client">客戶</option>
                  <option value="keyword">關鍵字</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">預估</label>
                <select value={quickMinutes} onChange={e => setQuickMinutes(Number(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                  <option value={15}>15 分</option>
                  <option value={30}>30 分</option>
                  <option value={45}>45 分</option>
                  <option value={60}>60 分</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">備註（花費/調整方向）</label>
              <input type="text" value={quickNote} onChange={e => setQuickNote(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                placeholder="例：本月花費 $15,000、下次調降 CPC" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleQuickAdd} disabled={!quickTask.trim() || !quickClient || taskSaving}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                {taskSaving ? '新增中...' : '新增'}
              </button>
              <button onClick={() => setShowQuickAdd(false)} disabled={taskSaving}
                className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 任務操作 Modal */}
      {completingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCompletingTask(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">📋 任務操作</h3>
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">改期（選填）</label>
              <input type="date" value={completingTask.scheduled_date}
                onChange={(e) => { handleReschedule(completingTask.id, e.target.value) }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleComplete(completingTask.id)} disabled={taskSaving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                {taskSaving ? '處理中...' : '✅ 完成'}
              </button>
              <button onClick={() => handlePostpone(completingTask.id)} disabled={taskSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                📅 延後一天
              </button>
              <button onClick={() => handleCancel(completingTask.id)} disabled={taskSaving}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                🗑️ 取消任務
              </button>
              <button onClick={() => setCompletingTask(null)} disabled={taskSaving}
                className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 transition">
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      </>}
    </div>
  )
}
