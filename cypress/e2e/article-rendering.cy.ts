/**
 * E2E tests for article rendering
 * Verifies that articles display correctly without RTF codes
 */
describe("Article Rendering", () => {
  it("should display article content without RTF codes", () => {
    // Visit an article page
    cy.visit("/article/1");

    // Wait for the page to load
    cy.get("h1").should("be.visible");

    // Verify the article content is visible
    cy.get(".prose").should("be.visible");

    // Verify no RTF codes are visible in the content
    cy.get(".prose").should("not.contain", "{\\rtf");
    cy.get(".prose").should("not.contain", "\\ansi");
    cy.get(".prose").should("not.contain", "\\deff0");
    cy.get(".prose").should("not.contain", "\\viewkind");
    cy.get(".prose").should("not.contain", "\\uc1");
    cy.get(".prose").should("not.contain", "\\pard");

    // Verify the content is actually readable (not just raw RTF)
    cy.get(".prose").invoke("text").should("have.length.greaterThan", 50);
  });

  it("should display formatted article title", () => {
    cy.visit("/article/1");

    // Verify title is formatted (should be "Artículo #XXXX" or similar)
    cy.get("h1").should("be.visible");
    cy.get("h1")
      .invoke("text")
      .then((text) => {
        // Title should either be "Artículo #XXXX" or "Sin Título"
        expect(text).to.match(/^(Artículo #\d+|Sin Título)/);
      });
  });

  it("should display article metadata", () => {
    cy.visit("/article/1");

    // Verify metadata is displayed (date, page number, etc.)
    cy.get(".prose").should("be.visible");

    // Check for date display (format: D de Month de YYYY)
    cy.contains(/\d{1,2} de [a-z]+ de \d{4}/i).should("be.visible");
  });

  it("should handle navigation between articles", () => {
    cy.visit("/article/1");

    // Verify first article loads
    cy.get("h1").should("be.visible");

    // Navigate to another article
    cy.visit("/article/2");

    // Verify second article loads
    cy.get("h1").should("be.visible");
    cy.get(".prose").should("be.visible");
    cy.get(".prose").should("not.contain", "{\\rtf");
  });

  it("should display article content with proper typography", () => {
    cy.visit("/article/1");

    // Verify content uses Tailwind prose classes (no inline font styles)
    cy.get(".prose").within(() => {
      // Check that paragraphs exist
      cy.get("p").should("exist");

      // Verify no inline font-size or font-family styles
      cy.get("*[style*='font-size']").should("not.exist");
      cy.get("*[style*='font-family']").should("not.exist");
    });
  });

  it("should handle articles with Spanish special characters", () => {
    cy.visit("/article/1");

    // Verify Spanish characters are displayed correctly
    cy.get(".prose")
      .invoke("text")
      .should("match", /[áéíóúñÁÉÍÓÚÑ]/);
  });

  it("should be responsive on mobile devices", () => {
    // Test mobile viewport
    cy.viewport("iphone-x");
    cy.visit("/article/1");

    // Verify content is visible and readable on mobile
    cy.get("h1").should("be.visible");
    cy.get(".prose").should("be.visible");
    cy.get(".prose").should("not.contain", "{\\rtf");
  });
});
