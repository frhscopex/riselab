const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../utils/prisma");
const { embedText, toVectorLiteral } = require("../utils/embedding");
const {
  getTrimmedString,
  parseBoundedInt,
  sendError,
} = require("../utils/http");

const router = express.Router();

router.get("/", async (req, res) => {
  const q = getTrimmedString(req.query.q);
  const topK = parseBoundedInt(req.query.limit, {
    defaultValue: 5,
    min: 1,
    max: 20,
  });

  if (!q) {
    return sendError(res, {
      status: 400,
      error: "q query parameter is required.",
      code: "SEARCH_QUERY_REQUIRED",
      hint: "Use /api/search?q=your+query&limit=5",
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
      results: rows,
    });
  } catch (_error) {
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
        results: fallbackRows,
      });
    } catch (fallbackError) {
      return sendError(res, {
        status: 500,
        error: "Semantic search failed.",
        code: "SEARCH_FAILED",
        details: fallbackError.message,
      });
    }
  }
});

router.use((err, _req, res, _next) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return sendError(res, {
      status: 500,
      error: "Semantic search failed.",
      code: "SEARCH_PRISMA_ERROR",
      details: err.message,
    });
  }

  return sendError(res, {
    status: 500,
    error: "Unexpected search error.",
    code: "SEARCH_UNEXPECTED_ERROR",
    details: err.message,
  });
});

module.exports = router;
