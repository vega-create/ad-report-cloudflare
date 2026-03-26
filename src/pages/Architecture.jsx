export default function Architecture() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">系統架構</h1>

      {/* 架構總覽 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">架構總覽</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
            <p className="text-blue-400 font-bold text-sm">前端</p>
            <p className="text-white font-semibold mt-1">ad-report-cloudflare</p>
            <p className="text-gray-400 text-xs mt-1">Cloudflare Pages</p>
            <p className="text-gray-500 text-xs">React + Vite + Tailwind</p>
          </div>
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-400 font-bold text-sm">後端 / LINE Bot</p>
            <p className="text-white font-semibold mt-1">mommy-wisdom-worker</p>
            <p className="text-gray-400 text-xs mt-1">Cloudflare Workers</p>
            <p className="text-gray-500 text-xs">TypeScript + Hono</p>
          </div>
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
            <p className="text-purple-400 font-bold text-sm">資料庫</p>
            <p className="text-white font-semibold mt-1">Supabase</p>
            <p className="text-gray-400 text-xs mt-1">PostgreSQL</p>
            <p className="text-gray-500 text-xs">兩個專案（廣告 + Agent）</p>
          </div>
        </div>
      </div>

      {/* 專案與 Repo */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">專案與 Repo</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">專案</th>
                <th className="text-left py-2 px-3">部署平台</th>
                <th className="text-left py-2 px-3">用途</th>
                <th className="text-left py-2 px-3">URL</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-medium text-white">ad-report-cloudflare</td>
                <td className="py-2 px-3">Cloudflare Pages</td>
                <td className="py-2 px-3">廣告報告系統前端、任務管理、客戶管理</td>
                <td className="py-2 px-3 text-blue-400 text-xs">ad-report-cloudflare.pages.dev</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-medium text-white">mommy-wisdom-worker</td>
                <td className="py-2 px-3">Cloudflare Workers</td>
                <td className="py-2 px-3">LINE Bot webhook + Cron 排程</td>
                <td className="py-2 px-3 text-blue-400 text-xs">mommy-wisdom-worker.vegalin1029.workers.dev</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-medium text-white">short-url</td>
                <td className="py-2 px-3">Vercel</td>
                <td className="py-2 px-3">短網址服務</td>
                <td className="py-2 px-3 text-blue-400 text-xs">short-url.quickhub.cc</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Supabase 資料庫 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Supabase 資料表</h2>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-400">廣告系統（VITE_SUPABASE_*）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">資料表</th>
                  <th className="text-left py-2 px-3">用途</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">clients</td>
                  <td className="py-2 px-3">客戶資料</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">reports</td>
                  <td className="py-2 px-3">廣告報告</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">ad_tasks</td>
                  <td className="py-2 px-3">廣告任務排程（日曆上的任務）</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">quick_logs</td>
                  <td className="py-2 px-3">快速記錄（不需完整報告的客戶）</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-green-400 mt-4">智慧媽咪 Agent（VITE_AGENT_SUPABASE_*）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">資料表</th>
                  <th className="text-left py-2 px-3">用途</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">agent_employees</td>
                  <td className="py-2 px-3">員工資料（name, line_user_id, line_group_id）</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">agent_groups</td>
                  <td className="py-2 px-3">LINE 群組（manager / employee / customer / company）</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">agent_tasks</td>
                  <td className="py-2 px-3">員工排程任務（每日/每週重複的例行工作）</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">agent_task_records</td>
                  <td className="py-2 px-3">員工任務完成記錄</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">agent_daily_todos</td>
                  <td className="py-2 px-3">每日待辦清單（#今日待辦）</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">agent_customer_messages</td>
                  <td className="py-2 px-3">客戶群訊息記錄 + 已回覆狀態</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-2 px-3 font-mono text-xs text-white">agent_personal_reminders</td>
                  <td className="py-2 px-3">個人提醒（定時推播）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cron 排程 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Cron 排程（mommy-wisdom-worker）</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">Cron</th>
                <th className="text-left py-2 px-3">台灣時間</th>
                <th className="text-left py-2 px-3">功能</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-mono text-xs text-white">0 1 * * *</td>
                <td className="py-2 px-3">每天 09:00</td>
                <td className="py-2 px-3">員工早安提醒 + 今日廣告任務總覽（週一含 daily-tasks）</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-mono text-xs text-white">30 4 * * *</td>
                <td className="py-2 px-3">每天 12:30</td>
                <td className="py-2 px-3">每日進度報告</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-mono text-xs text-white">0 11 * * *</td>
                <td className="py-2 px-3">每天 19:00</td>
                <td className="py-2 px-3">未完成任務提醒</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-mono text-xs text-white">0 2 1 * *</td>
                <td className="py-2 px-3">每月 1 日 10:00</td>
                <td className="py-2 px-3">月報提醒 + 月度總結</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-mono text-xs text-white">*/5 * * * *</td>
                <td className="py-2 px-3">每 5 分鐘</td>
                <td className="py-2 px-3">個人提醒 + 廣告任務到時間通知 + 30 分鐘未回覆提醒</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LINE Bot 功能 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">LINE Bot 功能</h2>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-yellow-400">主管群</h3>
          <div className="bg-gray-900 rounded-lg p-4 text-sm space-y-1 text-gray-300">
            <p>- 客戶群有新訊息 → 通知一次（員工回覆後重新計算）</p>
            <p>- 30 分鐘未回覆 → 再提醒一次</p>
            <p>- 「XXX 完成」→ 標記廣告任務完成</p>
            <p>- #今日待辦 / 新增 / 取消 / #查進度 → 老闆每日待辦</p>
          </div>

          <h3 className="text-sm font-semibold text-cyan-400 mt-3">員工群</h3>
          <div className="bg-gray-900 rounded-lg p-4 text-sm space-y-1 text-gray-300">
            <p>- #今日待辦 → 建立/更新每日待辦</p>
            <p>- 新增 XXX / 取消 XXX → 修改待辦</p>
            <p>- XXX 完成 → 標記任務完成</p>
            <p>- #查進度 → 查看完成率</p>
            <p>- 改期 XXX → 延後任務</p>
          </div>

          <h3 className="text-sm font-semibold text-orange-400 mt-3">客戶群</h3>
          <div className="bg-gray-900 rounded-lg p-4 text-sm space-y-1 text-gray-300">
            <p>- 客戶發訊息 → 記錄 + 通知主管群（每輪對話只通知一次）</p>
            <p>- 員工/老闆/合作夥伴發訊息 → 標記已回覆</p>
          </div>
        </div>
      </div>

      {/* 環境變數 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">環境變數</h2>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-green-400">mommy-wisdom-worker（Cloudflare Workers）</h3>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs space-y-1 text-gray-400">
            <p>LINE_CHANNEL_ACCESS_TOKEN</p>
            <p>LINE_CHANNEL_SECRET</p>
            <p>OPENAI_API_KEY</p>
            <p>SUPABASE_URL</p>
            <p>SUPABASE_ANON_KEY</p>
          </div>

          <h3 className="text-sm font-semibold text-blue-400 mt-3">ad-report-cloudflare（Cloudflare Pages）</h3>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs space-y-1 text-gray-400">
            <p>VITE_SUPABASE_URL（廣告系統資料庫）</p>
            <p>VITE_SUPABASE_ANON_KEY</p>
            <p>VITE_AGENT_SUPABASE_URL（智慧媽咪資料庫）</p>
            <p>VITE_AGENT_SUPABASE_ANON_KEY</p>
            <p>LINE_CHANNEL_ACCESS_TOKEN</p>
            <p>LINE_CHANNEL_SECRET</p>
            <p>OPENAI_API_KEY</p>
          </div>
        </div>
      </div>

      {/* 身份辨識 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">LINE 身份辨識</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">角色</th>
                <th className="text-left py-2 px-3">辨識方式</th>
                <th className="text-left py-2 px-3">說明</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-medium text-white">老闆（Vega）</td>
                <td className="py-2 px-3 font-mono text-xs">BOSS_USER_ID 硬編碼</td>
                <td className="py-2 px-3">webhook.ts + cron.ts 各一份</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-medium text-white">員工</td>
                <td className="py-2 px-3 font-mono text-xs">agent_employees.line_user_id</td>
                <td className="py-2 px-3">需綁定 LINE，is_active = true</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-medium text-white">合作夥伴</td>
                <td className="py-2 px-3 font-mono text-xs">agent_employees 表</td>
                <td className="py-2 px-3">加入員工表，line_group_id 留 NULL（不收提醒）</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2 px-3 font-medium text-white">客戶</td>
                <td className="py-2 px-3 text-xs">非以上角色的人</td>
                <td className="py-2 px-3">發訊息觸發通知到主管群</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 手動觸發 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">手動觸發 Cron（除錯用）</h2>
        <p className="text-gray-300 text-sm">
          POST 到 Worker 的 <code className="bg-gray-700 px-2 py-0.5 rounded text-xs text-white">/trigger-cron</code> 端點：
        </p>
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs space-y-2 text-gray-400">
          <p className="text-gray-500"># 早上提醒</p>
          <p className="text-white">curl -X POST "https://mommy-wisdom-worker.vegalin1029.workers.dev/trigger-cron?cron=0%201%20*%20*%20*"</p>
          <p className="text-gray-500 mt-2"># 晚上提醒</p>
          <p className="text-white">curl -X POST "https://mommy-wisdom-worker.vegalin1029.workers.dev/trigger-cron?cron=0%2011%20*%20*%20*"</p>
          <p className="text-gray-500 mt-2"># 每日報告</p>
          <p className="text-white">curl -X POST "https://mommy-wisdom-worker.vegalin1029.workers.dev/trigger-cron?cron=30%204%20*%20*%20*"</p>
        </div>
      </div>
    </div>
  )
}
