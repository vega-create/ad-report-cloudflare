import { handle, json } from '../../_lib/http.js';
import { selectWhere, q } from '../../_lib/db.js';
import { agentDb } from '../../_lib/agent.js';

// GET /api/agent/employees?active=1
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'active') !== undefined) conds.push(['is_active', '=', ['1', 'true'].includes(q(url, 'active')) ? 1 : 0]);
  const rows = await selectWhere(agentDb(env), 'agent_employees', conds, { fallbackOrder: 'created_at' });
  return json(rows);
});
