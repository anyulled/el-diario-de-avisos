import { boolean, customType, index, integer, pgTable, primaryKey, serial, timestamp, varchar, vector } from "drizzle-orm/pg-core";

const bytea = customType<{ data: unknown }>({
  dataType() {
    return "bytea";
  },
});

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const articles = pgTable(
  "articulos",
  {
    id: integer("arti_cod").primaryKey().notNull(),
    title: varchar("arti_titulo", { length: 255 }),
    subtitle: varchar("arti_subtitulo", { length: 255 }),
    date: timestamp("arti_fecha", { mode: "string" }),
    dateOld: varchar("arti_fecha_old", { length: 50 }),
    columnId: integer("col_cod"),
    pubId: integer("pub_cod"),
    issueId: integer("ejm_cod"),
    page: varchar("arti_pag", { length: 50 }),
    content: bytea("arti_contenido"),
    cota: varchar("arti_cota", { length: 128 }),
    code2: varchar("arti_cod2", { length: 128 }),
    authorId: integer("autor_cod"),
    isEditable: boolean("arti_editable").notNull(),
    observations: varchar("arti_observaciones", { length: 255 }),
    publicationYear: integer("arti_añopub"),
    publicationMonth: integer("arti_mespub"),
    issueNumber: integer("arti_ejemplar"),
    series: integer("arti_serie"),
    microfilm: varchar("arti_microfilm", { length: 20 }),
    searchVector: tsvector("search_vector"),
  },
  (table) => [
    index("articles_search_vector_idx").using("gin", table.searchVector),
    index("articles_publication_year_idx").on(table.publicationYear),
    index("articles_column_id_idx").on(table.columnId),
    index("articles_date_idx").on(table.date),
  ],
);

export const authors = pgTable("autores", {
  id: serial("autor_cod").primaryKey().notNull(),
  name: varchar("autor_nombre", { length: 255 }),
  reference: varchar("autor_referencia", { length: 255 }),
  pseudonymId: integer("pseudonimo_cod"),
  pubId: integer("pub_cod"),
});

export const descriptors = pgTable("descriptores", {
  id: serial("descriptor_cod").primaryKey().notNull(),
  type: integer("descriptor_tipo"),
  value: varchar("descriptor_valor", { length: 255 }),
  property: integer("descriptor_propiedad"),
  content: bytea("descriptor_contenido"),
});

export const essays = pgTable("ensayos", {
  id: integer("ensayo_cod").primaryKey().notNull(),
  title: varchar("ensayo_titulo", { length: 255 }),
  subtitle: varchar("ensayo_subtitulo", { length: 255 }),
  content: bytea("ensayo_contenido"),
  observations: varchar("ensayo_observaciones", { length: 255 }),
  memberId: integer("intg_cod"),
});

export const images = pgTable("imagenes", {
  id: integer("img_cod").primaryKey().notNull(),
  property: integer("img_prop"),
  content: bytea("img_contenido"),
});

export const members = pgTable("integrantes", {
  id: serial("intg_cod").primaryKey().notNull(),
  lastName: varchar("intg_apds", { length: 255 }),
  firstName: varchar("intg_nmbs", { length: 255 }),
  idCard: integer("inrg_cedula"),
  faculty: varchar("intg_facultad", { length: 255 }),
  department: varchar("intg_departamento", { length: 255 }),
  photo: varchar("intg_foto"),
  linkedinUrl: varchar("intg_linkedin_url", { length: 255 }),
  twitterUrl: varchar("intg_twitter_url", { length: 255 }),
  resume: varchar("intg_resumen"),
  cvUrl: varchar("cv_url", { length: 255 }),
});

export const subjects = pgTable("materias", {
  id: serial("mat_cod").primaryKey().notNull(),
  name: varchar("mat_denom", { length: 255 }),
  description: varchar("mat_descripcion", { length: 255 }),
  isSubject: boolean("materia").notNull(),
  parentId: integer("mat_padre"),
});

export const keywords = pgTable("palabras_clave", {
  id: integer("pc_cod").primaryKey().notNull(),
  name: varchar("pc_denom", { length: 255 }),
  topicId: integer("topi_cod"),
  aliasId: integer("alias_pc_cod"),
  isException: boolean("excepcion").notNull(),
});

export const publications = pgTable("publicaciones", {
  id: serial("pub_cod").primaryKey().notNull(),
  name: varchar("pub_nombre", { length: 255 }),
  foundedDate: timestamp("pub_fecha_fundacion", { mode: "string" }),
  closedDate: timestamp("pub_fecha_cierre", { mode: "string" }),
});

export const publicationColumns = pgTable("publicaciones_columnas", {
  id: serial("col_cod").primaryKey().notNull(),
  name: varchar("col_denom", { length: 255 }),
  pubId: integer("pub_cod"),
});

export const publicationIssues = pgTable("publicaciones_ejemplares", {
  id: serial("ejm_cod").primaryKey().notNull(),
  pubId: integer("pub_cod"),
  number: varchar("ejm_num", { length: 64 }),
  date: timestamp("ejm_fecha", { mode: "string" }),
});

export const publicationLocations = pgTable("publicaciones_localidades", {
  id: serial("localidad_cod").primaryKey().notNull(),
  name: varchar("localidad_denom", { length: 255 }),
  pubId: integer("pub_cod"),
});

export const tutors = pgTable("tutores", {
  id: serial("tutor_cod").primaryKey().notNull(),
  names: varchar("tutor_nombres", { length: 255 }),
  title: varchar("tutor_titulo", { length: 20 }),
  photoPath: varchar("tutor_foto_path", { length: 255 }),
  linkedinUrl: varchar("tutor_linkedin_url", { length: 255 }),
  twitterUrl: varchar("tutor_twitter_url", { length: 255 }),
  resume: varchar("tutor_resumen"),
  cvUrl: varchar("cv_url", { length: 255 }),
});

export const developers = pgTable("desarrolladores", {
  id: serial("dev_cod").primaryKey().notNull(),
  firstName: varchar("dev_nombres", { length: 255 }),
  lastName: varchar("dev_apellidos", { length: 255 }),
  photoPath: varchar("dev_foto", { length: 255 }),
  linkedinUrl: varchar("dev_linkedin_url", { length: 255 }),
  twitterUrl: varchar("dev_twitter_url", { length: 255 }),
  resume: varchar("dev_resumen"),
  cvUrl: varchar("cv_url", { length: 255 }),
});

export const articleTopics = pgTable(
  "articulos_topicos",
  {
    subjectId: integer("mat_cod").notNull(),
    articleId: integer("arti_cod").notNull(),
    summary: varchar("sumario", { length: 255 }),
  },
  (table) => [
    primaryKey({
      columns: [table.subjectId, table.articleId],
      name: "articulos_topicos_pkey",
    }),
  ],
);

export const essayArticles = pgTable(
  "ensayos_articulos",
  {
    essayId: integer("ensayo_cod").notNull(),
    articleId: integer("articulo_cod").notNull(),
    linkWord: varchar("palabra_enlace", { length: 50 }),
  },
  (table) => [
    primaryKey({
      columns: [table.essayId, table.articleId],
      name: "ensayos_articulos_pkey",
    }),
  ],
);

export const keywordIndex = pgTable(
  "palabras_clave_indice",
  {
    keywordId: integer("pc_cod").notNull(),
    articleId: integer("arti_cod").notNull(),
    position: bytea("posicion"),
  },
  (table) => [
    index("palabras_clave_indice_palabras_clave_indicepc_cod_idx").using("btree", table.keywordId.asc().nullsLast().op("int4_ops")),
    primaryKey({
      columns: [table.keywordId, table.articleId],
      name: "palabras_clave_indice_pkey",
    }),
  ],
);

export const articleImages = pgTable(
  "articulos_imagenes",
  {
    articleId: integer("arti_cod").notNull(),
    imageId: integer("img_cod").notNull(),
    x: integer("pos_x"),
    y: integer("pos_y"),
    caption: varchar("enunciado", { length: 50 }),
  },
  (table) => [
    primaryKey({
      columns: [table.articleId, table.imageId],
      name: "articulos_imagenes_pkey",
    }),
  ],
);

export const essayImages = pgTable(
  "ensayos_imagenes",
  {
    essayId: integer("ensayo_cod").notNull(),
    imageId: integer("img_cod").notNull(),
    x: integer("pos_x"),
    y: integer("pos_y"),
    caption: varchar("enunciado", { length: 255 }),
  },
  (table) => [
    primaryKey({
      columns: [table.essayId, table.imageId],
      name: "ensayos_imagenes_pkey",
    }),
  ],
);

export const articleEmbeddings = pgTable(
  "articulos_embeddings",
  {
    articleId: integer("arti_cod")
      .primaryKey()
      .references(() => articles.id),
    embedding: vector("embedding", { dimensions: 768 }),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("embeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);

export const essayEmbeddings = pgTable(
  "ensayos_embeddings",
  {
    essayId: integer("ensayo_cod")
      .primaryKey()
      .references(() => essays.id),
    embedding: vector("embedding", { dimensions: 768 }),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("essayEmbeddingIndex").using("hnsw", table.embedding.op("vector_cosine_ops"))],
);
