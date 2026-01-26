import { db } from "@/db";
import { developers, members, tutors } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const cvDir = path.join(process.cwd(), "public/cv");
  if (!fs.existsSync(cvDir)) {
    console.log("No cv directory found");
    return;
  }

  const files = fs.readdirSync(cvDir).filter((f) => f.endsWith(".pdf"));
  console.log(`Found ${files.length} cv files`);

  for (const file of files) {
    const namePart = file.replace(".pdf", "").replace(/-/g, " ");
    console.log(`Processing ${file} (searching for "${namePart}")`);

    // Check members
    const member = await db.query.members.findFirst({
      where: (members, { sql }) => sql`CONCAT(${members.firstName}, ' ', ${members.lastName}) ILIKE ${`%${namePart}%`}`,
    });

    if (member) {
      console.log(`Found member: ${member.firstName} ${member.lastName}`);
      await db
        .update(members)
        .set({ cvUrl: `/cv/${file}` })
        .where(eq(members.id, member.id));
      continue;
    }

    // Check tutors
    const tutor = await db.query.tutors.findFirst({
      where: (tutors, { sql }) => sql`${tutors.names} ILIKE ${`%${namePart}%`}`,
    });

    if (tutor) {
      console.log(`Found tutor: ${tutor.names}`);
      await db
        .update(tutors)
        .set({ cvUrl: `/cv/${file}` })
        .where(eq(tutors.id, tutor.id));
      continue;
    }

    // Check developers
    const dev = await db.query.developers.findFirst({
      where: (developers, { sql }) => sql`CONCAT(${developers.firstName}, ' ', ${developers.lastName}) ILIKE ${`%${namePart}%`}`,
    });

    if (dev) {
      console.log(`Found developer: ${dev.firstName} ${dev.lastName}`);
      await db
        .update(developers)
        .set({ cvUrl: `/cv/${file}` })
        .where(eq(developers.id, dev.id));
      continue;
    }

    console.log(`No match found for ${file}`);
  }
}

main().catch(console.error);
