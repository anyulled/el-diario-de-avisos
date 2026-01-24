import { describe, expect, it } from "vitest";
import { processRtfContent } from "./rtf-html-converter";

/**
 * Integration tests for RTF to HTML conversion
 * These tests use the REAL @iarna/rtf-to-html library (no mocking)
 * to verify end-to-end conversion behavior with realistic RTF samples
 */
describe("RTF Converter Integration Tests", () => {
  it("should convert historical newspaper RTF content to HTML", async () => {
    // Real historical newspaper RTF content (this format works with the library)
    const historicalRtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}
\\viewkind4\\uc1\\pard\\lang3082\\fs16\\tab Jos\\'e9 de los Reyes, de color negro, estatura regular, pech\\'f3n, pelo chicharr\\'f3n, cerrado de barbas, boca grande, labios gruesos, ojos grandes (P. 4)
\\par }`;

    const result = await processRtfContent(historicalRtf, 1);

    // Verify Spanish characters are decoded
    expect(result).toContain("José");
    expect(result).toContain("pechón");
    expect(result).toContain("chicharrón");

    // Verify page reference is preserved
    expect(result).toContain("(P. 4)");

    // Verify no RTF codes remain
    expect(result).not.toContain("{\\rtf");
    expect(result).not.toContain("\\viewkind");
    expect(result).not.toContain("\\uc1");
    expect(result).not.toContain("\\pard");
    expect(result).not.toContain("\\lang");

    // Verify font styles are stripped
    expect(result).not.toContain("font-size");
    expect(result).not.toContain("font-family");
  });

  it("should handle RTF with Spanish special characters", async () => {
    const rtfWithAccents = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}
\\viewkind4\\uc1\\pard\\lang3082\\fs16 M\\'fasica espa\\'f1ola: \\'e1\\'e9\\'ed\\'f3\\'fa\\'f1
\\par }`;

    const result = await processRtfContent(rtfWithAccents, 2);

    // Verify special characters are properly decoded
    expect(result).toContain("Música");
    expect(result).toContain("española");
    expect(result).toContain("áéíóúñ");

    // Should not contain RTF escape sequences
    expect(result).not.toContain("\\'");
  });

  it("should handle RTF with multiple paragraphs", async () => {
    const rtfWithParagraphs = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}
\\viewkind4\\uc1\\pard\\lang3082\\fs16 First paragraph with some text.
\\par Second paragraph after line break.
\\par Third paragraph.
\\par }`;

    const result = await processRtfContent(rtfWithParagraphs, 3);

    // Verify paragraphs are converted
    expect(result).toContain("First paragraph");
    expect(result).toContain("Second paragraph");
    expect(result).toContain("Third paragraph");

    // Should not contain RTF paragraph markers
    expect(result).not.toContain("\\par");
  });

  it("should strip font-size and font-family styles from converted HTML", async () => {
    const rtfWithFormatting = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}
\\viewkind4\\uc1\\pard\\lang3082\\f0\\fs20 Text with font formatting
\\par }`;

    const result = await processRtfContent(rtfWithFormatting, 4);

    // Verify content is present
    expect(result).toContain("Text with font formatting");

    // Verify stripFontStyles removed all inline styles
    expect(result).not.toContain("font-size");
    expect(result).not.toContain("font-family");
  });

  it("should handle empty RTF content", async () => {
    const emptyRtf = "{\\rtf1\\ansi}";

    const result = await processRtfContent(emptyRtf, 5);

    // Should return valid result even if empty
    expect(result).toBeDefined();
    expect(result).not.toContain("{\\rtf");
  });

  it("should handle plain text content (non-RTF)", async () => {
    const plainText = "This is plain text without RTF formatting.";

    const result = await processRtfContent(plainText, 6);

    // Should handle plain text gracefully
    expect(result).toContain("This is plain text");
    expect(result).not.toContain("{\\rtf");
  });

  it("should handle null content", async () => {
    const result = await processRtfContent(null, 7);

    // Should return default message
    expect(result).toBe("Contenido no disponible");
  });

  it("should handle Buffer input with RTF content", async () => {
    const rtfString = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}
\\viewkind4\\uc1\\pard\\lang3082\\fs16 Buffer test content
\\par }`;
    const buffer = Buffer.from(rtfString, "utf-8");

    const result = await processRtfContent(buffer, 8);

    // Verify content is converted from buffer
    expect(result).toContain("Buffer test content");
    expect(result).not.toContain("{\\rtf");
  });

  it("should preserve content structure and spacing", async () => {
    const rtfWithStructure = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}
\\viewkind4\\uc1\\pard\\lang3082\\fs16 Line 1
\\par 
\\par Line 2 after blank line
\\par }`;

    const result = await processRtfContent(rtfWithStructure, 9);

    // Verify both lines are present
    expect(result).toContain("Line 1");
    expect(result).toContain("Line 2");
  });

  it("should handle RTF with tabs and special formatting", async () => {
    const rtfWithTabs = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}
\\viewkind4\\uc1\\pard\\lang3082\\fs16\\tab Indented content with tab
\\par Normal content
\\par }`;

    const result = await processRtfContent(rtfWithTabs, 10);

    // Verify content is present
    expect(result).toContain("Indented content");
    expect(result).toContain("Normal content");

    // Should not contain RTF tab markers
    expect(result).not.toContain("\\tab");
  });
});
