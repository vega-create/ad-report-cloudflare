import { handle, json, readJson, error } from '../../_lib/http.js';
import { selectWhere, insertRows, q } from '../../_lib/db.js';

// GET /api/feedback?client_id=&report_id=&source=&limit=30&order=-created_at
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'client_id')) conds.push(['client_id', '=', q(url, 'client_id')]);
  if (q(url, 'report_id')) conds.push(['report_id', '=', q(url, 'report_id')]);
  if (q(url, 'source')) conds.push(['source', '=', q(url, 'source')]);
  const rows = await selectWhere(env.DB, 'report_feedback', conds, { order: q(url, 'order'), fallbackOrder: '-created_at', limit: q(url, 'limit') });
  return json(rows);
});

// POST /api/feedback  { client_id, report_id?, instruction, source, before_excerpt?, after_excerpt? }
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!body?.instruction) return error('缺少 instruction');
  const [row] = await insertRows(env.DB, 'report_feedback', {
    client_id: body.client_id || null,
    report_id: body.report_id || null,
    instruction: body.instruction,
    before_excerpt: body.before_excerpt ?? null,
    after_excerpt: body.after_excerpt ?? null,
    source: body.source || 'claude',
  });
  return json(row, 201);
});
