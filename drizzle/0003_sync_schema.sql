CREATE TABLE "desarrolladores" (
	"dev_cod" serial PRIMARY KEY NOT NULL,
	"dev_nombres" varchar(255),
	"dev_apellidos" varchar(255),
	"dev_foto" varchar(255),
	"dev_linkedin_url" varchar(255),
	"dev_twitter_url" varchar(255),
	"dev_resumen" varchar
);
--> statement-breakpoint
ALTER TABLE "integrantes" ALTER COLUMN "intg_foto" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "integrantes" ADD COLUMN "intg_linkedin_url" varchar(255);--> statement-breakpoint
ALTER TABLE "integrantes" ADD COLUMN "intg_twitter_url" varchar(255);--> statement-breakpoint
ALTER TABLE "integrantes" ADD COLUMN "intg_resumen" varchar;--> statement-breakpoint
ALTER TABLE "tutores" ADD COLUMN "tutor_foto_path" varchar(255);--> statement-breakpoint
ALTER TABLE "tutores" ADD COLUMN "tutor_linkedin_url" varchar(255);--> statement-breakpoint
ALTER TABLE "tutores" ADD COLUMN "tutor_twitter_url" varchar(255);--> statement-breakpoint
ALTER TABLE "tutores" ADD COLUMN "tutor_resumen" varchar;--> statement-breakpoint
ALTER TABLE "articulos" DROP COLUMN "arti_fecha_timestamp";