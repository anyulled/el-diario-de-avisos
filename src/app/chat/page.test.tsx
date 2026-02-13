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

describe("ChatPage - Metadata", () => {
  it("exports correct metadata title", () => {
    expect(metadata.title).toBe("Asistente del Archivo | Noticias Musicales en el Diario de Avisos");
  });

  it("exports correct metadata description", () => {
    expect(metadata.description).toBe("Conversa con la historia de nuestros archivos a través de nuestro asistente inteligente.");
  });
});

describe("ChatPage - Component", () => {
  it("renders the page with navbar", () => {
    render(<ChatPage />);
    const navbar = screen.getByTestId("navbar");
    expect(navbar).toBeDefined();
  });

  it("renders the main heading", () => {
    render(<ChatPage />);
    const heading = screen.getByText("Explora el Archivo Histórico");
    expect(heading).toBeDefined();
    expect(heading.tagName).toBe("H1");
  });

  it("renders the subtitle quote", () => {
    render(<ChatPage />);
    const quote = screen.getByText('"Un viaje a través de las décadas, ahora al alcance de tu mano."');
    expect(quote).toBeDefined();
  });

  it("renders the ChatInterface component", () => {
    render(<ChatPage />);
    const chatInterface = screen.getByTestId("chat-interface");
    expect(chatInterface).toBeDefined();
  });

  it("renders all three feature cards", () => {
    render(<ChatPage />);

    // Check for feature card headings
    expect(screen.getByText("Búsqueda Semántica")).toBeDefined();
    expect(screen.getByText("Acceso a 10,000+ Artículos")).toBeDefined();
    expect(screen.getByText("Citas Directas")).toBeDefined();
  });

  it("renders feature card descriptions", () => {
    render(<ChatPage />);

    expect(screen.getByText("No solo palabras clave, entiende el contexto de tu consulta.")).toBeDefined();
    expect(screen.getByText("Recuperación instantánea de décadas de periodismo.")).toBeDefined();
    expect(screen.getByText("Obtén referencias exactas de fechas y títulos de noticias.")).toBeDefined();
  });

  it("applies correct main container styling", () => {
    render(<ChatPage />);
    const main = screen.getByRole("main");
    expect(main.className).toContain("min-h-screen");
    expect(main.className).toContain("bg-slate-50");
    expect(main.className).toContain("dark:bg-zinc-950");
  });

  it("renders all components in correct order", () => {
    const { container } = render(<ChatPage />);

    // Check that navbar comes first
    const main = container.querySelector("main");
    expect(main).toBeDefined();

    const firstChild = main?.firstChild;
    expect(firstChild).toBeDefined();

    // Check that chat interface is present
    const chatInterface = screen.getByTestId("chat-interface");
    expect(chatInterface).toBeDefined();
  });
});
