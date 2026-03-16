# Ad Report System — 廣告報告系統

> Markdown 廣告報告編輯器，支援 LINE 推送
> 部署於 Cloudflare Pages

## 技術棧

- **前端**：React 18.2 + Vite 5.0（SPA，JSX 無 TypeScript）
- **後端**：Cloudflare Pages Functions
- **資料庫**：Supabase (PostgreSQL)
- **通知**：LINE Messaging API
- **樣式**：Tailwind CSS 3.4
- **路由**：React Router v6

## 核心功能

1. **客戶管理**：建立客戶資料 + LINE 群組 ID
2. **Markdown 報告編輯**：直接輸入或貼上 Markdown 內容，即時預覽
3. **報告管理**：草稿 / 已發布狀態管理
4. **公開報告頁**：`/r/{id}` 可分享給客戶
5. **LINE 推送**：一鍵推送報告連結到客戶 LINE 群組

## 資料庫

| 表格 | 說明 |
|------|------|
| `clients` | 客戶（name, industry, line_group_id, notes） |
| `reports` | 報告（client_id, data_analysis[markdown], report_date, status） |

## API 路由（Cloudflare Functions）

| 路由 | 說明 |
|------|------|
| `POST /api/send-line` | 推送報告連結到 LINE 群組 |

## 頁面路由

| 路由 | 說明 |
|------|------|
| `/` | Dashboard — 統計數字 + 最近報告 |
| `/clients` | 客戶列表 |
| `/clients/new` | 新增客戶 |
| `/clients/:id/edit` | 編輯客戶 |
| `/reports` | 報告列表 |
| `/reports/new` | 新增報告（Markdown 編輯器 + 即時預覽） |
| `/reports/:id` | 查看報告 + 發佈 + LINE 推送 |
| `/reports/:id/edit` | 編輯報告 Markdown |
| `/r/:id` | 公開報告頁（給客戶看） |

## 目錄結構

```
src/
├── App.jsx                    # 路由設定
├── lib/supabase.js            # Supabase 客戶端
├── components/
│   └── Layout.jsx             # 側邊欄導航
└── pages/
    ├── Dashboard.jsx          # 儀表板
    ├── Clients.jsx            # 客戶管理
    ├── Reports.jsx            # 報告列表
    ├── NewReport.jsx          # 新增報告（Markdown 編輯器）
    ├── ReportDetail.jsx       # 報告詳情
    ├── ReportEdit.jsx         # Markdown 編輯
    └── PublicReport.jsx       # 公開報告頁

functions/
└── api/
    └── send-line.js           # LINE 推送（Cloudflare Function）
```

## 環境變數

```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
LINE_CHANNEL_ACCESS_TOKEN=...
```

## Cloudflare Pages 部署設定

- Build command: `npm run build`
- Build output directory: `dist`
- 環境變數需在 Cloudflare Pages Settings > Environment variables 設定
