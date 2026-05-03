const express = require("express");
const db = require("../db");
const {
  getTrimmedString,
  parseBoundedInt,
  sendError,
  sendSuccess,
} = require("../utils/http");

const router = express.Router();

router.get("/trends", async (req, res) => {
  const limit = parseBoundedInt(req.query.limit, {
    defaultValue: 10,
    min: 1,
    max: 50,
  });

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

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Failed to fetch trends.",
      code: "INTEGRATIONS_TRENDS_FAILED",
      details: error.message,
    });
  }
});

router.get("/contradictions", async (req, res) => {
  const agentId = getTrimmedString(req.query.agentId);

  if (!agentId) {
    return sendError(res, {
      status: 400,
      error: "agentId query parameter is required.",
      code: "INTEGRATIONS_AGENT_REQUIRED",
    });
  }

  const payload = {
    agentId,
    conflicts: [],
  };

  return res.status(200).json({ ...payload, data: payload });
});

module.exports = router;
