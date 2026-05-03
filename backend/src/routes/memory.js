const express = require("express");
const db = require("../db");
const { Prisma } = require("@prisma/client");
const { embedText, isValidEmbedding, toVectorLiteral } = require("../utils/embedding");
const {
  getTrimmedString,
  isUuid,
  parseBoundedInt,
  sendError,
  sendSuccess,
} = require("../utils/http");

const router = express.Router();

router.get("/", async (req, res) => {
  const limit = parseBoundedInt(req.query.limit, {
    defaultValue: 5,
    min: 1,
    max: 50,
  });

  try {
    const rows = await db.$queryRaw`
      SELECT id, agent_id, content, created_at
      FROM memory
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return sendSuccess(res, rows);
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Failed to fetch memories.",
      code: "MEMORY_FETCH_FAILED",
      details: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  const agentId = getTrimmedString(req.body?.agentId || req.body?.agent_id);
  const content = getTrimmedString(req.body?.content);
  const embedding = req.body?.embedding;

  if (!agentId || !content) {
    return sendError(res, {
      status: 400,
      error: "agentId and content are required.",
      code: "MEMORY_REQUIRED_FIELDS",
      hint: "Send { agentId, content } JSON in the request body.",
    });
  }

  if (!isUuid(agentId)) {
    return sendError(res, {
      status: 400,
      error: "agentId must be a valid UUID.",
      code: "MEMORY_AGENT_ID_INVALID",
    });
  }

  const vector = Array.isArray(embedding) ? embedding : embedText(content);

  if (!isValidEmbedding(vector, 1536)) {
    return sendError(res, {
      status: 400,
      error: "Embedding must be a numeric array with exactly 1536 dimensions.",
      code: "MEMORY_EMBEDDING_INVALID",
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

    return sendSuccess(res, rows[0], 201);
  } catch (error) {
    const fallbackErrorHints = ["vector", "operator does not exist", "cannot cast", "uuid"];
    const shouldFallback = fallbackErrorHints.some((hint) =>
      String(error?.message || "").toLowerCase().includes(hint)
    );

    if (shouldFallback) {
      try {
        const created = await db.memory.create({
          data: {
            agentId,
            content,
            embeddingVector: JSON.stringify(vector),
          },
          select: {
            id: true,
            agentId: true,
            content: true,
            createdAt: true,
          },
        });

        return sendSuccess(
          res,
          {
            id: created.id,
            agent_id: created.agentId,
            content: created.content,
            created_at: created.createdAt,
          },
          201,
          { storageMode: "prisma-fallback" }
        );
      } catch (fallbackError) {
        return sendError(res, {
          status: 500,
          error: "Failed to store memory.",
          code: "MEMORY_STORE_FAILED",
          details: fallbackError.message,
        });
      }
    }

    return sendError(res, {
      status: 500,
      error: "Failed to store memory.",
      code: "MEMORY_STORE_FAILED",
      details: error.message,
    });
  }
});

module.exports = router;
