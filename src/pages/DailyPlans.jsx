import { useState, useEffect } from 'react'
import { supabaseAgent as supabase } from '../lib/supabase-agent'

const categories = ['學習進度', '自媒體進度', '聯盟行銷進度', '顧問講師進度']
const categoryEmoji = { '學習進度': '📚', '自媒體進度': '📱', '聯盟行銷進度': '🤝', '顧問講師進度': '🎓' }
const categoryColors = { '學習進度': 'border-blue-500', '自媒體進度': 'border-pink-500', '聯盟行銷進度': 'border-green-500', '顧問講師進度': 'border-yellow-500' }
const categoryBg = { '學習進度': 'bg-blue-600', '自媒體進度': 'bg-pink-600', '聯盟行銷進度': 'bg-green-600', '顧問講師進度': 'bg-yellow-600' }

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function DailyPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [showAdd, setShowAdd] = useState(false)
  const [newPlan, setNewPlan] = useState({ category: '學習進度', description: '' })
  const [editingPlan, setEditingPlan] = useState(null)
  const [editForm, setEditForm] = useState({ category: '', description: '' })
  const [weekOffset, setWeekOffset] = useState(0)

  // 計算一週日期
  function getMonday(d) {
    const date = new Date(d); const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff); date.setHours(0,0,0,0); return date
  }
  const monday = getMonday(new Date())
  monday.setDate(monday.getDate() + weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return d
  })
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']

  useEffect(() => { fetchPlans() }, [weekOffset])

  async function fetchPlans() {
    setLoading(true)
    const start = formatDate(weekDays[0])
    const end = formatDate(weekDays[6])
    const { data } = await supabase.from('daily_plans').select('*')
      .gte('plan_date', start).lte('plan_date', end)
      .order('category').order('created_at')
    setPlans(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!newPlan.description) return
    const items = newPlan.description.split(/[、，,]/).map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      await supabase.from('daily_plans').insert({
        plan_date: selectedDate, category: newPlan.category, description: item,
      })
    }
    setNewPlan({ category: '學習進度', description: '' })
    setShowAdd(false)
    fetchPlans()
  }

  async function handleToggleDone(plan) {
    await supabase.from('daily_plans').update({
      is_done: !plan.is_done,
      completed_at: !plan.is_done ? new Date().toISOString() : null,
    }).eq('id', plan.id)
    fetchPlans()
  }

  async function handleUpdate() {
    if (!editingPlan || !editForm.description) return
    await supabase.from('daily_plans').update({
      category: editForm.category, description: editForm.description,
    }).eq('id', editingPlan.id)
    setEditingPlan(null)
    fetchPlans()
  }

  async function handleDelete(id) {
    if (!confirm('確定要刪除？')) return
    await supabase.from('daily_plans').delete().eq('id', id)
    setEditingPlan(null)
    fetchPlans()
  }

  // 統計
  const todayStr = formatDate(new Date())
  const todayPlans = plans.filter(p => p.plan_date === todayStr)
  const todayDone = todayPlans.filter(p => p.is_done).length
  const weekDone = plans.filter(p => p.is_done).length
  const catStats = {}
  categories.forEach(c => {
    const cp = plans.filter(p => p.category === c)
    catStats[c] = { total: cp.length, done: cp.filter(p => p.is_done).length }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">每日計畫</h1>
        <button onClick={() => { setShowAdd(true); setSelectedDate(todayStr) }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">+ 新增計畫</button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">{todayDone}/{todayPlans.length}</p>
          <p className="text-xs text-gray-400">今日完成</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-white">{weekDone}/{plans.length}</p>
          <p className="text-xs text-gray-400">本週完成</p>
        </div>
        {categories.map(c => (
          <div key={c} className="bg-gray-800 rounded-xl border border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-white">{catStats[c]?.done || 0}/{catStats[c]?.total || 0}</p>
            <p className="text-xs text-gray-400">{categoryEmoji[c]} {c.replace('進度','')}</p>
          </div>
        ))}
      </div>

      {/* 週曆導覽 */}
      <div className="flex items-center gap-3">
        <button onClick={() => setWeekOffset(p => p - 1)} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">◀</button>
        <span className="text-white font-medium min-w-[160px] text-center">
          {weekDays[0].getMonth()+1}/{weekDays[0].getDate()} – {weekDays[6].getMonth()+1}/{weekDays[6].getDate()}
        </span>
        <button onClick={() => setWeekOffset(p => p + 1)} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-600">▶</button>
        <button onClick={() => setWeekOffset(0)} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg hover:bg-gray-600 text-sm">本週</button>
      </div>

      {/* 週曆 */}
      {loading ? <div className="text-center py-10 text-gray-400">載入中...</div> : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, di) => {
            const dayStr = formatDate(day)
            const dayPlans = plans.filter(p => p.plan_date === dayStr)
            const isToday = dayStr === todayStr
            const isWeekend = di >= 5
            const doneCnt = dayPlans.filter(p => p.is_done).length
            return (
              <div key={di} className={`bg-gray-800 rounded-xl border ${isToday ? 'border-blue-500' : 'border-gray-700'} overflow-hidden ${isWeekend ? 'opacity-80' : ''}`}>
                <div className={`px-2 py-2 text-center border-b ${isToday ? 'border-blue-500 bg-blue-600/10' : 'border-gray-700'}`}>
                  <p className={`text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>{dayNames[di]}</p>
                  <p className="text-xs text-gray-500">{day.getMonth()+1}/{day.getDate()}</p>
                  {dayPlans.length > 0 && <p className={`text-xs mt-0.5 ${doneCnt === dayPlans.length ? 'text-green-400' : 'text-gray-400'}`}>{doneCnt}/{dayPlans.length}</p>}
                </div>
                <div className="p-1.5 space-y-1 min-h-[100px]">
                  {dayPlans.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-3">-</p>
                  ) : dayPlans.map(plan => (
                    <div key={plan.id} className={`rounded-lg p-1.5 text-xs border-l-2 ${categoryColors[plan.category] || 'border-gray-500'} ${plan.is_done ? 'bg-gray-700/50' : 'bg-gray-700'} cursor-pointer hover:bg-gray-600 group`}>
                      <div className="flex items-start gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleToggleDone(plan) }}
                          className="shrink-0 mt-0.5">{plan.is_done ? '✅' : '⬜'}</button>
                        <div className="flex-1 min-w-0" onClick={() => { setEditingPlan(plan); setEditForm({ category: plan.category, description: plan.description }) }}>
                          <span className={`${categoryBg[plan.category]} text-white px-1 py-0.5 rounded text-[9px]`}>{categoryEmoji[plan.category]}</span>
                          <p className={`mt-0.5 leading-tight ${plan.is_done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{plan.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
                    {categories.map(c => <option key={c} value={c}>{categoryEmoji[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">日期</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
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
                  {categories.map(c => <option key={c} value={c}>{categoryEmoji[c]} {c}</option>)}
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
