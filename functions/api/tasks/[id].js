import { handle, json, readJson, error } from '../../_lib/http.js';
import { getById, updateWhere, deleteWhere } from '../../_lib/db.js';

const TASK_COLS = ['client_name', 'report_date', 'task', 'category', 'priority', 'estimated_minutes', 'scheduled_date', 'scheduled_time', 'status', 'completed_at', 'outcome_note', 'include_in_next_report'];

export const onRequestGet = handle(async ({ env, params }) => {
  const row = await getById(env.DB, 'ad_tasks', params.id);
  return row ? json(row) : error('找不到任務', 404);
});

// PATCH /api/tasks/:id  { status?, completed_at?, outcome_note?, include_in_next_report?, scheduled_date?, ... }
export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of TASK_COLS) if (k in body) patch[k] = body[k];
  if (patch.status === 'done' && !('completed_at' in patch)) patch.completed_at = new Date().toISOString();
  const [row] = await updateWhere(env.DB, 'ad_tasks', [['id', '=', params.id]], patch);
  return row ? json(row) : error('找不到任務', 404);
});

export const onRequestDelete = handle(async ({ env, params }) => {
  const n = await deleteWhere(env.DB, 'ad_tasks', [['id', '=', params.id]]);
  return n ? json({ ok: true }) : error('找不到任務', 404);
});
