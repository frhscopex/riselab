const jwt = require("jsonwebtoken");
const prisma = require("./prisma"); // Use the local prisma util

const JWT_SECRET = process.env.JWT_SECRET || "riselab-super-secret-key";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.header("x-api-key");

  // 1. Check for JWT (Bearer Token)
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // { userId: ... }
      return next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  }

  // 2. Check for API Key
  if (apiKey) {
    try {
      const keyEntry = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { agent: true },
      });

      if (keyEntry) {
        req.agent = keyEntry.agent;
        return next();
      }
    } catch (error) {
      console.error("Auth Error:", error);
    }
    return res.status(401).json({ error: "Invalid API key." });
  }

  return res.status(401).json({ error: "Authentication required (JWT or API Key)." });
}

module.exports = authMiddleware;
