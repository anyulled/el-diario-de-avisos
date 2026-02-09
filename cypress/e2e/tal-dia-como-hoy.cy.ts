describe("Tal día como hoy - HTML Stripping", () => {
  beforeEach(() => {
    cy.visit("/tal-dia-como-hoy");
  });

  it("should not display HTML tags in article extracts", () => {
    // Check all slide extracts
    cy.get(".swiper-slide").each(($el) => {
      cy.wrap($el)
        .find(".prose p")
        .then(($p) => {
          const text = $p.text();
          // Check for common HTML tags leaking in text
          expect(text).to.not.contain("<i>");
          expect(text).to.not.contain("</i>");
          expect(text).to.not.contain("<b>");
          expect(text).to.not.contain("</b>");
          expect(text).to.not.contain("<p>");
          expect(text).to.not.contain("</p>");
        });
    });
  });
});
