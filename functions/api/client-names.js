import { handle, json } from '../_lib/http.js';

// GET /api/client-names?sources=clients,tasks,logs
// 回傳去重排序後的客戶名稱（供下拉選單用）。預設只取 clients 表。
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const sources = (url.searchParams.get('sources') || 'clients').split(',').map((s) => s.trim());
  const names = new Set();
  if (sources.includes('clients')) {
    const { results } = await env.DB.prepare('SELECT name FROM clients ORDER BY name').all();
    results.forEach((r) => r.name && names.add(r.name));
  }
  if (sources.includes('tasks')) {
    const { results } = await env.DB.prepare('SELECT DISTINCT client_name AS name FROM ad_tasks').all();
    results.forEach((r) => r.name && names.add(r.name));
  }
  if (sources.includes('logs')) {
    const { results } = await env.DB.prepare('SELECT DISTINCT client_name AS name FROM ad_operation_logs').all();
    results.forEach((r) => r.name && names.add(r.name));
  }
  return json([...names].sort((a, b) => a.localeCompare(b)));
});
