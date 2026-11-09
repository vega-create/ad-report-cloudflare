import { handle, json, error } from '../../../_lib/http.js';
import { getWithClient } from '../../../_lib/joins.js';

// GET /api/public/reports/:id → 客戶看的公開報告（不用登入；只回必要欄位）
export const onRequestGet = handle(async ({ env, params }) => {
  const r = await getWithClient(env.DB, 'reports', params.id);
  if (!r) return error('找不到報告', 404);
  return json({
    id: r.id, report_date: r.report_date, status: r.status, data_analysis: r.data_analysis, created_at: r.created_at,
    clients: r.clients ? { name: r.clients.name, industry: r.clients.industry } : null,
  });
});
