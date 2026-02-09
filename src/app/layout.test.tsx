import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout, { generateMetadata } from "./layout";
import * as actions from "@/actions/actions";

// Mock all the components and dependencies
vi.mock("@/components/chat-widget", () => ({
  ChatWidget: () => <div data-testid="chat-widget">Chat Widget</div>,
}));

vi.mock("@/components/footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@/components/music-player", () => ({
  MusicPlayer: () => <div data-testid="music-player">Music Player</div>,
}));

vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => <div data-testid="analytics">Analytics</div>,
}));

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
  Playfair_Display: () => ({ variable: "--font-playfair" }),
}));

vi.mock("@/actions/actions", () => ({
  getIntegrantesNames: vi.fn(),
  getTutoresNames: vi.fn(),
}));

describe("RootLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the root layout with children", () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>,
    );

    const child = screen.getByTestId("test-child");
    expect(child).toBeDefined();
    expect(child.textContent).toBe("Test Content");
  });

  it("renders the Footer component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    const footer = screen.getByTestId("footer");
    expect(footer).toBeDefined();
  });

  it("renders the Analytics component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    const analytics = screen.getByTestId("analytics");
    expect(analytics).toBeDefined();
  });

  it("renders the MusicPlayer component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    const musicPlayer = screen.getByTestId("music-player");
    expect(musicPlayer).toBeDefined();
  });

  it("renders the ChatWidget component", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    const chatWidget = screen.getByTestId("chat-widget");
    expect(chatWidget).toBeDefined();
  });

  it("renders all required components together", () => {
    render(
      <RootLayout>
        <div data-testid="children">Main Content</div>
      </RootLayout>,
    );

    // Verify all components are rendered
    expect(screen.getByTestId("children")).toBeDefined();
    expect(screen.getByTestId("footer")).toBeDefined();
    expect(screen.getByTestId("analytics")).toBeDefined();
    expect(screen.getByTestId("music-player")).toBeDefined();
    expect(screen.getByTestId("chat-widget")).toBeDefined();
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates metadata with integrantes and tutores", async () => {
    const mockIntegrantes = [
      { firstName: "Juan", lastName: "Pérez", publicationName: null },
      { firstName: "María", lastName: "González", publicationName: null },
    ];

    const mockTutores = [{ names: "Dr. Carlos Rodríguez" }, { names: "Dra. Ana Martínez" }];

    vi.mocked(actions.getIntegrantesNames).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutoresNames).mockResolvedValue(mockTutores);

    const metadata = await generateMetadata();

    expect(metadata.title).toEqual({
      default: "Noticias Musicales en el Diario de Avisos",
      template: "%s | Noticias Musicales en el Diario de Avisos",
    });

    expect(metadata.description).toContain("Juan Pérez");
    expect(metadata.description).toContain("María González");
    expect(metadata.description).toContain("Dr. Carlos Rodríguez");
    expect(metadata.description).toContain("Dra. Ana Martínez");
  });

  it("sets correct metadataBase URL", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.metadataBase).toEqual(new URL("https://diariodeavisos-archivo.vercel.app"));
  });

  it("configures OpenGraph metadata correctly", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.openGraph).toEqual({
      title: "Noticias Musicales en el Diario de Avisos",
      description: "Archivo histórico de noticias musicales de El Diario de Avisos",
      url: "https://diariodeavisos-archivo.vercel.app",
      siteName: "Noticias Musicales en el Diario de Avisos",
      locale: "es_ES",
      type: "website",
    });
  });

  it("configures Twitter card metadata correctly", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "Noticias Musicales en el Diario de Avisos",
      description: "Archivo histórico de noticias musicales de El Diario de Avisos",
    });
  });

  it("sets robots to index and follow", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.robots).toEqual({
      index: true,
      follow: true,
    });
  });

  it("includes project metadata in other field", async () => {
    const mockIntegrantes = [{ firstName: "Test", lastName: "User", publicationName: null }];
    const mockTutores = [{ names: "Test Tutor" }];

    vi.mocked(actions.getIntegrantesNames).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutoresNames).mockResolvedValue(mockTutores);

    const metadata = await generateMetadata();

    expect(metadata.other).toEqual({
      "project:integrants": "Test User",
      "project:tutors": "Test Tutor",
    });
  });

  it("handles empty integrantes and tutores arrays", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.description).toBeDefined();
    expect(metadata.other).toEqual({
      "project:integrants": "",
      "project:tutors": "",
    });
  });

  it("filters out falsy values in authors list", async () => {
    const mockIntegrantes = [
      { firstName: "Valid", lastName: "User", publicationName: null },
      { firstName: "", lastName: "", publicationName: null },
    ];

    const mockTutores = [{ names: "Valid Tutor" }, { names: "" }];

    vi.mocked(actions.getIntegrantesNames).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutoresNames).mockResolvedValue(mockTutores);

    const metadata = await generateMetadata();

    expect(metadata.description).toContain("Valid User");
    expect(metadata.description).toContain("Valid Tutor");
  });

  it("calls getIntegrantesNames and getTutoresNames in parallel", async () => {
    const mockIntegrantes = [{ firstName: "Test", lastName: "User", publicationName: null }];
    const mockTutores = [{ names: "Test Tutor" }];

    vi.mocked(actions.getIntegrantesNames).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutoresNames).mockResolvedValue(mockTutores);

    await generateMetadata();

    expect(actions.getIntegrantesNames).toHaveBeenCalledTimes(1);
    expect(actions.getTutoresNames).toHaveBeenCalledTimes(1);
  });
});
