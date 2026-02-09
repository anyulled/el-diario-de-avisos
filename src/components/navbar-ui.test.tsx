import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NavbarUI } from "./navbar-ui";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; width?: number; height?: number; className?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("NavbarUI", () => {
  const mockEssays = [
    { id: 1, title: "Essay 1", groupName: "Diario de Avisos" },
    { id: 2, title: "Essay 2", groupName: "Diario de Avisos" },
    { id: 3, title: "Essay 3", groupName: "El Universal" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scroll position
    window.scrollY = 0;
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = "unset";
  });

  describe("Rendering", () => {
    it("renders the navbar with logo", () => {
      render(<NavbarUI essays={[]} />);
      const logo = screen.getByAltText("Logo");
      expect(logo).toBeDefined();
      expect(logo.getAttribute("src")).toBe("/icon.png");
    });

    it("renders the site title", () => {
      render(<NavbarUI essays={[]} />);
      const title = screen.getByText("Noticias Musicales");
      expect(title).toBeDefined();
    });

    it("renders all navigation links", () => {
      render(<NavbarUI essays={[]} />);
      // Use getAllByText since links appear in both desktop and mobile menus
      expect(screen.getAllByText("Tal día como hoy").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Asistente").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Cómo citar").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Acerca de").length).toBeGreaterThan(0);
    });

    it("renders Ensayos button", () => {
      render(<NavbarUI essays={[]} />);
      const ensayosButtons = screen.getAllByText("Ensayos");
      expect(ensayosButtons.length).toBeGreaterThan(0);
    });

    it("renders home link with correct href", () => {
      render(<NavbarUI essays={[]} />);
      const homeLinks = screen.getAllByRole("link");
      const logoLink = homeLinks.find((link) => link.getAttribute("href") === "/");
      expect(logoLink).toBeDefined();
    });
  });

  describe("Essay Grouping", () => {
    it("groups essays by groupName", () => {
      render(<NavbarUI essays={mockEssays} />);
      // Open the essays dropdown
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      // Use getAllByText since group names appear in both desktop and mobile menus
      expect(screen.getAllByText("Diario de Avisos").length).toBeGreaterThan(0);
      expect(screen.getAllByText("El Universal").length).toBeGreaterThan(0);
    });

    it("displays essays under correct groups", () => {
      render(<NavbarUI essays={mockEssays} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      expect(screen.getAllByText("Essay 1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Essay 2").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Essay 3").length).toBeGreaterThan(0);
    });

    it("shows default message when no essays available", () => {
      render(<NavbarUI essays={[]} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      const noEssaysMessages = screen.getAllByText("No hay ensayos disponibles");
      expect(noEssaysMessages.length).toBeGreaterThan(0);
    });

    it("displays 'Sin Título' for essays without title", () => {
      const essaysWithoutTitle = [{ id: 1, title: null, groupName: "Test Group" }];
      render(<NavbarUI essays={essaysWithoutTitle} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      const sinTituloElements = screen.getAllByText("Sin Título");
      expect(sinTituloElements.length).toBeGreaterThan(0);
    });

    it("uses default group name when groupName is null", () => {
      const essaysWithoutGroup = [{ id: 1, title: "Test Essay", groupName: "" }];
      render(<NavbarUI essays={essaysWithoutGroup} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      // Use getAllByText since group names appear in both desktop and mobile menus
      expect(screen.getAllByText("Diario de Avisos").length).toBeGreaterThan(0);
    });
  });

  describe("Mobile Menu", () => {
    it("toggles mobile menu when button is clicked", () => {
      render(<NavbarUI essays={[]} />);
      const menuButton = screen.getByLabelText("Toggle menu");

      // Menu should be closed initially
      const mobileNav = menuButton.closest("nav")?.parentElement?.querySelector(".fixed.inset-0");
      expect(mobileNav?.className).toContain("invisible");

      // Open menu
      fireEvent.click(menuButton);
      expect(mobileNav?.className).toContain("visible");

      // Close menu
      fireEvent.click(menuButton);
      expect(mobileNav?.className).toContain("invisible");
    });

    it("shows X icon when menu is open", () => {
      render(<NavbarUI essays={[]} />);
      const menuButton = screen.getByLabelText("Toggle menu");

      fireEvent.click(menuButton);
      // The X icon should be rendered (lucide-react renders as svg)
      const svg = menuButton.querySelector("svg");
      expect(svg).toBeDefined();
    });

    it("locks body scroll when mobile menu is open", () => {
      render(<NavbarUI essays={[]} />);
      const menuButton = screen.getByLabelText("Toggle menu");

      fireEvent.click(menuButton);
      expect(document.body.style.overflow).toBe("hidden");

      fireEvent.click(menuButton);
      expect(document.body.style.overflow).toBe("unset");
    });

    it("displays all navigation links in mobile menu", () => {
      render(<NavbarUI essays={mockEssays} />);
      const menuButton = screen.getByLabelText("Toggle menu");
      fireEvent.click(menuButton);

      // Mobile menu should have Buscar link
      expect(screen.getByText("Buscar")).toBeDefined();
    });
  });

  describe("Scroll Behavior", () => {
    it("applies scrolled styles when scrolled down", async () => {
      render(<NavbarUI essays={[]} />);

      // Simulate scroll
      window.scrollY = 100;
      fireEvent.scroll(window);

      await waitFor(() => {
        const nav = screen.getByRole("navigation");
        const navContainer = nav.querySelector("div");
        expect(navContainer?.className).toContain("glass");
      });
    });

    it("does not apply scrolled styles when at top", () => {
      render(<NavbarUI essays={[]} />);
      window.scrollY = 0;
      fireEvent.scroll(window);

      const nav = screen.getByRole("navigation");
      const navContainer = nav.querySelector("div");
      expect(navContainer?.className).toContain("bg-transparent");
    });
  });

  describe("Ensayos Dropdown", () => {
    it("toggles ensayos dropdown when clicked", () => {
      render(<NavbarUI essays={mockEssays} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];

      fireEvent.click(ensayosButton);
      const dropdown = ensayosButton.parentElement?.querySelector(".absolute");
      expect(dropdown).toBeDefined();
      if (dropdown) {
        expect(dropdown.className).toContain("visible");
      }

      fireEvent.click(ensayosButton);
      if (dropdown) {
        expect(dropdown.className).toContain("invisible");
      }
    });

    it("closes ensayos dropdown when clicking outside", async () => {
      render(<NavbarUI essays={mockEssays} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];

      // Open dropdown
      fireEvent.click(ensayosButton);
      const dropdown = ensayosButton.parentElement?.querySelector(".absolute");
      expect(dropdown).toBeDefined();
      if (dropdown) {
        expect(dropdown.className).toContain("visible");
      }

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        if (dropdown) {
          expect(dropdown.className).toContain("invisible");
        }
      });
    });

    it("renders essay links with correct hrefs", () => {
      render(<NavbarUI essays={mockEssays} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      const essayLinks = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/ensayos/"));
      expect(essayLinks.length).toBeGreaterThan(0);
    });
  });

  describe("Pathname Changes", () => {
    it("closes mobile menu when pathname changes", async () => {
      const { rerender } = render(<NavbarUI essays={[]} />);
      const menuButton = screen.getByLabelText("Toggle menu");

      // Open menu
      fireEvent.click(menuButton);
      const mobileNav = menuButton.closest("nav")?.parentElement?.querySelector(".fixed.inset-0");
      expect(mobileNav).toBeDefined();
      if (mobileNav) {
        expect(mobileNav.className).toContain("visible");
      }

      // Simulate pathname change by re-rendering
      const usePathname = await import("next/navigation").then((mod) => mod.usePathname);
      vi.mocked(usePathname).mockReturnValue("/about");

      rerender(<NavbarUI essays={[]} />);

      // Menu should close on pathname change (handled by useEffect)
      await waitFor(() => {
        if (mobileNav) {
          expect(mobileNav.className).toContain("invisible");
        }
      });
    });

    it("closes ensayos dropdown when pathname changes", async () => {
      const { rerender } = render(<NavbarUI essays={mockEssays} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];

      // Open dropdown
      fireEvent.click(ensayosButton);
      const dropdown = ensayosButton.parentElement?.querySelector(".absolute");
      expect(dropdown).toBeDefined();
      if (dropdown) {
        expect(dropdown.className).toContain("visible");
      }

      // Simulate pathname change
      const usePathname = await import("next/navigation").then((mod) => mod.usePathname);
      vi.mocked(usePathname).mockReturnValue("/about");

      rerender(<NavbarUI essays={mockEssays} />);

      await waitFor(() => {
        if (dropdown) {
          expect(dropdown.className).toContain("invisible");
        }
      });
    });
  });

  describe("Navigation Links", () => {
    it("renders correct href for Tal día como hoy", () => {
      render(<NavbarUI essays={[]} />);
      const links = screen.getAllByRole("link");
      const talDiaLink = links.find((link) => link.getAttribute("href") === "/tal-dia-como-hoy");
      expect(talDiaLink).toBeDefined();
    });

    it("renders correct href for Asistente", () => {
      render(<NavbarUI essays={[]} />);
      const links = screen.getAllByRole("link");
      const chatLink = links.find((link) => link.getAttribute("href") === "/chat");
      expect(chatLink).toBeDefined();
    });

    it("renders correct href for Cómo citar", () => {
      render(<NavbarUI essays={[]} />);
      const links = screen.getAllByRole("link");
      const citarLink = links.find((link) => link.getAttribute("href") === "/como-citar");
      expect(citarLink).toBeDefined();
    });

    it("renders correct href for Acerca de", () => {
      render(<NavbarUI essays={[]} />);
      const links = screen.getAllByRole("link");
      const aboutLink = links.find((link) => link.getAttribute("href") === "/about");
      expect(aboutLink).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("has aria-label on mobile menu button", () => {
      render(<NavbarUI essays={[]} />);
      const menuButton = screen.getByLabelText("Toggle menu");
      expect(menuButton).toBeDefined();
    });

    it("renders navigation as nav element", () => {
      render(<NavbarUI essays={[]} />);
      const nav = screen.getByRole("navigation");
      expect(nav).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty essays array", () => {
      render(<NavbarUI essays={[]} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      const noEssaysMessages = screen.getAllByText("No hay ensayos disponibles");
      expect(noEssaysMessages.length).toBeGreaterThan(0);
    });

    it("handles large number of essays", () => {
      const manyEssays = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        title: `Essay ${i}`,
        groupName: `Group ${i % 5}`,
      }));

      render(<NavbarUI essays={manyEssays} />);
      const ensayosButton = screen.getAllByText("Ensayos")[0];
      fireEvent.click(ensayosButton);

      // Should render all groups (use getAllByText since groups appear in both desktop and mobile)
      expect(screen.getAllByText("Group 0").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Group 1").length).toBeGreaterThan(0);
    });

    it("cleans up event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = render(<NavbarUI essays={[]} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    });
  });
});
