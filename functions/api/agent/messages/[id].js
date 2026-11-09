import { handle, json, readJson, error } from '../../../_lib/http.js';
import { updateWhere } from '../../../_lib/db.js';
import { agentDb } from '../../../_lib/agent.js';

// PATCH /api/agent/messages/:id  { is_important?, note?, is_replied? }
export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of ['is_important', 'note', 'is_replied']) if (k in body) patch[k] = body[k];
  const [row] = await updateWhere(agentDb(env), 'agent_customer_messages', [['id', '=', params.id]], patch);
  return row ? json(row) : error('找不到訊息', 404);
});
