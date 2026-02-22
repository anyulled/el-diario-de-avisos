CREATE INDEX IF NOT EXISTS "authors_pub_id_idx" ON "autores" ("pub_cod");
CREATE INDEX IF NOT EXISTS "essays_pub_id_idx" ON "ensayos" ("pub_cod");
CREATE INDEX IF NOT EXISTS "members_pub_id_idx" ON "integrantes" ("pub_cod");
