const express = require("express");
const db = require("../db");
const { generateCitation } = require("../services/utilityService");

const router = express.Router();

// GET /api/utils/cite/:id - Get a citation for a paper
router.get("/cite/:id", async (req, res) => {
  const { id } = req.params;
  const { format } = req.query;

  try {
    const paper = await db.knowledge.findUnique({
      where: { id }
    });

    if (!paper) {
      return res.status(404).json({ error: "Paper not found." });
    }

    const citation = generateCitation(paper, format);
    res.status(200).json({ data: citation });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate citation.",
      details: error.message
    });
  }
});

module.exports = router;
