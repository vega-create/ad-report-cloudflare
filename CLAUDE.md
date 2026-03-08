# Ad Report System — AI 廣告分析報告系統

> AI 驅動的廣告分析報告產生器，支援截圖分析 + LINE 推送
> 部署於 Vercel

## 技術棧

- **前端**：React 18.2 + Vite 5.0（SPA，JSX 無 TypeScript）
- **後端**：Vercel Serverless Functions
- **資料庫**：Supabase (PostgreSQL)
- **AI**：OpenAI GPT-4o-mini（Vision 功能分析廣告截圖）
- **通知**：LINE Messaging API
- **樣式**：Tailwind CSS 3.4
- **路由**：React Router v6

## 核心功能

1. **客戶管理**：建立客戶資料 + LINE 群組 ID
2. **截圖上傳**：最多 5 張廣告截圖，支援圖片拼接
3. **CSV 匯入**：Meta Ads / GA4 數據
4. **AI 報告生成**：GPT-4o-mini Vision 分析截圖 + 數據，產出專業中文報告
5. **Markdown 編輯器**：即時編輯報告內容
6. **公開報告頁**：`/r/{id}` 可分享給客戶
7. **LINE 推送**：一鍵推送報告連結到客戶 LINE 群組
8. **報告狀態管理**：draft / published

## 資料庫

| 表格 | 說明 |
|------|------|
| `clients` | 客戶（name, industry, line_group_id, notes） |
| `reports` | 報告（client_id, data_analysis[markdown], report_date, status） |

## API 路由

| 路由 | 說明 |
|------|------|
| `POST /api/claude` | GPT-4o-mini Vision 分析截圖，產出 Markdown 報告（60s timeout） |
| `POST /api/send-line` | 推送報告連結到 LINE 群組 |

## 頁面路由

| 路由 | 說明 |
|------|------|
| `/` | Dashboard — 統計數字 + 最近報告 |
| `/clients` | 客戶列表 |
| `/clients/new` | 新增客戶 |
| `/clients/:id/edit` | 編輯客戶 |
| `/reports` | 報告列表 |
| `/reports/new` | 新增報告（上傳截圖 + CSV → AI 生成） |
| `/reports/:id` | 查看報告 + 發佈 + LINE 推送 |
| `/reports/:id/edit` | 編輯報告 Markdown |
| `/r/:id` | 公開報告頁（給客戶看） |

## 目錄結構

```
src/
├── App.jsx                    # 路由設定
├── lib/supabase.js            # Supabase 客戶端
├── components/
│   ├── Layout.jsx             # 側邊欄導航
│   └── ImageStitcher.jsx      # 多圖拼接工具
└── pages/
    ├── Dashboard.jsx          # 儀表板
    ├── Clients.jsx            # 客戶管理
    ├── Reports.jsx            # 報告列表
    ├── NewReport.jsx          # 新增報告（截圖上傳 + AI）
    ├── ReportDetail.jsx       # 報告詳情
    ├── ReportEdit.jsx         # Markdown 編輯
    └── PublicReport.jsx       # 公開報告頁

api/
├── claude.js                  # GPT-4o-mini 報告生成
└── send-line.js               # LINE 推送
```

## 重要設計

- **無認證系統**：假設內部使用
- **AI prompt**：10+ 年廣告業專家角色，漏斗分析、歸因路徑、多渠道分析
- **圖片處理**：客戶端 Canvas 拼接，Base64 傳輸
- **報告格式**：Markdown（React Markdown + remark-gfm 渲染）

## 環境變數

```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=sk-proj-...
LINE_CHANNEL_ACCESS_TOKEN=...
```
