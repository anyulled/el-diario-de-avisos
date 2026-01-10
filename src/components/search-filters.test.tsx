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

  it("uses local date state when sending the range on blur", async () => {
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

    expect(replaceMock).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText("Fecha hasta"));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalled();
    });

    const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    const url = new URL(lastCall, "http://localhost");
    const params = url.searchParams;

    expect(params.get("dateFrom")).toBe("2024-02-01");
    expect(params.get("dateTo")).toBe("2024-02-10");
  });

  it("shows an error when the range is invalid on blur", async () => {
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
    fireEvent.change(screen.getByLabelText("Fecha hasta"), { target: { value: "2024-03-01" } });

    expect(replaceMock).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText("Fecha hasta"));

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

  it("defaults to oldest-first sorting when no sort param is present", () => {
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

    const [sortSelect] = screen.getAllByRole("combobox");

    expect((sortSelect as HTMLSelectElement).value).toBe("date_asc");
  });

  it("only updates text search when the search button is pressed", () => {
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

    fireEvent.change(screen.getByPlaceholderText("Buscar por palabra clave o texto..."), { target: { value: "  agua  " } });
    expect(replaceMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(replaceMock).toHaveBeenCalled();
    const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    const url = new URL(lastCall, "http://localhost");

    expect(url.searchParams.get("text")).toBe("agua");
  });

  it("updates sort, page size, and type filters", () => {
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

    const [sortSelect, pageSizeSelect] = screen.getAllByRole("combobox");

    fireEvent.change(sortSelect, { target: { value: "date_desc" } });
    let lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    let url = new URL(lastCall, "http://localhost");

    expect(url.searchParams.get("sort")).toBe("date_desc");

    fireEvent.change(pageSizeSelect, { target: { value: "50" } });
    lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    url = new URL(lastCall, "http://localhost");
    expect(url.searchParams.get("pageSize")).toBe("50");

    const typeToggle = screen.getByRole("button", { name: /Tipo de Noticia/i });
    fireEvent.click(typeToggle);

    const typeRadio = screen.getByRole("radio", { name: "Noticias" });
    fireEvent.click(typeRadio);

    lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    url = new URL(lastCall, "http://localhost");
    expect(url.searchParams.get("type")).toBe("1");
  });
});
