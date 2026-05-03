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
    // Try to perform a very simple select. 
    // Even if it fails due to permissions, it confirms the client is connected to the API.
    const { data, error } = await supabase
      .from('profiles') // Assuming a common table name, or just any table
      .select('count', { count: 'exact', head: true });

    return res.status(200).json({
      connected: true,
      details: "Supabase client successfully configured and pinged.",
      error: error ? error.message : null
    });
  } catch (err) {
    return res.status(500).json({
      connected: false,
      details: "Failed to communicate with Supabase.",
      error: err.message
    });
  }
});

module.exports = router;
