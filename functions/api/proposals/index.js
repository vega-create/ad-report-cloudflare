import { handle, json, readJson, error } from '../../_lib/http.js';
import { insertRows, q } from '../../_lib/db.js';
import { selectWithClient } from '../../_lib/joins.js';

// GET /api/proposals?client_id=&status=&order=-created_at
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'client_id')) conds.push(['client_id', '=', q(url, 'client_id')]);
  if (q(url, 'status')) conds.push(['status', '=', q(url, 'status')]);
  const rows = await selectWithClient(env.DB, 'proposals', conds, { order: q(url, 'order'), fallbackOrder: '-created_at', limit: q(url, 'limit') });
  return json(rows);
});

// POST /api/proposals  { title, client_id?, content? }
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!body || !String(body.title || '').trim()) return error('缺少提案標題');
  const [row] = await insertRows(env.DB, 'proposals', {
    title: String(body.title).trim(),
    client_id: body.client_id || null,
    content: body.content ?? '',
    status: body.status || 'draft',
  });
  return json(row, 201);
});
