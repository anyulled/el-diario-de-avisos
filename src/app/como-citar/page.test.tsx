import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ComoCitarPage, { metadata } from "./page";

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ArrowLeft: ({ size }: { size?: number }) => <svg data-testid="arrow-left-icon" width={size} height={size} />,
}));

describe("ComoCitarPage - Metadata", () => {
  it("exports correct metadata title", () => {
    expect(metadata.title).toBe("Cómo citar esta fuente");
  });

  it("exports correct metadata description", () => {
    expect(metadata.description).toBe(
      "Guía para citar artículos del Archivo de Noticias Musicales en el Diario de Avisos, con ejemplos para artículos con y sin autor.",
    );
  });

  it("sets correct canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("/como-citar");
  });

  it("configures OpenGraph metadata correctly", () => {
    expect(metadata.openGraph?.title).toBe("Cómo citar esta fuente");
    expect(metadata.openGraph?.description).toBe(
      "Guía para citar artículos del Archivo de Noticias Musicales en el Diario de Avisos, con ejemplos para artículos con y sin autor.",
    );
    expect(metadata.openGraph?.url).toBe("/como-citar");
  });

  it("configures Twitter card metadata correctly", () => {
    expect(metadata.twitter?.title).toBe("Cómo citar esta fuente");
    expect(metadata.twitter?.description).toBe(
      "Guía para citar artículos del Archivo de Noticias Musicales en el Diario de Avisos, con ejemplos para artículos con y sin autor.",
    );
  });
});

describe("ComoCitarPage - Component", () => {
  it("renders the page with correct main container", () => {
    render(<ComoCitarPage />);
    const main = screen.getByRole("main");
    expect(main).toBeDefined();
    expect(main.className).toContain("min-h-screen");
    expect(main.className).toContain("bg-black");
    expect(main.className).toContain("text-white");
  });

  it("renders back to home link", () => {
    render(<ComoCitarPage />);
    const link = screen.getByText("Volver al inicio");
    expect(link).toBeDefined();
    expect(link.closest("a")?.getAttribute("href")).toBe("/");
  });

  it("renders ArrowLeft icon in back link", () => {
    render(<ComoCitarPage />);
    const icon = screen.getByTestId("arrow-left-icon");
    expect(icon).toBeDefined();
  });

  it("renders the main heading", () => {
    render(<ComoCitarPage />);
    const heading = screen.getByText("¿Cómo citar esta fuente?");
    expect(heading).toBeDefined();
    expect(heading.tagName).toBe("H1");
  });

  it("renders section for articles with author", () => {
    render(<ComoCitarPage />);
    const heading = screen.getByText("Artículo con autor:");
    expect(heading).toBeDefined();
    expect(heading.tagName).toBe("H2");
  });

  it("renders section for articles without author", () => {
    render(<ComoCitarPage />);
    const heading = screen.getByText("Artículo sin autor:");
    expect(heading).toBeDefined();
    expect(heading.tagName).toBe("H2");
  });

  it("renders citation guidelines for articles with author", () => {
    render(<ComoCitarPage />);
    const guidelines = screen.getByText(/Nombre del autor del artículo/);
    expect(guidelines).toBeDefined();
  });

  it("renders example citation with author", () => {
    render(<ComoCitarPage />);
    const example = screen.getByText(/M. de B. \[Mariano de Briceño\]/);
    expect(example).toBeDefined();
  });

  it("renders example citation without author", () => {
    render(<ComoCitarPage />);
    const example = screen.getByText(/Brindis Salas/);
    expect(example).toBeDefined();
  });

  it("renders both example boxes", () => {
    const { container } = render(<ComoCitarPage />);
    const exampleBoxes = container.querySelectorAll(".bg-white\\/5");
    expect(exampleBoxes.length).toBe(2);
  });

  it("renders example labels", () => {
    render(<ComoCitarPage />);
    const labels = screen.getAllByText("Ejemplo:");
    expect(labels.length).toBe(2);
  });

  it("renders database URL in examples", () => {
    render(<ComoCitarPage />);
    const urls = screen.getAllByText(/https:\/\/diario-de-avisos\.vercel\.app\//);
    expect(urls.length).toBeGreaterThanOrEqual(2);
  });

  it("renders authors names in bold", () => {
    render(<ComoCitarPage />);
    const authorNames = screen.getAllByText(/Raquel Campomás y Yurenia Santana/);
    expect(authorNames.length).toBeGreaterThanOrEqual(2);
  });

  it("renders publication name in italics", () => {
    const { container } = render(<ComoCitarPage />);
    const italicElements = container.querySelectorAll("em");
    const diarioElements = Array.from(italicElements).filter((el) => el.textContent?.includes("Diario de"));
    expect(diarioElements.length).toBeGreaterThan(0);
  });

  it("renders guidelines for articles without author", () => {
    render(<ComoCitarPage />);
    const guidelines = screen.getByText(/De no señalarse autor/);
    expect(guidelines).toBeDefined();
  });

  it("applies correct styling to example boxes", () => {
    const { container } = render(<ComoCitarPage />);
    const exampleBoxes = container.querySelectorAll(".bg-white\\/5");

    exampleBoxes.forEach((box) => {
      expect(box.className).toContain("rounded-lg");
      expect(box.className).toContain("border");
    });
  });
});
