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
function getMonday(d) { const date = new Date(d); const day = date.getDay(); date.setDate(date.getDate() - day + (day === 0 ? -6 : 1)); date.setHours(0,0,0,0); return date }
function getMonthDays(y, m) {
  const first = new Date(y, m, 1), last = new Date(y, m+1, 0), pad = (first.getDay()+6)%7, days = []
  for (let i = -pad; i <= last.getDate()-1; i++) days.push(new Date(y, m, i+1))
  while (days.length % 7 !== 0) { const d = new Date(days[days.length-1]); d.setDate(d.getDate()+1); days.push(d) }
  return days
}

export default function DailyPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('calendar')
  const [viewMode, setViewMode] = useState('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthDate, setMonthDate] = useState(new Date())
  const [customStart, setCustomStart] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` })
  const [customEnd, setCustomEnd] = useState(() => fmt(new Date()))
  const [expandedDate, setExpandedDate] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addDate, setAddDate] = useState(fmt(new Date()))
  const [newPlan, setNewPlan] = useState({ category: '學習進度', description: '' })
  const [editingPlan, setEditingPlan] = useState(null)
  const [editForm, setEditForm] = useState({ category: '', description: '' })
  const analysisRef = useRef(null)
  const todayStr = fmt(new Date())

  // 週曆計算
  const monday = getMonday(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(d.getDate()+i); return d })
  const dayNames = ['一','二','三','四','五','六','日']

  // 月曆計算
  const year = monthDate.getFullYear(), month = monthDate.getMonth()
  const monthDays = useMemo(() => getMonthDays(year, month), [year, month])

  // 查詢範圍
  const qStart = viewMode === 'custom' ? customStart : viewMode === 'week' ? fmt(weekDays[0]) : fmt(monthDays[0])
  const qEnd = viewMode === 'custom' ? customEnd : viewMode === 'week' ? fmt(weekDays[6]) : fmt(monthDays[monthDays.length-1])
  const dateLabel = viewMode === 'week'
    ? `${weekDays[0].getMonth()+1}/${weekDays[0].getDate()} – ${weekDays[6].getMonth()+1}/${weekDays[6].getDate()}`
    : viewMode === 'month' ? `${year} 年 ${month+1} 月` : `${customStart} ~ ${customEnd}`

  useEffect(() => { fetchPlans() }, [qStart, qEnd])

  async function fetchPlans() {
    setLoading(true)
    const { data } = await supabase.from('daily_plans').select('*').gte('plan_date', qStart).lte('plan_date', qEnd).order('category').order('created_at')
    setPlans(data || []); setLoading(false)
  }

  async function handleAdd() {
    if (!newPlan.description) return
    for (const item of newPlan.description.split(/[、，,]/).map(s => s.trim()).filter(Boolean)) {
      await supabase.from('daily_plans').insert({ plan_date: addDate, category: newPlan.category, description: item })
    }
    setNewPlan({ category: '學習進度', description: '' }); setShowAdd(false); fetchPlans()
  }

  async function handleToggle(plan) {
    await supabase.from('daily_plans').update({ is_done: !plan.is_done, completed_at: !plan.is_done ? new Date().toISOString() : null }).eq('id', plan.id)
    fetchPlans()
  }

  async function handleUpdate() {
    if (!editingPlan || !editForm.description) return
    await supabase.from('daily_plans').update({ category: editForm.category, description: editForm.description }).eq('id', editingPlan.id)
    setEditingPlan(null); fetchPlans()
  }

  async function handleDelete(id) {
    if (!confirm('確定要刪除？')) return
    await supabase.from('daily_plans').delete().eq('id', id); setEditingPlan(null); fetchPlans()
  }

  // 匯出
  function dl(content, filename, type) {
    const blob = new Blob([type === 'csv' ? '﻿' + content : content], { type: type === 'csv' ? 'text/csv;charset=utf-8' : 'text/markdown' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  }

  function exportCSV() {
    if (plans.length === 0) return
    const rows = ['日期,類別,內容,狀態,完成時間', ...plans.map(p =>
      `${p.plan_date},${p.category},${p.description.replace(/,/g,'，')},${p.is_done?'已完成':'未完成'},${p.completed_at?new Date(p.completed_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):''}`
    )].join('\n')
    dl(rows, `每日計畫_${qStart}_${qEnd}.csv`, 'csv')
  }

  function exportMD() {
    if (plans.length === 0) return
    const done = plans.filter(p => p.is_done).length, grouped = {}
    plans.forEach(p => { if (!grouped[p.plan_date]) grouped[p.plan_date] = []; grouped[p.plan_date].push(p) })
    let md = `# 每日計畫報告\n📅 ${qStart} ~ ${qEnd}\n\n`
    md += `## 總覽\n- 總計畫：${plans.length} 項\n- 已完成：${done} 項（${plans.length>0?Math.round(done/plans.length*100):0}%）\n\n`
    md += `## 類別統計\n`
    categories.forEach(c => { const cp = plans.filter(p => p.category === c); if (cp.length > 0) md += `- ${catEmoji[c]} ${c}：${cp.filter(p=>p.is_done).length}/${cp.length}\n` })
    md += `\n## 每日明細\n\n`
    Object.entries(grouped).sort(([a],[b])=>a.localeCompare(b)).forEach(([date, items]) => {
      const d = new Date(date), wd = ['日','一','二','三','四','五','六'][d.getDay()]
      md += `### ${d.getMonth()+1}/${d.getDate()}（${wd}）\n`
      items.forEach(p => { md += `- ${p.is_done?'✅':'⬜'} [${catEmoji[p.category]} ${p.category.replace('進度','')}] ${p.description}\n` })
      md += '\n'
    })
    dl(md, `每日計畫_${qStart}_${qEnd}.md`, 'md')
  }

  async function exportPDF() {
    if (!analysisRef.current) return
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf().set({ margin:[15,15,15,15], filename:`每日計畫_${qStart}_${qEnd}.pdf`, image:{type:'jpeg',quality:0.98}, html2canvas:{scale:2}, jsPDF:{unit:'mm',format:'a4',orientation:'portrait'} }).from(analysisRef.current).save()
  }

  // 統計
  const totalPlans = plans.length, totalDone = plans.filter(p => p.is_done).length
  const catStats = {}
  categories.forEach(c => { const cp = plans.filter(p => p.category === c); catStats[c] = { total: cp.length, done: cp.filter(p => p.is_done).length } })

  // 圖表
  const pieData = { labels: categories.map(c => `${catEmoji[c]} ${c.replace('進度','')}`), datasets: [{ data: categories.map(c => catStats[c]?.total||0), backgroundColor: categories.map(c => catColors[c]), borderWidth: 0 }] }
  const pieDoneData = { labels: ['已完成','未完成'], datasets: [{ data: [totalDone, totalPlans-totalDone], backgroundColor: ['#22c55e','#374151'], borderWidth: 0 }] }
  const pieOpts = { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#d1d5db', padding: 12 } } } }

  // 折線圖用月份的每日
  const lineLabels = viewMode === 'month' ? Array.from({ length: new Date(year,month+1,0).getDate() }, (_,i) => `${i+1}`) : weekDays.map(d => `${d.getMonth()+1}/${d.getDate()}`)
  const lineDates = viewMode === 'month' ? Array.from({ length: new Date(year,month+1,0).getDate() }, (_,i) => `${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`) : weekDays.map(d => fmt(d))
  const lineData = { labels: lineLabels, datasets: [
    { label: '計畫數', data: lineDates.map(ds => plans.filter(p=>p.plan_date===ds).length), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.3 },
    { label: '完成數', data: lineDates.map(ds => plans.filter(p=>p.plan_date===ds&&p.is_done).length), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.3 },
  ]}
  const lineOpts = { responsive: true, plugins: { legend: { labels: { color: '#9ca3af' } } }, scales: { x: { ticks: { color: '#6b7280' } }, y: { ticks: { color: '#6b7280', stepSize: 1 }, beginAtZero: true } } }

  // 計畫卡片元件
  function PlanItem({ plan, compact }) {
    return (
      <div className={`rounded-lg p-1.5 text-xs border-l-2 ${catBorder[plan.category]} ${plan.is_done ? 'bg-green-900/20' : 'bg-gray-700'} cursor-pointer hover:bg-gray-600 group flex items-start gap-1.5`}>
        <button onClick={e => { e.stopPropagation(); handleToggle(plan) }} className="shrink-0 mt-0.5 text-sm">{plan.is_done ? '✅' : '⬜'}</button>
        <div className="flex-1 min-w-0" onClick={() => { setEditingPlan(plan); setEditForm({ category: plan.category, description: plan.description }) }}>
          <div className="flex items-center gap-1">
            <span className={`${catBg[plan.category]} text-white px-1 py-0.5 rounded text-[9px]`}>{catEmoji[plan.category]}</span>
            {!compact && <span className="text-gray-500 text-[10px]">{plan.category.replace('進度','')}</span>}
          </div>
          <p className={`mt-0.5 leading-tight ${plan.is_done ? 'text-green-400/70 line-through' : 'text-gray-200'}`}>{plan.description}</p>
          {plan.is_done && plan.completed_at && <p className="text-green-600 text-[10px] mt-0.5">{new Date(plan.completed_at).toLocaleString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Taipei'})} 完成</p>}
        </div>
      </div>
    )
  }

  // 按日期分組（自訂模式用）
  const grouped = {}
  plans.forEach(p => { if (!grouped[p.plan_date]) grouped[p.plan_date] = []; grouped[p.plan_date].push(p) })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">每日計畫</h1>
        <button onClick={() => { setShowAdd(true); setAddDate(todayStr) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">+ 新增計畫</button>
      </div>

      {/* Tab */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('calendar')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>📅 行事曆</button>
        <button onClick={() => setTab('analysis')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'analysis' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>📊 分析</button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalPlans}</p>
          <p className="text-xs text-gray-400">總計畫</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className={`text-2xl font-bold ${totalDone===totalPlans&&totalPlans>0?'text-green-400':'text-white'}`}>{totalDone}/{totalPlans}</p>
          <p className="text-xs text-gray-400">已完成</p>
        </div>
        {categories.map(c => (
          <div key={c} className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-white">{catStats[c]?.done||0}/{catStats[c]?.total||0}</p>
            <p className="text-xs text-gray-400">{catEmoji[c]} {c.replace('進度','')}</p>
          </div>
        ))}
      </div>

      {/* 導覽列 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-gray-700 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-sm transition ${viewMode==='week'?'bg-blue-600 text-white':'text-gray-400 hover:text-white'}`}>週</button>
          <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-sm transition ${viewMode==='month'?'bg-blue-600 text-white':'text-gray-400 hover:text-white'}`}>月</button>
          <button onClick={() => setViewMode('custom')} className={`px-3 py-1.5 text-sm transition ${viewMode==='custom'?'bg-blue-600 text-white':'text-gray-400 hover:text-white'}`}>自訂</button>
        </div>

        {viewMode === 'custom' ? (
          <>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm" />
            <span className="text-gray-400">~</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-gray-700 text-white rounded-lg px-3 py-1.5 border border-gray-600 text-sm" />
          </>
        ) : (
          <>
            <button onClick={() => { if(viewMode==='week') setWeekOffset(p=>p-1); else setMonthDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()-1);return n}) }} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">◀</button>
            <span className="text-white font-medium min-w-[160px] text-center">{dateLabel}</span>
            <button onClick={() => { if(viewMode==='week') setWeekOffset(p=>p+1); else setMonthDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()+1);return n}) }} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">▶</button>
            <button onClick={() => { setWeekOffset(0); setMonthDate(new Date()) }} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-600 text-sm">今天</button>
          </>
        )}

        <div className="flex gap-2 ml-auto">
          <button onClick={exportCSV} disabled={plans.length===0} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">CSV</button>
          <button onClick={exportMD} disabled={plans.length===0} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">MD</button>
          <button onClick={exportPDF} disabled={plans.length===0} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">PDF</button>
        </div>
      </div>

      {/* ===== 行事曆 Tab ===== */}
      {tab === 'calendar' && !loading && (
        viewMode === 'week' ? (
          /* 週檢視 7 天 */
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, di) => {
              const ds = fmt(day), dayP = plans.filter(p => p.plan_date === ds)
              const isToday = ds === todayStr, doneCnt = dayP.filter(p => p.is_done).length
              return (
                <div key={di} className={`bg-gray-800 rounded-xl border ${isToday?'border-blue-500':'border-gray-700'} overflow-hidden ${di>=5?'opacity-80':''}`}>
                  <div className={`px-2 py-2 text-center border-b ${isToday?'border-blue-500 bg-blue-600/10':'border-gray-700'}`}>
                    <p className={`text-sm font-semibold ${isToday?'text-blue-400':'text-gray-300'}`}>{dayNames[di]}</p>
                    <p className="text-xs text-gray-500">{day.getMonth()+1}/{day.getDate()}</p>
                    {dayP.length > 0 && <p className={`text-xs mt-0.5 ${doneCnt===dayP.length?'text-green-400':'text-gray-400'}`}>{doneCnt}/{dayP.length}</p>}
                  </div>
                  <div className="p-1.5 space-y-1 min-h-[100px]">
                    {dayP.length === 0 ? <p className="text-xs text-gray-600 text-center py-3">-</p> :
                      dayP.map(p => <PlanItem key={p.id} plan={p} compact={false} />)}
                    <button onClick={() => { setShowAdd(true); setAddDate(ds) }} className="w-full text-[10px] text-blue-400 hover:text-blue-300 text-center py-1 border border-dashed border-gray-600 rounded mt-1">+</button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : viewMode === 'month' ? (
          /* 月檢視 */
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-700">
              {dayNames.map(n => <div key={n} className="px-2 py-2 text-center text-xs font-semibold text-gray-400">{n}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const ds = fmt(day), dayP = plans.filter(p => p.plan_date === ds)
                const isToday = ds === todayStr, isCurrent = day.getMonth() === month
                const doneCnt = dayP.filter(p => p.is_done).length, isExpanded = expandedDate === ds
                return (
                  <div key={i} className={`min-h-[90px] border-b border-r border-gray-700 p-1.5 cursor-pointer hover:bg-gray-750 transition ${!isCurrent?'bg-gray-800/50':''} ${isToday?'bg-blue-900/10':''} ${isExpanded?'bg-gray-700/50':''}`}
                    onClick={() => setExpandedDate(isExpanded ? null : ds)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${isToday?'text-blue-400 font-bold':isCurrent?'text-gray-400':'text-gray-600'}`}>{day.getDate()}</span>
                      {dayP.length > 0 && <span className={`text-[10px] ${doneCnt===dayP.length?'text-green-400':'text-gray-500'}`}>{doneCnt}/{dayP.length}</span>}
                    </div>
                    <div className="space-y-0.5">
                      {dayP.slice(0, isExpanded ? 999 : 3).map(p => (
                        <div key={p.id} className={`rounded px-1 py-0.5 text-[10px] flex items-center gap-1 ${p.is_done?'bg-green-900/20':'bg-gray-700/80'}`}
                          onClick={e => { e.stopPropagation(); setEditingPlan(p); setEditForm({ category: p.category, description: p.description }) }}>
                          <button onClick={e => { e.stopPropagation(); handleToggle(p) }} className="shrink-0">{p.is_done?'✅':'⬜'}</button>
                          <span className={`${catBg[p.category]} text-white px-1 rounded text-[8px]`}>{catEmoji[p.category]}</span>
                          <span className={`truncate ${p.is_done?'text-green-400/60 line-through':'text-gray-300'}`}>{p.description}</span>
                        </div>
                      ))}
                      {!isExpanded && dayP.length > 3 && <p className="text-[10px] text-gray-500 text-center">+{dayP.length-3}</p>}
                      {isExpanded && isCurrent && <button onClick={e => { e.stopPropagation(); setShowAdd(true); setAddDate(ds) }} className="mt-0.5 w-full text-[10px] text-blue-400 hover:text-blue-300 text-center py-0.5 border border-dashed border-gray-600 rounded">+</button>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* 自訂模式 - 列表 */
          plans.length === 0 ? <div className="text-center py-20 text-gray-500"><p className="text-4xl mb-4">📋</p><p>此範圍無計畫</p></div> : (
          <div className="space-y-4">
            {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([date, items]) => {
              const d = new Date(date), wd = ['日','一','二','三','四','五','六'][d.getDay()]
              const doneCnt = items.filter(p => p.is_done).length
              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-gray-400 text-sm font-medium">{d.getMonth()+1}/{d.getDate()} ({wd})</h3>
                    <span className={`text-xs ${doneCnt===items.length?'text-green-400':'text-gray-500'}`}>{doneCnt}/{items.length}</span>
                  </div>
                  <div className="space-y-1.5">{items.map(p => <PlanItem key={p.id} plan={p} compact={false} />)}</div>
                </div>
              )
            })}
          </div>)
        )
      )}

      {/* ===== 分析 Tab ===== */}
      {tab === 'analysis' && !loading && (
        <div ref={analysisRef} className="space-y-6">
          {/* 折線圖 */}
          {(viewMode === 'week' || viewMode === 'month') && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">📈 每日趨勢</h3>
              <Line data={lineData} options={lineOpts} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">📊 類別分佈</h3>
              {totalPlans > 0 ? <div className="max-w-[260px] mx-auto"><Pie data={pieData} options={pieOpts} /></div> : <p className="text-gray-500 text-center py-10">尚無資料</p>}
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">✅ 完成率</h3>
              {totalPlans > 0 ? (<div><div className="max-w-[260px] mx-auto"><Pie data={pieDoneData} options={pieOpts} /></div><p className="text-center text-3xl font-bold text-white mt-4">{Math.round(totalDone/totalPlans*100)}%</p></div>) : <p className="text-gray-500 text-center py-10">尚無資料</p>}
            </div>
          </div>

          {/* 類別進度 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categories.map(c => {
              const cp = plans.filter(p => p.category === c), done = cp.filter(p => p.is_done), undone = cp.filter(p => !p.is_done)
              const pct = cp.length > 0 ? Math.round(done.length/cp.length*100) : 0
              return (
                <div key={c} className={`bg-gray-800 rounded-xl border-l-4 ${catBorder[c]} border border-gray-700 p-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium">{catEmoji[c]} {c}</h4>
                    <span className="text-gray-400 text-sm">{done.length}/{cp.length} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: catColors[c] }} />
                  </div>
                  {done.length > 0 && <div className="mb-2">{done.map(p => <p key={p.id} className="text-xs text-green-400">✅ {p.plan_date.slice(5)} {p.description}</p>)}</div>}
                  {undone.length > 0 && <div>{undone.map(p => <p key={p.id} className="text-xs text-gray-400">⬜ {p.plan_date.slice(5)} {p.description}</p>)}</div>}
                </div>
              )
            })}
          </div>
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
                <div><label className="text-sm text-gray-400 block mb-1">類別</label>
                  <select value={newPlan.category} onChange={e => setNewPlan({...newPlan, category: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
                    {categories.map(c => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
                  </select></div>
                <div><label className="text-sm text-gray-400 block mb-1">日期</label>
                  <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600" /></div>
              </div>
              <div><label className="text-sm text-gray-400 block mb-1">內容（頓號分隔可多項）</label>
                <textarea value={newPlan.description} onChange={e => setNewPlan({...newPlan, description: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 h-24 resize-none" placeholder="完成Python課程第3章、寫部落格文章" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
              <button onClick={handleAdd} disabled={!newPlan.description} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">儲存</button>
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
              <div><label className="text-sm text-gray-400 block mb-1">類別</label>
                <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600">
                  {categories.map(c => <option key={c} value={c}>{catEmoji[c]} {c}</option>)}
                </select></div>
              <div><label className="text-sm text-gray-400 block mb-1">內容</label>
                <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 h-24 resize-none" /></div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => handleDelete(editingPlan.id)} className="px-4 py-2 text-red-400 hover:text-red-300">🗑️ 刪除</button>
              <div className="flex gap-3">
                <button onClick={() => setEditingPlan(null)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                <button onClick={handleUpdate} disabled={!editForm.description} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50">儲存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
