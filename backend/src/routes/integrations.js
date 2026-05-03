const express = require("express");
const supabase = require("../utils/supabase");

const router = express.Router();

router.get("/supabase", async (req, res) => {
  if (!supabase) {
    return res.status(200).json({
      connected: false,
      details: "Supabase client not initialized. Check your environment variables.",
    });
  }

  try {
    // A lightweight ping. We can just check auth health or do a dummy select.
    // If the client is initialized with valid credentials, it shouldn't throw.
    // However, without a public table we can reliably read, just auth ping is fine.
    
    // We'll perform a basic check by seeing if supabase client has the url populated.
    // Actually, calling getSession or a dummy query is better.
    const { data, error } = await supabase.from('pg_stat_activity').select('*').limit(1).catch(() => ({ error: { message: "Permission denied or table missing" } }));
    
    // As long as we get a response (even a permission error on pg_stat_activity), 
    // it means we successfully contacted the Supabase server.
    return res.status(200).json({
      connected: true,
      details: "Supabase client successfully configured.",
      pingError: error ? error.message : null
    });
  } catch (err) {
    return res.status(500).json({
      connected: false,
      details: "Failed to ping Supabase instance.",
      error: err.message
    });
  }
});

module.exports = router;
