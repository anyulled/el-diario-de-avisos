#!/usr/bin/env node
import path from "node:path";
import { loadPdf, processPdf, updateEssayInDb } from "./update-essay-logic";

const USAGE = `
Usage: npx tsx scripts/update-essay.ts --id <essay_id> --file <pdf_file_path> [--pageStart <number>] [--pageEnd <number>]

Example:
  npx tsx scripts/update-essay.ts --id 123 --file ./my-essay.pdf --pageStart 2 --pageEnd 5
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const idArg = args.indexOf("--id");
  const fileArg = args.indexOf("--file");
  const pageStartArg = args.indexOf("--pageStart");
  const pageEndArg = args.indexOf("--pageEnd");

  if (idArg === -1 || fileArg === -1) {
    console.error(USAGE);
    process.exit(1);
  }

  const id = Number.parseInt(args[idArg + 1], 10);
  const filePath = args[fileArg + 1];
  const pageStart = pageStartArg === -1 ? 1 : Number.parseInt(args[pageStartArg + 1], 10);
  const pageEnd = pageEndArg === -1 ? null : Number.parseInt(args[pageEndArg + 1], 10);

  if (Number.isNaN(id)) {
    console.error("Error: --id must be a number");
    process.exit(1);
  }

  try {
    const absolutePath = path.resolve(filePath);
    console.log(`Reading PDF from: ${absolutePath}`);
    console.log(`Processing pages: ${pageStart} to ${pageEnd || "end"}`);

    const pdfData = await loadPdf(absolutePath);
    const htmlContent = processPdf(pdfData, pageStart, pageEnd);

    console.log(`Extracted HTML length: ${htmlContent.length} chars`);
    console.log(`Updating essay ID: ${id}`);

    await updateEssayInDb(id, htmlContent);

    console.log("✅ Essay updated successfully.");
  } catch (error) {
    console.error("Error updating essay:", error);
    process.exit(1);
  }
}

// Only run main if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await main();
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}
