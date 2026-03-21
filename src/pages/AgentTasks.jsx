import { useEffect, useState } from 'react'
import { supabaseAgent as supabase } from '../lib/supabase-agent'

export default function AgentTasks() {
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    employee_id: '', client_name: '', task_name: '',
    frequency: 'weekly', frequency_detail: '',
  })

  async function loadData() {
    const [{ data: tasksData }, { data: empData }] = await Promise.all([
      supabase
        .from('agent_tasks')
        .select('id, task_name, client_name, frequency, frequency_detail, is_active, employee_id, agent_employees (name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('agent_employees')
        .select('id, name')
        .eq('is_active', true),
    ])

    setTasks((tasksData || []).map(t => ({
      ...t,
      employee_name: t.agent_employees?.name || '未指派',
    })))
    setEmployees(empData || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (editingId) {
      await supabase.from('agent_tasks').update({
        employee_id: formData.employee_id,
        client_name: formData.client_name,
        task_name: formData.task_name,
        frequency: formData.frequency,
        frequency_detail: formData.frequency_detail,
      }).eq('id', editingId)
    } else {
      await supabase.from('agent_tasks').insert({
        ...formData,
        is_active: true,
      })
    }
    setShowForm(false)
    setEditingId(null)
    setFormData({ employee_id: '', client_name: '', task_name: '', frequency: 'weekly', frequency_detail: '' })
    loadData()
  }

  function handleEdit(task) {
    setEditingId(task.id)
    setFormData({
      employee_id: task.employee_id,
      client_name: task.client_name,
      task_name: task.task_name,
      frequency: task.frequency,
      frequency_detail: task.frequency_detail,
    })
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!confirm('確定要刪除這個任務嗎？')) return
    await supabase.from('agent_tasks').delete().eq('id', id)
    loadData()
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setFormData({ employee_id: '', client_name: '', task_name: '', frequency: 'weekly', frequency_detail: '' })
  }

  if (loading) return <div className="text-center py-10 text-gray-400">載入中...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">任務管理</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? '取消' : '+ 新增任務'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h2 className="font-semibold text-white mb-4">{editingId ? '編輯任務' : '新增任務'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">員工</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">選擇員工</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">客戶名稱</label>
                <input type="text" value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：寵樂芙" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">任務名稱</label>
                <input type="text" value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：廣告代操" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">頻率</label>
                <select value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="daily">每日</option>
                  <option value="weekly">每週</option>
                  <option value="monthly">每月</option>
                  <option value="custom">自訂</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">頻率細節</label>
                <input type="text" value={formData.frequency_detail}
                  onChange={(e) => setFormData({ ...formData, frequency_detail: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例：每週一、週三 或 每月5號 或 不固定" />
              </div>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                {editingId ? '更新' : '儲存'}
              </button>
              <button type="button" onClick={handleCancel} className="bg-gray-700 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-600 transition">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
          目前沒有任務
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">員工</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">客戶</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">任務</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">頻率</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-sm text-gray-300">{task.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{task.client_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{task.task_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{task.frequency_detail || task.frequency}</td>
                    <td className="px-4 py-3 text-sm space-x-3">
                      <button onClick={() => handleEdit(task)} className="text-blue-400 hover:text-blue-300 font-medium">編輯</button>
                      <button onClick={() => handleDelete(task.id)} className="text-red-400 hover:text-red-300 font-medium">刪除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
