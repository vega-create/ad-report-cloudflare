// 共用：D1 存取層
// - 每張表宣告欄位、布林欄、JSON 欄 → 讀出時 0/1 → true/false、JSON 字串 → 物件；寫入時反向
// - 條件用參數化 SQL，欄位名只允許白名單，避免注入
import { HttpError } from './http.js';

const TS = ['created_at', 'updated_at', 'completed_at', 'published_at'];

export const TABLES = {
  clients: {
    cols: ['id', 'name', 'industry', 'line_group_id', 'notes', 'created_at', 'updated_at'],
    bool: [], json: [],
  },
  reports: {
    cols: ['id', 'client_id', 'report_date', 'status', 'data_analysis', 'comparison', 'recommendations', 'raw_metrics', 'created_at', 'published_at', 'ai_draft', 'source'],
    bool: [], json: ['raw_metrics'],
  },
  proposals: {
    cols: ['id', 'client_id', 'title', 'content', 'status', 'created_at', 'updated_at'],
    bool: [], json: [],
  },
  report_feedback: {
    cols: ['id', 'report_id', 'client_id', 'instruction', 'before_excerpt', 'after_excerpt', 'source', 'created_at'],
    bool: [], json: [],
  },
  ad_tasks: {
    cols: ['id', 'client_name', 'report_date', 'task', 'category', 'priority', 'estimated_minutes', 'scheduled_date', 'scheduled_time', 'status', 'completed_at', 'outcome_note', 'include_in_next_report', 'created_at', 'updated_at'],
    bool: ['include_in_next_report'], json: [],
  },
  ad_operation_logs: {
    cols: ['id', 'client_name', 'operation_date', 'platform', 'operation_type', 'description', 'details', 'raw_message', 'created_at', 'include_in_report'],
    bool: ['include_in_report'], json: ['details'],
  },
  ad_quick_logs: {
    cols: ['id', 'client_id', 'client_name', 'period_start', 'period_end', 'spend_summary', 'next_actions', 'notes', 'raw_markdown', 'created_at'],
    bool: [], json: ['spend_summary'],
  },
  daily_plans: {
    cols: ['id', 'plan_date', 'category', 'description', 'is_done', 'completed_at', 'created_at'],
    bool: ['is_done'], json: [],
  },
  agent_employees: {
    cols: ['id', 'name', 'line_user_id', 'line_group_id', 'is_active', 'created_at'],
    bool: ['is_active'], json: [],
  },
  agent_tasks: {
    cols: ['id', 'task_name', 'client_name', 'employee_id', 'frequency', 'frequency_detail', 'is_active', 'created_at'],
    bool: ['is_active'], json: [],
  },
  agent_task_records: {
    cols: ['id', 'task_id', 'employee_id', 'completed_at', 'note', 'created_at'],
    bool: [], json: [],
  },
  agent_customer_messages: {
    cols: ['id', 'group_id', 'group_name', 'group_type', 'user_id', 'message', 'is_replied', 'is_important', 'note', 'created_at'],
    bool: ['is_replied', 'is_important'], json: [],
  },
};

export const nowIso = () => new Date().toISOString();

function spec(table) {
  const s = TABLES[table];
  if (!s) throw new HttpError(500, `未知資料表 ${table}`);
  return s;
}

// 讀出：D1 row → API 物件
export function rowOut(table, row) {
  if (!row) return row;
  const s = spec(table);
  const out = { ...row };
  for (const c of s.bool) if (c in out && out[c] !== null) out[c] = out[c] === 1 || out[c] === true;
  for (const c of s.json) {
    if (typeof out[c] === 'string') {
      try { out[c] = JSON.parse(out[c]); } catch { /* 留原字串 */ }
    }
  }
  return out;
}
export const rowsOut = (table, rows) => (rows || []).map((r) => rowOut(table, r));

// 寫入：API 物件 → 可存進 D1 的值（只保留白名單欄位）
export function rowIn(table, obj, { strict = true } = {}) {
  const s = spec(table);
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (!s.cols.includes(k)) {
      if (strict) throw new HttpError(400, `欄位 ${k} 不存在於 ${table}`);
      continue;
    }
    if (v === undefined) continue;
    if (s.bool.includes(k)) out[k] = v === null ? null : (v ? 1 : 0);
    else if (s.json.includes(k)) out[k] = v === null ? null : (typeof v === 'string' ? v : JSON.stringify(v));
    else if (TS.includes(k) && typeof v === 'string' && v) {
      const d = new Date(v);
      out[k] = Number.isNaN(d.getTime()) ? v : d.toISOString();
    } else out[k] = v;
  }
  return out;
}

export function assertCol(table, col) {
  if (!spec(table).cols.includes(col)) throw new HttpError(400, `不允許的欄位 ${col}`);
  return col;
}

// ---- 查詢建構 ----
// where: [[col, op, value]] ，op ∈ = != > >= < <= like in
export function buildWhere(table, conds, prefix = '') {
  const parts = [];
  const binds = [];
  for (const [col, op, val] of conds) {
    assertCol(table, col);
    const c = prefix + col;
    if (op === 'in') {
      const arr = Array.isArray(val) ? val : [val];
      if (!arr.length) { parts.push('0'); continue; }
      parts.push(`${c} IN (${arr.map(() => '?').join(',')})`);
      binds.push(...arr);
    } else if (op === 'is null') parts.push(`${c} IS NULL`);
    else if (op === 'is not null') parts.push(`${c} IS NOT NULL`);
    else if (['=', '!=', '>', '>=', '<', '<=', 'like'].includes(op)) {
      parts.push(`${c} ${op === 'like' ? 'LIKE' : op} ?`);
      binds.push(val);
    } else throw new HttpError(500, `不支援的運算子 ${op}`);
  }
  return { sql: parts.length ? ' WHERE ' + parts.join(' AND ') : '', binds };
}

// order: 'col' | '-col' | 'col,-col2'
export function buildOrder(table, order, fallback = '', prefix = '') {
  const spec_ = order || fallback;
  if (!spec_) return '';
  const items = String(spec_).split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
    const desc = s.startsWith('-');
    const col = assertCol(table, desc ? s.slice(1) : s);
    return `${prefix}${col} ${desc ? 'DESC' : 'ASC'}`;
  });
  return items.length ? ' ORDER BY ' + items.join(', ') : '';
}

export async function selectWhere(db, table, conds, { order, fallbackOrder, limit, columns } = {}) {
  const w = buildWhere(table, conds);
  const cols = columns ? columns.map((c) => assertCol(table, c)).join(', ') : '*';
  let sql = `SELECT ${cols} FROM ${table}${w.sql}${buildOrder(table, order, fallbackOrder)}`;
  if (limit) sql += ` LIMIT ${Math.max(1, Math.min(5000, Number(limit) || 0))}`;
  const { results } = await db.prepare(sql).bind(...w.binds).all();
  return rowsOut(table, results);
}

export async function getById(db, table, id) {
  const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  return rowOut(table, row);
}

export async function count(db, table, conds = []) {
  const w = buildWhere(table, conds);
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM ${table}${w.sql}`).bind(...w.binds).first();
  return Number(row?.n || 0);
}

// 新增一筆或多筆；回傳新增後的資料（含 id、時間欄位）
export async function insertRows(db, table, rows) {
  const list = Array.isArray(rows) ? rows : [rows];
  if (!list.length) return [];
  const s = spec(table);
  const stmts = [];
  const ids = [];
  for (const raw of list) {
    const r = rowIn(table, raw);
    if (!r.id) r.id = crypto.randomUUID();
    if (s.cols.includes('created_at') && !r.created_at) r.created_at = nowIso();
    if (s.cols.includes('updated_at') && !r.updated_at) r.updated_at = nowIso();
    const cols = Object.keys(r);
    stmts.push(db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map((c) => r[c])));
    ids.push(r.id);
  }
  await db.batch(stmts);
  const w = buildWhere(table, [['id', 'in', ids]]);
  const { results } = await db.prepare(`SELECT * FROM ${table}${w.sql}`).bind(...w.binds).all();
  // 依插入順序回傳
  const byId = new Map(results.map((r) => [r.id, r]));
  return ids.map((id) => rowOut(table, byId.get(id)));
}

// 更新：conds 決定更新哪些列；回傳更新後的列
export async function updateWhere(db, table, conds, patch) {
  const s = spec(table);
  const p = rowIn(table, patch);
  delete p.id;
  if (s.cols.includes('updated_at') && !p.updated_at) p.updated_at = nowIso();
  const keys = Object.keys(p);
  if (!keys.length) throw new HttpError(400, '沒有要更新的欄位');
  const w = buildWhere(table, conds);
  if (!w.sql) throw new HttpError(400, '更新需要條件');
  await db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(', ')}${w.sql}`).bind(...keys.map((k) => p[k]), ...w.binds).run();
  const { results } = await db.prepare(`SELECT * FROM ${table}${w.sql}`).bind(...w.binds).all();
  return rowsOut(table, results);
}

export async function deleteWhere(db, table, conds) {
  const w = buildWhere(table, conds);
  if (!w.sql) throw new HttpError(400, '刪除需要條件');
  const r = await db.prepare(`DELETE FROM ${table}${w.sql}`).bind(...w.binds).run();
  return r.meta?.changes ?? 0;
}

// 讀 query string 裡常見的篩選
export function q(url, name) {
  const v = url.searchParams.get(name);
  return v === null || v === '' ? undefined : v;
}
