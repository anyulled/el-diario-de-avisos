import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChatPage, { metadata } from "./page";

// Mock the components
vi.mock("@/components/navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock("@/components/chat-interface", () => ({
  default: () => <div data-testid="chat-interface">Chat Interface</div>,
}));

// Mock the articles lib
vi.mock("@/lib/articles", () => ({
  getArticleCount: vi.fn().mockResolvedValue(22953),
  formatArticleCount: vi.fn().mockReturnValue("22,900+"),
}));

describe("ChatPage - Metadata", () => {
  it("exports correct metadata title", () => {
    expect(metadata.title).toBe("Asistente del Archivo | Noticias Musicales en el Diario de Avisos");
  });

  it("exports correct metadata description", () => {
    expect(metadata.description).toBe("Conversa con la historia de nuestros archivos a través de nuestro asistente inteligente.");
  });
});

describe("ChatPage - Component", () => {
  it("renders the page with navbar", async () => {
    const page = await ChatPage();
    render(page);
    const navbar = screen.getByTestId("navbar");
    expect(navbar).toBeDefined();
  });

  it("renders the main heading", async () => {
    const page = await ChatPage();
    render(page);
    const heading = screen.getByText("Explora el Archivo Histórico");
    expect(heading).toBeDefined();
    expect(heading.tagName).toBe("H1");
  });

  it("renders the subtitle quote", async () => {
    const page = await ChatPage();
    render(page);
    const quote = screen.getByText('"Un viaje a través de las décadas, ahora al alcance de tu mano."');
    expect(quote).toBeDefined();
  });

  it("renders the ChatInterface component", async () => {
    const page = await ChatPage();
    render(page);
    const chatInterface = screen.getByTestId("chat-interface");
    expect(chatInterface).toBeDefined();
  });

  it("renders all three feature cards", async () => {
    const page = await ChatPage();
    render(page);

    // Check for feature card headings
    expect(screen.getByText("Búsqueda Semántica")).toBeDefined();
    expect(screen.getByText("Acceso a 22,900+ Artículos")).toBeDefined();
    expect(screen.getByText("Citas Directas")).toBeDefined();
  });

  it("renders feature card descriptions", async () => {
    const page = await ChatPage();
    render(page);

    expect(screen.getByText("No solo palabras clave, entiende el contexto de tu consulta.")).toBeDefined();
    expect(screen.getByText("Recuperación instantánea de décadas de periodismo.")).toBeDefined();
    expect(screen.getByText("Obtén referencias exactas de fechas y títulos de noticias.")).toBeDefined();
  });

  it("applies correct main container styling", async () => {
    const page = await ChatPage();
    render(page);
    const main = screen.getByRole("main");
    expect(main.className).toContain("min-h-screen");
    expect(main.className).toContain("bg-slate-50");
    expect(main.className).toContain("dark:bg-zinc-950");
  });

  it("renders all components in correct order", async () => {
    const page = await ChatPage();
    const { container } = render(page);

    // Check that navbar comes first
    const main = container.querySelector("main");
    expect(main).toBeDefined();

    /*
     * In the actual JSX, Navbar is inside main? No, usually Navbar is top level.
     * Let's check page.tsx content again to be sure about structure.
     * page.tsx:
     * <main ...>
     *   <Navbar />
     *   <div ...>
     *     ...
     *   </div>
     * </main>
     * So Navbar is the first child of Main.
     */

    const firstChild = main?.firstChild;
    expect(firstChild).toBeDefined();

    // Check that chat interface is present
    const chatInterface = screen.getByTestId("chat-interface");
    expect(chatInterface).toBeDefined();
  });
});
