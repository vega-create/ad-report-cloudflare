import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default function ProposalEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [clients, setClients] = useState([])
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  useEffect(() => {
    fetchClients()
    if (!isNew) fetchProposal()
  }, [id])
  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').order('name')
    setClients(data || [])
  }
  const fetchProposal = async () => {
    try {
      const { data, error } = await supabase.from('proposals').select('*, clients(name)').eq('id', id).single()
      if (error) throw error
      setTitle(data.title || '')
      setClientId(data.client_id || '')
      setContent(data.content || '')
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }
  const saveProposal = async () => {
    if (!title.trim()) { alert('請輸入提案標題'); return }
    setSaving(true)
    try {
      if (isNew) {
        const { data, error } = await supabase.from('proposals').insert([{
          title, client_id: clientId || null, content
        }]).select().single()
        if (error) throw error
        navigate(`/proposals/${data.id}`)
      } else {
        const { error } = await supabase.from('proposals').update({
          title, client_id: clientId || null, content, updated_at: new Date().toISOString()
        }).eq('id', id)
        if (error) throw error
        navigate(`/proposals/${id}`)
      }
    } catch (error) { alert('儲存失敗') } finally { setSaving(false) }
  }
  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">載入中...</div></div>
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">{isNew ? '📑 建立提案' : '✏️ 編輯提案'}</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">{showPreview ? '📝 編輯' : '👁️ 預覽'}</button>
          <Link to="/proposals" className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">取消</Link>
          <button onClick={saveProposal} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? '儲存中...' : '💾 儲存'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">提案標題</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="例：2026 Q2 整體行銷規劃" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">客戶</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">選擇客戶（選填）</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${showPreview ? 'hidden lg:block' : ''}`}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700"><span className="text-gray-400 text-sm">Markdown 編輯器</span></div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 w-full p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none" placeholder="在這裡貼上提案內容..." />
          </div>
        </div>
        <div className={`${!showPreview ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-xl border border-gray-300 h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50"><span className="text-gray-600 text-sm">預覽（客戶看到的樣式）</span></div>
            <div className="flex-1 overflow-auto p-6 public-report">
              <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '（無內容）'}</ReactMarkdown></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
