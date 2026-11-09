import { handle, json, readJson, error } from '../../_lib/http.js';
import { updateWhere, deleteWhere } from '../../_lib/db.js';

// PATCH /api/plans/:id  { is_done?, completed_at?, category?, description?, plan_date? }
export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of ['plan_date', 'category', 'description', 'is_done', 'completed_at']) if (k in body) patch[k] = body[k];
  if ('is_done' in patch && !('completed_at' in patch)) patch.completed_at = patch.is_done ? new Date().toISOString() : null;
  const [row] = await updateWhere(env.DB, 'daily_plans', [['id', '=', params.id]], patch);
  return row ? json(row) : error('找不到計畫', 404);
});

export const onRequestDelete = handle(async ({ env, params }) => {
  const n = await deleteWhere(env.DB, 'daily_plans', [['id', '=', params.id]]);
  return n ? json({ ok: true }) : error('找不到計畫', 404);
});
