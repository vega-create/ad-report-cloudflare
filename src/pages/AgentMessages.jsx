import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AgentMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [importantOnly, setImportantOnly] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [noteText, setNoteText] = useState('')

  async function loadMessages() {
    setLoading(true)

    let query = supabase
      .from('agent_customer_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    // 時間篩選
    if (dateFilter === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      query = query.gte('created_at', today.toISOString())
    } else if (dateFilter === '7days') {
      const date = new Date()
      date.setDate(date.getDate() - 7)
      query = query.gte('created_at', date.toISOString())
    } else if (dateFilter === '30days') {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      query = query.gte('created_at', date.toISOString())
    } else if (dateFilter === 'custom') {
      if (customStartDate) query = query.gte('created_at', new Date(customStartDate).toISOString())
      if (customEndDate) {
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        query = query.lte('created_at', end.toISOString())
      }
    }

    if (groupFilter !== 'all') query = query.eq('group_name', groupFilter)
    if (searchText) query = query.ilike('message', `%${searchText}%`)
    if (importantOnly) query = query.eq('is_important', true)

    const { data } = await query
    setMessages(data || [])

    // 取得群組列表
    const { data: groupData } = await supabase
      .from('agent_customer_messages')
      .select('group_name')
      .order('group_name')
    const unique = [...new Set((groupData || []).map(g => g.group_name))]
    setGroups(unique)
    setLoading(false)
  }

  useEffect(() => {
    loadMessages()
  }, [dateFilter, customStartDate, customEndDate, groupFilter, importantOnly])

  useEffect(() => {
    const timer = setTimeout(() => loadMessages(), 300)
    return () => clearTimeout(timer)
  }, [searchText])

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('zh-TW', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function toggleImportant(id, currentValue) {
    await supabase
      .from('agent_customer_messages')
      .update({ is_important: !currentValue })
      .eq('id', id)
    setMessages(messages.map(m => m.id === id ? { ...m, is_important: !currentValue } : m))
  }

  async function saveNote(id) {
    await supabase
      .from('agent_customer_messages')
      .update({ note: noteText })
      .eq('id', id)
    setMessages(messages.map(m => m.id === id ? { ...m, note: noteText } : m))
    setEditingNote(null)
    setNoteText('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">客戶訊息</h1>

      {/* 篩選區 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="🔍 搜尋訊息內容..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setImportantOnly(!importantOnly)}
            className={`px-4 py-2 rounded-lg border transition ${importantOnly
              ? 'bg-yellow-600/20 border-yellow-500 text-yellow-400'
              : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600'
            }`}
          >
            ⭐ 重要
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部時間</option>
            <option value="today">今天</option>
            <option value="7days">最近 7 天</option>
            <option value="30days">最近 30 天</option>
            <option value="custom">自訂時間</option>
          </select>

          {dateFilter === 'custom' && (
            <>
              <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white" />
              <span className="py-2 text-gray-500">到</span>
              <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white" />
            </>
          )}

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部群組</option>
            {groups.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* 訊息列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : messages.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
          沒有找到訊息
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-700">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-4 hover:bg-gray-750 ${msg.is_important ? 'bg-yellow-900/10' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400">
                      {msg.group_name}
                    </span>
                    <button
                      onClick={() => toggleImportant(msg.id, msg.is_important)}
                      className={`text-lg ${msg.is_important ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-400'}`}
                    >
                      ⭐
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(msg.created_at)}</span>
                </div>

                <p className="text-gray-300 mb-2">{msg.message}</p>

                {editingNote === msg.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="輸入備註..."
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button onClick={() => saveNote(msg.id)} className="px-3 py-1 text-sm text-white bg-blue-600 rounded-lg">儲存</button>
                    <button onClick={() => setEditingNote(null)} className="px-3 py-1 text-sm text-gray-400 bg-gray-700 rounded-lg">取消</button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    {msg.note ? (
                      <span
                        className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded cursor-pointer hover:bg-gray-600"
                        onClick={() => { setEditingNote(msg.id); setNoteText(msg.note || '') }}
                      >
                        📝 {msg.note}
                      </span>
                    ) : (
                      <button
                        onClick={() => { setEditingNote(msg.id); setNoteText('') }}
                        className="text-sm text-gray-500 hover:text-gray-400"
                      >
                        + 加備註
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-gray-500">
        共 {messages.length} 則訊息
      </div>
    </div>
  )
}
