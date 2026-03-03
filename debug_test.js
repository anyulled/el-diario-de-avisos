import { describe, expect, it, vi, beforeEach } from "vitest";

function notFound() { throw new Error("NEXT_NOT_FOUND"); }

async function EssayPage() {
  const [essay] = await Promise.all([Promise.resolve(null)]);
  if (!essay) {
    notFound();
  }
}

describe("Test", () => {
  it("should catch", async () => {
    try {
      await EssayPage();
    } catch (e) {
      console.log("CAUGHT", e);
    }
  });
});
