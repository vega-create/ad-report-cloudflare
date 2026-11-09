import { handle, json, readJson, error } from '../../_lib/http.js';
import { selectWhere, insertRows, q } from '../../_lib/db.js';

// GET /api/quick-logs?client_name=&created_after=&order=-created_at
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'client_name')) conds.push(['client_name', '=', q(url, 'client_name')]);
  if (q(url, 'created_after')) conds.push(['created_at', '>=', q(url, 'created_after')]);
  const rows = await selectWhere(env.DB, 'ad_quick_logs', conds, { order: q(url, 'order'), fallbackOrder: '-created_at', limit: q(url, 'limit') });
  return json(rows);
});

// POST /api/quick-logs  { client_name, period_start, period_end, spend_summary, next_actions?, notes?, raw_markdown?, client_id? }
// 沒給 client_id 會用 client_name 到 clients 表找
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!body?.client_name) return error('缺少 client_name');
  let client_id = body.client_id || null;
  if (!client_id) {
    const c = await env.DB.prepare('SELECT id FROM clients WHERE name = ? LIMIT 1').bind(body.client_name).first();
    client_id = c?.id || null;
  }
  const [row] = await insertRows(env.DB, 'ad_quick_logs', {
    client_id,
    client_name: body.client_name,
    period_start: body.period_start || null,
    period_end: body.period_end || null,
    spend_summary: body.spend_summary ?? [],
    next_actions: body.next_actions || '',
    notes: body.notes || '',
    raw_markdown: body.raw_markdown ?? null,
  });
  return json(row, 201);
});
