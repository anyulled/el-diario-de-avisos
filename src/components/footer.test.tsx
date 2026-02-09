import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the footer component", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeDefined();
  });

  it("displays the main heading", () => {
    render(<Footer />);
    const heading = screen.getByText("Noticias Musicales en el Diario de Avisos");
    expect(heading).toBeDefined();
  });

  it("displays the description text", () => {
    render(<Footer />);
    const description = screen.getByText(/Un archivo histórico digital dedicado a la preservación/i);
    expect(description).toBeDefined();
  });

  it("renders the Escuela de Artes logo with correct link", () => {
    render(<Footer />);
    const artesLink = screen.getByRole("link", { name: /Logo Escuela de Artes/i });
    expect(artesLink).toBeDefined();
    expect(artesLink.getAttribute("href")).toBe("http://www.ucv.ve/artes");
    expect(artesLink.getAttribute("target")).toBe("_blank");
    expect(artesLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders the UCV logo with correct link", () => {
    render(<Footer />);
    const ucvLogo = screen.getByAltText("Logo Universidad Central de Venezuela");
    expect(ucvLogo).toBeDefined();
    expect(ucvLogo.getAttribute("src")).toBe("/logo_ucv.jpg");
  });

  it("displays the current year in copyright notice", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    const copyright = screen.getByText(new RegExp(`© ${currentYear} Noticias Musicales en el Diario de Avisos`));
    expect(copyright).toBeDefined();
  });

  it("renders Universidad Central de Venezuela link in footer", () => {
    render(<Footer />);
    const links = screen.getAllByRole("link", { name: /Universidad Central de Venezuela/i });
    expect(links.length).toBeGreaterThan(0);
    const bottomLink = links[links.length - 1];
    expect(bottomLink.getAttribute("href")).toBe("http://www.ucv.ve/");
    expect(bottomLink.getAttribute("target")).toBe("_blank");
  });

  it("has proper accessibility attributes on external links", () => {
    render(<Footer />);
    const externalLinks = screen.getAllByRole("link");
    externalLinks.forEach((link) => {
      if (link.getAttribute("target") === "_blank") {
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      }
    });
  });

  it("applies correct CSS classes for responsive layout", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer?.className).toContain("w-full");
    expect(footer?.className).toContain("py-12");
    expect(footer?.className).toContain("bg-white");
    expect(footer?.className).toContain("dark:bg-zinc-950");
  });

  it("renders both logo images", () => {
    render(<Footer />);
    const artesLogo = screen.getByAltText("Logo Escuela de Artes");
    const ucvLogo = screen.getByAltText("Logo Universidad Central de Venezuela");
    expect(artesLogo).toBeDefined();
    expect(ucvLogo).toBeDefined();
  });

  it("contains the complete copyright text", () => {
    render(<Footer />);
    const copyrightText = screen.getByText(/Todos los derechos reservados/i);
    expect(copyrightText).toBeDefined();
  });

  it("has proper semantic HTML structure", () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector("footer");
    expect(footer).toBeDefined();
    expect(footer?.tagName).toBe("FOOTER");
  });

  it("renders all external links with correct attributes", () => {
    render(<Footer />);
    const artesLink = screen.getByRole("link", { name: /Logo Escuela de Artes/i });
    const ucvLinks = screen.getAllByRole("link", { name: /Universidad Central de Venezuela/i });

    expect(artesLink.getAttribute("href")).toBe("http://www.ucv.ve/artes");
    ucvLinks.forEach((link) => {
      expect(link.getAttribute("href")).toBe("http://www.ucv.ve/");
    });
  });

  it("applies hover effects classes to logo links", () => {
    const { container } = render(<Footer />);
    const logoLinks = container.querySelectorAll("a.grayscale");
    expect(logoLinks.length).toBeGreaterThan(0);
    logoLinks.forEach((link) => {
      expect(link.className).toContain("hover:grayscale-0");
      expect(link.className).toContain("transition-all");
    });
  });
});
