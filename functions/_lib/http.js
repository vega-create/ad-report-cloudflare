// 共用：JSON 回應與請求解析
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export function error(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, status);
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 把 route handler 包起來：統一錯誤處理（D1 錯誤 → 500 / FK 擋刪 → 409）
export function handle(fn) {
  return async (context) => {
    try {
      return await fn(context);
    } catch (e) {
      const msg = String(e?.message || e);
      if (/FOREIGN KEY constraint failed/i.test(msg)) {
        return error('資料仍被其他記錄引用（例如客戶底下還有報告），無法刪除', 409);
      }
      if (e instanceof HttpError) return error(e.message, e.status);
      console.error('API error:', msg);
      return error(msg, 500);
    }
  };
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
