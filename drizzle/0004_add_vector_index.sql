CREATE INDEX IF NOT EXISTS "embeddingIndex" ON "articulos_embeddings" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "essayEmbeddingIndex" ON "ensayos_embeddings" USING hnsw ("embedding" vector_cosine_ops);
