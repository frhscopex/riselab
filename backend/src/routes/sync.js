const express = require("express");

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    syncedAt: new Date().toISOString(),
    fleet: [
      {
        id: "athena",
        name: "Athena",
        status: "online",
        health: "good",
        lastHeartbeat: new Date().toISOString(),
      },
      {
        id: "orion",
        name: "Orion",
        status: "online",
        health: "good",
        lastHeartbeat: new Date().toISOString(),
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
  });
});

module.exports = router;
