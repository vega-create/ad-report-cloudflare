import { handle, json } from '../../_lib/http.js';
import { agentDb } from '../../_lib/agent.js';

// GET /api/agent/stats → 主管總覽：每位在職員工（任務數、今日完成數、完成率）＋ 未回覆訊息數
export const onRequestGet = handle(async ({ env }) => {
  const db = agentDb(env);
  const today = new Date().toISOString().slice(0, 10);
  const { results: employees } = await db.prepare('SELECT id, name FROM agent_employees WHERE is_active = 1 ORDER BY created_at').all();
  const stats = [];
  for (const emp of employees) {
    const total = await db.prepare('SELECT COUNT(*) AS n FROM agent_tasks WHERE employee_id = ? AND is_active = 1').bind(emp.id).first();
    const done = await db.prepare('SELECT COUNT(*) AS n FROM agent_task_records WHERE employee_id = ? AND completed_at >= ?').bind(emp.id, today).first();
    const t = Number(total?.n || 0), d = Number(done?.n || 0);
    stats.push({ name: emp.name, total: t, completed: d, rate: t ? Math.round((d / t) * 100) : 0 });
  }
  const unread = await db.prepare('SELECT COUNT(*) AS n FROM agent_customer_messages WHERE is_replied = 0').first();
  return json({ employeeStats: stats, unreadMessages: Number(unread?.n || 0) });
});
