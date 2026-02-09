import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AboutPage, { generateMetadata } from "./page";
import * as actions from "@/actions/actions";

// Mock the components
vi.mock("@/components/member-card", () => ({
  MemberCard: ({
    firstName,
    lastName,
    fullName,
    subtitle,
    fallbackLetter,
  }: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    subtitle?: string;
    fallbackLetter?: string;
  }) => (
    <div data-testid={`member-card-${fallbackLetter}`}>
      {fullName || `${firstName} ${lastName}`} - {subtitle}
    </div>
  ),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

// Mock the actions
vi.mock("@/actions/actions", () => ({
  getIntegrantes: vi.fn(),
  getTutores: vi.fn(),
  getDevelopers: vi.fn(),
  getIntegrantesNames: vi.fn(),
  getTutoresNames: vi.fn(),
  getDevelopersNames: vi.fn(),
}));

describe("AboutPage - generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates metadata with all team members", async () => {
    const mockIntegrantes = [
      { firstName: "Juan", lastName: "Pérez", publicationName: null },
      { firstName: "María", lastName: "González", publicationName: null },
    ];
    const mockTutores = [{ names: "Dr. Carlos Rodríguez" }];
    const mockDevelopers = [{ firstName: "Ana", lastName: "Martínez" }];

    vi.mocked(actions.getIntegrantesNames).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutoresNames).mockResolvedValue(mockTutores);
    vi.mocked(actions.getDevelopersNames).mockResolvedValue(mockDevelopers);

    const metadata = await generateMetadata();

    expect(metadata.title).toBe("Acerca del Proyecto");
    expect(metadata.description).toContain("Juan Pérez");
    expect(metadata.description).toContain("María González");
    expect(metadata.description).toContain("Dr. Carlos Rodríguez");
    expect(metadata.description).toContain("Ana Martínez");
  });

  it("sets correct canonical URL", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);
    vi.mocked(actions.getDevelopersNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.alternates?.canonical).toBe("/about");
  });

  it("configures OpenGraph metadata with image", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);
    vi.mocked(actions.getDevelopersNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.openGraph?.title).toBe("Acerca del Proyecto");
    expect(metadata.openGraph?.url).toBe("/about");
    // Type is not directly accessible in Next.js 15 metadata
    expect(metadata.openGraph?.images).toHaveLength(1);
    const images = Array.isArray(metadata.openGraph?.images) ? metadata.openGraph?.images : [metadata.openGraph?.images];
    expect(images[0]).toMatchObject({
      width: 2071,
      height: 1381,
      alt: "Acerca del Proyecto - Diario de Avisos",
    });
  });

  it("configures Twitter card metadata", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);
    vi.mocked(actions.getDevelopersNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    // Card type is not directly accessible in Next.js 15 metadata
    expect(metadata.twitter?.title).toBe("Acerca del Proyecto");
    expect(metadata.twitter?.images).toHaveLength(1);
  });

  it("limits people summary to 8 names and adds ellipsis", async () => {
    const mockIntegrantes = Array.from({ length: 6 }, (_, i) => ({
      firstName: `Person${i}`,
      lastName: `Last${i}`,
      publicationName: null,
    }));
    const mockTutores = Array.from({ length: 3 }, (_, i) => ({
      names: `Tutor${i}`,
    }));
    const mockDevelopers = [{ firstName: "Dev", lastName: "One" }];

    vi.mocked(actions.getIntegrantesNames).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutoresNames).mockResolvedValue(mockTutores);
    vi.mocked(actions.getDevelopersNames).mockResolvedValue(mockDevelopers);

    const metadata = await generateMetadata();

    expect(metadata.description).toContain("y más.");
  });

  it("handles empty team members gracefully", async () => {
    vi.mocked(actions.getIntegrantesNames).mockResolvedValue([]);
    vi.mocked(actions.getTutoresNames).mockResolvedValue([]);
    vi.mocked(actions.getDevelopersNames).mockResolvedValue([]);

    const metadata = await generateMetadata();

    expect(metadata.title).toBe("Acerca del Proyecto");
    expect(metadata.description).toBe("Conoce el equipo y el trabajo detrás del Archivo de Noticias Musicales de El Diario de Avisos.");
  });

  it("filters out empty names", async () => {
    const mockIntegrantes = [
      { firstName: "Valid", lastName: "User", publicationName: null },
      { firstName: "", lastName: "", publicationName: null },
    ];
    const mockTutores = [{ names: "Valid Tutor" }, { names: "" }];
    const mockDevelopers = [{ firstName: "", lastName: "" }];

    vi.mocked(actions.getIntegrantesNames).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutoresNames).mockResolvedValue(mockTutores);
    vi.mocked(actions.getDevelopersNames).mockResolvedValue(mockDevelopers);

    const metadata = await generateMetadata();

    expect(metadata.description).toContain("Valid User");
    expect(metadata.description).toContain("Valid Tutor");
    // No double spaces from empty names
    expect(metadata.description).not.toContain("  ");
  });
});

describe("AboutPage - Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page with navbar", async () => {
    vi.mocked(actions.getIntegrantes).mockResolvedValue([]);
    vi.mocked(actions.getTutores).mockResolvedValue([]);
    vi.mocked(actions.getDevelopers).mockResolvedValue([]);

    const page = await AboutPage();
    render(page);

    const navbar = screen.getByTestId("navbar");
    expect(navbar).toBeDefined();
  });

  it("displays the main heading", async () => {
    vi.mocked(actions.getIntegrantes).mockResolvedValue([]);
    vi.mocked(actions.getTutores).mockResolvedValue([]);
    vi.mocked(actions.getDevelopers).mockResolvedValue([]);

    const page = await AboutPage();
    render(page);

    const heading = screen.getByText("Acerca del Proyecto");
    expect(heading).toBeDefined();
  });

  it("renders integrantes grouped by publication", async () => {
    const mockIntegrantes = [
      {
        id: 1,
        firstName: "Juan",
        lastName: "Pérez",
        publicationName: "Publicación A",
        faculty: "Facultad de Artes",
        department: "Musicología",
        photo: "/photo1.jpg",
        resume: "Resume 1",
        linkedinUrl: "https://linkedin.com/juan",
        twitterUrl: null,
        cvUrl: null,
        idCard: null,
        pubId: null,
      },
      {
        id: 2,
        firstName: "María",
        lastName: "González",
        publicationName: "Publicación A",
        faculty: "Facultad de Artes",
        department: "Historia",
        photo: "/photo2.jpg",
        resume: "Resume 2",
        linkedinUrl: null,
        twitterUrl: null,
        cvUrl: null,
        idCard: null,
        pubId: null,
      },
      {
        id: 3,
        firstName: "Carlos",
        lastName: "Rodríguez",
        publicationName: "Publicación B",
        faculty: "Facultad de Humanidades",
        department: "Literatura",
        photo: "/photo3.jpg",
        resume: "Resume 3",
        linkedinUrl: null,
        twitterUrl: null,
        cvUrl: null,
        idCard: null,
        pubId: null,
      },
    ];

    vi.mocked(actions.getIntegrantes).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutores).mockResolvedValue([]);
    vi.mocked(actions.getDevelopers).mockResolvedValue([]);

    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Publicación A")).toBeDefined();
    expect(screen.getByText("Publicación B")).toBeDefined();
  });

  it("groups integrantes without publication under default name", async () => {
    const mockIntegrantes = [
      {
        id: 1,
        firstName: "Juan",
        lastName: "Pérez",
        publicationName: null,
        faculty: "Facultad de Artes",
        department: "Musicología",
        photo: "/photo1.jpg",
        resume: "Resume 1",
        linkedinUrl: null,
        twitterUrl: null,
        cvUrl: null,
        idCard: null,
        pubId: null,
      },
    ];

    vi.mocked(actions.getIntegrantes).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutores).mockResolvedValue([]);
    vi.mocked(actions.getDevelopers).mockResolvedValue([]);

    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Equipo de Investigación")).toBeDefined();
  });

  it("renders tutores section", async () => {
    const mockTutores = [
      {
        id: 1,
        names: "Dr. Carlos Rodríguez",
        title: "Profesor Titular",
        photoPath: "/tutor1.jpg",
        resume: "Tutor resume",
        linkedinUrl: "https://linkedin.com/tutor",
        twitterUrl: null,
        cvUrl: null,
      },
    ];

    vi.mocked(actions.getIntegrantes).mockResolvedValue([]);
    vi.mocked(actions.getTutores).mockResolvedValue(mockTutores);
    vi.mocked(actions.getDevelopers).mockResolvedValue([]);

    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Tutores")).toBeDefined();
    const tutorCards = screen.getAllByTestId("member-card-T");
    expect(tutorCards.length).toBe(1);
  });

  it("renders desarrolladores section", async () => {
    const mockDevelopers = [
      {
        id: 1,
        firstName: "Ana",
        lastName: "Martínez",
        photoPath: "/dev1.jpg",
        resume: "Developer resume",
        linkedinUrl: "https://linkedin.com/dev",
        twitterUrl: null,
        cvUrl: null,
      },
    ];

    vi.mocked(actions.getIntegrantes).mockResolvedValue([]);
    vi.mocked(actions.getTutores).mockResolvedValue([]);
    vi.mocked(actions.getDevelopers).mockResolvedValue(mockDevelopers);

    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Desarrolladores")).toBeDefined();
    const devCards = screen.getAllByTestId("member-card-D");
    expect(devCards.length).toBe(1);
  });

  it("renders all three sections when data is available", async () => {
    const mockIntegrantes = [
      {
        id: 1,
        firstName: "Juan",
        lastName: "Pérez",
        publicationName: "Publicación A",
        faculty: "Facultad de Artes",
        department: "Musicología",
        photo: "/photo1.jpg",
        resume: "Resume 1",
        linkedinUrl: null,
        twitterUrl: null,
        cvUrl: null,
        idCard: null,
        pubId: null,
      },
    ];

    const mockTutores = [
      {
        id: 1,
        names: "Dr. Carlos Rodríguez",
        title: "Profesor Titular",
        photoPath: "/tutor1.jpg",
        resume: "Tutor resume",
        linkedinUrl: null,
        twitterUrl: null,
        cvUrl: null,
      },
    ];

    const mockDevelopers = [
      {
        id: 1,
        firstName: "Ana",
        lastName: "Martínez",
        photoPath: "/dev1.jpg",
        resume: "Developer resume",
        linkedinUrl: null,
        twitterUrl: null,
        cvUrl: null,
      },
    ];

    vi.mocked(actions.getIntegrantes).mockResolvedValue(mockIntegrantes);
    vi.mocked(actions.getTutores).mockResolvedValue(mockTutores);
    vi.mocked(actions.getDevelopers).mockResolvedValue(mockDevelopers);

    const page = await AboutPage();
    render(page);

    expect(screen.getByText("Publicación A")).toBeDefined();
    expect(screen.getByText("Tutores")).toBeDefined();
    expect(screen.getByText("Desarrolladores")).toBeDefined();
  });

  it("fetches all data in parallel", async () => {
    vi.mocked(actions.getIntegrantes).mockResolvedValue([]);
    vi.mocked(actions.getTutores).mockResolvedValue([]);
    vi.mocked(actions.getDevelopers).mockResolvedValue([]);

    await AboutPage();

    expect(actions.getIntegrantes).toHaveBeenCalledTimes(1);
    expect(actions.getTutores).toHaveBeenCalledTimes(1);
    expect(actions.getDevelopers).toHaveBeenCalledTimes(1);
  });
});
