CREATE INDEX "embeddingIndex" ON "articulos_embeddings" USING hnsw ("embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "essayEmbeddingIndex" ON "ensayos_embeddings" USING hnsw ("embedding" vector_cosine_ops);
