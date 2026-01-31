/**
 * E2E tests for article rendering
 * Verifies that articles display correctly without RTF codes
 */
describe("Article Rendering", () => {
  it("should display article content without RTF codes", () => {
    // Visit an article page
    cy.visit("/article/1");

    // Wait for the page to load
    cy.get("h2").should("be.visible");

    // Verify the article content is visible
    cy.get("article").should("be.visible");

    // Verify no RTF codes are visible in the content
    cy.get("article").should("not.contain", "{\\rtf");
    cy.get("article").should("not.contain", "\\ansi");
    cy.get("article").should("not.contain", "\\deff0");
    cy.get("article").should("not.contain", "\\viewkind");
    cy.get("article").should("not.contain", "\\uc1");
    cy.get("article").should("not.contain", "\\pard");

    // Verify the content is actually readable (not just raw RTF)
    cy.get("article").invoke("text").should("have.length.greaterThan", 10);
  });

  it("should display formatted article title", () => {
    cy.visit("/article/1");

    // Verify title is present and cleaned when needed
    cy.get("h2").should("be.visible");
    cy.get("h2")
      .invoke("text")
      .then((text) => {
        const trimmed = text.trim();
        expect(trimmed).to.not.equal("");
        expect(trimmed).to.not.match(/\(Sin Título\).*Articulo #/i);
      });
  });

  it("should display article metadata", () => {
    cy.visit("/article/1");

    // Verify metadata is displayed (date, page number, etc.)
    cy.get("article").should("be.visible");

    // Check for metadata labels
    cy.contains(/Página:/).should("be.visible");
    cy.contains(/Ref:/).should("be.visible");
    cy.contains(/\d{4}/).should("be.visible");
  });

  it("should handle navigation between articles", () => {
    cy.visit("/article/1");

    // Verify first article loads
    cy.get("h2").should("be.visible");

    // Navigate to another article
    cy.visit("/article/2");

    // Verify second article loads
    cy.get("h2").should("be.visible");
    cy.get("article").should("be.visible");
    cy.get("article").should("not.contain", "{\\rtf");
  });

  it("should display article content with proper typography", () => {
    cy.visit("/article/1");

    // Verify content uses Tailwind prose classes (no inline font styles)
    cy.get("article").within(() => {
      // Check that paragraphs exist
      cy.get("p").should("exist");

      // Verify no inline font-size or font-family styles
      cy.get("*[style*='font-size']").should("not.exist");
      cy.get("*[style*='font-family']").should("not.exist");
    });
  });

  it("should handle articles with Spanish special characters", () => {
    cy.visit("/article/1");

    // Verify Spanish characters are displayed correctly (e.g., "Página" in metadata)
    cy.contains("Página").should("be.visible");
  });

  it("should be responsive on mobile devices", () => {
    // Test mobile viewport
    cy.viewport("iphone-x");
    cy.visit("/article/1");

    // Verify content is visible and readable on mobile
    cy.get("h2").should("be.visible");
    cy.get("article").should("be.visible");
    cy.get("article").should("not.contain", "{\\rtf");
  });

  it("should not display '[object Object]' in article content", () => {
    cy.visit("/article/1");

    // Explicit check for the bug
    cy.get("article").should("not.contain", "[object Object]");
    cy.get("article").should("not.contain", "[object HTMLDivElement]");

    // Verify actual content is present (article 1 is "ESCLAVOS PROFUGOS")
    cy.get("article")
      .invoke("text")
      .then((text) => {
        const trimmed = text.trim();
        expect(trimmed).to.not.equal("");
        expect(trimmed.length).to.be.greaterThan(50);
        // Ensure it's not just error messages or placeholders
        expect(trimmed).to.not.contain("Contenido no disponible");
        expect(trimmed).to.not.contain("Error:");
        // Verify actual article content is present (from article 1: "ESCLAVOS PROFUGOS")
        expect(trimmed).to.contain("José de los Reyes");
      });
  });
});
