// scripts/migrate-from-supabase.mjs
// 一次性搬運：Supabase 兩個專案的 12 張表 ＋ Storage `ads` 桶的圖片 → Cloudflare D1 `adreport` ＋ R2 `adreport-ads`
//
// 用法（在專案目錄）：
//   node scripts/migrate-from-supabase.mjs <輸出資料夾>                    只匯出（tables/*.json、images/、data.sql）
//   node scripts/migrate-from-supabase.mjs <輸出資料夾> --apply local      匯出後寫進本機 D1/R2（wrangler pages dev 用）並核對
//   node scripts/migrate-from-supabase.mjs <輸出資料夾> --apply remote     匯出後寫進正式 D1/R2 並核對
//   node scripts/migrate-from-supabase.mjs <輸出資料夾> --apply remote --skip-export   用既有匯出直接套用
//
// 金鑰：只讀 .env.local（或環境變數），絕不印出；對 Supabase 只做讀取。
//   AD_SUPABASE_URL / AD_SUPABASE_SERVICE_KEY        lbkrvyfsusmkjrjglbwm（Ad 專案）：clients / reports / proposals / report_feedback ＋ ads 桶
//   AGENT_SUPABASE_URL / AGENT_SUPABASE_SERVICE_KEY  lexcvcinmphkmavgswgn（共用專案）：ad_tasks / ad_operation_logs / ad_quick_logs / daily_plans / agent_*
//   （用 anon key 也能跑，但 lexcvc 的 agent_customer_messages 會被 RLS 擋成 0 筆，請用 service key）
// ⚠️ 輸出資料夾含客戶報告全文與 LINE 群組 ID，請放在專案外、不要進 git。
// 可重跑：INSERT OR REPLACE；R2 上傳同 key 覆蓋。切換當天再跑一次 --apply remote 同步最新資料。
//
// ad_tasks 重複問題（2026-11-09 查證）：ad_tasks 只存在 lexcvc（144 筆）；lbkrvy 沒有這張表（PostgREST 404），
// 只有一張空的 ad_operation_logs（0 筆）。所以 lbkrvy 這邊的 ad_* 不搬（見 SKIPPED）。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const CWD = process.cwd();
const args = process.argv.slice(2);
const OUT = args.find((a) => !a.startsWith('--'));
const APPLY = args.includes('--apply') ? args[args.indexOf('--apply') + 1] : null;
const SKIP_EXPORT = args.includes('--skip-export');
if (!OUT || (APPLY && !['local', 'remote'].includes(APPLY))) {
  console.error('用法：node scripts/migrate-from-supabase.mjs <輸出資料夾> [--apply local|remote] [--skip-export]');
  process.exit(1);
}
const OUT_ABS = path.resolve(OUT.replace(/^~/, process.env.HOME ?? ''));
if (OUT_ABS === CWD || OUT_ABS.startsWith(CWD + path.sep)) {
  console.error('✗ 輸出資料夾請放在專案外（含客戶資料，不可進 git）');
  process.exit(1);
}

const D1_NAME = 'adreport';
const R2_BUCKET = 'adreport-ads';
const STORAGE_BUCKET = 'ads';               // lbkrvy 的 Supabase Storage 桶
const EXPECTED_IMAGES = 17;                 // Vega 放在 ads 桶裡的圖片數（核對用）

// ── 表與欄位（與 migrations/d1/0001_init.sql 對齊；順序＝FK 先父後子） ──
const TABLES = {
  ad: {
    clients: ['id', 'name', 'industry', 'line_group_id', 'notes', 'created_at', 'updated_at'],
    reports: ['id', 'client_id', 'report_date', 'status', 'data_analysis', 'comparison', 'recommendations', 'raw_metrics', 'created_at', 'published_at', 'ai_draft', 'source'],
    proposals: ['id', 'client_id', 'title', 'content', 'status', 'created_at', 'updated_at'],
    report_feedback: ['id', 'report_id', 'client_id', 'instruction', 'before_excerpt', 'after_excerpt', 'source', 'created_at'],
  },
  agent: {
    ad_tasks: ['id', 'client_name', 'report_date', 'task', 'category', 'priority', 'estimated_minutes', 'scheduled_date', 'scheduled_time', 'status', 'completed_at', 'outcome_note', 'include_in_next_report', 'created_at', 'updated_at'],
    ad_operation_logs: ['id', 'client_name', 'operation_date', 'platform', 'operation_type', 'description', 'details', 'raw_message', 'created_at', 'include_in_report'],
    ad_quick_logs: ['id', 'client_id', 'client_name', 'period_start', 'period_end', 'spend_summary', 'next_actions', 'notes', 'raw_markdown', 'created_at'],
    daily_plans: ['id', 'plan_date', 'category', 'description', 'is_done', 'completed_at', 'created_at'],
    agent_employees: ['id', 'name', 'line_user_id', 'line_group_id', 'is_active', 'created_at'],
    agent_tasks: ['id', 'task_name', 'client_name', 'employee_id', 'frequency', 'frequency_detail', 'is_active', 'created_at'],
    agent_task_records: ['id', 'task_id', 'employee_id', 'completed_at', 'note', 'created_at'],
    agent_customer_messages: ['id', 'group_id', 'group_name', 'group_type', 'user_id', 'message', 'is_replied', 'is_important', 'note', 'created_at'],
  },
};
// 明確「不搬」的表（另一個專案裡的同名殘留）
const SKIPPED = [
  { project: 'ad (lbkrvy)', table: 'ad_operation_logs', reason: '空表（0 筆），活的資料在 lexcvc' },
  { project: 'ad (lbkrvy)', table: 'ad_tasks', reason: '不存在（PostgREST 404），活的資料在 lexcvc' },
];
const ALL_TABLES = { ...TABLES.ad, ...TABLES.agent };
// 哪些欄位是 timestamptz → 轉成 ISO 8601 UTC（與 D1 預設格式一致）
const TS_COLS = new Set(['created_at', 'updated_at', 'completed_at', 'published_at']);
// 布林 → 0/1；JSON → 字串
const BOOL_COLS = new Set(['include_in_next_report', 'include_in_report', 'is_done', 'is_active', 'is_replied', 'is_important']);
const JSON_COLS = new Set(['raw_metrics', 'details', 'spend_summary']);
// 內容裡可能含圖片網址、要改寫的欄位
const URL_COLS = { reports: ['data_analysis', 'ai_draft', 'comparison', 'recommendations'], proposals: ['content'] };

function loadEnv() {
  try {
    for (const line of readFileSync(path.join(CWD, '.env.local'), 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // 沒有 .env.local 就只靠環境變數
  }
}

function sqlLit(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'object') return sqlLit(JSON.stringify(v));
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function convert(col, v) {
  if (v === null || v === undefined) return null;
  if (BOOL_COLS.has(col)) return v ? 1 : 0;
  if (JSON_COLS.has(col)) return typeof v === 'string' ? v : JSON.stringify(v);
  if (TS_COLS.has(col) && typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d.toISOString();
  }
  return v;
}

function wrangler(cmdArgs, { quiet = false } = {}) {
  const r = spawnSync('npx', ['wrangler', ...cmdArgs], { cwd: CWD, encoding: 'utf8', stdio: 'pipe', maxBuffer: 512 * 1024 * 1024 });
  if (r.status !== 0) {
    if (!quiet) process.stderr.write((r.stdout || '') + (r.stderr || ''));
    throw new Error(`wrangler ${cmdArgs.slice(0, 3).join(' ')} … 失敗（exit ${r.status}）`);
  }
  return r.stdout;
}

// 圖片網址改寫：Supabase 公開網址 → /img/<bucket>/<file>
const IMG_RE = /https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/([a-z0-9_-]+)\/([^\s)"'<>]+)/g;
function rewriteUrls(text, found) {
  if (typeof text !== 'string' || !text.includes('supabase.co/storage')) return text;
  return text.replace(IMG_RE, (full, bucket, file) => {
    const key = `${bucket}/${decodeURIComponent(file)}`;
    found.set(key, full);
    return `/img/${key}`;
  });
}

// ── 1) 匯出 ──────────────────────────────────────
async function exportAll() {
  loadEnv();
  const src = {
    ad: { url: process.env.AD_SUPABASE_URL, key: process.env.AD_SUPABASE_SERVICE_KEY },
    agent: { url: process.env.AGENT_SUPABASE_URL, key: process.env.AGENT_SUPABASE_SERVICE_KEY },
  };
  for (const [k, v] of Object.entries(src)) {
    if (!v.url || !v.key) {
      console.error(`✗ 缺 ${k === 'ad' ? 'AD' : 'AGENT'}_SUPABASE_URL / _SERVICE_KEY（.env.local 或環境變數）`);
      process.exit(1);
    }
    v.url = v.url.replace(/\/$/, '');
  }

  async function readAll({ url, key }, table) {
    const rows = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items' },
      });
      if (!res.ok && res.status !== 206) throw new Error(`讀 ${table} 失敗：HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      const page = await res.json();
      rows.push(...page);
      if (page.length < PAGE) break;
    }
    return rows;
  }

  mkdirSync(path.join(OUT_ABS, 'tables'), { recursive: true });
  mkdirSync(path.join(OUT_ABS, 'images'), { recursive: true });
  const sql = ['-- 由 scripts/migrate-from-supabase.mjs 產生；含客戶資料，不要進 git。', 'PRAGMA foreign_keys = OFF;'];
  const summary = {};
  const imageRefs = new Map(); // key → 原網址

  for (const [proj, tables] of Object.entries(TABLES)) {
    console.log(`\n[${proj === 'ad' ? 'lbkrvy（Ad）' : 'lexcvc（共用）'}]`);
    for (const [table, cols] of Object.entries(tables)) {
      const rows = await readAll(src[proj], table);
      writeFileSync(path.join(OUT_ABS, 'tables', `${table}.json`), JSON.stringify(rows, null, 2));
      for (const row of rows) {
        const r = { ...row };
        for (const c of URL_COLS[table] || []) r[c] = rewriteUrls(r[c], imageRefs);
        const vals = cols.map((c) => sqlLit(convert(c, r[c])));
        sql.push(`INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});`);
      }
      summary[table] = rows.length;
      console.log(`  ✓ ${table}: ${rows.length} 筆`);
    }
  }
  for (const s of SKIPPED) console.log(`  – 略過 ${s.project} ${s.table}：${s.reason}`);

  // ── 圖片：先試 Storage 列表（需 service key），不行就用內容裡掃到的網址
  console.log(`\n[Storage ${STORAGE_BUCKET}]`);
  const images = []; // { key, url }
  const listed = await listBucket(src.ad, STORAGE_BUCKET).catch(() => null);
  if (listed && listed.length) {
    for (const name of listed) images.push({ key: `${STORAGE_BUCKET}/${name}`, url: `${src.ad.url}/storage/v1/object/public/${STORAGE_BUCKET}/${encodeURIComponent(name)}` });
    console.log(`  桶內列出 ${listed.length} 個檔案`);
  } else {
    console.log('  （無法列出桶內容，改用報告／提案內容裡掃到的網址）');
  }
  // 內容裡引用、但不在 ads 桶列表的（例如 lexcvc 的 ai-ads 桶那張）也一併搬，報告才不會破圖
  for (const [key, url] of imageRefs) if (!images.some((i) => i.key === key)) images.push({ key, url });

  const manifestImages = [];
  for (const img of images) {
    const res = await fetch(img.url);
    if (!res.ok) { console.log(`  ✗ 下載失敗 ${img.key}（HTTP ${res.status}）`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const file = path.join(OUT_ABS, 'images', img.key.replace(/\//g, '__'));
    writeFileSync(file, buf);
    manifestImages.push({ key: img.key, file: path.basename(file), bytes: buf.length, contentType: res.headers.get('content-type') || 'application/octet-stream', source: img.url, referenced: imageRefs.has(img.key) });
    console.log(`  ✓ ${img.key}（${(buf.length / 1024).toFixed(0)} KB）`);
  }
  const adsCount = manifestImages.filter((i) => i.key.startsWith(`${STORAGE_BUCKET}/`)).length;
  console.log(`  ${STORAGE_BUCKET} 桶共 ${adsCount} 張（預期 ${EXPECTED_IMAGES}）${adsCount === EXPECTED_IMAGES ? '✓' : '⚠ 數量不符，請確認'}；另 ${manifestImages.length - adsCount} 張來自其他桶`);

  writeFileSync(path.join(OUT_ABS, 'data.sql'), sql.join('\n') + '\n');
  writeFileSync(path.join(OUT_ABS, 'manifest.json'), JSON.stringify({
    exported_at: new Date().toISOString(),
    sources: { ad: src.ad.url, agent: src.agent.url },
    tables: summary, skipped: SKIPPED, images: manifestImages,
  }, null, 2));
}

async function listBucket({ url, key }, bucket) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) throw new Error(`list ${bucket} → ${res.status}`);
    const page = await res.json();
    for (const o of page) if (o.id) out.push(o.name); // 資料夾沒有 id
    if (page.length < 1000) break;
  }
  return out;
}

// ── 2) 套用到 D1 / R2 並核對 ────────────────────────
function apply(target) {
  const flag = target === 'remote' ? '--remote' : '--local';
  const sqlFile = path.join(OUT_ABS, 'data.sql');
  const manifestFile = path.join(OUT_ABS, 'manifest.json');
  if (!existsSync(sqlFile) || !existsSync(manifestFile)) throw new Error(`找不到 ${sqlFile}，請先匯出`);
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));

  console.log(`\n→ D1 ${target}：執行 data.sql`);
  wrangler(['d1', 'execute', D1_NAME, flag, '--yes', '--file', sqlFile]);
  console.log('  ✓ 資料表寫入完成');

  console.log(`\n→ 核對筆數（Supabase 匯出 vs D1 ${target}）`);
  // 用 scalar subquery，避免 miniflare 的「too many terms in compound SELECT」
  const counts = 'SELECT ' + Object.keys(ALL_TABLES).map((t) => `(SELECT COUNT(*) FROM ${t}) AS ${t}`).join(', ');
  const out = wrangler(['d1', 'execute', D1_NAME, flag, '--yes', '--json', '--command', counts]);
  const actual = JSON.parse(out.slice(out.indexOf('[')))[0].results[0];
  let mismatch = 0;
  for (const [t, n] of Object.entries(actual)) {
    // D1 可能已有搬完後新增的資料（切換前再跑一次同步），只要不少於匯出筆數就算一致
    const ok = n >= manifest.tables[t];
    if (!ok) mismatch++;
    console.log(`  ${ok ? '✓' : '✗'} ${t}: Supabase ${manifest.tables[t]} / D1 ${n}`);
  }
  if (mismatch) throw new Error(`${mismatch} 張表筆數不符`);

  console.log(`\n→ R2 ${target}：上傳圖片到 ${R2_BUCKET}`);
  for (const img of manifest.images) {
    const file = path.join(OUT_ABS, 'images', img.file);
    wrangler(['r2', 'object', 'put', `${R2_BUCKET}/${img.key}`, '--file', file, '--content-type', img.contentType, ...(target === 'remote' ? ['--remote'] : ['--local'])]);
    console.log(`  ✓ ${img.key}`);
  }
  console.log(`\n→ 核對圖片張數（R2 ${target}）`);
  let okImgs = 0;
  for (const img of manifest.images) {
    try {
      wrangler(['r2', 'object', 'get', `${R2_BUCKET}/${img.key}`, '--file', '/dev/null', ...(target === 'remote' ? ['--remote'] : ['--local'])], { quiet: true });
      okImgs++;
    } catch { console.log(`  ✗ R2 讀不到 ${img.key}`); }
  }
  console.log(`  ${okImgs === manifest.images.length ? '✓' : '✗'} 圖片 ${okImgs}/${manifest.images.length}`);
  if (okImgs !== manifest.images.length) throw new Error('R2 圖片張數不符');
  console.log('  ✓ 全部一致');
}

if (!SKIP_EXPORT) {
  console.log(`匯出 Supabase → ${OUT_ABS}`);
  await exportAll();
}
if (APPLY) apply(APPLY);
console.log('\n✓ 完成');
