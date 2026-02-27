"use server";

import { db } from "@/db";
import { developers, members, publications, tutors } from "@/db/schema";
import { eq, getTableColumns } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const getIntegrantes = unstable_cache(
  async () => {
    return await db
      .select({
        ...getTableColumns(members),
        publicationName: publications.name,
      })
      .from(members)
      .leftJoin(publications, eq(members.pubId, publications.id));
  },
  ["integrantes"],
  { revalidate: 3600, tags: ["integrantes"] },
);

export const getTutores = unstable_cache(
  async () => {
    return await db.select().from(tutors);
  },
  ["tutores"],
  { revalidate: 3600, tags: ["tutores"] },
);

export const getDevelopers = unstable_cache(
  async () => {
    return await db.select().from(developers);
  },
  ["developers"],
  { revalidate: 3600, tags: ["developers"] },
);

export const getIntegrantesNames = unstable_cache(
  async () => {
    return await db
      .select({
        firstName: members.firstName,
        lastName: members.lastName,
        publicationName: publications.name,
      })
      .from(members)
      .leftJoin(publications, eq(members.pubId, publications.id));
  },
  ["integrantes-names"],
  { revalidate: 3600, tags: ["integrantes"] },
);

export const getTutoresNames = unstable_cache(
  async () => {
    return await db
      .select({
        names: tutors.names,
      })
      .from(tutors);
  },
  ["tutores-names"],
  { revalidate: 3600, tags: ["tutores"] },
);

export const getDevelopersNames = unstable_cache(
  async () => {
    return await db
      .select({
        firstName: developers.firstName,
        lastName: developers.lastName,
      })
      .from(developers);
  },
  ["developers-names"],
  { revalidate: 3600, tags: ["developers"] },
);
