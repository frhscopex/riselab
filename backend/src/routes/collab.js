const express = require("express");
const db = require("../db");

const router = express.Router();

// POST /api/collab/send - Send a message/knowledge to another agent
router.post("/send", async (req, res) => {
  const { fromId, toId, content, metadata } = req.body;

  if (!fromId || !toId || !content) {
    return res.status(400).json({
      error: "fromId, toId, and content are required."
    });
  }

  try {
    const message = await db.message.create({
      data: {
        fromId,
        toId,
        content,
        metadata: metadata || {}
      }
    });

    res.status(201).json({ data: message });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send message.",
      details: error.message
    });
  }
});

// GET /api/collab/inbox/:agentId - Get all messages received by an agent
router.get("/inbox/:agentId", async (req, res) => {
  const { agentId } = req.params;

  try {
    const messages = await db.message.findMany({
      where: { toId: agentId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ data: messages });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch inbox.",
      details: error.message
    });
  }
});

module.exports = router;
