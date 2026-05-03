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

const authMiddleware = require("./utils/authMiddleware");
const integrationsRouter = require("./routes/integrations");
const { sendError } = require("./utils/http");

const app = express();

app.use(cors());



app.use(
  express.json({
    limit: "1mb",
  })
);

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

app.use("/api/integrations", integrationsRouter);

app.use("/api", (_req, res) =>
  sendError(res, {
    status: 404,
    error: "API route not found.",
    code: "ROUTE_NOT_FOUND",
    hint: "Check the endpoint path and HTTP method.",
  })
);

app.use((err, _req, res, _next) => {
  const isJsonSyntaxError =
    err instanceof SyntaxError &&
    err.status === 400 &&
    Object.prototype.hasOwnProperty.call(err, "body");

  if (isJsonSyntaxError) {
    return sendError(res, {
      status: 400,
      error: "Invalid JSON payload.",
      code: "INVALID_JSON",
      hint: "Ensure request body is valid JSON and Content-Type is application/json.",
    });
  }

  console.error("Unhandled API error:", err);
  return sendError(res, {
    status: err?.status || 500,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    details: err?.message || "Unexpected failure",
  });
});

module.exports = app;
