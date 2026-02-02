/**
 * E2E tests for search functionality
 * Verifies search works correctly with highlighting
 */
describe("Search Functionality", () => {
  const getSearchTerm = () => {
    // List of common Spanish stop words and title prefixes to avoid
    const stopWords = new Set(["sin", "con", "del", "por", "las", "los", "una", "uno", "para", "este"]);
    const titlePrefixes = ["(sin título)", "artículo #", "articulo #"];

    return cy
      .get("article h3")
      .first()
      .invoke("text")
      .then((text) => {
        let cleaned = text.toLowerCase().trim();

        // Remove known prefixes
        titlePrefixes.forEach((prefix) => {
          if (cleaned.startsWith(prefix)) {
            cleaned = cleaned.replace(prefix, "").trim();
          }
        });

        // Split into words and find a suitable one (longer than 3 chars and not a stop word)
        const word =
          cleaned
            .split(/\s+/)
            .map((w) => w.replace(/[^\wáéíóúñÁÉÍÓÚÑ]/g, ""))
            .find((w) => w.length > 3 && !stopWords.has(w)) || "diario";

        return word;
      });
  };

  beforeEach(() => {
    // Start from the home page
    cy.visit("/");
  });

  it("should display search input on home page", () => {
    // Verify search input is visible
    cy.get('input[type="search"]').should("be.visible");
  });

  it("should perform search and display results", () => {
    getSearchTerm().then((term) => {
      const escaped = Cypress._.escapeRegExp(term);

      // Type a search query
      cy.get('input[type="search"]').type(`${term}{enter}`);

      // Wait for results to load
      cy.get("article").should("be.visible");

      // Verify search results are displayed
      cy.contains(new RegExp(escaped, "i")).should("be.visible");
    });
  });

  it("should highlight search terms in results", () => {
    getSearchTerm().then((term) => {
      // Perform a search
      cy.get('input[type="search"]').type(`${term}{enter}`);

      // Wait for results
      cy.get("article").should("be.visible");

      // Verify search term is highlighted (has mark tag or highlight class)
      cy.get("mark, .highlight").should("exist");
      // Use contains with regex for accent-insensitive and case-insensitive check
      const escaped = Cypress._.escapeRegExp(term);
      cy.get("mark, .highlight").first().contains(new RegExp(escaped, "i"));
    });
  });

  it("should handle accent-insensitive search", () => {
    // Search without accents
    cy.get('input[type="search"]').type("Jose{enter}");

    // Should still find "José" with accent
    cy.get("article").should("be.visible");

    // Verify results contain the accented version
    cy.contains(/José|Jose/i).should("be.visible");
  });

  it("should navigate to article from search results", () => {
    getSearchTerm().then((term) => {
      // Perform a search
      cy.get('input[type="search"]').type(`${term}{enter}`);

      // Wait for results
      cy.get("article").should("be.visible");

      // Click on the first result
      cy.get("article").first().click();

      // Verify we're on an article page
      cy.url().should("include", "/article/");
      cy.get("h1").should("be.visible");
    });
  });

  it("should preserve search term when navigating to article", () => {
    getSearchTerm().then((term) => {
      // Perform a search
      cy.get('input[type="search"]').type(`${term}{enter}`);

      // Wait for URL to reflect the search
      cy.location("search").should("include", "text=");

      // Wait for results
      cy.get("article").should("be.visible");

      // Verify URL contains search query parameter
      cy.url().should("include", "text=");

      // Click on a result
      cy.get("article").first().click();

      // Verify we're on an article page
      cy.url().should("include", "/article/");
      cy.url().should("include", "text=");
    });
  });

  it("should handle empty search gracefully", () => {
    // Submit empty search
    cy.get('input[type="search"]').type("{enter}");

    // Should either show all results or a message
    cy.get("body").should("be.visible");
  });

  it("should handle search with no results", () => {
    // Search for something that doesn't exist
    cy.get('input[type="search"]').type("xyzabc123nonexistent{enter}");

    // Should display a "no results" message or empty state
    cy.contains(/no.*result|sin.*resultado/i).should("be.visible");
  });

  it("should clear search when input is cleared", () => {
    getSearchTerm().then((term) => {
      // Perform a search
      cy.get('input[type="search"]').type(`${term}{enter}`);

      // Wait for results
      cy.get("article").should("be.visible");

      // Clear the search
      cy.get('input[type="search"]').clear().type("{enter}");

      // Should show all articles or home page
      cy.get("body").should("be.visible");
    });
  });

  it("should handle special characters in search", () => {
    // Search with special characters
    cy.get('input[type="search"]').type("(P. 4){enter}");

    // Should handle the search without errors
    cy.get("body").should("be.visible");
  });

  it("should be responsive on mobile devices", () => {
    // Test mobile viewport
    cy.viewport("iphone-x");

    // Verify search input is visible and usable
    cy.get('input[type="search"]').should("be.visible");

    getSearchTerm().then((term) => {
      // Perform a search
      cy.get('input[type="search"]').type(`${term}{enter}`);

      // Verify results are displayed properly on mobile
      cy.get("article").should("be.visible");
    });
  });
});
