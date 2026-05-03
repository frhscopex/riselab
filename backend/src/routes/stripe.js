const express = require("express");
const Stripe = require("stripe");
const prisma = require("../utils/prisma");
const authMiddleware = require("../utils/authMiddleware");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// 1. Create Checkout Session
router.post("/create-checkout-session", authMiddleware, async (req, res) => {
  const { plan } = req.body; // 'pro' or 'enterprise'
  const userId = req.user.userId;

  if (!['pro', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan type." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Find or create Stripe Customer
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

    // Map plan to Price ID (User should set these in .env)
    const priceId = plan === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_ENTERPRISE_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: "Stripe Price ID not configured." });
    }

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
      success_url: `${process.env.FRONTEND_URL}/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard.html`,
      metadata: { userId, plan },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Webhook Handler
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;
    const subscriptionId = session.subscription;

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: plan,
          subscriptionId: subscriptionId,
        },
      });
      console.log(`User ${userId} successfully upgraded to ${plan}`);
    } catch (dbError) {
      console.error("Database Update Error (Webhook):", dbError);
    }
  }

  // Handle subscription cancellation
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

  res.json({ received: true });
});

module.exports = router;
