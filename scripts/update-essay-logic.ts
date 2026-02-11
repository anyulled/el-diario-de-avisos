import { config } from "dotenv";
import PDFParser from "pdf2json";
import { eq } from "drizzle-orm";

/**
 * PDF Data structure (partial)
 */
export interface PdfText {
  y: number;
  x: number;
  R: Array<{ T: string; TS: number[] }>;
}

export interface PdfPage {
  Texts: PdfText[];
}

export interface PdfData {
  Pages: PdfPage[];
}

// Load environment variables FIRST
config({ path: ".env.local" });

export async function loadPdf(absolutePath: string): Promise<PdfData> {
  const pdfParser = new PDFParser();
  return new Promise<PdfData>((resolve, reject) => {
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
}

export function processPdf(pdfData: PdfData, pageStart = 1, pageEnd: number | null = null): string {
  const startIdx = Math.max(0, pageStart - 1);
  const endIdx = pageEnd ? Math.min(pdfData.Pages.length, pageEnd) : pdfData.Pages.length;

  const htmlContentParts = pdfData.Pages.slice(startIdx, endIdx).map((page) => processPage(page));

  const rawHtmlContent = htmlContentParts.join("\n<hr/>\n");

  return rawHtmlContent
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/\s+/g, " ")
    .replace(/<\/p>\s*<p>/g, "</p>\n<p>");
}

export async function updateEssayInDb(id: number, htmlContent: string): Promise<void> {
  const { db } = await import("../src/db");
  const { essays } = await import("../src/db/schema");

  await db
    .update(essays)
    .set({
      content: Buffer.from(htmlContent),
    })
    .where(eq(essays.id, id));
}

/**
 * Process a single PDF page into HTML
 */
export function processPage(page: PdfPage): string {
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
