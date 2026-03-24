export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const { markdown, client_name, report_date } = await context.request.json();

    if (!markdown) {
      return new Response(JSON.stringify({ error: "缺少 markdown 內容" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = context.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const today = new Date().toISOString().split('T')[0];
    const dayOfWeek = ['日','一','二','三','四','五','六'][new Date().getDay()];

    const prompt = `你是廣告投手 Vega 的任務助理。請分析以下「快速記錄」Markdown，提取結構化資料。

今天：${today}（週${dayOfWeek}）
工作時段：週一到週五 09:00-12:00，每天最多 120 分鐘廣告工作

Markdown 內容：
${markdown}

請回傳 JSON 物件，格式如下：
{
  "client_name": "客戶名稱",
  "period_start": "YYYY-MM-DD",
  "period_end": "YYYY-MM-DD",
  "spend_summary": [
    {
      "platform": "Facebook 或 Google",
      "amount": 8000,
      "metrics": "ROAS 2.3, CPA $120"
    }
  ],
  "next_actions": "下次調整的原始 markdown 文字",
  "notes": "備註內容（沒有則為空字串）",
  "tasks": [
    {
      "task": "任務描述",
      "category": "facebook | google | client | keyword",
      "priority": "red | yellow | green",
      "estimated_minutes": 30,
      "scheduled_date": "YYYY-MM-DD",
      "scheduled_time": "HH:MM",
      "reasoning": "為什麼排在這個時間"
    }
  ]
}

重要規則：
1. client_name：從標題 "# 快速記錄：XXX | ..." 提取，如果找不到就用 "${client_name || '未知客戶'}"
2. period_start/period_end：從標題日期提取
3. spend_summary：從花費摘要表格提取，amount 為純數字（去掉 NT$ 和逗號）
4. next_actions：保留「下次調整」區塊的原始 markdown
5. notes：保留「備註」區塊的原始文字
6. tasks：從「下次調整」的每一項提取任務，排程規則：
   - 🔴 red（緊急）→ 今天或明天，09:00-10:00
   - 🟡 yellow（重要）→ 本週內，10:00-11:30，同客戶排同天
   - 🟢 green（優化）→ 下週，填補空檔
   - 每天總工時不超過 120 分鐘
   - 週六日不排任務
   - 同一客戶的任務盡量排同一天

只回傳 JSON 物件，不要其他文字。`;

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
    const content = data.choices[0]?.message?.content || '{}';
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();

    const result = JSON.parse(cleaned);
    return new Response(JSON.stringify(result), {
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
