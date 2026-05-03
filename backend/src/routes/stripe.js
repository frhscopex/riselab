const express = require("express");
const Stripe = require("stripe");
const prisma = require("../utils/prisma");
const authMiddleware = require("../utils/authMiddleware");
const { getTrimmedString, sendError } = require("../utils/http");

const router = express.Router();

function getStripeClient() {
  const secret = getTrimmedString(process.env.STRIPE_SECRET_KEY);
  if (!secret) return null;
  return new Stripe(secret);
}

router.post("/create-checkout-session", authMiddleware, async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return sendError(res, {
      status: 500,
      error: "Stripe is not configured on the server.",
      code: "STRIPE_NOT_CONFIGURED",
      hint: "Set STRIPE_SECRET_KEY in backend environment variables.",
    });
  }

  const plan = getTrimmedString(req.body?.plan).toLowerCase();
  const userId = req.user?.userId;

  if (!userId) {
    return sendError(res, {
      status: 401,
      error: "Unauthorized: user authentication required.",
      code: "STRIPE_AUTH_REQUIRED",
    });
  }

  if (!["pro", "enterprise"].includes(plan)) {
    return sendError(res, {
      status: 400,
      error: "Invalid plan type.",
      code: "STRIPE_PLAN_INVALID",
      hint: "Allowed values: pro, enterprise.",
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return sendError(res, {
        status: 404,
        error: "User not found.",
        code: "STRIPE_USER_NOT_FOUND",
      });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId =
      plan === "pro"
        ? process.env.STRIPE_PRO_PRICE_ID
        : process.env.STRIPE_ENTERPRISE_PRICE_ID;

    if (!priceId) {
      return sendError(res, {
        status: 500,
        error: "Stripe price ID not configured.",
        code: "STRIPE_PRICE_NOT_CONFIGURED",
      });
    }

    const frontendUrl =
      getTrimmedString(process.env.FRONTEND_URL) || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${frontendUrl}/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard.html`,
      metadata: { userId, plan },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return sendError(res, {
      status: 500,
      error: "Failed to create checkout session.",
      code: "STRIPE_CHECKOUT_FAILED",
      details: error.message,
    });
  }
});

router.post("/webhook", async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return sendError(res, {
      status: 500,
      error: "Stripe is not configured on the server.",
      code: "STRIPE_NOT_CONFIGURED",
    });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return sendError(res, {
      status: 400,
      error: "Stripe signature header is missing.",
      code: "STRIPE_SIGNATURE_MISSING",
    });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return sendError(res, {
      status: 400,
      error: "Invalid Stripe webhook payload.",
      code: "STRIPE_WEBHOOK_INVALID",
      details: err.message,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session?.metadata?.userId;
    const plan = session?.metadata?.plan;
    const subscriptionId = session.subscription;

    if (userId && plan) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subscriptionId,
          },
        });
      } catch (dbError) {
        console.error("Database Update Error (Webhook):", dbError);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    try {
      await prisma.user.updateMany({
        where: { subscriptionId: subscription.id },
        data: {
          plan: "free",
          subscriptionId: null,
        },
      });
    } catch (dbError) {
      console.error("Database Update Error (Subscription Deleted):", dbError);
    }
  }

  return res.status(200).json({ received: true });
});

module.exports = router;
