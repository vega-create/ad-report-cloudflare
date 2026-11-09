import { handle, json, readJson, error, HttpError } from '../../_lib/http.js';
import { selectWhere, insertRows, updateWhere, q } from '../../_lib/db.js';

const TASK_COLS = ['client_name', 'report_date', 'task', 'category', 'priority', 'estimated_minutes', 'scheduled_date', 'scheduled_time', 'status', 'completed_at', 'outcome_note', 'include_in_next_report'];

function pick(body) {
  const row = {};
  for (const k of TASK_COLS) if (k in body) row[k] = body[k];
  return row;
}

// GET /api/tasks?client_name=&status=&date_from=&date_to=&include_in_next_report=1&order=scheduled_date,scheduled_time&limit=
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'client_name')) conds.push(['client_name', '=', q(url, 'client_name')]);
  if (q(url, 'status')) conds.push(['status', '=', q(url, 'status')]);
  if (q(url, 'date_from')) conds.push(['scheduled_date', '>=', q(url, 'date_from')]);
  if (q(url, 'date_to')) conds.push(['scheduled_date', '<=', q(url, 'date_to')]);
  if (q(url, 'include_in_next_report') !== undefined) conds.push(['include_in_next_report', '=', q(url, 'include_in_next_report') === '1' || q(url, 'include_in_next_report') === 'true' ? 1 : 0]);
  const rows = await selectWhere(env.DB, 'ad_tasks', conds, { order: q(url, 'order'), fallbackOrder: 'scheduled_date,scheduled_time', limit: q(url, 'limit') });
  return json(rows);
});

// POST /api/tasks  單筆物件或陣列
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  const list = Array.isArray(body) ? body : body ? [body] : [];
  if (!list.length) return error('沒有要新增的任務');
  const rows = list.map((t) => {
    if (!t.client_name || !t.task) throw new HttpError(400, '每筆任務都要有 client_name 與 task');
    const r = pick(t);
    r.status = r.status || 'pending';
    r.scheduled_time = r.scheduled_time || '10:00';
    r.priority = r.priority || 'yellow';
    r.estimated_minutes = Number(r.estimated_minutes) > 0 ? Number(r.estimated_minutes) : 30;
    return r;
  });
  const created = await insertRows(env.DB, 'ad_tasks', rows);
  return json(created, 201);
});

// PATCH /api/tasks  { ids: [...], patch: {...} }   批次更新（例如報告引用後標記 include_in_next_report=false）
export const onRequestPatch = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!Array.isArray(body?.ids) || !body.ids.length) return error('缺少 ids');
  const rows = await updateWhere(env.DB, 'ad_tasks', [['id', 'in', body.ids]], pick(body.patch || {}));
  return json(rows);
});
