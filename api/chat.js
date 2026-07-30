module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  let body;
  try { body = JSON.parse(raw); } catch(e) {
    return res.status(400).json({ error: "Invalid JSON: " + e.message });
  }

  const model = body.model || "";
  console.log("[chat] model:", model, "messages:", body.messages?.length);

  // Claude models → Anthropic
  if (model.startsWith("claude")) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel env vars" });
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      console.log("[chat] Anthropic status:", r.status, data.error?.message || "ok");
      return res.status(r.ok ? 200 : r.status).json(data);
    } catch(e) {
      console.error("[chat] Anthropic fetch error:", e.message);
      return res.status(500).json({ error: e.message });
    }
  }

  // OpenAI models (gpt-4o-mini, gpt-4o)
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY not set in Vercel env vars" });
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    console.log("[chat] OpenAI status:", r.status, data.error?.message || "ok");
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch(e) {
    console.error("[chat] OpenAI fetch error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
