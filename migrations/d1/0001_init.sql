-- 廣告報告系統 D1 schema（2026-11 從 Supabase 兩個專案合併搬來）
-- 來源：
--   lbkrvyfsusmkjrjglbwm（Ad 專案）：clients / reports / proposals / report_feedback
--   lexcvcinmphkmavgswgn（共用專案）：ad_tasks / ad_operation_logs / ad_quick_logs / daily_plans
--                                    agent_employees / agent_tasks / agent_task_records / agent_customer_messages
-- 慣例：
--   id         TEXT，UUID v4（沒給就由 DEFAULT 產生）
--   時間       TEXT ISO 8601 UTC（例 2026-11-09T01:23:45.678Z）
--   日期       TEXT YYYY-MM-DD；時間欄位 TEXT HH:MM 或 HH:MM:SS
--   布林       INTEGER 0/1（API 層轉成 true/false）
--   JSON       TEXT（API 層 parse / stringify）

-- ============ 客戶 ============
CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  name          TEXT NOT NULL,
  industry      TEXT,
  line_group_id TEXT,
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- ============ 報告（Markdown） ============
CREATE TABLE IF NOT EXISTS reports (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  client_id       TEXT NOT NULL REFERENCES clients(id),   -- 有報告的客戶不能刪（與 Postgres 預設一致）
  report_date     TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',          -- draft / published
  data_analysis   TEXT,                                   -- 報告 Markdown 全文
  comparison      TEXT,
  recommendations TEXT,
  raw_metrics     TEXT,                                   -- JSON
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at    TEXT,
  ai_draft        TEXT,                                   -- Claude 產出的原始草稿（學習修改偏好用）
  source          TEXT NOT NULL DEFAULT 'manual'          -- manual / ai
);
CREATE INDEX IF NOT EXISTS idx_reports_client_date ON reports(client_id, report_date);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

-- ============ 提案 ============
CREATE TABLE IF NOT EXISTS proposals (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  client_id  TEXT REFERENCES clients(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  content    TEXT,
  status     TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at);

-- ============ 報告修正／回饋記錄（MCP 學習 Vega 偏好） ============
CREATE TABLE IF NOT EXISTS report_feedback (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  report_id      TEXT REFERENCES reports(id) ON DELETE SET NULL,
  client_id      TEXT REFERENCES clients(id) ON DELETE CASCADE,
  instruction    TEXT,
  before_excerpt TEXT,
  after_excerpt  TEXT,
  source         TEXT,   -- chat-revision / context / plan / client-feedback / web-diff / claude
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_feedback_client ON report_feedback(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_report ON report_feedback(report_id);

-- ============ 廣告任務（排程） ============
CREATE TABLE IF NOT EXISTS ad_tasks (
  id                     TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  client_name            TEXT NOT NULL,
  report_date            TEXT,
  task                   TEXT NOT NULL,
  category               TEXT,              -- facebook / google / client / keyword
  priority               TEXT,              -- red / yellow / green
  estimated_minutes      INTEGER,
  scheduled_date         TEXT,
  scheduled_time         TEXT,
  status                 TEXT NOT NULL DEFAULT 'pending',   -- pending / done / cancelled
  completed_at           TEXT,
  outcome_note           TEXT,
  include_in_next_report INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_ad_tasks_client ON ad_tasks(client_name);
CREATE INDEX IF NOT EXISTS idx_ad_tasks_date ON ad_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_ad_tasks_status ON ad_tasks(status, scheduled_date);

-- ============ 廣告操作記錄 ============
CREATE TABLE IF NOT EXISTS ad_operation_logs (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  client_name       TEXT NOT NULL,
  operation_date    TEXT NOT NULL,
  platform          TEXT,              -- facebook / google / line / website / other，可逗號多選
  operation_type    TEXT,
  description       TEXT NOT NULL,
  details           TEXT,              -- JSON
  raw_message       TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  include_in_report INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ops_client ON ad_operation_logs(client_name);
CREATE INDEX IF NOT EXISTS idx_ops_date ON ad_operation_logs(operation_date);

-- ============ 快速記錄（不需完整報告的客戶） ============
CREATE TABLE IF NOT EXISTS ad_quick_logs (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  client_id     TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name   TEXT NOT NULL,
  period_start  TEXT,
  period_end    TEXT,
  spend_summary TEXT,   -- JSON [{platform, amount, metrics}]
  next_actions  TEXT,
  notes         TEXT,
  raw_markdown  TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_quick_logs_created ON ad_quick_logs(created_at);

-- ============ 每日計畫 ============
CREATE TABLE IF NOT EXISTS daily_plans (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  plan_date    TEXT NOT NULL,
  category     TEXT NOT NULL,   -- 學習進度 / 自媒體進度 / 聯盟行銷進度 / 顧問講師進度
  description  TEXT NOT NULL,
  is_done      INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(plan_date);

-- ============ 智慧媽咪 Agent（LINE bot 為主要寫入者；網頁只有「智慧媽咪／員工任務」頁在看） ============
CREATE TABLE IF NOT EXISTS agent_employees (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  name          TEXT NOT NULL,
  line_user_id  TEXT,
  line_group_id TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  task_name        TEXT NOT NULL,
  client_name      TEXT,
  employee_id      TEXT REFERENCES agent_employees(id),
  frequency        TEXT,     -- daily / weekly / monthly / custom
  frequency_detail TEXT,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_emp ON agent_tasks(employee_id);

CREATE TABLE IF NOT EXISTS agent_task_records (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  task_id      TEXT REFERENCES agent_tasks(id) ON DELETE CASCADE,
  employee_id  TEXT REFERENCES agent_employees(id),
  completed_at TEXT,
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_records_task ON agent_task_records(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_records_emp ON agent_task_records(employee_id, completed_at);

CREATE TABLE IF NOT EXISTS agent_customer_messages (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  group_id     TEXT,
  group_name   TEXT,
  group_type   TEXT,
  user_id      TEXT,
  message      TEXT,
  is_replied   INTEGER NOT NULL DEFAULT 0,
  is_important INTEGER NOT NULL DEFAULT 0,
  note         TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_msgs_created ON agent_customer_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_msgs_group ON agent_customer_messages(group_name);
