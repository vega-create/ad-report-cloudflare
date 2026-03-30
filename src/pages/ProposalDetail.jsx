import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default function ProposalDetail() {
  const { id } = useParams()
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  useEffect(() => { fetchProposal() }, [id])
  const fetchProposal = async () => {
    try {
      const { data, error } = await supabase.from('proposals').select('*, clients(name, line_group_id)').eq('id', id).single()
      if (error) throw error
      setProposal(data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }
  const publishProposal = async () => {
    setPublishing(true)
    try {
      const { error } = await supabase.from('proposals').update({ status: 'published' }).eq('id', id)
      if (error) throw error
      setProposal(prev => ({ ...prev, status: 'published' }))
    } catch (error) { alert('發布失敗') } finally { setPublishing(false) }
  }
  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">載入中...</div></div>
  if (!proposal) return <div className="text-center py-12"><div className="text-5xl mb-4">😕</div><h2 className="text-xl text-white mb-2">找不到提案</h2><Link to="/proposals" className="text-blue-400">返回提案列表</Link></div>
  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">📑 {proposal.title}</h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span>{proposal.clients?.name || '未指定客戶'}</span>
            <span>建立於 {new Date(proposal.created_at).toLocaleString('zh-TW')}</span>
            <span className={`px-3 py-1 rounded-full ${proposal.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{proposal.status === 'published' ? '已發布' : '草稿'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${id}`); alert('已複製提案連結！') }} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">🔗 複製連結</button>
          {proposal.status !== 'published' && <button onClick={publishProposal} disabled={publishing} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{publishing ? '發布中...' : '✅ 發布'}</button>}
          <Link to={`/proposals/${id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">✏️ 編輯</Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-300 p-8 public-report">
        <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{proposal.content || '（無內容）'}</ReactMarkdown></div>
      </div>
      <div className="mt-6 flex justify-between">
        <Link to="/proposals" className="text-gray-400 hover:text-gray-300">← 返回列表</Link>
        <a href={`/p/${id}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">在新視窗預覽客戶版提案 →</a>
      </div>
    </div>
  )
}
