import { handle, json } from '../../../_lib/http.js';
import { selectWhere, q } from '../../../_lib/db.js';
import { agentDb } from '../../../_lib/agent.js';

// GET /api/agent/messages?created_after=&created_before=&group_name=&search=&important=1&limit=500
export const onRequestGet = handle(async ({ env, request }) => {
  const url = new URL(request.url);
  const conds = [];
  if (q(url, 'created_after')) conds.push(['created_at', '>=', q(url, 'created_after')]);
  if (q(url, 'created_before')) conds.push(['created_at', '<=', q(url, 'created_before')]);
  if (q(url, 'group_name')) conds.push(['group_name', '=', q(url, 'group_name')]);
  if (q(url, 'search')) conds.push(['message', 'like', `%${q(url, 'search')}%`]);
  if (q(url, 'important') !== undefined) conds.push(['is_important', '=', ['1', 'true'].includes(q(url, 'important')) ? 1 : 0]);
  const rows = await selectWhere(agentDb(env), 'agent_customer_messages', conds, { fallbackOrder: '-created_at', limit: q(url, 'limit') || 500 });
  return json(rows);
});
