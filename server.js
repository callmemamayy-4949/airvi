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

app.post("/api/reports", (_req, res) => {
  res.json({
    success: true,
    skipped: true,
    message: "PDF download only. Google Sheet saving is disabled for now."
  });
});

app.use((_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AirVision listening on 0.0.0.0:${port}`);
});
