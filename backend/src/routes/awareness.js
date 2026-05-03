const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/trends", async (req, res) => {
  const limitRaw = Number(req.query.limit || 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

  try {
    const papers = await db.knowledge.findMany({
      orderBy: { date: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        source: true,
        date: true,
      },
    });

    const nowMs = Date.now();
    const data = papers.map((paper) => {
      const ageMs = nowMs - new Date(paper.date).getTime();
      const ageDays = Math.max(ageMs / (1000 * 60 * 60 * 24), 0);
      const velocityScore = Number((1 / (1 + ageDays)).toFixed(4));

      return {
        ...paper,
        velocityScore,
      };
    });

    return res.status(200).json({ data });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch trends.",
      details: error.message,
    });
  }
});

router.get("/contradictions", async (req, res) => {
  const { agentId } = req.query;

  if (!agentId || typeof agentId !== "string") {
    return res.status(400).json({
      error: "agentId query parameter is required.",
    });
  }

  // TODO: contradiction detection logic will be finalized in the next phase.
  return res.status(200).json({
    agentId,
    conflicts: [],
  });
});

module.exports = router;
