import { handle, json, readJson, error, HttpError } from '../../_lib/http.js';
import { selectWhere, insertRows, q } from '../../_lib/db.js';

// GET /api/plans?date_from=&date_to=&is_done=&order=category,created_at
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'date_from')) conds.push(['plan_date', '>=', q(url, 'date_from')]);
  if (q(url, 'date_to')) conds.push(['plan_date', '<=', q(url, 'date_to')]);
  if (q(url, 'date')) conds.push(['plan_date', '=', q(url, 'date')]);
  if (q(url, 'is_done') !== undefined) conds.push(['is_done', '=', ['1', 'true'].includes(q(url, 'is_done')) ? 1 : 0]);
  const rows = await selectWhere(env.DB, 'daily_plans', conds, { order: q(url, 'order'), fallbackOrder: 'category,created_at', limit: q(url, 'limit') });
  return json(rows);
});

// POST /api/plans  單筆或陣列 { plan_date, category, description }
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  const list = Array.isArray(body) ? body : body ? [body] : [];
  if (!list.length) return error('沒有要新增的計畫');
  const rows = list.map((p) => {
    if (!p.plan_date || !p.category || !p.description) throw new HttpError(400, '每筆都要有 plan_date / category / description');
    return { plan_date: p.plan_date, category: p.category, description: p.description, is_done: !!p.is_done };
  });
  const created = await insertRows(env.DB, 'daily_plans', rows);
  return json(created, 201);
});
