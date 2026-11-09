import { handle, json, error } from '../../../_lib/http.js';
import { getWithClient } from '../../../_lib/joins.js';

// GET /api/public/proposals/:id → 客戶看的公開提案（不用登入）
export const onRequestGet = handle(async ({ env, params }) => {
  const p = await getWithClient(env.DB, 'proposals', params.id);
  if (!p) return error('找不到提案', 404);
  return json({
    id: p.id, title: p.title, content: p.content, status: p.status, created_at: p.created_at,
    clients: p.clients ? { name: p.clients.name, industry: p.clients.industry } : null,
  });
});
