import { describe, expect, it, vi } from "vitest";
import { processRtfContent } from "./rtf-html-converter";

// Mock @iarna/rtf-to-html
vi.mock("@iarna/rtf-to-html", () => ({
  fromString: (rtf: string, options: unknown, cb: (err: Error | null, html: string) => void) => {
    // Determine callback if options is omitted (though in our code we pass options)
    const callback = (typeof options === "function" ? options : cb) as (err: Error | null, html: string) => void;
    // Return mock HTML with the text content if possible, or just a static string
    if (rtf.includes("ERROR_PLEASE")) {
      callback(new Error("Mock Error"), "");
    } else if (rtf.includes("Hello World")) {
      callback(null, "<div>Hello World</div>");
    } else {
      // Return the input as "html" so we can verify if unescape happened
      callback(null, rtf);
    }
  },
}));

describe("processRtfContent", () => {
  it("should return default message if content is null", async () => {
    const result = await processRtfContent(null, 1);
    expect(result).toBe("Contenido no disponible");
  });

  it("should handle plain text with newlines", async () => {
    const content = "Paragraph 1\n\nParagraph 2";
    const result = await processRtfContent(content, 1);
    // The processor converts \n\n split paragraphs into <p> tags
    expect(result).toBe("<p>Paragraph 1</p>\n<p>Paragraph 2</p>");
  });

  it("should handle plain text with single newline", async () => {
    const content = "Line 1\nLine 2";
    const result = await processRtfContent(content, 1);
    expect(result).toBe("<p>Line 1<br>Line 2</p>");
  });

  it("should detect RTF content", async () => {
    const content = "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Arial;}} \\f0\\fs24 Hello World}";
    const result = await processRtfContent(content, 1);
    expect(result).toContain("Hello World");
  });

  it("should unescape valid hex sequences", async () => {
    // Input with hex char \'e1 (á) which is 225 (> 128)
    const content = "{\\rtf1\\'e1}";
    const result = await processRtfContent(content, 1);
    /*
     * The mock returns the RTF string it received.
     * We expect it to have 'á' instead of '\'e1'.
     */
    expect(result).toContain("á");
    expect(result).not.toContain("\\'e1");
  });

  it("should handle error in RTF processing", async () => {
    // Trigger the mock error
    const content = "{\\rtf1 ERROR_PLEASE}";
    const result = await processRtfContent(content, 1);
    // Should fallback to raw content in <pre>
    expect(result).toContain("<pre>");
    expect(result).toContain("ERROR_PLEASE");
  });

  it("should ignore standard ASCII hex sequences", async () => {
    // Input with hex char \'7f (DEL), which is < 128
    const content = "{\\rtf1\\'7f}";
    const result = await processRtfContent(content, 1);
    // Should REMAIN \'7f because logic only unescapes 128-255
    expect(result).toContain("\\'7f");
  });
});
