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
            { step: '4', label: '執行任務', sub: '完成/取消/改期', color: 'green' },
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
          <h2 className="text-lg font-semibold text-white">執行任務（完成 / 取消 / 改期）</h2>
        </div>
        <p className="text-gray-300">廣告任務可以完成、取消或改期，LINE 和網頁都可以操作：</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-semibold">方式 A：LINE 指令</p>
            <p className="text-gray-300 text-sm">在主管群組直接說：</p>
            <div className="bg-gray-800 rounded p-2 text-sm space-y-2">
              <div>
                <p className="text-gray-500 text-xs">完成：</p>
                <p className="text-white">「寵樂芙 ROAS 調整<span className="text-green-400">完成</span>」</p>
                <p className="text-white">「寵樂芙 ROAS <span className="text-green-400">完成</span>，ROAS 從 19 升到 23」</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">取消：</p>
                <p className="text-white">「<span className="text-red-400">取消</span> 3 piglets 素材 A/B 測試」</p>
                <p className="text-white">「寵樂芙 素材替換 <span className="text-red-400">不做了</span>」</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">延後到明天：</p>
                <p className="text-white">「<span className="text-blue-400">延後</span> 寵樂芙 素材替換」</p>
                <p className="text-white">「3 piglets 測試 <span className="text-blue-400">改期</span>」</p>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-green-400 text-xs">✅ 廣告任務完成：[寵樂芙] 調整 ROAS 出價</p>
              <p className="text-red-400 text-xs">🗑️ 已取消廣告任務：[3 piglets] 素材 A/B 測試</p>
              <p className="text-blue-400 text-xs">📅 已延後廣告任務到明天：[寵樂芙] 素材替換</p>
            </div>
            <p className="text-gray-500 text-xs mt-1">💡 完成時加成效備註會自動帶入下次報告</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-semibold">方式 B：網頁操作</p>
            <p className="text-gray-300 text-sm">在「廣告任務」頁面點擊任務卡片：</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p><span className="text-green-400">✅ 完成</span> → 標記完成 + 填成效備註</p>
              <p><span className="text-blue-400">📅 延後一天</span> → 自動移到明天</p>
              <p><span className="text-red-400">🗑️ 取消任務</span> → 標記為已取消</p>
              <p><span className="text-yellow-400">日期選擇器</span> → 改到任何日期</p>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <p className="text-gray-400 text-xs">任務狀態顯示：</p>
              <p className="text-green-400 text-xs">✅ 完成 → 綠色底 + 刪除線 + 成效備註</p>
              <p className="text-red-400 text-xs">🗑️ 取消 → 紅色半透明 + 刪除線</p>
            </div>
            <p className="text-gray-500 text-xs mt-1">💡 LINE 和網頁操作是同步的</p>
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

      {/* 快速記錄（不需報告的客戶） */}
      <div className="bg-gray-800 rounded-xl border border-green-700/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">⚡</span>
          <h2 className="text-lg font-semibold text-white">快速記錄（不需完整報告的客戶）</h2>
        </div>
        <p className="text-gray-300">
          有些客戶不需要產出完整報告，但你仍需追蹤花費、廣告時間和下次調整方向。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-semibold">方式 A：網頁快速新增</p>
            <p className="text-gray-300 text-sm">
              在「廣告任務」頁面點 <span className="bg-green-600 text-white px-2 py-0.5 rounded text-sm">+ 快速新增</span>
            </p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>1. 選擇客戶 + 填寫任務內容</p>
              <p>2. 設定日期、時間、優先級</p>
              <p>3. 備註欄記錄花費金額和調整方向</p>
              <p>4. 任務會出現在行事曆，LINE 照常提醒</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-semibold">方式 B：Claude 快速記錄</p>
            <p className="text-gray-300 text-sm">
              在 Claude Code 使用 <code className="bg-gray-700 px-1 rounded text-xs">/ad-quick-log</code> 指令
            </p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>1. 告知客戶名、本期花費、廣告期間</p>
              <p>2. 說明下次要調整的方向</p>
              <p>3. Claude 產出結構化 MD</p>
              <p>4. 貼入「解析 MD 排程」自動建立任務</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-sm">
          <p className="text-white font-medium mb-2">備註欄範例</p>
          <div className="space-y-1 text-gray-400">
            <p>• 本月花費 $15,000 / 廣告期間 3/1-3/31</p>
            <p>• 下次調降 CPC 出價、暫停低轉換受眾</p>
            <p>• ROAS 目前 15，目標拉到 20</p>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            💡 完成任務時的「成效備註」會自動帶入下次報告
          </p>
        </div>
      </div>

      {/* 排定時間提醒 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">⏰</span>
          <h2 className="text-lg font-semibold text-white">排定時間提醒</h2>
        </div>
        <p className="text-gray-300">
          除了每天 09:00 的總覽提醒，系統每 <span className="text-white font-bold">5 分鐘</span>檢查是否有到期任務，
          到了排定時間會再推一次 LINE 提醒。
        </p>
        <div className="bg-gray-900 rounded-lg p-4 text-sm space-y-1">
          <p className="text-white font-medium">⏰ 廣告任務提醒</p>
          <p className="text-gray-400">🟡 [寵樂芙] 調整 ROAS 出價</p>
          <p className="text-gray-400">⏱️ 預估 30 分鐘</p>
          <p className="text-gray-400">🕐 排定時間：10:00</p>
        </div>
      </div>

      {/* 員工待辦清單 */}
      <div className="bg-gray-800 rounded-xl border border-cyan-700/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-cyan-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">📝</span>
          <h2 className="text-lg font-semibold text-white">員工待辦清單（LINE 指令）</h2>
        </div>
        <p className="text-gray-300 text-sm">
          員工在自己的群組、老闆在主管群組都可以使用以下指令管理每日待辦。
        </p>

        <div className="space-y-4">
          {/* 建立待辦 */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-cyan-400 font-semibold">建立今日待辦</p>
            <p className="text-gray-400 text-sm">在群組輸入 <code className="bg-gray-700 px-1 rounded text-white">#今日待辦</code>，接著列出任務：</p>
            <div className="bg-gray-800 rounded p-3 text-sm space-y-1">
              <p className="text-white">#今日待辦</p>
              <p className="text-gray-400">1. [智慧媽咪] FB貼文</p>
              <p className="text-gray-400">2. [寵樂芙] IG限動</p>
              <p className="text-gray-400">3. 回覆客戶訊息</p>
            </div>
          </div>

          {/* 指令列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <p className="text-green-400 font-semibold">回報完成</p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>「智慧媽咪貼文 <span className="text-white">完成</span>」</p>
                <p>「<span className="text-white">完成</span> 寵樂芙限動」</p>
                <p>「回覆客戶 <span className="text-white">做好了</span>」</p>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <p className="text-blue-400 font-semibold">新增任務</p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>「<span className="text-white">新增</span> 製作週報」</p>
                <p>「<span className="text-white">加一個</span> 回電給廠商」</p>
                <p>「<span className="text-white">增加</span> 整理檔案」</p>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <p className="text-red-400 font-semibold">取消任務</p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>「<span className="text-white">取消</span> FB貼文」</p>
                <p>「<span className="text-white">刪除</span> 智慧媽咪貼文」</p>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <p className="text-yellow-400 font-semibold">改期 / 查進度</p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>「智慧媽咪貼文 <span className="text-white">改到週三</span>」</p>
                <p>「寵樂芙限動 <span className="text-white">延到下週</span>」</p>
                <p>「<span className="text-white">#查進度</span>」→ 顯示完成率</p>
              </div>
            </div>
          </div>

          {/* 自動提醒 */}
          <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400 space-y-1">
            <p className="text-white font-medium mb-2">自動提醒時間</p>
            <p>☀️ 每天 <span className="text-white">09:00</span> → 系統自動把排程任務建成今日待辦並通知</p>
            <p>🌙 每天 <span className="text-white">19:00</span> → 未完成任務提醒</p>
            <p>💡 不用打得一模一樣，系統會用 AI 自動比對</p>
          </div>
        </div>
      </div>

      {/* 任務管理（排程任務） */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">📋</span>
          <h2 className="text-lg font-semibold text-white">任務管理（員工排程任務）</h2>
        </div>
        <p className="text-gray-300">
          管理員工的固定排程任務（週期性工作），系統會根據頻率自動排入每日待辦。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-cyan-400 font-semibold">新增 / 編輯任務</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>1. 側邊欄點「任務管理」</p>
              <p>2. 點 <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">新增任務</span></p>
              <p>3. 選擇<span className="text-white">員工、客戶、任務名稱</span></p>
              <p>4. 設定<span className="text-white">頻率</span>：每天、週一~週五、不固定</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-cyan-400 font-semibold">頻率範例</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p><span className="text-white">每天</span> → 每天出現在待辦</p>
              <p><span className="text-white">週一、週三、週五</span> → 指定星期</p>
              <p><span className="text-white">12號</span> → 每月固定日期</p>
              <p><span className="text-white">不固定</span> → 不自動排入待辦</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400 space-y-1">
          <p>💡 刪除任務會一併清除相關記錄</p>
          <p>💡 排程任務和廣告任務是分開的：排程任務 = 員工固定工作，廣告任務 = 具體廣告操作</p>
        </div>
      </div>

      {/* 客戶訊息篩選 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-yellow-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">💬</span>
          <h2 className="text-lg font-semibold text-white">客戶訊息通知</h2>
        </div>
        <p className="text-gray-300">
          系統會自動篩選客戶群組的訊息，只有<span className="text-white font-medium">公事相關</span>才會通知主管群。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-semibold">會通知的訊息</p>
            <p className="text-gray-400 text-sm">包含以下關鍵字的訊息：</p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>報價、廣告、素材、修改、預算、費用</p>
              <p>合約、排程、活動、進度、問題、確認</p>
              <p>設計、文案、貼文、影片、上架、下架</p>
              <p>請款、收據、發票、ROAS、CPC、CTR...</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-red-400 font-semibold">不會通知的訊息</p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>早安、午安、晚安</p>
              <p>貼圖、閒聊、日常問候</p>
              <p>與業務無關的對話</p>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2 text-xs text-gray-500">
              <p>💡 同一輪對話只通知一次</p>
              <p>💡 老闆或員工回覆後，下一輪公事訊息才會再通知</p>
            </div>
          </div>
        </div>
      </div>

      {/* 提案功能 */}
      <div className="bg-gray-800 rounded-xl border border-purple-700/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">📑</span>
          <h2 className="text-lg font-semibold text-white">提案功能</h2>
        </div>
        <p className="text-gray-300">
          為新客戶或舊客戶的新活動 / 新品建立完整行銷提案，產生可分享的客戶連結。
        </p>

        <div className="space-y-4">
          {/* 建立提案 */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-purple-400 font-semibold">建立提案</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>1. 側邊欄點「📑 提案」→ 進入提案列表</p>
              <p>2. 點右上角 <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">+ 新增提案</span></p>
              <p>3. 填寫<span className="text-white">標題</span>、選擇<span className="text-white">客戶</span>（選填）</p>
              <p>4. 左邊編輯 <span className="text-white">Markdown 內容</span>，右邊即時預覽</p>
              <p>5. 點<span className="text-white">「儲存」</span></p>
            </div>
          </div>

          {/* 編輯預覽 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <p className="text-purple-400 font-semibold">編輯器</p>
              <p className="text-gray-400 text-sm">左邊輸入 Markdown 格式：</p>
              <div className="bg-gray-800 rounded p-2 text-xs text-gray-400 space-y-1 font-mono">
                <p className="text-white">## 行銷方案</p>
                <p>### 目標受眾</p>
                <p>- 25-35 歲媽媽族群</p>
                <p className="text-white">### 預算分配</p>
                <p>| 平台 | 預算 | 佔比 |</p>
                <p>|------|------|------|</p>
                <p>| Facebook | $30,000 | 60% |</p>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <p className="text-purple-400 font-semibold">操作按鈕</p>
              <div className="space-y-2 text-sm text-gray-400">
                <p><span className="text-green-400">✅ 發布</span> → 標記為已發布</p>
                <p><span className="text-gray-300">📥 下載 PDF</span> → 匯出 PDF 檔案</p>
                <p><span className="text-gray-300">🔗 複製連結</span> → 複製公開連結</p>
                <p><span className="text-blue-400">✏️ 編輯</span> → 修改提案內容</p>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                💡 提案可能需要修改好幾次，儲存後隨時可以再編輯
              </p>
            </div>
          </div>

          {/* 分享提案 */}
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-purple-400 font-semibold">分享給客戶</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>1. 在提案詳情頁點 <span className="text-gray-300">🔗 複製連結</span></p>
              <p>2. 連結格式：<code className="bg-gray-700 px-1 rounded text-xs text-white">/p/提案ID</code></p>
              <p>3. 客戶打開連結可以看到完整提案（紫色主題、無後台側欄）</p>
              <p>4. 客戶也可以自行下載 PDF</p>
            </div>
          </div>

          {/* 提案用途 */}
          <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-400 space-y-1">
            <p className="text-white font-medium mb-2">適用場景</p>
            <p>📌 新客戶的廣告行銷企劃</p>
            <p>📌 舊客戶新活動 / 新品的廣告建議</p>
            <p>📌 新排程規劃（可先放上提案確認後再執行）</p>
            <p>📌 任何需要分享給客戶看的 Markdown 內容</p>
          </div>
        </div>
      </div>

      {/* 報告功能 */}
      <div className="bg-gray-800 rounded-xl border border-blue-700/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">📊</span>
          <h2 className="text-lg font-semibold text-white">廣告報告</h2>
        </div>
        <p className="text-gray-300">
          產出客戶的廣告成效報告，可分享連結或下載 PDF。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-blue-400 font-semibold">操作按鈕</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p><span className="text-green-400">✅ 發布報告</span> → 標記為已發布</p>
              <p><span className="text-gray-300">📥 下載 PDF</span> → 匯出 PDF 給客戶</p>
              <p><span className="text-gray-300">🔗 複製連結</span> → 複製公開連結</p>
              <p><span className="text-green-400">📱 發送到 LINE</span> → 推送到客戶 LINE 群組</p>
              <p><span className="text-blue-400">✏️ 編輯</span> → 修改報告內容</p>
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 space-y-2">
            <p className="text-blue-400 font-semibold">分享給客戶</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>連結格式：<code className="bg-gray-700 px-1 rounded text-xs text-white">/r/報告ID</code></p>
              <p>客戶可以看到完整報告（藍色主題）</p>
              <p>客戶也可以自行下載 PDF</p>
              <p>也可以直接發送到客戶的 LINE 群組</p>
            </div>
          </div>
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
