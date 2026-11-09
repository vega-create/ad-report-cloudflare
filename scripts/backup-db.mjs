// 備份 Cloudflare D1（adreport）：完整 SQL dump + 每張表的 JSON。
// 本機：npm run backup                 → ~/adreport-backups/<時間戳>/（專案外）
// GitHub Actions（.github/workflows/backup.yml）：BACKUP_ROOT=./backup-out，上傳成 Artifact。
// 認證：本機用 wrangler 登入；Actions 用 CLOUDFLARE_API_TOKEN（Account → D1:Edit）。
// ⚠️ 備份含客戶報告全文與 LINE 群組 ID，請勿外傳。（R2 圖片另有 17 張，不在此備份內；R2 不會自己消失）
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';

const D1_NAME = 'adreport';
const TABLES = [
  'clients', 'reports', 'proposals', 'report_feedback',
  'ad_tasks', 'ad_operation_logs', 'ad_quick_logs', 'daily_plans',
  'agent_employees', 'agent_tasks', 'agent_task_records', 'agent_customer_messages',
];

function wrangler(args) {
  const r = spawnSync('npx', ['wrangler', ...args], { encoding: 'utf8', stdio: 'pipe', maxBuffer: 512 * 1024 * 1024 });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || r.stdout || '');
    throw new Error(`wrangler ${args.slice(0, 3).join(' ')} 失敗`);
  }
  return r.stdout;
}
function d1Json(sql) {
  const out = wrangler(['d1', 'execute', D1_NAME, '--remote', '--yes', '--json', '--command', sql]);
  return JSON.parse(out.slice(out.indexOf('[')))[0].results;
}

const d = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const stamp = `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}-${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}`;
const ROOT = process.env.BACKUP_ROOT || path.join(homedir(), 'adreport-backups');
const OUT = path.join(ROOT, stamp);
mkdirSync(path.join(OUT, 'tables'), { recursive: true });
console.log(`備份中 → ${OUT}\n`);

const manifest = { backed_up_at: d.toISOString(), source: { d1: D1_NAME }, tables: {} };
for (const t of TABLES) {
  const rows = d1Json(`SELECT * FROM ${t}`);
  writeFileSync(path.join(OUT, 'tables', `${t}.json`), JSON.stringify(rows, null, 2) + '\n');
  manifest.tables[t] = rows.length;
  console.log(`  ✓ ${t}: ${rows.length} 筆`);
}

wrangler(['d1', 'export', D1_NAME, '--remote', '--output', path.join(OUT, 'd1.sql')]);
console.log('  ✓ d1.sql（完整 dump，含 schema）');

writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(path.join(OUT, 'README.md'), `# 廣告報告系統備份 ${stamp}

來源：Cloudflare D1 \`${D1_NAME}\`，報告 ${manifest.tables.reports} 份、任務 ${manifest.tables.ad_tasks} 筆。

- \`tables/*.json\`：每張表的完整資料
- \`d1.sql\`：\`wrangler d1 export\` 的完整 SQL dump（含 schema）

## 還原
\`\`\`bash
cd ~/ad-report-cloudflare
npx wrangler d1 execute adreport --remote --yes --file <這個資料夾>/d1.sql
\`\`\`
（還原到空庫；若庫已有資料請先清空或改用 \`wrangler d1 time-travel\` 的 30 天時間點還原。）
`);
console.log(`\n✓ 備份完成：${OUT}`);
