const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const knowledge = await db.knowledge.findMany({
      orderBy: {
        date: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        summary: true,
        source: true,
        date: true,
        createdAt: true
      }
    });
    
    res.status(200).json({ data: knowledge });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch feed.",
      details: error.message,
    });
  }
});

module.exports = router;
