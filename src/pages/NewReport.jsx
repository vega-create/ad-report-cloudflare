import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function NewReport() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name')
      if (error) throw error
      setClients(data || [])
    } catch (error) { console.error(error) }
  }

  const saveReport = async () => {
    if (!selectedClient) { alert('請選擇客戶'); return }
    if (!content.trim()) { alert('請輸入報告內容'); return }
    setSaving(true)
    try {
      const { data: report, error } = await supabase.from('reports').insert([{
        client_id: selectedClient,
        data_analysis: content,
        report_date: new Date().toISOString().split('T')[0],
        status: 'draft'
      }]).select().single()
      if (error) throw error
      navigate(`/reports/${report.id}`)
    } catch (error) { alert('儲存失敗: ' + error.message) } finally { setSaving(false) }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">➕ 建立新報告</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
            {showPreview ? '📝 編輯' : '👁️ 預覽'}
          </button>
          <button onClick={saveReport} disabled={saving || !selectedClient || !content.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? '儲存中...' : '💾 儲存報告'}
          </button>
        </div>
      </div>

      {/* 選擇客戶 */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-2">選擇客戶 <span className="text-red-400">*</span></label>
        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none">
          <option value="">請選擇客戶...</option>
          {clients.map((client) => (<option key={client.id} value={client.id}>{client.name} {client.industry ? `(${client.industry})` : ''}</option>))}
        </select>
      </div>

      {/* Markdown 編輯器 / 預覽 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${showPreview ? 'hidden lg:block' : ''}`}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 h-[65vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm">Markdown 編輯器</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none"
              placeholder="在這裡輸入報告內容（支援 Markdown 格式）..."
            />
          </div>
        </div>
        <div className={`${!showPreview ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-xl border border-gray-300 h-[65vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="text-gray-600 text-sm">預覽（客戶看到的樣式）</span>
            </div>
            <div className="flex-1 overflow-auto p-6 public-report">
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || '（尚無內容）'}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
