import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ScrollToResults } from "@/components/scroll-to-results";

describe("ScrollToResults", () => {
  it("scrolls smoothly when results are available", () => {
    const container = document.createElement("div");
    container.id = "search-results";
    const scrollIntoView = vi.fn();
    container.scrollIntoView = scrollIntoView;
    document.body.appendChild(container);

    render(<ScrollToResults shouldScroll />);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    container.remove();
  });

  it("does not scroll when no results are available", () => {
    const container = document.createElement("div");
    container.id = "search-results";
    const scrollIntoView = vi.fn();
    container.scrollIntoView = scrollIntoView;
    document.body.appendChild(container);

    render(<ScrollToResults shouldScroll={false} />);

    expect(scrollIntoView).not.toHaveBeenCalled();
    container.remove();
  });
});
