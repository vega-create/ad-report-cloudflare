// 帶客戶資料的查詢（取代 supabase 的 select('*, clients(name)')）
import { buildWhere, buildOrder, rowOut } from './db.js';

const CLIENT_COLS = ['id', 'name', 'industry', 'line_group_id', 'notes', 'created_at', 'updated_at'];

function nestClient(row) {
  const out = { ...row };
  const c = {};
  let has = false;
  for (const col of CLIENT_COLS) {
    const k = `__c_${col}`;
    if (k in out) {
      if (out[k] !== null) has = true;
      c[col] = out[k];
      delete out[k];
    }
  }
  out.clients = has ? c : null;
  return out;
}

// table 需有 client_id 欄位（reports / proposals / ad_quick_logs）
export async function selectWithClient(db, table, conds, { order, fallbackOrder, limit } = {}) {
  // 條件與排序欄位都屬於主表，加 t. 前綴避免與 clients 欄位撞名
  const w = buildWhere(table, conds, 't.');
  const where = w.sql;
  const orderSql = buildOrder(table, order, fallbackOrder, 't.');
  const cSel = CLIENT_COLS.map((c) => `c.${c} AS __c_${c}`).join(', ');
  let sql = `SELECT t.*, ${cSel} FROM ${table} t LEFT JOIN clients c ON c.id = t.client_id${where}${orderSql}`;
  if (limit) sql += ` LIMIT ${Math.max(1, Math.min(5000, Number(limit) || 0))}`;
  const { results } = await db.prepare(sql).bind(...w.binds).all();
  return results.map((r) => rowOut(table, nestClient(r)));
}

export async function getWithClient(db, table, id) {
  const rows = await selectWithClient(db, table, [['id', '=', id]], { limit: 1 });
  return rows[0] || null;
}
