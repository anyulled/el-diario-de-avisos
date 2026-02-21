import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ImageGallery from "./ImageGallery";

vi.mock("yet-another-react-lightbox/styles.css", () => ({}));
vi.mock("yet-another-react-lightbox/plugins/thumbnails.css", () => ({}));

interface MockLightboxProps {
  slides: { src: string; alt?: string }[];
  open: boolean;
  close: () => void;
  index: number;
}
vi.mock("yet-another-react-lightbox", () => {
  return {
    default: ({ slides, open, close, index }: MockLightboxProps) => {
      if (!open) return null;
      return (
        <div data-testid="mock-lightbox">
          <span data-testid="lightbox-current-index">{index}</span>
          <span data-testid="lightbox-slides-length">{slides.length}</span>
          <button onClick={close} data-testid="lightbox-close">
            Close
          </button>
        </div>
      );
    },
  };
});

describe("ImageGallery", () => {
  it("renders a message when no images are provided", () => {
    render(<ImageGallery images={[]} />);
    expect(screen.getByText("No hay imágenes en la galería.")).toBeDefined();
  });

  it("renders the correct number of images", () => {
    const images = [
      { src: "/test1.jpg", alt: "Test Image 1" },
      { src: "/test2.jpg", alt: "Test Image 2" },
    ];
    render(<ImageGallery images={images} />);

    // Check that we have 2 images rendered in the grid
    const imgElements = screen.getAllByRole("img");
    expect(imgElements).toHaveLength(2);
    expect(imgElements[0].getAttribute("alt")).toBe("Test Image 1");
    expect(imgElements[1].getAttribute("alt")).toBe("Test Image 2");
  });

  it("opens lightbox when an image is clicked", () => {
    const images = [
      { src: "/test1.jpg", alt: "Test Image 1" },
      { src: "/test2.jpg", alt: "Test Image 2" },
    ];
    render(<ImageGallery images={images} />);

    expect(screen.queryByTestId("mock-lightbox")).toBeNull();

    const imgElements = screen.getAllByRole("img");
    fireEvent.click(imgElements[1]);

    expect(screen.getByTestId("mock-lightbox")).toBeDefined();
    expect(screen.getByTestId("lightbox-current-index").textContent).toBe("1");
    expect(screen.getByTestId("lightbox-slides-length").textContent).toBe("2");
  });

  it("closes lightbox when close button is clicked", () => {
    const images = [{ src: "/test1.jpg", alt: "Test Image 1" }];
    render(<ImageGallery images={images} />);

    fireEvent.click(screen.getByRole("img"));
    expect(screen.getByTestId("mock-lightbox")).toBeDefined();

    fireEvent.click(screen.getByTestId("lightbox-close"));
    expect(screen.queryByTestId("mock-lightbox")).toBeNull();
  });
});
