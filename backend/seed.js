const fs = require("fs");
const path = require("path");
const db = require("./src/db");
const { embedText, toVectorLiteral } = require("./src/utils/embedding");

async function ensureSchema() {
  const schemaPath = path.join(__dirname, "prisma", "sql", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await db.query(sql);
}

async function seedAgents() {
  const agentRows = [
    ["Athena", "riselab-core"],
    ["Orion", "research-ops"],
  ];

  const inserted = [];
  for (const [name, owner] of agentRows) {
    const { rows } = await db.query(
      "INSERT INTO agent (name, owner) VALUES ($1, $2) RETURNING id, name, owner, created_at",
      [name, owner]
    );
    inserted.push(rows[0]);
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
    const vector = toVectorLiteral(embedText(note));
    const { rows } = await db.query(
      `INSERT INTO memory (agent_id, content, embedding_vector)
       VALUES ($1::uuid, $2, $3::vector)
       RETURNING id, agent_id, content, created_at`,
      [agentId, note, vector]
    );
    inserted.push(rows[0]);
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
    {
      title: "Sparse + dense search fusion",
      summary: "Reciprocal rank fusion improves answer grounding quality.",
      source: "Search Today",
      date: "2026-05-01T16:00:00Z",
    },
    {
      title: "Latency-aware embedding pipelines",
      summary: "Batching and async queues reduce p95 embed latency.",
      source: "Backend Digest",
      date: "2026-02-10T12:10:00Z",
    },
    {
      title: "Knowledge graph linking for agents",
      summary: "Entity linking improves cross-document memory recall.",
      source: "Graph Monthly",
      date: "2026-03-02T07:20:00Z",
    },
    {
      title: "Evaluation rubric for agent retrieval",
      summary: "Defines faithfulness, relevance, and freshness metrics.",
      source: "Research Ops",
      date: "2026-04-15T19:05:00Z",
    },
    {
      title: "Prompt contracts for multi-agent systems",
      summary: "Structured handoffs reduce coordination regressions.",
      source: "Engineering Papers",
      date: "2026-04-25T14:40:00Z",
    },
  ];

  const inserted = [];
  for (const item of papers) {
    const vector = toVectorLiteral(embedText(`${item.title} ${item.summary}`));
    const { rows } = await db.query(
      `INSERT INTO knowledge (title, summary, source, date, embedding_vector)
       VALUES ($1, $2, $3, $4::timestamptz, $5::vector)
       RETURNING id, title, source, date, created_at`,
      [item.title, item.summary, item.source, item.date, vector]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

async function run() {
  try {
    await ensureSchema();
    await db.query("TRUNCATE TABLE memory, knowledge, agent CASCADE");

    const agents = await seedAgents();
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
