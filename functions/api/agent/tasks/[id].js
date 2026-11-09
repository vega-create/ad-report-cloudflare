import { handle, json, readJson, error } from '../../../_lib/http.js';
import { updateWhere, deleteWhere } from '../../../_lib/db.js';
import { agentDb } from '../../../_lib/agent.js';

export const onRequestPatch = handle(async ({ env, params, request }) => {
  const body = await readJson(request);
  if (!body) return error('缺少內容');
  const patch = {};
  for (const k of ['employee_id', 'client_name', 'task_name', 'frequency', 'frequency_detail', 'is_active']) if (k in body) patch[k] = body[k];
  const [row] = await updateWhere(agentDb(env), 'agent_tasks', [['id', '=', params.id]], patch);
  return row ? json(row) : error('找不到任務', 404);
});

// DELETE：先刪完成記錄再刪任務（與原網頁行為相同）
export const onRequestDelete = handle(async ({ env, params }) => {
  const db = agentDb(env);
  await deleteWhere(db, 'agent_task_records', [['task_id', '=', params.id]]);
  const n = await deleteWhere(db, 'agent_tasks', [['id', '=', params.id]]);
  return n ? json({ ok: true }) : error('找不到任務', 404);
});
