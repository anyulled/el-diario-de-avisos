import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchFilters } from "@/components/search-filters";

const replaceMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => currentSearchParams,
}));

describe("SearchFilters date range", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    currentSearchParams = new URLSearchParams();
  });

  it("uses local date state when sending the range", async () => {
    render(
      <SearchFilters
        types={[
          {
            id: 1,
            name: "Noticias",
            pubId: 1,
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Fecha desde"), { target: { value: "2024-02-01" } });
    fireEvent.change(screen.getByLabelText("Fecha hasta"), { target: { value: "2024-02-10" } });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalled();
    });

    const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    const url = new URL(lastCall, "http://localhost");
    const params = url.searchParams;

    expect(params.get("dateFrom")).toBe("2024-02-01");
    expect(params.get("dateTo")).toBe("2024-02-10");
  });

  it("shows an error when the range is invalid", async () => {
    render(
      <SearchFilters
        types={[
          {
            id: 1,
            name: "Noticias",
            pubId: 1,
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Fecha desde"), { target: { value: "2024-03-05" } });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalled();
    });

    replaceMock.mockClear();

    fireEvent.change(screen.getByLabelText("Fecha hasta"), { target: { value: "2024-03-01" } });

    await waitFor(() => {
      expect(screen.getByText("La fecha inicial no puede ser posterior a la fecha final.")).toBeTruthy();
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("uses the selected type label when present", () => {
    currentSearchParams = new URLSearchParams("type=1");

    render(
      <SearchFilters
        types={[
          {
            id: 1,
            name: "Noticias",
            pubId: 1,
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /Noticias/i })).toBeTruthy();
  });
});
