/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";
import EssayPage, { generateMetadata } from "./page";
import * as actions from "@/actions/actions";
import * as rtfConverter from "@/lib/rtf-html-converter";

// Mock dependencies
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("@/actions/actions", () => ({
  getEssayById: vi.fn(),
  getEssayMetadata: vi.fn(),
}));

vi.mock("@/lib/rtf-html-converter", () => ({
  processRtfContent: vi.fn(),
}));

describe("EssayPage", () => {
  const mockEssay = {
    id: 1,
    title: "Test Essay",
    subtitle: "Test Subtitle",
    content: "Test Content",
    observations: "Test Observations",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateMetadata", () => {
    it("returns metadata for existing essay", async () => {
      vi.mocked(actions.getEssayMetadata).mockResolvedValue(mockEssay as any);

      const params = Promise.resolve({ id: "1" });
      const metadata = await generateMetadata({ params });

      expect(actions.getEssayMetadata).toHaveBeenCalledWith(1);
      expect(metadata).toEqual({
        title: "Test Essay",
        description: "Test Subtitle",
        openGraph: {
          title: "Test Essay",
          description: "Test Subtitle",
          type: "article",
        },
      });
    });

    it("returns metadata with fallback values if fields are missing", async () => {
      vi.mocked(actions.getEssayMetadata).mockResolvedValue({
        ...mockEssay,
        title: null,
        subtitle: null,
        observations: "Fallback Obs",
      } as any);

      const params = Promise.resolve({ id: "1" });
      const metadata = await generateMetadata({ params });

      expect(metadata.title).toBe("Sin Título");
      expect(metadata.description).toBe("Fallback Obs");
    });

    it("returns metadata with default description if everything missing", async () => {
      vi.mocked(actions.getEssayMetadata).mockResolvedValue({
        ...mockEssay,
        title: null,
        subtitle: null,
        observations: null,
      } as any);

      const params = Promise.resolve({ id: "1" });
      const metadata = await generateMetadata({ params });

      expect(metadata.description).toBe("Ensayo histórico");
    });

    it("returns empty object if essay not found", async () => {
      vi.mocked(actions.getEssayMetadata).mockResolvedValue(null as any);

      const params = Promise.resolve({ id: "999" }) as any;
      const metadata = await generateMetadata({ params });

      expect(metadata).toEqual({});
    });
  });

  describe("EssayComponent", () => {
    it("renders essay content correctly", async () => {
      vi.mocked(actions.getEssayById).mockResolvedValue(mockEssay as any);
      vi.mocked(rtfConverter.processRtfContent).mockResolvedValue("<p>Processed Content</p>");

      const params = Promise.resolve({ id: "1" });

      render(await EssayPage({ params }));

      expect(screen.getByTestId("navbar")).toBeDefined();
      expect(screen.getByText("Test Essay")).toBeDefined();
      expect(screen.getByText("Test Subtitle")).toBeDefined();
      expect(screen.getByText("Processed Content")).toBeDefined();
      expect(screen.getByText("Test Observations")).toBeDefined();
      expect(screen.getByText("Ref: 1")).toBeDefined();
    });

    it("calls notFound if essay does not exist", async () => {
      vi.mocked(actions.getEssayById).mockResolvedValue(null as any);

      const params = Promise.resolve({ id: "999" }) as any;

      try {
        await EssayPage({ params });
      } catch {
        // Expected
      }

      expect(notFound).toHaveBeenCalled();
    });

    it("renders default title if missing", async () => {
      vi.mocked(actions.getEssayById).mockResolvedValue({ ...mockEssay, title: null } as any);
      vi.mocked(rtfConverter.processRtfContent).mockResolvedValue("<p>Content</p>");

      const params = Promise.resolve({ id: "1" });

      render(await EssayPage({ params }));

      expect(screen.getByText("Sin Título")).toBeDefined();
    });

    it("does not render subtitle if missing", async () => {
      vi.mocked(actions.getEssayById).mockResolvedValue({ ...mockEssay, subtitle: null } as any);
      vi.mocked(rtfConverter.processRtfContent).mockResolvedValue("<p>Content</p>");

      const params = Promise.resolve({ id: "1" });

      render(await EssayPage({ params }));

      expect(screen.queryByText("Test Subtitle")).toBeNull();
    });
  });
});
