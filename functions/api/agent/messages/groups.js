import { handle, json } from '../../../_lib/http.js';
import { agentDb } from '../../../_lib/agent.js';

// GET /api/agent/messages/groups → 有訊息的群組名稱（去重排序）
export const onRequestGet = handle(async ({ env }) => {
  const { results } = await agentDb(env).prepare('SELECT DISTINCT group_name FROM agent_customer_messages WHERE group_name IS NOT NULL ORDER BY group_name').all();
  return json(results.map((r) => r.group_name));
});
