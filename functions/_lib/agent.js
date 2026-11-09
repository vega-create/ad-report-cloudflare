// agent_* 四張表（智慧媽咪 LINE bot 的員工／任務／客戶訊息）
// 唯一真身是 LINE bot 的 D1 `mommy-wisdom-bot`（wrangler.toml 綁成 AGENT_DB）；
// 沒綁 AGENT_DB 時退回同一顆 adreport（schema 仍保留這四張表，方便本機或過渡期）。
export function agentDb(env) {
  return env.AGENT_DB || env.DB;
}
