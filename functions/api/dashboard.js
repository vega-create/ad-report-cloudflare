import { handle, json } from '../_lib/http.js';
import { count } from '../_lib/db.js';
import { selectWithClient } from '../_lib/joins.js';

// GET /api/dashboard → 首頁統計：客戶數、報告數、最近 5 份報告、最近 7 天沒報告也沒快速記錄的客戶
export const onRequestGet = handle(async ({ env }) => {
  const db = env.DB;
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const [clients, reports, recentReports, allClients, reported, logged] = await Promise.all([
    count(db, 'clients'),
    count(db, 'reports'),
    selectWithClient(db, 'reports', [], { fallbackOrder: '-created_at', limit: 5 }),
    db.prepare('SELECT id, name FROM clients ORDER BY name').all().then((r) => r.results),
    db.prepare('SELECT DISTINCT client_id FROM reports WHERE created_at >= ?').bind(cutoff).all().then((r) => r.results.map((x) => x.client_id)),
    db.prepare('SELECT DISTINCT client_name FROM ad_quick_logs WHERE created_at >= ?').bind(cutoff).all().then((r) => r.results.map((x) => x.client_name)),
  ]);
  const reportedIds = new Set(reported);
  const loggedNames = new Set(logged);
  const unrecordedClients = allClients.filter((c) => !reportedIds.has(c.id) && !loggedNames.has(c.name));
  return json({ clients, reports, recentReports, unrecordedClients });
});
