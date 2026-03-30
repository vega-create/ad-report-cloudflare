import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showLinePreview, setShowLinePreview] = useState(false)
  const [lineMessage, setLineMessage] = useState('')
  const contentRef = useRef(null)
  useEffect(() => { fetchReport() }, [id])
  const fetchReport = async () => {
    try {
      const { data, error } = await supabase.from('reports').select('*, clients(*)').eq('id', id).single()
      if (error) throw error
      setReport(data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }
  const publishReport = async () => {
    setPublishing(true)
    try {
      const { error } = await supabase.from('reports').update({ status: 'published' }).eq('id', id)
      if (error) throw error
      setReport(prev => ({ ...prev, status: 'published' }))
    } catch (error) { alert('發布失敗') } finally { setPublishing(false) }
  }
  const openLinePreview = () => {
    if (!report.clients?.line_group_id) { alert('此客戶尚未設定 LINE 群組 ID'); return }
    const reportUrl = `${window.location.origin}/r/${id}`
    setLineMessage(`📊 ${report.clients.name} 廣告週報\n\n您好，本週的廣告成效報告已經準備好了！\n\n🔗 完整報告請點擊以下連結：\n${reportUrl}\n\n如有任何問題，歡迎隨時聯繫我們。\n智慧媽咪國際有限公司`)
    setShowLinePreview(true)
  }
  const sendToLine = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/send-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: report.clients.line_group_id, message: lineMessage })
      })
      if (!response.ok) throw new Error('發送失敗')
      setShowLinePreview(false)
      alert('已發送到 LINE 群組！')
    } catch (error) { alert('發送失敗: ' + error.message) } finally { setSending(false) }
  }
  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">載入中...</div></div>
  if (!report) return <div className="text-center py-12"><div className="text-5xl mb-4">😕</div><h2 className="text-xl text-white mb-2">找不到報告</h2><Link to="/reports" className="text-blue-400">返回報告列表</Link></div>
  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">📊 {report.clients?.name || '未知客戶'} 廣告報告</h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>建立於 {new Date(report.created_at).toLocaleString('zh-TW')}</span>
            <span className={`px-3 py-1 rounded-full ${report.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{report.status === 'published' ? '已發布' : '草稿'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={async () => { setDownloading(true); try { const html2pdf = (await import('html2pdf.js')).default; await html2pdf().set({ margin: [15,15,15,15], filename: `${report.clients?.name || '廣告'}_成效報告.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all','css','legacy'] } }).from(contentRef.current).save(); } catch(e) { alert('下載失敗') } finally { setDownloading(false) } }} disabled={downloading} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">{downloading ? '下載中...' : '📥 下載 PDF'}</button>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/r/${id}`); alert('已複製報告連結！') }} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">🔗 複製連結</button>
          {report.status !== 'published' && <button onClick={publishReport} disabled={publishing} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{publishing ? '發布中...' : '✅ 發布報告'}</button>}
          <button onClick={openLinePreview} disabled={!report.clients?.line_group_id} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">📱 發送到 LINE</button>
          <Link to={`/reports/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">✏️ 編輯</Link>
        </div>
      </div>
      <div ref={contentRef} className="bg-white rounded-xl border border-gray-300 p-8 public-report">
        <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{report.data_analysis || '（無內容）'}</ReactMarkdown></div>
      </div>
      <div className="mt-6 flex justify-between">
        <Link to="/reports" className="text-gray-400 hover:text-gray-300">← 返回列表</Link>
        <a href={`/r/${id}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">在新視窗預覽客戶版報告 →</a>
      </div>
      {showLinePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">📱 LINE 訊息預覽</h3>
              <button onClick={() => setShowLinePreview(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <textarea value={lineMessage} onChange={(e) => setLineMessage(e.target.value)} className="w-full h-64 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none" />
              <p className="text-gray-500 text-xs mt-2">訊息將發送到：{report.clients?.name} 的 LINE 群組</p>
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-3 justify-end">
              <button onClick={() => setShowLinePreview(false)} className="px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500">取消</button>
              <button onClick={sendToLine} disabled={sending || !lineMessage.trim()} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">{sending ? '發送中...' : '✅ 確認發送'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
