const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Dashboard password lives in the ADMIN_PASSWORD env var, never in the page code
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(503).json({ error: "ADMIN_PASSWORD not set" });

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

  // Compare hashes so the check takes the same time whether the guess is close or not
  const hash = s => crypto.createHash("sha256").update(String(s || "")).digest();
  if (crypto.timingSafeEqual(hash(body.password), hash(expected))) {
    return res.status(200).json({ ok: true });
  }
  return res.status(401).json({ error: "Incorrect password" });
};
