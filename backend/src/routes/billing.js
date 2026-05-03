const express = require("express");
const db = require("../db");

const router = express.Router();

// POST /api/billing/subscribe - Update a user's subscription plan
router.post("/subscribe", async (req, res) => {
  const { plan } = req.body;
  const userId = req.user && req.user.userId;

  const validPlans = ["free", "pro", "enterprise"];

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized: user authentication required."
    });
  }

  if (!plan || !validPlans.includes(plan.toLowerCase())) {
    return res.status(400).json({
      error: "A valid plan (free, pro, enterprise) is required."
    });
  }

  try {
    // Update all agents owned by this user to the new plan
    await db.agent.updateMany({
      where: { userId },
      data: { plan: plan.toLowerCase() }
    });

    res.status(200).json({ 
      data: {
        userId,
        plan: plan.toLowerCase(),
        message: `Successfully subscribed to the ${plan} plan!`
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update subscription.",
      details: error.message
    });
  }
});

// GET /api/billing/status - Get current plan status for authenticated user
router.get("/status", async (req, res) => {
  const userId = req.user && req.user.userId;

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized: user authentication required."
    });
  }

  try {
    const agent = await db.agent.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ 
      data: {
        userId,
        plan: agent ? agent.plan : "free"
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch billing status.",
      details: error.message
    });
  }
});

module.exports = router;
