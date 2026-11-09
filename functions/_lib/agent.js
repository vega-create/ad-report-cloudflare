// agent_* 四張表（智慧媽咪 LINE bot 的員工／任務／客戶訊息）
// 主要寫入者是 LINE bot（mommy-wisdom-worker）。若之後 bot 搬到自己的 D1，
// 在 Pages 綁一個 AGENT_DB 指到那顆庫即可，網頁的 Agent 頁面會改讀那邊，不用再同步兩份。
export function agentDb(env) {
  return env.AGENT_DB || env.DB;
}
