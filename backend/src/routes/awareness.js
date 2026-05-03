const express = require("express");
const supabase = require("../utils/supabase");
const { sendError } = require("../utils/http");

const router = express.Router();

router.get("/supabase", async (_req, res) => {
  if (!supabase) {
    const payload = {
      connected: false,
      details: "Supabase client not initialized. Check your environment variables.",
      error: null,
    };

    return res.status(200).json({ ...payload, data: payload });
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .select("count", { count: "exact", head: true });

    const payload = {
      connected: true,
      details: "Supabase client successfully configured and pinged.",
      error: error ? error.message : null,
    };

    return res.status(200).json({ ...payload, data: payload });
  } catch (err) {
    return sendError(res, {
      status: 500,
      error: "Failed to communicate with Supabase.",
      code: "AWARENESS_SUPABASE_FAILED",
      details: err.message,
    });
  }
});

module.exports = router;
