import { handle, json, readJson, error } from '../../_lib/http.js';
import { updateWhere, deleteWhere } from '../../_lib/db.js';
import { getWithClient } from '../../_lib/joins.js';

export const onRequestGet = handle(async ({ env, params }) => {
  const row = await getWithClient(env.DB, 'reports', params.id);
  return row ? json(row) : error('找不到報告', 404);
});

// PATCH /api/reports/:id  { data_analysis?, status?, report_date?, ... }
export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of ['client_id', 'report_date', 'status', 'data_analysis', 'comparison', 'recommendations', 'raw_metrics', 'published_at', 'ai_draft', 'source']) {
    if (k in body) patch[k] = body[k];
  }
  if (patch.status === 'published' && !('published_at' in patch)) patch.published_at = new Date().toISOString();
  const rows = await updateWhere(env.DB, 'reports', [['id', '=', params.id]], patch);
  if (!rows.length) return error('找不到報告', 404);
  return json(await getWithClient(env.DB, 'reports', params.id));
});

export const onRequestDelete = handle(async ({ env, params }) => {
  const n = await deleteWhere(env.DB, 'reports', [['id', '=', params.id]]);
  return n ? json({ ok: true }) : error('找不到報告', 404);
});
