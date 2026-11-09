import { handle, json, readJson, error, HttpError } from '../../_lib/http.js';
import { selectWhere, insertRows, updateWhere, q } from '../../_lib/db.js';

const LOG_COLS = ['client_name', 'operation_date', 'platform', 'operation_type', 'description', 'details', 'raw_message', 'include_in_report'];
function pick(body) {
  const row = {};
  for (const k of LOG_COLS) if (k in body) row[k] = body[k];
  return row;
}

// GET /api/operation-logs?client_name=&date_from=&date_to=&date_before=&include_in_report=1&order=operation_date,created_at&limit=
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'client_name')) conds.push(['client_name', '=', q(url, 'client_name')]);
  if (q(url, 'date_from')) conds.push(['operation_date', '>=', q(url, 'date_from')]);
  if (q(url, 'date_to')) conds.push(['operation_date', '<=', q(url, 'date_to')]);
  if (q(url, 'date_before')) conds.push(['operation_date', '<', q(url, 'date_before')]);
  if (q(url, 'include_in_report') !== undefined) conds.push(['include_in_report', '=', ['1', 'true'].includes(q(url, 'include_in_report')) ? 1 : 0]);
  const rows = await selectWhere(env.DB, 'ad_operation_logs', conds, { order: q(url, 'order'), fallbackOrder: 'operation_date,created_at', limit: q(url, 'limit') });
  return json(rows);
});

// POST /api/operation-logs  單筆或陣列 { client_name, operation_date?, platform?, description, raw_message? }
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  const list = Array.isArray(body) ? body : body ? [body] : [];
  if (!list.length) return error('沒有要新增的記錄');
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })).toLocaleDateString('sv-SE');
  const rows = list.map((l) => {
    if (!l.client_name || !l.description) throw new HttpError(400, '每筆都要有 client_name 與 description');
    const r = pick(l);
    r.operation_date = r.operation_date || today;
    r.platform = r.platform || null;
    return r;
  });
  const created = await insertRows(env.DB, 'ad_operation_logs', rows);
  return json(created, 201);
});

// PATCH /api/operation-logs  { ids, patch }
export const onRequestPatch = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!Array.isArray(body?.ids) || !body.ids.length) return error('缺少 ids');
  const rows = await updateWhere(env.DB, 'ad_operation_logs', [['id', 'in', body.ids]], pick(body.patch || {}));
  return json(rows);
});
