const jwt = require("jsonwebtoken");
const prisma = require("./prisma");
const { sendError } = require("./http");

const JWT_SECRET = process.env.JWT_SECRET || "riselab-super-secret-key";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.header("x-api-key");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();

    if (!token) {
      return sendError(res, {
        status: 401,
        error: "Bearer token is missing.",
        code: "TOKEN_MISSING",
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded?.userId) {
        return sendError(res, {
          status: 401,
          error: "Invalid token payload.",
          code: "TOKEN_INVALID",
        });
      }

      req.user = decoded;
      req.auth = { type: "jwt" };
      return next();
    } catch (_error) {
      return sendError(res, {
        status: 401,
        error: "Invalid or expired token.",
        code: "TOKEN_INVALID",
      });
    }
  }

  if (apiKey) {
    try {
      const keyEntry = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { agent: true },
      });

      if (!keyEntry) {
        return sendError(res, {
          status: 401,
          error: "Invalid API key.",
          code: "API_KEY_INVALID",
        });
      }

      req.agent = keyEntry.agent;
      req.auth = { type: "api-key" };
      return next();
    } catch (error) {
      console.error("Auth Error:", error);
      return sendError(res, {
        status: 500,
        error: "Failed to validate API key.",
        code: "AUTH_VALIDATION_FAILED",
      });
    }
  }

  return sendError(res, {
    status: 401,
    error: "Authentication required (JWT or API key).",
    code: "AUTH_REQUIRED",
  });
}

module.exports = authMiddleware;
