import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MemberCard } from "./member-card";

vi.mock("next/image", () => ({
  default: (props: { alt?: string; src?: string }) => <span data-testid="next-image" data-alt={props.alt} data-src={props.src} />,
}));

describe("MemberCard", () => {
  it("renders the full name, photo, and resume", () => {
    render(<MemberCard fullName="Ana Torres" subtitle="Tutora" photoPath="/images/ana.jpg" resume="Docente universitaria." fallbackLetter="T" />);

    expect(screen.getByText("Ana Torres")).toBeTruthy();
    expect(screen.getByText("Tutora")).toBeTruthy();
    expect(screen.getByText("Docente universitaria.")).toBeTruthy();
    const image = screen.getByTestId("next-image");
    expect(image.getAttribute("data-alt")).toBe("Ana Torres");
    expect(image.getAttribute("data-src")).toBe("/images/ana.jpg");
  });

  it("renders fallback avatar and muted subtitle", () => {
    const { container } = render(
      <MemberCard firstName="Luis" lastName="Mora" subtitle="Facultad de Artes" subtitleTone="muted" eyebrow="Departamento de Musica" fallbackLetter="I" />,
    );

    expect(screen.getByText("Luis Mora")).toBeTruthy();
    expect(screen.getByText("Facultad de Artes")).toBeTruthy();
    expect(screen.getByText("Departamento de Musica")).toBeTruthy();
    expect(screen.getByText("I")).toBeTruthy();

    const subtitle = screen.getByText("Facultad de Artes");
    expect(subtitle.className).toContain("text-gray-500");

    const headerRow = container.querySelector(".flex.items-start.gap-4");
    expect(headerRow?.className).toContain("mb-4");
  });

  it("omits spacing when there is no resume or eyebrow", () => {
    const { container } = render(<MemberCard fullName="Sin Meta" subtitle="Rol" fallbackLetter="M" />);

    const headerRow = container.querySelector(".flex.items-start.gap-4");
    expect(headerRow?.className).not.toContain("mb-4");
  });
});
