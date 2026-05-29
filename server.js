import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public", {
  etag: true,
  maxAge: 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-store");
    }
  }
}));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "airvision" });
});

app.use(express.json({ limit: process.env.MAX_JSON_SIZE || "35mb" }));

app.post("/api/reports", async (req, res) => {
  const appsScriptUrl = process.env.APPS_SCRIPT_WEB_APP_URL;
  if (!appsScriptUrl) {
    res.status(501).json({
      success: false,
      error: "Missing APPS_SCRIPT_WEB_APP_URL"
    });
    return;
  }

  try {
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok || !body || !body.success) {
      res.status(500).json({
        success: false,
        error: body && body.error ? body.error : "Apps Script save failed"
      });
      return;
    }
    res.json(body);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.use((_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AirVision listening on 0.0.0.0:${port}`);
});
