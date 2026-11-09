import { handle, json, readJson, error } from '../../_lib/http.js';
import { selectWhere, insertRows, q } from '../../_lib/db.js';

// GET /api/clients?order=name|-created_at   → 客戶列表
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const rows = await selectWhere(env.DB, 'clients', [], { order: q(url, 'order'), fallbackOrder: '-created_at' });
  return json(rows);
});

// POST /api/clients  { name, industry, line_group_id, notes }
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !String(body.name || '').trim()) return error('缺少客戶名稱');
  const [row] = await insertRows(env.DB, 'clients', {
    name: String(body.name).trim(),
    industry: body.industry || null,
    line_group_id: body.line_group_id || null,
    notes: body.notes || null,
  });
  return json(row, 201);
});
