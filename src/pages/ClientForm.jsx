import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [form, setForm] = useState({ name: '', industry: '', line_group_id: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditing)
  useEffect(() => { if (isEditing) fetchClient() }, [id])
  const fetchClient = async () => {
    try {
      const data = await api.clients.get(id)
      if (data) setForm({ name: data.name || '', industry: data.industry || '', line_group_id: data.line_group_id || '', notes: data.notes || '' })
    } catch (error) { alert('載入客戶資料失敗') } finally { setFetching(false) }
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { alert('請輸入客戶名稱'); return }
    setLoading(true)
    try {
      if (isEditing) await api.clients.update(id, form)
      else await api.clients.create(form)
      navigate('/clients')
    } catch (error) { alert('儲存失敗：' + error.message) } finally { setLoading(false) }
  }
  if (fetching) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">載入中...</div></div>
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8">{isEditing ? '✏️ 編輯客戶' : '➕ 新增客戶'}</h1>
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="space-y-6">
          <div><label className="block text-gray-300 mb-2">客戶名稱 <span className="text-red-400">*</span></label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="例如：ABC 公司" /></div>
          <div><label className="block text-gray-300 mb-2">產業類別</label><input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="例如：電商、餐飲、教育" /></div>
          <div><label className="block text-gray-300 mb-2">LINE 群組 ID</label><input type="text" value={form.line_group_id} onChange={(e) => setForm({ ...form, line_group_id: e.target.value })} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="例如：Cxxxxxxxxxxxxxxx" /></div>
          <div><label className="block text-gray-300 mb-2">備註</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none resize-none" /></div>
        </div>
        <div className="flex gap-4 mt-8">
          <button type="button" onClick={() => navigate('/clients')} className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">取消</button>
          <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? '儲存中...' : (isEditing ? '更新' : '建立')}</button>
        </div>
      </form>
    </div>
  )
}
