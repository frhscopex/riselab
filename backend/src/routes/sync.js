const express = require("express");
const router = express.Router();

router.get("/", (_req, res) => {
  const timestamp = new Date().toISOString();

  const payload = {
    syncedAt: timestamp,
    fleet: [
      {
        id: "athena",
        name: "Athena",
        status: "online",
        health: "good",
        lastHeartbeat: timestamp,
      },
      {
        id: "orion",
        name: "Orion",
        status: "online",
        health: "good",
        lastHeartbeat: timestamp,
      },
    ],
    memoryStats: {
      totalAgents: 2,
      totalMemories: 5,
      totalKnowledgeNodes: 10,
    },
    queue: {
      pendingResearchTasks: 2,
      pendingMemoryWrites: 1,
    },
  };

  return res.status(200).json({ ...payload, data: payload });
});

module.exports = router;
