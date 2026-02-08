DROP INDEX IF EXISTS "embeddingIndex";--> statement-breakpoint
DROP INDEX IF EXISTS "essayEmbeddingIndex";--> statement-breakpoint
ALTER TABLE "articulos_embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(3072);--> statement-breakpoint
ALTER TABLE "ensayos_embeddings" ALTER COLUMN "embedding" SET DATA TYPE vector(3072);--> statement-breakpoint
-- ALTER TABLE "articulos" ADD COLUMN "arti_texto_plano" text;--> statement-breakpoint
-- ALTER TABLE "ensayos" ADD COLUMN "pub_cod" integer;--> statement-breakpoint
-- ALTER TABLE "ensayos" ADD CONSTRAINT "ensayos_pub_cod_publicaciones_pub_cod_fk" FOREIGN KEY ("pub_cod") REFERENCES "public"."publicaciones"("pub_cod") ON DELETE no action ON UPDATE no action;