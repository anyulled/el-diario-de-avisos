-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "articulos" (
	"arti_cod" integer PRIMARY KEY NOT NULL,
	"arti_titulo" varchar(255),
	"arti_subtitulo" varchar(255),
	"arti_fecha" varchar(50),
	"col_cod" integer,
	"pub_cod" integer,
	"ejm_cod" integer,
	"arti_pag" integer,
	"arti_contenido" "bytea",
	"arti_cota" varchar(128),
	"arti_cod2" varchar(128),
	"autor_cod" integer,
	"arti_editable" boolean NOT NULL,
	"arti_observaciones" varchar(255),
	"arti_añopub" integer,
	"arti_mespub" integer,
	"arti_ejemplar" integer,
	"arti_serie" integer,
	"arti_microfilm" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "autores" (
	"autor_cod" serial PRIMARY KEY NOT NULL,
	"autor_nombre" varchar(255),
	"autor_referencia" varchar(255),
	"pseudonimo_cod" integer,
	"pub_cod" integer
);
--> statement-breakpoint
CREATE TABLE "descriptores" (
	"descriptor_cod" serial PRIMARY KEY NOT NULL,
	"descriptor_tipo" integer,
	"descriptor_valor" varchar(255),
	"descriptor_propiedad" integer,
	"descriptor_contenido" "bytea"
);
--> statement-breakpoint
CREATE TABLE "ensayos" (
	"ensayo_cod" integer PRIMARY KEY NOT NULL,
	"ensayo_titulo" varchar(255),
	"ensayo_subtitulo" varchar(255),
	"ensayo_contenido" "bytea",
	"ensayo_observaciones" varchar(255),
	"intg_cod" integer
);
--> statement-breakpoint
CREATE TABLE "imagenes" (
	"img_cod" integer PRIMARY KEY NOT NULL,
	"img_prop" integer,
	"img_contenido" "bytea"
);
--> statement-breakpoint
CREATE TABLE "integrantes" (
	"intg_cod" serial PRIMARY KEY NOT NULL,
	"intg_apds" varchar(255),
	"intg_nmbs" varchar(255),
	"inrg_cedula" integer,
	"intg_facultad" varchar(255),
	"intg_departamento" varchar(255),
	"intg_foto" "bytea"
);
--> statement-breakpoint
CREATE TABLE "materias" (
	"mat_cod" serial PRIMARY KEY NOT NULL,
	"mat_denom" varchar(255),
	"mat_descripcion" varchar(255),
	"materia" boolean NOT NULL,
	"mat_padre" integer
);
--> statement-breakpoint
CREATE TABLE "palabras_clave" (
	"pc_cod" integer PRIMARY KEY NOT NULL,
	"pc_denom" varchar(255),
	"topi_cod" integer,
	"alias_pc_cod" integer,
	"excepcion" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "publicaciones" (
	"pub_cod" serial PRIMARY KEY NOT NULL,
	"pub_nombre" varchar(255),
	"pub_fecha_fundacion" timestamp,
	"pub_fecha_cierre" timestamp
);
--> statement-breakpoint
CREATE TABLE "publicaciones_columnas" (
	"col_cod" serial PRIMARY KEY NOT NULL,
	"col_denom" varchar(255),
	"pub_cod" integer
);
--> statement-breakpoint
CREATE TABLE "publicaciones_ejemplares" (
	"ejm_cod" serial PRIMARY KEY NOT NULL,
	"pub_cod" integer,
	"ejm_num" varchar(64),
	"ejm_fecha" timestamp
);
--> statement-breakpoint
CREATE TABLE "publicaciones_localidades" (
	"localidad_cod" serial PRIMARY KEY NOT NULL,
	"localidad_denom" varchar(255),
	"pub_cod" integer
);
--> statement-breakpoint
CREATE TABLE "tutores" (
	"tutor_cod" serial PRIMARY KEY NOT NULL,
	"tutor_nombres" varchar(255),
	"tutor_titulo" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "articulos_topicos" (
	"mat_cod" integer NOT NULL,
	"arti_cod" integer NOT NULL,
	"sumario" varchar(255),
	CONSTRAINT "articulos_topicos_pkey" PRIMARY KEY("mat_cod","arti_cod")
);
--> statement-breakpoint
CREATE TABLE "ensayos_articulos" (
	"ensayo_cod" integer NOT NULL,
	"articulo_cod" integer NOT NULL,
	"palabra_enlace" varchar(50),
	CONSTRAINT "ensayos_articulos_pkey" PRIMARY KEY("ensayo_cod","articulo_cod")
);
--> statement-breakpoint
CREATE TABLE "palabras_clave_indice" (
	"pc_cod" integer NOT NULL,
	"arti_cod" integer NOT NULL,
	"posicion" "bytea",
	CONSTRAINT "palabras_clave_indice_pkey" PRIMARY KEY("pc_cod","arti_cod")
);
--> statement-breakpoint
CREATE TABLE "articulos_imagenes" (
	"arti_cod" integer NOT NULL,
	"img_cod" integer NOT NULL,
	"pos_x" integer,
	"pos_y" integer,
	"enunciado" varchar(50),
	CONSTRAINT "articulos_imagenes_pkey" PRIMARY KEY("arti_cod","img_cod")
);
--> statement-breakpoint
CREATE TABLE "ensayos_imagenes" (
	"ensayo_cod" integer NOT NULL,
	"img_cod" integer NOT NULL,
	"pos_x" integer,
	"pos_y" integer,
	"enunciado" varchar(255),
	CONSTRAINT "ensayos_imagenes_pkey" PRIMARY KEY("ensayo_cod","img_cod")
);
--> statement-breakpoint
CREATE INDEX "palabras_clave_indice_palabras_clave_indicepc_cod_idx" ON "palabras_clave_indice" USING btree ("pc_cod" int4_ops);
*/