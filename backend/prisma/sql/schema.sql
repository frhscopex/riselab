CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS agent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agent(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding_vector VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  embedding_vector VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_agent_id ON memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_date ON knowledge(date DESC);

-- Optional semantic indexes (uncomment after enough rows are present and tune lists/probes)
-- CREATE INDEX IF NOT EXISTS idx_memory_embedding_ivfflat
--   ON memory USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX IF NOT EXISTS idx_knowledge_embedding_ivfflat
--   ON knowledge USING ivfflat (embedding_vector vector_cosine_ops) WITH (lists = 100);
