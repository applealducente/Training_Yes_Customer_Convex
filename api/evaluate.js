module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY not set" });

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  let body;
  try { body = JSON.parse(raw); } catch(e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: body.messages
      }),
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: "No content" });

    try {
      return res.status(200).json(JSON.parse(content));
    } catch(e) {
      return res.status(500).json({ error: "Parse failed", raw: content.slice(0, 200) });
    }
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};