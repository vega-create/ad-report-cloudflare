# Ad Report System — 廣告報告系統

> Markdown 廣告報告編輯器 ＋ 廣告任務排程 ＋ 操作記錄，支援 LINE 推送
> 部署於 Cloudflare Pages；資料在 Cloudflare D1（2026-11 從 Supabase 搬來）

## 技術棧

- **前端**：React 18.2 + Vite 5.0（SPA，JSX）
- **後端**：Cloudflare Pages Functions（`functions/`），前端只透過 `/api/*` 存取資料，瀏覽器不直連資料庫
- **資料庫**：Cloudflare D1 `adreport`（binding `DB`，schema 在 `migrations/d1/`）；agent_* 讀 LINE bot 的 D1 `mommy-wisdom-bot`（binding `AGENT_DB`）。LINE bot 也把 ad_tasks／ad_operation_logs／daily_plans／clients／reports／report_feedback 直接寫進 `adreport`
- **圖片**：Cloudflare R2 `adreport-ads`（binding `BUCKET`），由 `/img/<key>` 回傳
- **登入**：Cloudflare Access（網頁）；`/api/*` 由 Functions 再驗 Access JWT（header 或 `CF_Authorization` cookie，驗 AUD）或程式用的 `Bearer API_TOKEN`；`/api/public/*` 與 `/img/*` 不需登入
- **通知**：LINE Messaging API
- **樣式**：Tailwind CSS 3.4；**路由**：React Router v6
- **MCP**：`~/adreport-mcp`（Cloudflare Worker）直接綁同一顆 D1，給 Claude 讀寫

## 本機開發

```bash
npm install
npm run db:migrate:local      # 建本機 D1 schema（.wrangler/state）
node scripts/migrate-from-supabase.mjs ~/adreport-migration --apply local   # 灌資料（key 放 .env.local）
npm run dev:pages             # build + wrangler pages dev dist（http://localhost:8788，localhost 不驗 Access）
```
`.dev.vars`（gitignore）放 `OPENAI_API_KEY`、`LINE_CHANNEL_ACCESS_TOKEN`。

## 資料表（D1）

| 表格 | 說明 |
|------|------|
| `clients` | 客戶（name, industry, line_group_id, notes） |
| `reports` | 報告（client_id, data_analysis[markdown], report_date, status, ai_draft, source） |
| `proposals` | 提案（client_id 可空, title, content, status） |
| `report_feedback` | MCP 學習 Vega 修改偏好／口述背景／客戶回饋／規劃 |
| `ad_tasks` | 廣告任務排程（client_name, task, scheduled_date/time, priority, status, outcome_note, include_in_next_report） |
| `ad_operation_logs` | 廣告操作記錄（client_name, operation_date, platform, description, include_in_report） |
| `ad_quick_logs` | 快速記錄（spend_summary JSON） |
| `daily_plans` | 每日計畫 |
| `agent_employees` / `agent_tasks` / `agent_task_records` / `agent_customer_messages` | 智慧媽咪 LINE bot 的員工／任務／客戶訊息。**唯一真身在 bot 的 D1 `mommy-wisdom-bot`**，Pages 以 `AGENT_DB` binding 直接讀；`adreport` 裡的同名表只是備用（搬遷腳本預設不匯，加 `--include-agent` 才匯） |

布林存 0/1、JSON 存字串，`functions/_lib/db.js` 讀寫時自動轉換；id 為 UUID。

## API 路由（Pages Functions，全部走 D1）

| 路由 | 說明 |
|------|------|
| `GET/POST /api/clients`、`GET/PATCH/DELETE /api/clients/:id` | 客戶 |
| `GET/POST /api/reports`、`GET/PATCH/DELETE /api/reports/:id` | 報告（附 `clients`） |
| `GET/POST /api/proposals`、`GET/PATCH/DELETE /api/proposals/:id` | 提案 |
| `GET/POST /api/feedback` | 報告修正／回饋記錄 |
| `GET/POST/PATCH /api/tasks`、`GET/PATCH/DELETE /api/tasks/:id` | 廣告任務（PATCH 集合 = `{ids, patch}` 批次） |
| `GET/POST/PATCH /api/operation-logs`、`GET/PATCH/DELETE /api/operation-logs/:id` | 操作記錄 |
| `GET/POST /api/quick-logs` | 快速記錄 |
| `GET/POST /api/plans`、`PATCH/DELETE /api/plans/:id` | 每日計畫 |
| `GET /api/client-names?sources=clients,tasks,logs` | 下拉用客戶名稱 |
| `GET /api/dashboard` | 首頁統計 |
| `GET /api/agent/stats`、`/api/agent/employees`、`/api/agent/tasks[/:id]`、`/api/agent/messages[/:id]`、`/api/agent/messages/groups` | 智慧媽咪頁面 |
| `GET /api/public/reports/:id`、`GET /api/public/proposals/:id` | 客戶看的公開頁（不需登入） |
| `POST /api/parse-tasks`、`POST /api/parse-quick-log` | OpenAI 解析 MD（原有） |
| `POST /api/send-line` | 推送到 LINE 群組（原有） |
| `GET /img/<key>` | R2 圖片 |

前端呼叫一律經 `src/lib/api.ts`。

## 頁面路由

| 路由 | 說明 |
|------|------|
| `/` | Dashboard |
| `/clients`、`/clients/new`、`/clients/:id/edit` | 客戶 |
| `/reports`、`/reports/new`、`/reports/:id`、`/reports/:id/edit` | 報告 |
| `/proposals`… | 提案 |
| `/tasks` | 廣告任務（操作記錄 / 排程任務，解析 MD 排程） |
| `/quick-logs`、`/operation-logs`、`/daily-plans` | 快速記錄、操作記錄、每日計畫 |
| `/agent`、`/agent/messages`、`/agent/tasks` | 智慧媽咪 |
| `/guide`、`/architecture` | 使用說明、系統架構 |
| `/r/:id`、`/p/:id` | 公開報告／提案頁（給客戶看） |

## 目錄結構

```
functions/
├── _lib/            # db.js（D1 存取）、auth.js（Access JWT / API token）、joins.js、http.js、agent.js
├── api/
│   ├── _middleware.js   # /api/* 驗身分（/api/public/* 例外）
│   ├── clients/ reports/ proposals/ feedback/ tasks/ operation-logs/ quick-logs/ plans/ agent/ public/
│   ├── client-names.js dashboard.js
│   └── parse-tasks.js parse-quick-log.js send-line.js
└── img/[[key]].js   # R2 圖片
migrations/d1/0001_init.sql
scripts/migrate-from-supabase.mjs   # Supabase → D1/R2 搬運＋核對
scripts/backup-db.mjs               # D1 備份（.github/workflows/backup.yml 每週跑）
src/lib/api.ts                      # 前端唯一資料入口
```

## 環境變數 / Secret

- `wrangler.toml`：D1（`DB`＝adreport、`AGENT_DB`＝mommy-wisdom-bot）/ R2 binding、`ACCESS_TEAM_DOMAIN`
- Pages Secret：`ACCESS_AUD`、`API_TOKEN`、`OPENAI_API_KEY`、`LINE_CHANNEL_ACCESS_TOKEN`
- GitHub Secret：`CLOUDFLARE_API_TOKEN`（部署＋每週備份）、`CLOUDFLARE_ACCOUNT_ID`

## 部署

GitHub Actions（`.github/workflows/deploy.yml`）push main → `npm run build` → `wrangler pages deploy dist`（binding 依 `wrangler.toml`）。
