const express = require("express");
const db = require("../db");
const { parseBoundedInt, sendError, sendSuccess } = require("../utils/http");

const router = express.Router();

router.get("/", async (req, res) => {
  const limit = parseBoundedInt(req.query.limit, {
    defaultValue: 5,
    min: 1,
    max: 50,
  });

  try {
    const knowledge = await db.knowledge.findMany({
      orderBy: {
        date: "desc",
      },
      take: limit,
      select: {
        id: true,
        title: true,
        summary: true,
        source: true,
        date: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, knowledge);
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Failed to fetch feed.",
      code: "FEED_FETCH_FAILED",
      details: error.message,
    });
  }
});

module.exports = router;
