// /api 的身分驗證
// 1) 程式呼叫（MCP、LINE bot）：Authorization: Bearer <API_TOKEN>
// 2) 瀏覽器：Cloudflare Access 的 JWT（Cf-Access-Jwt-Assertion header，或 /api 被 Access bypass 時瀏覽器仍會帶的 CF_Authorization cookie）
//    照 Cloudflare 文件驗：RS256 簽章（JWKS: https://<team>.cloudflareaccess.com/cdn-cgi/access/certs）、aud 含 ACCESS_AUD、iss、exp
// 3) 本機 wrangler pages dev（localhost）：不驗
// 沒設 ACCESS_AUD / ACCESS_TEAM_DOMAIN 時在正式環境一律拒絕（fail closed）。

let jwksCache = { team: '', keys: null, fetchedAt: 0 };

function b64urlToBytes(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function b64urlToJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

async function getJwks(team) {
  const fresh = jwksCache.team === team && jwksCache.keys && Date.now() - jwksCache.fetchedAt < 60 * 60 * 1000;
  if (fresh) return jwksCache.keys;
  const r = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error(`取得 Access JWKS 失敗：${r.status}`);
  const data = await r.json();
  jwksCache = { team, keys: data.keys || [], fetchedAt: Date.now() };
  return jwksCache.keys;
}

export async function verifyAccessJwt(token, env) {
  const team = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  if (!team || !aud) return { ok: false, error: 'ACCESS_TEAM_DOMAIN / ACCESS_AUD 未設定' };
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, error: 'JWT 格式錯誤' };
  let header, payload;
  try {
    header = b64urlToJson(parts[0]);
    payload = b64urlToJson(parts[1]);
  } catch {
    return { ok: false, error: 'JWT 無法解析' };
  }
  if (header.alg !== 'RS256') return { ok: false, error: `不支援的演算法 ${header.alg}` };
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp < now) return { ok: false, error: 'Access 登入已逾時，請重新整理頁面' };
  const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audList.includes(aud)) return { ok: false, error: 'JWT aud 不符' };
  if (payload.iss !== `https://${team}`) return { ok: false, error: 'JWT iss 不符' };

  let keys = await getJwks(team);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    // 金鑰輪替：強制重抓一次
    jwksCache = { team: '', keys: null, fetchedAt: 0 };
    keys = await getJwks(team);
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) return { ok: false, error: '找不到對應的 Access 簽章金鑰' };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return { ok: false, error: 'JWT 簽章無效' };
  return { ok: true, kind: 'access', email: payload.email || null };
}

function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function authenticate(request, env) {
  const url = new URL(request.url);
  const host = url.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return { ok: true, kind: 'dev' };

  const authz = request.headers.get('Authorization') || '';
  if (authz.startsWith('Bearer ')) {
    const tok = authz.slice(7).trim();
    if (env.API_TOKEN && timingSafeEqual(tok, env.API_TOKEN)) return { ok: true, kind: 'token' };
    // 也允許直接用 Bearer 帶 Access JWT
    if (tok.split('.').length === 3) return verifyAccessJwt(tok, env);
    return { ok: false, error: 'API token 無效' };
  }

  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || readCookie(request, 'CF_Authorization');
  if (!jwt) return { ok: false, error: '未登入（找不到 Access 憑證）' };
  return verifyAccessJwt(jwt, env);
}
