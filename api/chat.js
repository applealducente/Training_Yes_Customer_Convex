module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  let body;
  try { body = JSON.parse(raw); } catch(e) { return res.status(400).json({ error: "Invalid JSON" }); }

  const model = body.model || "";

  // Route: claude models → Anthropic, everything else → OpenAI
  if (model.startsWith("claude")) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set." });
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      return res.status(r.ok ? 200 : r.status).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // OpenAI route (gpt-4o-mini for customer, gpt-4o for eval)
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "OPENAI_API_KEY not set." });
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};