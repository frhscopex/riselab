const express = require("express");
const db = require("../db");
const { Prisma } = require("@prisma/client");
const { embedText, isValidEmbedding, toVectorLiteral } = require("../utils/embedding");

const router = express.Router();

router.get("/", async (req, res) => {
  const limitRaw = Number(req.query.limit || 5);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 5;

  try {
    const rows = await db.$queryRaw`
      SELECT id, agent_id, content, created_at
      FROM memory
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return res.status(200).json({ data: rows });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch memories.",
      details: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const { agentId, content, embedding } = req.body;

  if (!agentId || !content) {
    return res.status(400).json({
      error: "agentId and content are required.",
    });
  }

  const vector = Array.isArray(embedding) ? embedding : embedText(content);

  if (!isValidEmbedding(vector, 1536)) {
    return res.status(400).json({
      error: "Embedding must be a numeric array with exactly 1536 dimensions.",
    });
  }

  try {
    const rows = await db.$queryRaw(
      Prisma.sql`
        INSERT INTO memory (agent_id, content, embedding_vector)
        VALUES (${agentId}::uuid, ${content}, ${toVectorLiteral(vector)}::vector)
        RETURNING id, agent_id, content, created_at
      `
    );

    return res.status(201).json({ data: rows[0] });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to store memory.",
      details: error.message,
    });
  }
});

module.exports = router;
