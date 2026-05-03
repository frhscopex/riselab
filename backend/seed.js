const db = require("./src/db");
const { embedText } = require("./src/utils/embedding");

async function ensureDemoUser() {
  return db.user.upsert({
    where: { email: "demo@riselab.local" },
    update: {},
    create: {
      email: "demo@riselab.local",
      name: "RiseLab Demo",
      passwordHash: "seeded-account",
    },
    select: { id: true },
  });
}

async function seedAgents(userId) {
  const agentRows = ["Athena", "Orion"];
  const inserted = [];

  for (const name of agentRows) {
    const agent = await db.agent.create({
      data: { name, userId },
      select: { id: true, name: true, userId: true, createdAt: true },
    });

    inserted.push(agent);
  }

  return inserted;
}

async function seedMemories(agentIds) {
  const notes = [
    "User prefers short answers.",
    "User is building a React app with TypeScript.",
    "Persist context between sessions for better continuity.",
    "Use semantic retrieval before generating final responses.",
    "Prioritize concise output unless detail is requested.",
  ];

  const inserted = [];
  for (let i = 0; i < notes.length; i += 1) {
    const note = notes[i];
    const agentId = agentIds[i % agentIds.length];

    const row = await db.memory.create({
      data: {
        agentId,
        content: note,
        embeddingVector: JSON.stringify(embedText(note)),
      },
      select: {
        id: true,
        agentId: true,
        content: true,
        createdAt: true,
      },
    });

    inserted.push(row);
  }

  return inserted;
}

async function seedKnowledge() {
  const papers = [
    {
      title: "New reasoning model released",
      summary: "A benchmark-tuned reasoning model improves chain reliability.",
      source: "AI Journal",
      date: "2026-04-09T10:00:00Z",
    },
    {
      title: "pgvector optimization techniques",
      summary: "Guidelines for ivfflat indexing, probes tuning, and recall tradeoffs.",
      source: "DB Weekly",
      date: "2026-03-18T09:00:00Z",
    },
    {
      title: "Agent memory compression strategies",
      summary: "Hierarchical summarization reduces token footprint by 40%.",
      source: "Systems Lab",
      date: "2026-02-22T11:30:00Z",
    },
    {
      title: "Realtime retrieval orchestration",
      summary: "Hybrid lexical + semantic routing speeds retrieval under load.",
      source: "Infra Review",
      date: "2026-04-28T08:15:00Z",
    },
    {
      title: "Context windows and failure modes",
      summary: "Long context can hurt precision without ranking safeguards.",
      source: "ML Notes",
      date: "2026-01-14T13:45:00Z",
    },
  ];

  const inserted = [];
  for (const item of papers) {
    const row = await db.knowledge.create({
      data: {
        title: item.title,
        summary: item.summary,
        source: item.source,
        date: new Date(item.date),
        embeddingVector: JSON.stringify(embedText(`${item.title} ${item.summary}`)),
      },
      select: {
        id: true,
        title: true,
        source: true,
        date: true,
        createdAt: true,
      },
    });

    inserted.push(row);
  }

  return inserted;
}

async function run() {
  try {
    await db.$executeRawUnsafe('TRUNCATE TABLE "memory", "knowledge", "api_key", "agent" CASCADE');

    const demoUser = await ensureDemoUser();
    const agents = await seedAgents(demoUser.id);
    const memories = await seedMemories(agents.map((a) => a.id));
    const knowledge = await seedKnowledge();

    console.log(
      JSON.stringify(
        {
          seeded: {
            agents: agents.length,
            memories: memories.length,
            knowledge: knowledge.length,
          },
        },
        null,
        2
      )
    );
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
}

run();
