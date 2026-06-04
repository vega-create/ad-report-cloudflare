import { useState, useEffect, useMemo, useRef } from 'react'
import { supabaseAgent as supabase } from '../lib/supabase-agent'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Pie, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const categories = ['學習進度', '自媒體進度', '聯盟行銷進度', '顧問講師進度']
const catEmoji = { '學習進度': '📚', '自媒體進度': '📱', '聯盟行銷進度': '🤝', '顧問講師進度': '🎓' }
const catColors = { '學習進度': '#3b82f6', '自媒體進度': '#ec4899', '聯盟行銷進度': '#22c55e', '顧問講師進度': '#eab308' }
const catBorder = { '學習進度': 'border-blue-500', '自媒體進度': 'border-pink-500', '聯盟行銷進度': 'border-green-500', '顧問講師進度': 'border-yellow-500' }
const catBg = { '學習進度': 'bg-blue-600', '自媒體進度': 'bg-pink-600', '聯盟行銷進度': 'bg-green-600', '顧問講師進度': 'bg-yellow-600' }

function fmt(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function getMonthDays(y, m) {
  const first = new Date(y, m, 1), last = new Date(y, m+1, 0)
  const pad = (first.getDay() + 6) % 7, days = []
  for (let i = -pad; i <= last.getDate()-1; i++) days.push(new Date(y, m, i+1))
  while (days.length % 7 !== 0) { const d = new Date(days[days.length-1]); d.setDate(d.getDate()+1); days.push(d) }
  return days
}

export default function DailyPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('calendar') // 'calendar' | 'analysis'
  const [monthDate, setMonthDate] = useState(new Date())
  const [expandedDate, setExpandedDate] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addDate, setAddDate] = useState(fmt(new Date()))
  const [newPlan, setNewPlan] = useState({ category: '學習進度', description: '' })
  const [editingPlan, setEditingPlan] = useState(null)
  const [editForm, setEditForm] = useState({ category: '', description: '' })
  const [exportStart, setExportStart] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })
  const [exportEnd, setExportEnd] = useState(() => fmt(new Date()))
  const [exportData, setExportData] = useState([])
  const [exportLoading, setExportLoading] = useState(false)
  const analysisRef = useRef(null)

  const year = monthDate.getFullYear(), month = monthDate.getMonth()
  const monthDays = useMemo(() => getMonthDays(year, month), [year, month])
  const startDate = fmt(monthDays[0]), endDate = fmt(monthDays[monthDays.length - 1])
  const todayStr = fmt(new Date())

  useEffect(() => { fetchPlans() }, [startDate, endDate])

  async function fetchPlans() {
    setLoading(true)
    const { data } = await supabase.from('daily_plans').select('*')
      .gte('plan_date', startDate).lte('plan_date', endDate)
      .order('category').order('created_at')
    setPlans(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newPlan.description) return
    const items = newPlan.description.split(/[、，,]/).map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      await supabase.from('daily_plans').insert({ plan_date: addDate, category: newPlan.category, description: item })
    }
    setNewPlan({ category: '學習進度', description: '' }); setShowAdd(false); fetchPlans()
  }

  async function handleToggle(plan) {
    await supabase.from('daily_plans').update({
      is_done: !plan.is_done, completed_at: !plan.is_done ? new Date().toISOString() : null
    }).eq('id', plan.id)
    fetchPlans()
  }

  async function handleUpdate() {
    if (!editingPlan || !editForm.description) return
    await supabase.from('daily_plans').update({ category: editForm.category, description: editForm.description }).eq('id', editingPlan.id)
    setEditingPlan(null); fetchPlans()
  }

  async function handleDelete(id) {
    if (!confirm('確定要刪除？')) return
    await supabase.from('daily_plans').delete().eq('id', id)
    setEditingPlan(null); fetchPlans()
  }

  // 匯出：抓自訂範圍資料
  async function fetchExportData() {
    setExportLoading(true)
    const { data } = await supabase.from('daily_plans').select('*')
      .gte('plan_date', exportStart).lte('plan_date', exportEnd)
      .order('plan_date').order('category').order('created_at')
    setExportData(data || [])
    setExportLoading(false)
    return data || []
  }

  async function exportCSV() {
    const data = await fetchExportData()
    if (data.length === 0) { alert('此範圍無資料'); return }
    const header = '日期,類別,內容,狀態,完成時間\n'
    const rows = data.map(p => `${p.plan_date},${p.category},${p.description.replace(/,/g,'，')},${p.is_done ? '已完成' : '未完成'},${p.completed_at ? new Date(p.completed_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}) : ''}`).join('\n')
    const bom = '﻿'
    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `每日計畫_${exportStart}_${exportEnd}.csv`; a.click()
  }

  async function exportMD() {
    const data = await fetchExportData()
    if (data.length === 0) { alert('此範圍無資料'); return }
    const grouped = {}
    data.forEach(p => { if (!grouped[p.plan_date]) grouped[p.plan_date] = []; grouped[p.plan_date].push(p) })
    const total = data.length, done = data.filter(p => p.is_done).length
    const catCount = {}
    categories.forEach(c => { const cp = data.filter(p => p.category === c); catCount[c] = { total: cp.length, done: cp.filter(p => p.is_done).length } })

    let md = `# 每日計畫報告\n📅 ${exportStart} ~ ${exportEnd}\n\n`
    md += `## 總覽\n- 總計畫：${total} 項\n- 已完成：${done} 項（${total > 0 ? Math.round(done/total*100) : 0}%）\n\n`
    md += `## 類別統計\n`
    categories.forEach(c => {
      const s = catCount[c]
      if (s.total > 0) md += `- ${catEmoji[c]} ${c}：${s.done}/${s.total}（${Math.round(s.done/s.total*100)}%）\n`
    })
    md += `\n## 每日明細\n\n`
    Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).forEach(([date, items]) => {
      const d = new Date(date)
      const wd = ['日','一','二','三','四','五','六'][d.getDay()]
      md += `### ${d.getMonth()+1}/${d.getDate()}（${wd}）\n`
      items.forEach(p => { md += `- ${p.is_done ? '✅' : '⬜'} [${catEmoji[p.category]} ${p.category.replace('進度','')}] ${p.description}\n` })
      md += '\n'
    })
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `每日計畫_${exportStart}_${exportEnd}.md`; a.click()
  }

  async function exportPDF() {
    const data = await fetchExportData()
    if (data.length === 0) { alert('此範圍無資料'); return }
    if (!analysisRef.current) return
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf().set({
      margin: [15,15,15,15], filename: `每日計畫_${exportStart}_${exportEnd}.pdf`,
      image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(analysisRef.current).save()
  }

  // 月統計
  const monthPlans = plans.filter(p => new Date(p.plan_date).getMonth() === month)
  const monthDone = monthPlans.filter(p => p.is_done).length
  const catStats = {}
  categories.forEach(c => {
    const cp = monthPlans.filter(p => p.category === c)
    catStats[c] = { total: cp.length, done: cp.filter(p => p.is_done).length }
  })

  // 圓餅圖 - 類別分佈
  const pieData = {
    labels: categories.map(c => `${catEmoji[c]} ${c.replace('進度','')}`),
    datasets: [{
      data: categories.map(c => catStats[c]?.total || 0),
      backgroundColor: categories.map(c => catColors[c]),
      borderWidth: 0,
    }]
  }

  // 圓餅圖 - 完成率
  const pieCompletionData = {
    labels: ['已完成', '未完成'],
    datasets: [{
      data: [monthDone, monthPlans.length - monthDone],
      backgroundColor: ['#22c55e', '#374151'],
      borderWidth: 0,
    }]
  }

  // 折線圖 - 每日完成數
  const dailyStats = useMemo(() => {
    const daysInMonth = new Date(year, month+1, 0).getDate()
    const labels = [], totals = [], dones = []
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      labels.push(`${d}`)
      const dayP = plans.filter(p => p.plan_date === ds)
      totals.push(dayP.length)
      dones.push(dayP.filter(p => p.is_done).length)
    }
    return { labels, totals, dones }
  }, [plans, year, month])

  const lineData = {
    labels: dailyStats.labels,
    datasets: [
      { label: '計畫數', data: dailyStats.totals, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
      { label: '完成數', data: dailyStats.dones, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3 },
    ]
  }
  const lineOpts = { responsive: true, plugins: { legend: { labels: { color: '#9ca3af' } } }, scales: { x: { ticks: { color: '#6b7280' } }, y: { ticks: { color: '#6b7280', stepSize: 1 }, beginAtZero: true } } }
  const pieOpts = { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#d1d5db', padding: 15 } } } }

  // 每類別折線
  const catLineData = {
    labels: dailyStats.labels,
    datasets: categories.map(c => ({
      label: c.replace('進度',''),
      data: dailyStats.labels.map((_, i) => {
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`
        return plans.filter(p => p.plan_date === ds && p.category === c).length
      }),
      borderColor: catColors[c], backgroundColor: catColors[c] + '20', fill: false, tension: 0.3,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">每日計畫</h1>
        <button onClick={() => { setShowAdd(true); setAddDate(todayStr) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">+ 新增計畫</button>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('calendar')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>📅 月曆</button>
        <button onClick={() => setTab('analysis')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'analysis' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>📊 分析</button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">{monthPlans.length}</p>
          <p className="text-xs text-gray-400">本月計畫</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className={`text-2xl font-bold ${monthDone === monthPlans.length && monthPlans.length > 0 ? 'text-green-400' : 'text-white'}`}>{monthDone}/{monthPlans.length}</p>
          <p className="text-xs text-gray-400">已完成</p>
        </div>
        {categories.map(c => (
          <div key={c} className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-white">{catStats[c]?.done || 0}/{catStats[c]?.total || 0}</p>
            <p className="text-xs text-gray-400">{catEmoji[c]} {c.replace('進度','')}</p>
          </div>
        ))}
      </div>

      {/* 月份導覽 */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n })} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">◀</button>
        <span className="text-white font-medium min-w-[140px] text-center">{year} 年 {month+1} 月</span>
        <button onClick={() => setMonthDate(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n })} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">▶</button>
        <button onClick={() => setMonthDate(new Date())} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-600 text-sm">本月</button>
      </div>

      {/* ===== 月曆 Tab ===== */}
      {tab === 'calendar' && !loading && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-700">
            {['一','二','三','四','五','六','日'].map(n => (
              <div key={n} className="px-2 py-2 text-center text-xs font-semibold text-gray-400">{n}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, i) => {
              const ds = fmt(day)
              const dayP = plans.filter(p => p.plan_date === ds)
              const isToday = ds === todayStr
              const isCurrent = day.getMonth() === month
              const doneCnt = dayP.filter(p => p.is_done).length
              const isExpanded = expandedDate === ds
              return (
                <div key={i} className={`min-h-[90px] border-b border-r border-gray-700 p-1.5 cursor-pointer hover:bg-gray-750 transition
                  ${!isCurrent ? 'bg-gray-800/50' : ''} ${isToday ? 'bg-blue-900/10' : ''} ${isExpanded ? 'bg-gray-700/50' : ''}`}
                  onClick={() => setExpandedDate(isExpanded ? null : ds)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${isToday ? 'text-blue-400 font-bold' : isCurrent ? 'text-gray-400' : 'text-gray-600'}`}>{day.getDate()}</span>
                    {dayP.length > 0 && <span className={`text-[10px] ${doneCnt === dayP.length ? 'text-green-400' : 'text-gray-500'}`}>{doneCnt}/{dayP.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {dayP.slice(0, isExpanded ? 999 : 3).map(p => (
                      <div key={p.id} className={`rounded px-1 py-0.5 text-[10px] flex items-center gap-1 ${p.is_done ? 'bg-gray-600/50' : 'bg-gray-700/80'}`}
                        onClick={e => { e.stopPropagation(); setEditingPlan(p); setEditForm({ category: p.category, description: p.description }) }}>
                        <button onClick={e => { e.stopPropagation(); handleToggle(p) }} className="shrink-0">{p.is_done ? '✅' : '⬜'}</button>
                        <span className={`${catBg[p.category]} text-white px-1 rounded text-[8px]`}>{catEmoji[p.category]}</span>
                        <span className={`truncate ${p.is_done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{p.description}</span>
                      </div>
                    ))}
                    {!isExpanded && dayP.length > 3 && <p className="text-[10px] text-gray-500 text-center">+{dayP.length - 3} 更多</p>}
                  </div>
                  {isExpanded && isCurrent && (
                    <button onClick={e => { e.stopPropagation(); setShowAdd(true); setAddDate(ds) }}
                      className="mt-1 w-full text-[10px] text-blue-400 hover:text-blue-300 text-center py-1 border border-dashed border-gray-600 rounded">+ 新增</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== 分析 Tab ===== */}
      {tab === 'analysis' && !loading && (
        <div className="space-y-6">
          {/* 匯出工具列 */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-wrap items-center gap-3">
            <span className="text-gray-400 text-sm">匯出範圍：</span>
            <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm" />
            <span className="text-gray-400">~</span>
            <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm" />
            <div className="flex gap-2 ml-auto">
              <button onClick={exportCSV} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1.5 rounded-lg text-sm">CSV</button>
              <button onClick={exportMD} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1.5 rounded-lg text-sm">MD</button>
              <button onClick={exportPDF} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm">PDF</button>
            </div>
          </div>

          <div ref={analysisRef}>
          {/* 每日趨勢 */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-white font-semibold mb-4">📈 每日計畫 vs 完成</h3>
            <Line data={lineData} options={lineOpts} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 類別分佈 */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">📊 類別分佈</h3>
              {monthPlans.length > 0 ? <div className="max-w-[280px] mx-auto"><Pie data={pieData} options={pieOpts} /></div> : <p className="text-gray-500 text-center py-10">尚無資料</p>}
            </div>

            {/* 完成率 */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">✅ 完成率</h3>
              {monthPlans.length > 0 ? (
                <div>
                  <div className="max-w-[280px] mx-auto"><Pie data={pieCompletionData} options={pieOpts} /></div>
                  <p className="text-center text-2xl font-bold text-white mt-4">{monthPlans.length > 0 ? Math.round(monthDone/monthPlans.length*100) : 0}%</p>
                </div>
              ) : <p className="text-gray-500 text-center py-10">尚無資料</p>}
            </div>
          </div>

          {/* 各類別趨勢 */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-white font-semibold mb-4">📉 各類別每日趨勢</h3>
            <Line data={catLineData} options={lineOpts} />
          </div>

          {/* 類別詳細 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categories.map(c => {
              const cp = monthPlans.filter(p => p.category === c)
              const done = cp.filter(p => p.is_done)
              const undone = cp.filter(p => !p.is_done)
              const pct = cp.length > 0 ? Math.round(done.length / cp.length * 100) : 0
              return (
                <div key={c} className={`bg-gray-800 rounded-xl border-l-4 ${catBorder[c]} border border-gray-700 p-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium">{catEmoji[c]} {c}</h4>
                    <span className="text-gray-400 text-sm">{done.length}/{cp.length} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: catColors[c] }} />
                  </div>
                  {undone.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">未完成：</p>
                      {undone.map(p => <p key={p.id} className="text-xs text-gray-400">⬜ {p.plan_date.slice(5)} {p.description}</p>)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          </div>{/* close analysisRef */}
        </div>
      )}

      {loading && <div className="text-center py-10 text-gray-400">載入中...</div>}

      {/* 新增 Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">新增計畫</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">類別</label>
                  <select value={newPlan.category} onChange={e => setNewPlan({ ...newPlan, category: e.target.value })}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
                    {categories.map(c => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">日期</label>
                  <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">內容（頓號分隔可新增多項）</label>
                <textarea value={newPlan.description} onChange={e => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 h-24 resize-none"
                  placeholder="完成Python課程第3章、寫部落格文章" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <button onClick={handleAdd} disabled={!newPlan.description}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">儲存</button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯 Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditingPlan(null)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">編輯計畫</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">類別</label>
                <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
                  {categories.map(c => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">內容</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 h-24 resize-none" />
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => handleDelete(editingPlan.id)} className="px-4 py-2 text-red-400 hover:text-red-300">🗑️ 刪除</button>
              <div className="flex gap-3">
                <button onClick={() => setEditingPlan(null)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                <button onClick={handleUpdate} disabled={!editForm.description}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
