import { handle, json, readJson, error } from '../../_lib/http.js';
import { updateWhere, deleteWhere } from '../../_lib/db.js';
import { getWithClient } from '../../_lib/joins.js';

export const onRequestGet = handle(async ({ env, params }) => {
  const row = await getWithClient(env.DB, 'proposals', params.id);
  return row ? json(row) : error('找不到提案', 404);
});

export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of ['title', 'client_id', 'content', 'status', 'updated_at']) if (k in body) patch[k] = body[k];
  if ('client_id' in patch && !patch.client_id) patch.client_id = null;
  const rows = await updateWhere(env.DB, 'proposals', [['id', '=', params.id]], patch);
  if (!rows.length) return error('找不到提案', 404);
  return json(await getWithClient(env.DB, 'proposals', params.id));
});

export const onRequestDelete = handle(async ({ env, params }) => {
  const n = await deleteWhere(env.DB, 'proposals', [['id', '=', params.id]]);
  return n ? json({ ok: true }) : error('找不到提案', 404);
});
