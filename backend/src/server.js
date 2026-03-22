require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./config/db");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", routes);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// 404 handler
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);

// Global error handler
app.use((err, req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () =>
    console.log(`[server] API Explorer running on http://localhost:${PORT}`)
  );
}

if (process.env.NODE_ENV !== "test") {
  start();
}

module.exports = app; // export for tests
