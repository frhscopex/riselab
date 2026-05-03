const express = require("express");
const prisma = require("../utils/prisma");
const { getTrimmedString, sendError, sendSuccess } = require("../utils/http");

const router = express.Router();
const VALID_PLANS = new Set(["free", "pro", "enterprise"]);

router.get("/status", async (req, res) => {
  const userId = req.user && req.user.userId;

  if (!userId) {
    return sendError(res, {
      status: 401,
      error: "Unauthorized: user authentication required.",
      code: "BILLING_AUTH_REQUIRED",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    return sendSuccess(res, {
      userId,
      plan: user ? user.plan : "free",
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Failed to fetch billing status.",
      code: "BILLING_STATUS_FAILED",
      details: error.message,
    });
  }
});

router.post("/subscribe", async (req, res) => {
  const plan = getTrimmedString(req.body?.plan).toLowerCase();
  const userId = req.user && req.user.userId;

  if (!userId) {
    return sendError(res, {
      status: 401,
      error: "Unauthorized: user authentication required.",
      code: "BILLING_AUTH_REQUIRED",
    });
  }

  if (!VALID_PLANS.has(plan)) {
    return sendError(res, {
      status: 400,
      error: "A valid plan (free, pro, enterprise) is required.",
      code: "BILLING_PLAN_INVALID",
    });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    return sendSuccess(res, {
      userId,
      plan: updatedUser.plan,
      message: `Successfully updated to the ${updatedUser.plan} plan!`,
    });
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Failed to update subscription.",
      code: "BILLING_SUBSCRIBE_FAILED",
      details: error.message,
    });
  }
});

module.exports = router;
