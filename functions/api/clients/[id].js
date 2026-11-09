import { handle, json, readJson, error } from '../../_lib/http.js';
import { getById, updateWhere, deleteWhere } from '../../_lib/db.js';

export const onRequestGet = handle(async ({ env, params }) => {
  const row = await getById(env.DB, 'clients', params.id);
  return row ? json(row) : error('找不到客戶', 404);
});

// PATCH /api/clients/:id  { name?, industry?, line_group_id?, notes? }
export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of ['name', 'industry', 'line_group_id', 'notes']) if (k in body) patch[k] = body[k] === '' ? null : body[k];
  if ('name' in patch && !patch.name) return error('客戶名稱不可空白');
  const [row] = await updateWhere(env.DB, 'clients', [['id', '=', params.id]], patch);
  return row ? json(row) : error('找不到客戶', 404);
});

// DELETE /api/clients/:id （底下還有報告會回 409）
export const onRequestDelete = handle(async ({ env, params }) => {
  const n = await deleteWhere(env.DB, 'clients', [['id', '=', params.id]]);
  return n ? json({ ok: true }) : error('找不到客戶', 404);
});
