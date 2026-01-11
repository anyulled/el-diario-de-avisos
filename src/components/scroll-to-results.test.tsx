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

    const { rerender } = render(<ScrollToResults shouldScroll scrollKey="q=agua" />);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    rerender(<ScrollToResults shouldScroll scrollKey="q=agua" />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerender(<ScrollToResults shouldScroll scrollKey="q=agua&type=1" />);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    container.remove();
  });

  it("does not scroll when no results are available", () => {
    const container = document.createElement("div");
    container.id = "search-results";
    const scrollIntoView = vi.fn();
    container.scrollIntoView = scrollIntoView;
    document.body.appendChild(container);

    render(<ScrollToResults shouldScroll={false} scrollKey="q=agua" />);

    expect(scrollIntoView).not.toHaveBeenCalled();
    container.remove();
  });
});
