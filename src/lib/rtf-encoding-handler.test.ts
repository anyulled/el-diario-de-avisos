import { describe, expect, it } from "vitest";
import { decodeBuffer, repairMojibake, unescapeRtfHex } from "./rtf-encoding-handler";

describe("rtf-encoding-handler", () => {
  describe("repairMojibake", () => {
    it("should repair UTF-8 bytes interpreted as Latin1", () => {
      // "AÃ±o" is what you get if you read UTF-8 bytes for "Año" (41 C3 B1 6F) via Latin1
      expect(repairMojibake("AÃ±o")).toBe("Año");
      expect(repairMojibake("MÃºsica")).toBe("Música");
    });

    it("should return original text if no mojibake pattern is found", () => {
      expect(repairMojibake("Año")).toBe("Año");
      expect(repairMojibake("Normal text")).toBe("Normal text");
    });

    it("should return original text if repair introduces replacement characters", () => {
      // Something that looks like Mojibake but isn't valid UTF-8
      const pseudoMojibake = "\u00C3\u0080\u00FF";
      expect(repairMojibake(pseudoMojibake)).toBe(pseudoMojibake);
    });
  });

  describe("decodeBuffer", () => {
    it("should decode valid UTF-8 buffer", () => {
      const buf = Buffer.from("Año", "utf8");
      expect(decodeBuffer(buf)).toBe("Año");
    });

    it("should fallback to win1252 for invalid UTF-8 buffer", () => {
      // 0xF1 is 'ñ' in win1252 but invalid standalone UTF-8
      const buf = Buffer.from([0xf1]);
      expect(decodeBuffer(buf)).toBe("ñ");
    });
  });

  describe("unescapeRtfHex", () => {
    it("should unescape valid RTF hex sequences (128-255)", () => {
      expect(unescapeRtfHex("{\\rtf1\\'e1}")).toContain("á");
      expect(unescapeRtfHex("\\'f1")).toBe("ñ");
    });

    it("should not unescape standard ASCII hex sequences (< 128)", () => {
      expect(unescapeRtfHex("\\'41")).toBe("\\'41");
      expect(unescapeRtfHex("\\'7f")).toBe("\\'7f");
    });

    it("should handle non-hex patterns gracefully", () => {
      expect(unescapeRtfHex("\\'xy")).toBe("\\'xy");
      expect(unescapeRtfHex("normal text")).toBe("normal text");
    });
  });
});
