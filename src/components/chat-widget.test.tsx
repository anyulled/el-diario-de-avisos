import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatWidget } from "./chat-widget";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MockChatInterface = (props: any) => <div data-testid="chat-interface" {...props} />;
    return MockChatInterface;
  },
}));

describe("ChatWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null on /chat route", () => {
    vi.mocked(usePathname).mockReturnValue("/chat");
    const { container } = render(<ChatWidget />);
    expect(container.firstChild).toBeNull();
  });

  it("renders closed initially and opens on click", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    render(<ChatWidget />);

    const button = screen.getByRole("button", { name: /Abrir chat/i });
    expect(button).toBeTruthy();

    // Chat interface should not be rendered yet
    expect(screen.queryByTestId("chat-interface")).toBeNull();

    // Click to open
    fireEvent.click(button);

    // Now it should be open
    expect(screen.getByLabelText(/Cerrar chat/i)).toBeTruthy();
    expect(screen.getByTestId("chat-interface")).toBeTruthy();

    // Click to close
    fireEvent.click(screen.getByLabelText(/Cerrar chat/i));

    // It should still be rendered but closed visually (hasOpened remains true)
    expect(screen.getByTestId("chat-interface")).toBeTruthy();
  });
});
