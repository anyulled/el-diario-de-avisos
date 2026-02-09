ALTER TABLE "integrantes" ADD COLUMN "pub_cod" integer;
ALTER TABLE "integrantes" ADD CONSTRAINT "integrantes_pub_cod_publicaciones_pub_cod_fk" FOREIGN KEY ("pub_cod") REFERENCES "public"."publicaciones"("pub_cod") ON DELETE no action ON UPDATE no action;
UPDATE "integrantes" SET "pub_cod" = 1 WHERE "intg_cod" IN (1, 2);
UPDATE "integrantes" SET "pub_cod" = 2 WHERE "pub_cod" IS NULL;