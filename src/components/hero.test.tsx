import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the updated title and subtitle", () => {
    render(<Hero />);

    expect(screen.getByText("Noticias Musicales en el Diario de Avisos")).toBeTruthy();
    expect(screen.getByText("Un viaje a través del tiempo, descubriendo las noticias que marcaron la historia musical venezolana.")).toBeTruthy();
  });
});
