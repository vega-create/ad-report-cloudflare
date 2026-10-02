import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default function ReportEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  useEffect(() => { fetchReport() }, [id])
  const fetchReport = async () => {
    try {
      const { data, error } = await supabase.from('reports').select('*, clients(name)').eq('id', id).single()
      if (error) throw error
      setReport(data)
      setContent(data.data_analysis || '')
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }
  const saveReport = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('reports').update({ data_analysis: content }).eq('id', id)
      if (error) throw error
      navigate(`/reports/${id}`)
    } catch (error) { alert('儲存失敗') } finally { setSaving(false) }
  }
  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">載入中...</div></div>
  if (!report) return <div className="text-center py-12"><Link to="/reports" className="text-blue-400">返回報告列表</Link></div>
  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">✏️ 編輯報告 - {report.clients?.name}</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">{showPreview ? '📝 編輯' : '👁️ 預覽'}</button>
          <Link to={`/reports/${id}`} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">取消</Link>
          <button onClick={saveReport} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? '儲存中...' : '💾 儲存'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${showPreview ? 'hidden lg:block' : ''}`}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700"><span className="text-gray-400 text-sm">Markdown 編輯器</span></div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 w-full p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none" placeholder="在這裡編輯報告內容..." />
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
