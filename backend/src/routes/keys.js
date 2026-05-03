const express = require("express");
const db = require("../db");
const crypto = require("crypto");
const { getTrimmedString, sendError, sendSuccess } = require("../utils/http");

const router = express.Router();

router.post("/generate", async (req, res) => {
  const name = getTrimmedString(req.body?.name);
  const userId = req.user && req.user.userId;

  if (!userId) {
    return sendError(res, {
      status: 401,
      error: "Unauthorized: user authentication required.",
      code: "KEYS_AUTH_REQUIRED",
    });
  }

  if (!name) {
    return sendError(res, {
      status: 400,
      error: "name (for the agent/key) is required.",
      code: "KEYS_NAME_REQUIRED",
    });
  }

  if (name.length < 3 || name.length > 100) {
    return sendError(res, {
      status: 400,
      error: "name must be between 3 and 100 characters.",
      code: "KEYS_NAME_INVALID",
    });
  }

  try {
    const agent = await db.agent.create({
      data: {
        name,
        userId,
      },
    });

    const apiKeyStr = `rl_${crypto.randomBytes(16).toString("hex")}`;

    await db.apiKey.create({
      data: {
        key: apiKeyStr,
        agentId: agent.id,
      },
    });

    return sendSuccess(
      res,
      {
        userId,
        agentId: agent.id,
        apiKey: apiKeyStr,
        message: "Key generated successfully. Store it safely!",
      },
      201
    );
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Failed to generate API key.",
      code: "KEYS_GENERATE_FAILED",
      details: error.message,
    });
  }
});

module.exports = router;
