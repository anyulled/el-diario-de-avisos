import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "./hero";

describe("Hero", () => {
  it("renders the updated title and subtitle", () => {
    render(<Hero />);

    expect(screen.getByText("Noticias Musicales en la prensa caraqueña del siglo XIX")).toBeTruthy();
    expect(screen.getByText("Un viaje a través del tiempo, descubriendo las noticias que marcaron la historia musical venezolana.")).toBeTruthy();
  });
});
