import { handle, json, readJson, error } from '../../../_lib/http.js';
import { insertRows, rowsOut } from '../../../_lib/db.js';
import { agentDb } from '../../../_lib/agent.js';

// GET /api/agent/tasks → 員工任務（附 agent_employees: { name }）
export const onRequestGet = handle(async ({ env }) => {
  const { results } = await agentDb(env).prepare(
    'SELECT t.*, e.name AS __emp_name FROM agent_tasks t LEFT JOIN agent_employees e ON e.id = t.employee_id ORDER BY t.created_at DESC',
  ).all();
  const rows = rowsOut('agent_tasks', results.map((r) => {
    const { __emp_name, ...rest } = r;
    return { ...rest, agent_employees: __emp_name !== null && __emp_name !== undefined ? { name: __emp_name } : null };
  }));
  return json(rows);
});

// POST /api/agent/tasks  { employee_id, client_name, task_name, frequency, frequency_detail, is_active? }
export const onRequestPost = handle(async ({ env, request }) => {
  const body = await readJson(request);
  if (!body?.task_name) return error('缺少 task_name');
  const [row] = await insertRows(agentDb(env), 'agent_tasks', {
    employee_id: body.employee_id || null,
    client_name: body.client_name || null,
    task_name: body.task_name,
    frequency: body.frequency || 'weekly',
    frequency_detail: body.frequency_detail || null,
    is_active: body.is_active === undefined ? true : !!body.is_active,
  });
  return json(row, 201);
});
