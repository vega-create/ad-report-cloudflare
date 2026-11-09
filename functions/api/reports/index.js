import { handle, json, readJson, error } from '../../_lib/http.js';
import { insertRows, q } from '../../_lib/db.js';
import { selectWithClient } from '../../_lib/joins.js';

// GET /api/reports?client_id=&status=&created_after=&date_from=&date_to=&limit=&order=-created_at
// 回傳每筆附 clients: { name, industry, line_group_id, ... }
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'client_id')) conds.push(['client_id', '=', q(url, 'client_id')]);
  if (q(url, 'status')) conds.push(['status', '=', q(url, 'status')]);
  if (q(url, 'created_after')) conds.push(['created_at', '>=', q(url, 'created_after')]);
  if (q(url, 'date_from')) conds.push(['report_date', '>=', q(url, 'date_from')]);
  if (q(url, 'date_to')) conds.push(['report_date', '<=', q(url, 'date_to')]);
  const rows = await selectWithClient(env.DB, 'reports', conds, { order: q(url, 'order'), fallbackOrder: '-created_at', limit: q(url, 'limit') });
  return json(rows);
});

// POST /api/reports  { client_id, data_analysis, report_date?, status?, ai_draft?, source? }
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!body?.client_id) return error('缺少 client_id');
  const [row] = await insertRows(env.DB, 'reports', {
    client_id: body.client_id,
    report_date: body.report_date || new Date().toISOString().slice(0, 10),
    status: body.status || 'draft',
    data_analysis: body.data_analysis ?? '',
    comparison: body.comparison ?? null,
    recommendations: body.recommendations ?? null,
    raw_metrics: body.raw_metrics ?? null,
    ai_draft: body.ai_draft ?? null,
    source: body.source || 'manual',
  });
  return json(row, 201);
});
