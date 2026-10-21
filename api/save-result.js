module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Google Apps Script web app URL — kept server-side so it isn't visible in the page
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) return res.status(500).json({ error: "SHEET_WEBHOOK_URL not set" });

  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => data += chunk);
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  try { JSON.parse(raw); } catch(e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch(e) {
      console.error("[save-result] Non-JSON reply:", r.status, text.slice(0, 200));
      return res.status(502).json({ error: "Sheet did not reply with JSON" });
    }
    if (!data.ok) {
      console.error("[save-result] Sheet error:", data.error);
      return res.status(502).json({ error: data.error || "Sheet error" });
    }
    return res.status(200).json({ ok: true });
  } catch(e) {
    console.error("[save-result] error:", e.message);
    return res.status(500).json({ error: e.message });
  }
};
