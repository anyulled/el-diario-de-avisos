import { config } from "dotenv";
import path from "node:path";
import PDFParser from "pdf2json";
import { eq } from "drizzle-orm";

/**
 * PDF Data structure (partial)
 */
interface PdfText {
  y: number;
  x: number;
  R: Array<{ T: string; TS: number[] }>;
}

interface PdfPage {
  Texts: PdfText[];
}

interface PdfData {
  Pages: PdfPage[];
}

// Load environment variables FIRST
config({ path: ".env.local" });

const USAGE = `
Usage: npx tsx scripts/update-essay.ts --id <essay_id> --file <path_to_pdf> [--pageStart <number>] [--pageEnd <number>]

Options:
  --id          The ID of the essay to update (required)
  --file        Path to the PDF file (required)
  --pageStart   The starting page number (1-based, optional)
  --pageEnd     The ending page number (1-based, optional)
`;

async function main(): Promise<void> {
  const { db } = await import("../src/db");
  const { essays } = await import("../src/db/schema");

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

    const pdfParser = new PDFParser();

    const pdfData = await new Promise<PdfData>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData: Error | { parserError: Error }) => {
        if ("parserError" in errData) {
          reject(errData.parserError);
        } else {
          reject(errData);
        }
      });
      pdfParser.on("pdfParser_dataReady", (readyData: PdfData) => {
        resolve(readyData);
      });
      pdfParser.loadPDF(absolutePath);
    });

    // Iterate through pages
    const startIdx = Math.max(0, pageStart - 1);
    const endIdx = pageEnd ? Math.min(pdfData.Pages.length, pageEnd) : pdfData.Pages.length;

    const htmlContentParts = pdfData.Pages.slice(startIdx, endIdx).map((page) => processPage(page));

    const rawHtmlContent = htmlContentParts.join("\n<hr/>\n");

    // Clean up empty tags and excessive whitespace (regex is safe)
    const htmlContent = rawHtmlContent
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/\s+/g, " ")
      .replace(/<\/p>\s*<p>/g, "</p>\n<p>");

    console.log(`Extracted HTML length: ${htmlContent.length} chars`);
    console.log(`Updating essay ID: ${id}`);

    // Update query
    await db
      .update(essays)
      .set({
        content: Buffer.from(htmlContent),
      })
      .where(eq(essays.id, id));

    console.log("✅ Essay updated successfully.");
  } catch (error) {
    console.error("Error updating essay:", error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit();
  });

/**
 * Process a single PDF page into HTML
 */
function processPage(page: PdfPage): string {
  const texts = [...(page.Texts || [])].sort((a: PdfText, b: PdfText) => {
    if (Math.abs(a.y - b.y) < 0.5) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const result = texts.reduce(
    (acc: { html: string; lastY: number }, text: PdfText) => {
      const rawText = decodeURIComponent(text.R[0].T);
      const isBold = text.R[0].TS[2] === 1;
      const isItalic = text.R[0].TS[3] === 1;

      const boldText = isBold ? `<b>${rawText}</b>` : rawText;
      const formattedText = isItalic ? `<i>${boldText}</i>` : boldText;

      const prefix = acc.lastY !== -1 && Math.abs(text.y - acc.lastY) > 1 ? "</p>\n<p>" : acc.html === "" ? "<p>" : " ";

      return {
        html: acc.html + prefix + formattedText,
        lastY: text.y,
      };
    },
    { html: "", lastY: -1 },
  );

  return result.html ? `${result.html}</p>` : "";
}
