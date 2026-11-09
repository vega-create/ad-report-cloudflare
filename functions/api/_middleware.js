// /api/* 統一驗身分（/api/public/* 給客戶看的公開報告／提案不用登入）
import { authenticate } from '../_lib/auth.js';
import { json } from '../_lib/http.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return next();
  if (url.pathname.startsWith('/api/public/')) return next();
  const auth = await authenticate(request, env);
  if (!auth.ok) return json({ error: auth.error || '未授權' }, 401);
  context.data.auth = auth;
  return next();
}
