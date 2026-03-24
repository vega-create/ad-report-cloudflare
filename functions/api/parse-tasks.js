export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { markdown, client_name, report_date } = await context.request.json();

    if (!markdown || !client_name) {
      return new Response(JSON.stringify({ error: "缺少 markdown 或 client_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = context.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // 使用台灣時間（UTC+8）
    const nowTW = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const today = `${nowTW.getFullYear()}-${String(nowTW.getMonth() + 1).padStart(2, '0')}-${String(nowTW.getDate()).padStart(2, '0')}`;
    const dayOfWeek = ['日','一','二','三','四','五','六'][nowTW.getDay()];

    const prompt = `你是廣告投手 Vega 的任務助理。請分析以下廣告操作規劃 Markdown，提取所有待辦任務。

客戶：${client_name}
報告日期：${report_date || today}
今天：${today}（週${dayOfWeek}）
工作時段：週一到週五 09:00-12:00，每天最多 120 分鐘廣告工作

Markdown 內容：
${markdown}

請回傳 JSON 陣列，每個任務包含：
{
  "task": "任務描述",
  "category": "facebook | google | client | keyword",
  "priority": "red | yellow | green",
  "estimated_minutes": 30,
  "scheduled_date": "YYYY-MM-DD",
  "scheduled_time": "HH:MM",
  "reasoning": "為什麼排在這個時間"
}

排程規則：
- 🔴 red（緊急）→ 今天或明天，09:00-10:00
- 🟡 yellow（重要）→ 本週內，10:00-11:30，同客戶排同天
- 🟢 green（優化）→ 下週，填補空檔
- 每天總工時不超過 120 分鐘
- 週六日不排任務
- 同一客戶的任務盡量排同一天

只回傳 JSON 陣列，不要其他文字。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();

    const tasks = JSON.parse(cleaned);
    return new Response(JSON.stringify({ tasks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
