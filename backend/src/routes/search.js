const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../utils/prisma");
const { embedText, toVectorLiteral } = require("../utils/embedding");

const router = express.Router();

router.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const topKRaw = Number(req.query.limit || 5);
  const topK = Number.isFinite(topKRaw) ? Math.min(Math.max(topKRaw, 1), 20) : 5;

  if (!q) {
    return res.status(400).json({
      error: "q query parameter is required.",
    });
  }

  const vectorLiteral = toVectorLiteral(embedText(q));

  try {
    const rows = await prisma.$queryRaw`
      SELECT
        id,
        title,
        summary,
        source,
        date,
        1 - (embedding_vector <=> ${vectorLiteral}::vector) AS similarity
      FROM knowledge
      ORDER BY embedding_vector <=> ${vectorLiteral}::vector ASC
      LIMIT ${topK}
    `;

    return res.status(200).json({
      query: q,
      limit: topK,
      mode: "vector",
      results: rows
    });
  } catch (error) {
    const keywordPattern = `%${q}%`;

    try {
      const fallbackRows = await prisma.$queryRaw`
        SELECT
          id,
          title,
          summary,
          source,
          date,
          0::float AS similarity
        FROM knowledge
        WHERE title ILIKE ${keywordPattern} OR summary ILIKE ${keywordPattern}
        ORDER BY date DESC
        LIMIT ${topK}
      `;

      return res.status(200).json({
        query: q,
        limit: topK,
        mode: "keyword-fallback",
        results: fallbackRows
      });
    } catch (fallbackError) {
      return res.status(500).json({
        error: "Semantic search failed.",
        details: fallbackError.message
      });
    }
  }
});

router.use((err, _req, res, _next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(500).json({
      error: "Semantic search failed.",
      details: err.message
    });
  }

  return res.status(500).json({
    error: "Unexpected search error.",
    details: err.message
  });
});

module.exports = router;
