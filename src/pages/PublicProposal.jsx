import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default function PublicProposal() {
  const { id } = useParams()
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => { fetchProposal() }, [id])
  const fetchProposal = async () => {
    try {
      const { data, error } = await supabase.from('proposals').select('*, clients(name, industry)').eq('id', id).single()
      if (error) throw error
      setProposal(data)
    } catch (error) { setError('找不到提案') } finally { setLoading(false) }
  }
  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-500">載入中...</div></div>
  if (error || !proposal) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">📑</div><h1 className="text-2xl font-bold text-gray-800 mb-2">找不到提案</h1></div></div>
  return (
    <div className="min-h-screen bg-white public-report">
      <header className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl font-bold mb-2">📑 {proposal.title}</h1>
          <p className="text-purple-100">{proposal.clients?.name ? `${proposal.clients.name} · ` : ''}{new Date(proposal.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{proposal.content || '（無內容）'}</ReactMarkdown></div>
      </main>
      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>此提案由智慧媽咪國際有限公司提供</p>
          <p className="mt-1">如有任何問題，請與我們聯繫</p>
        </div>
      </footer>
    </div>
  )
}
