/**
 * E2E tests for article rendering
 * Verifies that articles display correctly without RTF codes
 */
describe("Article Rendering", () => {
  it("should display article content without RTF codes", () => {
    // Visit article 1: ESCLAVOS PROFUGOS
    cy.visit("/article/1");

    // Wait for the page to load and verify h1 title
    cy.get("h1").should("be.visible").and("contain", "ESCLAVOS PROFUGOS");

    // Verify the article content is visible
    cy.get("article").should("be.visible");

    // Verify no RTF codes are visible in the content
    cy.get("article").should("not.contain", "{\\rtf");
    cy.get("article").should("not.contain", "\\ansi");
    cy.get("article").should("not.contain", "\\deff0");
    cy.get("article").should("not.contain", "\\viewkind");
    cy.get("article").should("not.contain", "\\uc1");
    cy.get("article").should("not.contain", "\\pard");

    // Verify specific content from the article is present
    cy.get("article").should("contain", "José de los Reyes");
    cy.get("article").should("contain", "color negro");
    cy.get("article").should("contain", "cantador de fandangos");
  });

  it("should display formatted article title in h1 tag", () => {
    cy.visit("/article/1");

    // Verify h1 title is present with exact content
    cy.get("h1").should("be.visible");
    cy.get("h1")
      .invoke("text")
      .then((text) => {
        const trimmed = text.trim();
        // Verify it's the correct title
        expect(trimmed).to.equal("ESCLAVOS PROFUGOS");
        // Ensure it doesn't contain fallback patterns
        expect(trimmed).to.not.match(/\(Sin Título\).*Articulo #/i);
      });
  });

  it("should display article metadata", () => {
    cy.visit("/article/1");

    // Verify metadata is displayed (date, page number, etc.)
    cy.get("article").should("be.visible");

    // Check for specific metadata
    cy.contains(/Página:/).should("be.visible");
    // Article 1 is on page 4
    cy.contains("Página: 4").should("be.visible");
    cy.contains(/Ref:/).should("be.visible");
    cy.contains("Ref: 1").should("be.visible");
    // Verify year 1837 is displayed
    cy.contains("1837").should("be.visible");
  });

  it("should handle navigation between articles", () => {
    cy.visit("/article/1");

    // Verify first article loads
    cy.get("h1").should("be.visible");

    // Navigate to another article
    cy.visit("/article/2");

    // Verify second article loads
    cy.get("h1").should("be.visible");
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
    cy.get("h1").should("be.visible");
    cy.get("article").should("be.visible");
    cy.get("article").should("not.contain", "{\\rtf");
  });

  it("should display actual article content without errors", () => {
    cy.visit("/article/1");

    // Verify h1 contains the correct title
    cy.get("h1").should("contain", "ESCLAVOS PROFUGOS");

    // Explicit check for common rendering bugs
    cy.get("article").should("not.contain", "[object Object]");
    cy.get("article").should("not.contain", "[object HTMLDivElement]");

    // Verify actual content is present with specific phrases from article 1
    cy.get("article")
      .invoke("text")
      .then((text) => {
        const trimmed = text.trim();
        expect(trimmed).to.not.equal("");
        expect(trimmed.length).to.be.greaterThan(100);

        // Ensure it's not just error messages or placeholders
        expect(trimmed).to.not.contain("Contenido no disponible");
        expect(trimmed).to.not.contain("Error:");

        // Verify specific content from article 1: "ESCLAVOS PROFUGOS"
        expect(trimmed).to.contain("José de los Reyes");
        expect(trimmed).to.contain("color negro");
        expect(trimmed).to.contain("estatura regular");
        expect(trimmed).to.contain("cantador de fandangos");
        expect(trimmed).to.contain("sabe tocar guitarra");

        // Verify the date is present
        expect(trimmed).to.contain("Sábado 2 de diciembre de 1837");
      });
  });
});
