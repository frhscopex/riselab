const express = require("express");
const db = require("../db");
const crypto = require("crypto");

const router = express.Router();

// POST /api/keys/generate - Generate a new API Key for the authenticated user
router.post("/generate", async (req, res) => {
  const { name } = req.body;
  const userId = req.user && req.user.userId;

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized: user authentication required."
    });
  }

  if (!name) {
    return res.status(400).json({
      error: "name (for the agent/key) is required."
    });
  }

  try {
    // 1. Create the Agent entry first
    const agent = await db.agent.create({
      data: {
        name: name,
        userId
      }
    });

    // 2. Generate a unique key
    const apiKeyStr = `rl_${crypto.randomBytes(16).toString("hex")}`;

    // 3. Save to database
    await db.apiKey.create({
      data: {
        key: apiKeyStr,
        agentId: agent.id
      }
    });
    
    res.status(201).json({ 
      data: {
        userId,
        agentId: agent.id,
        apiKey: apiKeyStr,
        message: "Key generated successfully. Store it safely!"
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to generate API Key.",
      details: error.message
    });
  }
});

module.exports = router;
