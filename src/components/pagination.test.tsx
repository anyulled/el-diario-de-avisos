import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Pagination } from "./pagination";

// Mock Next.js navigation hooks
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock Lucide icons to avoid rendering issues and for testing presence
vi.mock("lucide-react", () => ({
  ChevronLeft: () => <span data-testid="chevron-left" />,
  ChevronRight: () => <span data-testid="chevron-right" />,
  ChevronsLeft: () => <span data-testid="chevrons-left" />,
  ChevronsRight: () => <span data-testid="chevrons-right" />,
}));

describe("Pagination Component", () => {
  const mockRouterPush = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useRouter).mockReturnValue({ push: mockRouterPush } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as any);
  });

  it("renders nothing if total pages is 0 or 1", () => {
    const { container } = render(<Pagination total={10} pageSize={10} currentPage={1} />);
    expect(container.firstChild).toBeNull();

    const { container: container2 } = render(<Pagination total={0} pageSize={10} currentPage={1} />);
    expect(container2.firstChild).toBeNull();
  });

  it("renders pagination controls when total pages > 1", () => {
    render(<Pagination total={20} pageSize={10} currentPage={1} />);

    expect(screen.getByTitle("Primera página")).toBeDefined();
    expect(screen.getByTitle("Anterior")).toBeDefined();
    expect(screen.getByTitle("Siguiente")).toBeDefined();
    expect(screen.getByTitle("Última página")).toBeDefined();
    expect(screen.getByText(/Página 1 de 2/)).toBeDefined();
    expect(screen.getByText(/Total 20 resultados/)).toBeDefined();
  });

  it("disables 'First' and 'Previous' buttons on the first page", () => {
    render(<Pagination total={50} pageSize={10} currentPage={1} />);

    expect((screen.getByTitle("Primera página") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTitle("Anterior") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTitle("Siguiente") as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByTitle("Última página") as HTMLButtonElement).disabled).toBe(false);
  });

  it("disables 'Next' and 'Last' buttons on the last page", () => {
    render(<Pagination total={50} pageSize={10} currentPage={5} />);

    expect((screen.getByTitle("Primera página") as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByTitle("Anterior") as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByTitle("Siguiente") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTitle("Última página") as HTMLButtonElement).disabled).toBe(true);
  });

  it("calls router.push with correct URL when clicking a page number", async () => {
    render(<Pagination total={50} pageSize={10} currentPage={1} />);

    const page2Button = screen.getByText("2");
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/?page=2");
    });
  });

  it("calls router.push with correct URL when clicking 'Next'", async () => {
    render(<Pagination total={50} pageSize={10} currentPage={1} />);

    const nextButton = screen.getByTitle("Siguiente");
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/?page=2");
    });
  });

  it("calls router.push with correct URL when clicking 'Previous'", async () => {
    render(<Pagination total={50} pageSize={10} currentPage={2} />);

    const prevButton = screen.getByTitle("Anterior");
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/?page=1");
    });
  });

  it("calls router.push with correct URL when clicking 'First'", async () => {
    render(<Pagination total={50} pageSize={10} currentPage={3} />);

    const firstButton = screen.getByTitle("Primera página");
    fireEvent.click(firstButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/?page=1");
    });
  });

  it("calls router.push with correct URL when clicking 'Last'", async () => {
    render(<Pagination total={50} pageSize={10} currentPage={1} />);

    const lastButton = screen.getByTitle("Última página");
    fireEvent.click(lastButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/?page=5");
    });
  });

  it("updates existing search params", async () => {
    const existingParams = new URLSearchParams();
    existingParams.set("q", "search-term");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useSearchParams).mockReturnValue(existingParams as any);

    render(<Pagination total={50} pageSize={10} currentPage={1} />);

    const page2Button = screen.getByText("2");
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/?q=search-term&page=2");
    });
  });

  it("calculates total pages correctly", () => {
    render(<Pagination total={55} pageSize={10} currentPage={1} />);
    expect(screen.getByText(/Página 1 de 6/)).toBeDefined();
  });

  // Test logic for rendering visible page numbers (maxVisible = 5)
  describe("Page Number Logic", () => {
    it("shows pages 1-5 when current page is 1", () => {
      render(<Pagination total={100} pageSize={10} currentPage={1} />);
      // Should see 1, 2, 3, 4, 5
      expect(screen.getByText("1")).toBeDefined();
      expect(screen.getByText("5")).toBeDefined();
      expect(screen.queryByText("6")).toBeNull();
    });

    it("shows pages centered around current page (e.g., current 5, total 10)", () => {
      /*
       * MaxVisible 5. Middle is 5. Should show 3, 4, 5, 6, 7.
       * Logic:
       * half = 2
       * initialStart = 5 - 2 = 3
       * initialEnd = 3 + 5 - 1 = 7. min(10, 7) = 7.
       * start = max(1, 7 - 5 + 1) = 3.
       * end = min(10, 7) = 7.
       */
      render(<Pagination total={100} pageSize={10} currentPage={5} />);
      expect(screen.getByText("3")).toBeDefined();
      expect(screen.getByText("4")).toBeDefined();
      expect(screen.getByText("5")).toBeDefined();
      expect(screen.getByText("6")).toBeDefined();
      expect(screen.getByText("7")).toBeDefined();

      expect(screen.queryByText("2")).toBeNull();
      expect(screen.queryByText("8")).toBeNull();
    });

    it("shows last 5 pages when current page is near the end", () => {
      /*
       * Total 10 pages. Current 10.
       * Should show 6, 7, 8, 9, 10
       */
      render(<Pagination total={100} pageSize={10} currentPage={10} />);

      expect(screen.getByText("6")).toBeDefined();
      expect(screen.getByText("10")).toBeDefined();
      expect(screen.queryByText("5")).toBeNull();
    });
  });
});
