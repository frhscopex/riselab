const express = require("express");
const prisma = require("../utils/prisma");

const router = express.Router();

// GET /api/billing/status - Get current plan status for authenticated user
router.get("/status", async (req, res) => {
  const userId = req.user && req.user.userId;

  if (!userId) {
    return res.status(401).json({
      error: "Unauthorized: user authentication required."
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    res.status(200).json({ 
      data: {
        userId,
        plan: user ? user.plan : "free"
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch billing status.",
      details: error.message
    });
  }
});

// POST /api/billing/subscribe - Update a user's subscription plan (Manual/Internal use)
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { plan: plan.toLowerCase() }
    });

    res.status(200).json({ 
      data: {
        userId,
        plan: updatedUser.plan,
        message: `Successfully updated to the ${plan} plan!`
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update subscription.",
      details: error.message
    });
  }
});

module.exports = router;
