// GET /img/<key> → 從 R2（adreport-ads）回傳圖片；報告 Markdown 裡的圖片網址都指到這裡
// 例：/img/ads/cat1.png  對應 R2 物件 key "ads/cat1.png"
export async function onRequestGet({ env, params, request }) {
  const key = Array.isArray(params.key) ? params.key.join('/') : String(params.key || '');
  if (!key || key.includes('..')) return new Response('not found', { status: 404 });
  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response('not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  if (!headers.get('Content-Type')) headers.set('Content-Type', guessType(key));
  headers.set('ETag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (request.headers.get('If-None-Match') === obj.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}

function guessType(key) {
  const ext = key.split('.').pop()?.toLowerCase();
  return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf' }[ext] || 'application/octet-stream';
}
