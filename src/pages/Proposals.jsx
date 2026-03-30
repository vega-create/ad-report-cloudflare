import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
export default function Proposals() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchProposals() }, [])
  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase.from('proposals').select('*, clients(name)').order('created_at', { ascending: false })
      if (error) throw error
      setProposals(data || [])
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }
  const deleteProposal = async (id) => {
    if (!confirm('確定要刪除這份提案嗎？')) return
    try {
      const { error } = await supabase.from('proposals').delete().eq('id', id)
      if (error) throw error
      setProposals(proposals.filter(p => p.id !== id))
    } catch (error) { alert('刪除失敗') }
  }
  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">載入中...</div></div>
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">📑 提案列表</h1>
        <Link to="/proposals/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">➕ 建立提案</Link>
      </div>
      {proposals.length > 0 ? (
        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-white">{proposal.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs ${proposal.status === 'published' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>{proposal.status === 'published' ? '已發布' : '草稿'}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{proposal.clients?.name || '未指定客戶'} · {new Date(proposal.created_at).toLocaleString('zh-TW')}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/proposals/${proposal.id}`} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm">查看</Link>
                  <Link to={`/proposals/${proposal.id}/edit`} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">編輯</Link>
                  <button onClick={() => deleteProposal(proposal.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">刪除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="text-5xl mb-4">📑</div>
          <h3 className="text-xl text-white mb-2">還沒有任何提案</h3>
          <Link to="/proposals/new" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">➕ 建立提案</Link>
        </div>
      )}
    </div>
  )
}
