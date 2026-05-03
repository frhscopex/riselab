const express = require("express");
const cors = require("cors");
const feedRouter = require("./routes/feed");
const memoryRouter = require("./routes/memory");
const searchRouter = require("./routes/search");
const syncRouter = require("./routes/sync");
const collabRouter = require("./routes/collab");
const awarenessRouter = require("./routes/awareness");
const utilsRouter = require("./routes/utils");
const keysRouter = require("./routes/keys");
const billingRouter = require("./routes/billing");
const authRouter = require("./routes/auth");
const stripeRouter = require("./routes/stripe");
const authMiddleware = require("./utils/authMiddleware");
const integrationsRouter = require("./routes/integrations");

const app = express();

app.use(cors());

// Webhook route must come BEFORE express.json()
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/feed", feedRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/search", authMiddleware, searchRouter);
app.use("/api/sync", syncRouter);
app.use("/api/collab", authMiddleware, collabRouter);
app.use("/api/awareness", authMiddleware, awarenessRouter);
app.use("/api/utils", utilsRouter);
app.use("/api/keys", authMiddleware, keysRouter);
app.use("/api/billing", authMiddleware, billingRouter);
app.use("/api/auth", authRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/integrations", integrationsRouter);

app.use((err, _req, res, _next) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: err?.message || "Unexpected failure",
  });
});

module.exports = app;
