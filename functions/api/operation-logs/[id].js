import { handle, json, readJson, error } from '../../_lib/http.js';
import { getById, updateWhere, deleteWhere } from '../../_lib/db.js';

const LOG_COLS = ['client_name', 'operation_date', 'platform', 'operation_type', 'description', 'details', 'raw_message', 'include_in_report'];

export const onRequestGet = handle(async ({ env, params }) => {
  const row = await getById(env.DB, 'ad_operation_logs', params.id);
  return row ? json(row) : error('找不到記錄', 404);
});

export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of LOG_COLS) if (k in body) patch[k] = body[k];
  const [row] = await updateWhere(env.DB, 'ad_operation_logs', [['id', '=', params.id]], patch);
  return row ? json(row) : error('找不到記錄', 404);
});

export const onRequestDelete = handle(async ({ env, params }) => {
  const n = await deleteWhere(env.DB, 'ad_operation_logs', [['id', '=', params.id]]);
  return n ? json({ ok: true }) : error('找不到記錄', 404);
});
