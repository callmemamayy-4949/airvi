import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public", {
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "airvision" });
});

app.post("/api/reports", (_req, res) => {
  res.status(501).json({
    success: false,
    error: "Google Sheet saving is not enabled yet. PDF download runs in the browser."
  });
});

app.use((_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AirVision listening on 0.0.0.0:${port}`);
});
