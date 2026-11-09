// 前端唯一的資料存取入口：全部打同一個部署的 Pages Functions（/api/*），瀏覽器不再直連資料庫。
// 身分：瀏覽器帶 Cloudflare Access 的 cookie，Functions 端驗 JWT；程式端則用 Bearer API_TOKEN。
// 錯誤：非 2xx 一律 throw Error(message)，頁面用 try/catch 或 .catch 處理。

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

function qs(params?: Query): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    sp.set(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function request<T>(method: string, path: string, body?: unknown, params?: Query): Promise<T> {
  const res = await fetch(`/api${path}${qs(params)}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  })
  const text = await res.text()
  let data: any = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = { error: text } }
  }
  if (!res.ok) {
    const msg = data?.error || `${res.status} ${res.statusText}`
    throw new ApiError(res.status, res.status === 401 ? `未登入或登入逾時，請重新整理頁面（${msg}）` : msg)
  }
  return data as T
}

const get = <T,>(path: string, params?: Query) => request<T>('GET', path, undefined, params)
const post = <T,>(path: string, body: unknown) => request<T>('POST', path, body)
const patch = <T,>(path: string, body: unknown) => request<T>('PATCH', path, body)
const del = <T,>(path: string) => request<T>('DELETE', path)

// ---- 型別（與 D1 欄位一致；布林已轉 true/false，JSON 欄已 parse） ----
export interface Client { id: string; name: string; industry: string | null; line_group_id: string | null; notes: string | null; created_at: string; updated_at: string }
export interface Report {
  id: string; client_id: string; report_date: string | null; status: 'draft' | 'published'; data_analysis: string | null
  comparison: string | null; recommendations: string | null; raw_metrics: unknown; created_at: string; published_at: string | null
  ai_draft: string | null; source: string; clients?: Client | null
}
export interface Proposal { id: string; client_id: string | null; title: string; content: string | null; status: string; created_at: string; updated_at: string; clients?: Client | null }
export interface Task {
  id: string; client_name: string; report_date: string | null; task: string; category: string | null; priority: string | null
  estimated_minutes: number | null; scheduled_date: string | null; scheduled_time: string | null; status: 'pending' | 'done' | 'cancelled'
  completed_at: string | null; outcome_note: string | null; include_in_next_report: boolean; created_at: string; updated_at: string
}
export interface OperationLog {
  id: string; client_name: string; operation_date: string; platform: string | null; operation_type: string | null; description: string
  details: unknown; raw_message: string | null; created_at: string; include_in_report: boolean
}
export interface QuickLog {
  id: string; client_id: string | null; client_name: string; period_start: string | null; period_end: string | null
  spend_summary: Array<{ platform: string; amount: number; metrics: string }> | null; next_actions: string | null; notes: string | null
  raw_markdown: string | null; created_at: string
}
export interface DailyPlan { id: string; plan_date: string; category: string; description: string; is_done: boolean; completed_at: string | null; created_at: string }
export interface Feedback { id: string; report_id: string | null; client_id: string | null; instruction: string | null; before_excerpt: string | null; after_excerpt: string | null; source: string | null; created_at: string }
export interface AgentEmployee { id: string; name: string; line_user_id: string | null; line_group_id: string | null; is_active: boolean; created_at: string }
export interface AgentTask { id: string; task_name: string; client_name: string | null; employee_id: string | null; frequency: string | null; frequency_detail: string | null; is_active: boolean; created_at: string; agent_employees?: { name: string } | null }
export interface AgentMessage { id: string; group_id: string | null; group_name: string | null; group_type: string | null; user_id: string | null; message: string | null; is_replied: boolean; is_important: boolean; note: string | null; created_at: string }

export const api = {
  clients: {
    list: (params?: { order?: string }) => get<Client[]>('/clients', params),
    get: (id: string) => get<Client>(`/clients/${id}`),
    create: (body: Partial<Client>) => post<Client>('/clients', body),
    update: (id: string, body: Partial<Client>) => patch<Client>(`/clients/${id}`, body),
    remove: (id: string) => del<{ ok: true }>(`/clients/${id}`),
  },
  reports: {
    list: (params?: { client_id?: string; status?: string; created_after?: string; date_from?: string; date_to?: string; limit?: number; order?: string }) => get<Report[]>('/reports', params),
    get: (id: string) => get<Report>(`/reports/${id}`),
    create: (body: Partial<Report>) => post<Report>('/reports', body),
    update: (id: string, body: Partial<Report>) => patch<Report>(`/reports/${id}`, body),
    remove: (id: string) => del<{ ok: true }>(`/reports/${id}`),
  },
  proposals: {
    list: (params?: { client_id?: string; status?: string; order?: string }) => get<Proposal[]>('/proposals', params),
    get: (id: string) => get<Proposal>(`/proposals/${id}`),
    create: (body: Partial<Proposal>) => post<Proposal>('/proposals', body),
    update: (id: string, body: Partial<Proposal>) => patch<Proposal>(`/proposals/${id}`, body),
    remove: (id: string) => del<{ ok: true }>(`/proposals/${id}`),
  },
  feedback: {
    list: (params?: { client_id?: string; report_id?: string; source?: string; limit?: number; order?: string }) => get<Feedback[]>('/feedback', params),
    create: (body: Partial<Feedback>) => post<Feedback>('/feedback', body),
  },
  tasks: {
    list: (params?: { client_name?: string; status?: string; date_from?: string; date_to?: string; include_in_next_report?: boolean; order?: string; limit?: number }) => get<Task[]>('/tasks', params),
    create: (rows: Partial<Task> | Partial<Task>[]) => post<Task[]>('/tasks', rows),
    update: (id: string, body: Partial<Task>) => patch<Task>(`/tasks/${id}`, body),
    updateMany: (ids: string[], body: Partial<Task>) => patch<Task[]>('/tasks', { ids, patch: body }),
    remove: (id: string) => del<{ ok: true }>(`/tasks/${id}`),
  },
  operationLogs: {
    list: (params?: { client_name?: string; date_from?: string; date_to?: string; date_before?: string; include_in_report?: boolean; order?: string; limit?: number }) => get<OperationLog[]>('/operation-logs', params),
    create: (rows: Partial<OperationLog> | Partial<OperationLog>[]) => post<OperationLog[]>('/operation-logs', rows),
    update: (id: string, body: Partial<OperationLog>) => patch<OperationLog>(`/operation-logs/${id}`, body),
    updateMany: (ids: string[], body: Partial<OperationLog>) => patch<OperationLog[]>('/operation-logs', { ids, patch: body }),
    remove: (id: string) => del<{ ok: true }>(`/operation-logs/${id}`),
  },
  quickLogs: {
    list: (params?: { client_name?: string; created_after?: string; order?: string; limit?: number }) => get<QuickLog[]>('/quick-logs', params),
    create: (body: Partial<QuickLog>) => post<QuickLog>('/quick-logs', body),
  },
  plans: {
    list: (params?: { date_from?: string; date_to?: string; date?: string; is_done?: boolean; order?: string }) => get<DailyPlan[]>('/plans', params),
    create: (rows: Partial<DailyPlan> | Partial<DailyPlan>[]) => post<DailyPlan[]>('/plans', rows),
    update: (id: string, body: Partial<DailyPlan>) => patch<DailyPlan>(`/plans/${id}`, body),
    remove: (id: string) => del<{ ok: true }>(`/plans/${id}`),
  },
  // 下拉選單用的客戶名稱：sources 可含 clients / tasks / logs
  clientNames: (sources: Array<'clients' | 'tasks' | 'logs'> = ['clients']) => get<string[]>('/client-names', { sources: sources.join(',') }),
  dashboard: () => get<{ clients: number; reports: number; recentReports: Report[]; unrecordedClients: Array<{ id: string; name: string }> }>('/dashboard'),
  agent: {
    stats: () => get<{ employeeStats: Array<{ name: string; total: number; completed: number; rate: number }>; unreadMessages: number }>('/agent/stats'),
    employees: (params?: { active?: boolean }) => get<AgentEmployee[]>('/agent/employees', params),
    tasks: {
      list: () => get<AgentTask[]>('/agent/tasks'),
      create: (body: Partial<AgentTask>) => post<AgentTask>('/agent/tasks', body),
      update: (id: string, body: Partial<AgentTask>) => patch<AgentTask>(`/agent/tasks/${id}`, body),
      remove: (id: string) => del<{ ok: true }>(`/agent/tasks/${id}`),
    },
    messages: {
      list: (params?: { created_after?: string; created_before?: string; group_name?: string; search?: string; important?: boolean; limit?: number }) => get<AgentMessage[]>('/agent/messages', params),
      groups: () => get<string[]>('/agent/messages/groups'),
      update: (id: string, body: Partial<AgentMessage>) => patch<AgentMessage>(`/agent/messages/${id}`, body),
    },
  },
  // 客戶看的公開頁（不需登入）
  public: {
    report: (id: string) => get<Report>(`/public/reports/${id}`),
    proposal: (id: string) => get<Proposal>(`/public/proposals/${id}`),
  },
  // 既有的 AI 解析／LINE 推送
  parseTasks: (body: { markdown: string; client_name: string; report_date?: string; existing_load?: Array<{ date: string; minutes: number }> }) => post<{ tasks: any[]; error?: string }>('/parse-tasks', body),
  parseQuickLog: (body: { markdown: string; client_name?: string }) => post<any>('/parse-quick-log', body),
  sendLine: (body: { groupId: string; message: string }) => post<{ success: boolean }>('/send-line', body),
}

export default api
