CREATE TABLE "articulos_embeddings" (
	"arti_cod" integer PRIMARY KEY NOT NULL,
	"embedding" vector(768),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "articulos_embeddings" ADD CONSTRAINT "articulos_embeddings_arti_cod_articulos_arti_cod_fk" FOREIGN KEY ("arti_cod") REFERENCES "public"."articulos"("arti_cod") ON DELETE no action ON UPDATE no action;