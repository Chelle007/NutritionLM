/** Gemini model IDs — override via env without code changes. */
export const GEMINI_MODELS = {
  /** Chat, image understanding, fact-check/compare */
  primary: process.env.GEMINI_MODEL_PRIMARY ?? "gemini-3.5-flash",
  /** JSON/text tasks (nutrition analysis, recommendations) */
  fast: process.env.GEMINI_MODEL_FAST ?? "gemini-3.1-flash-lite",
  /** RAG document/query embeddings */
  embedding: process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
} as const;

/** Matches source_chunks.embedding vector(768) in db/schema.sql */
export const EMBEDDING_DIMENSIONS = 768;
