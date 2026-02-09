import { beforeAll, vi } from "vitest";

beforeAll(() => {
  process.env.GEMINI_KEY = "test-gemini-key";
  process.env.GROQ_KEY = "test-groq-key";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
