export default function Guide() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white">使用說明</h1>

      {/* 流程總覽 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">系統流程總覽</h2>
        <div className="flex items-center justify-between text-center text-sm gap-2">
          {[
            { step: '1', label: 'Claude 分析', sub: '廣告截圖', color: 'blue' },
            { step: '2', label: '解析排程', sub: '貼 MD', color: 'blue' },
            { step: '3', label: 'LINE 提醒', sub: '每天 09:00', color: 'green' },
            { step: '4', label: '完成任務', sub: 'LINE / 網頁', color: 'green' },
            { step: '5', label: '帶入報告', sub: '自動引用', color: 'purple' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`bg-${item.color}-600/20 border border-${item.color}-500/30 rounded-xl p-3 flex-1 min-w-[100px]`}>
                <div className={`text-${item.color}-400 font-bold text-lg`}>{item.step}</div>
                <div className="text-white font-medium">{item.label}</div>
                <div className="text-gray-400 text-xs">{item.sub}</div>
              </div>
              {i < 4 && <span className="text-gray-600 text-xl">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</span>
          <h2 className="text-lg font-semibold text-white">建立廣告操作規劃</h2>
        </div>
        <p className="text-gray-300">
          用 Claude 分析客戶的 Facebook / Google 廣告截圖，產出操作規劃 Markdown。
        </p>
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-400">
          <p className="text-white">## 本期操作規劃</p>
          <p className="text-white mt-2">### Facebook</p>
          <p>- 🔴 調整 ROAS 出價 19→23</p>
          <p>- 🟡 新增「媽咪族群 25-35」受眾測試組</p>
          <p>- 🟡 替換低 CTR 素材（&lt;1% 的關閉）</p>
          <p className="text-white mt-2">### Google</p>
          <p>- 🟢 優化關鍵字出價，暫停低轉換字</p>
          <p>- 🟢 更新廣告文案 A/B 測試</p>
        </div>
        <p className="text-sm text-gray-500">
          💡 優先級用 emoji 標示：🔴 緊急 🟡 重要 🟢 優化
        </p>
      </div>

      {/* Step 2 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</span>
          <h2 className="text-lg font-semibold text-white">解析 MD 排程</h2>
        </div>
        <p className="text-gray-300">
          在「廣告任務」頁面點右上角 <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm">+ 解析 MD 排程</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <p className="text-gray-300">選擇<span className="text-white font-medium">客戶名稱</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <p className="text-gray-300">選擇<span className="text-white font-medium">報告日期</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <p className="text-gray-300">貼上操作規劃 <span className="text-white font-medium">Markdown</span></p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <p className="text-gray-300">點<span className="text-white font-medium">「解析並排程」</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
              <p className="text-gray-300">AI 自動分配<span className="text-white font-medium">優先級 + 時間</span></p>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">6</span>
              <p className="text-gray-300">確認後<span className="text-white font-medium">存入排程</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</span>
          <h2 className="text-lg font-semibold text-white">每日任務提醒（LINE）</h2>
        </div>
        <p className="text-gray-300">
          每天早上 <span className="text-white font-bold">09:00</span>，LINE Bot 自動推送今日待辦到主管群組。
        </p>
        <div className="bg-gray-900 rounded-lg p-4 text-sm space-y-1">
          <p className="text-white font-medium">📋 今日廣告任務</p>
          <p className="text-gray-400">🔴 [寵樂芙] 調整 ROAS 出價 19→23（30分鐘）</p>
          <p className="text-gray-400">🟡 [寵樂芙] 新增受眾測試組（20分鐘）</p>
          <p className="text-gray-400">🟡 [美美寵物] 替換低 CTR 素材（25分鐘）</p>
          <p className="text-gray-500 mt-2 text-xs">完成後說「[客戶] [任務關鍵字] 完成」即可記錄</p>
        </div>
        <p className="text-sm text-gray-500">
          週六日不推送，每天工時上限 120 分鐘
        </p>
      </div>

      {/* Step 4 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</span>
          <h2 className="text-lg font-semibold text-white">完成任務</h2>
        </div>
        <p className="text-gray-300">兩種方式標記完成：</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-semibold">方式 A：LINE 回報</p>
            <p className="text-gray-300 text-sm">直接在 LINE 群組說：</p>
            <div className="bg-gray-800 rounded p-2 text-sm">
              <p className="text-white">「寵樂芙 ROAS 調整完成，升到 23」</p>
            </div>
            <p className="text-gray-500 text-xs">→ AI 自動比對任務 + 記錄成效備註</p>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-gray-400 text-xs">LINE 回覆：</p>
              <p className="text-green-400 text-xs">✅ 廣告任務完成：[寵樂芙] 調整 ROAS 出價</p>
              <p className="text-green-400 text-xs">📊 成效：ROAS 升到 23</p>
              <p className="text-green-400 text-xs">（已標記帶入下次報告）</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-semibold">方式 B：網頁點擊</p>
            <p className="text-gray-300 text-sm">在「廣告任務」頁面：</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-400">1. 點擊待處理的任務卡片</p>
              <p className="text-gray-400">2. 輸入成效備註（選填）</p>
              <p className="text-gray-400">3. 點「確認完成」</p>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-gray-400 text-xs">任務卡片會變成：</p>
              <p className="text-green-400 text-xs">✅ 綠色底 + 刪除線</p>
              <p className="text-green-400 text-xs">📊 顯示成效備註</p>
              <p className="text-green-500 text-xs">完成時間戳記</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 5 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">5</span>
          <h2 className="text-lg font-semibold text-white">自動帶入報告</h2>
        </div>
        <p className="text-gray-300">
          完成任務時填的成效備註會自動標記<span className="text-green-400 font-medium">「帶入下次報告」</span>。
        </p>
        <p className="text-gray-300">
          產報告時，系統會自動列出該客戶所有已完成且有成效的任務，直接引用到報告內容。
        </p>
        <div className="bg-gray-900 rounded-lg p-4 text-sm space-y-1">
          <p className="text-white font-medium">📊 本期執行成效</p>
          <p className="text-gray-400">✅ 調整 ROAS 出價 → ROAS 從 19 升到 23</p>
          <p className="text-gray-400">✅ 新增受眾測試組 → CTR 提升 0.8%</p>
          <p className="text-gray-400">✅ 替換低 CTR 素材 → 平均 CTR 從 0.9% 升到 1.4%</p>
        </div>
      </div>

      {/* 優先級規則 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">優先級與排程規則</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 text-center">
            <p className="text-3xl mb-2">🔴</p>
            <p className="text-red-400 font-bold">緊急</p>
            <p className="text-gray-400 text-sm mt-1">今天或明天</p>
            <p className="text-gray-500 text-xs">09:00 - 10:00</p>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 text-center">
            <p className="text-3xl mb-2">🟡</p>
            <p className="text-yellow-400 font-bold">重要</p>
            <p className="text-gray-400 text-sm mt-1">本週內</p>
            <p className="text-gray-500 text-xs">10:00 - 11:30</p>
          </div>
          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4 text-center">
            <p className="text-3xl mb-2">🟢</p>
            <p className="text-green-400 font-bold">優化</p>
            <p className="text-gray-400 text-sm mt-1">下週填補空檔</p>
            <p className="text-gray-500 text-xs">彈性安排</p>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400 space-y-1">
          <p>⏰ 每天廣告工時上限 <span className="text-white">120 分鐘</span></p>
          <p>📅 週六日不排任務</p>
          <p>👤 同一客戶的任務盡量排在同一天</p>
        </div>
      </div>
    </div>
  )
}
