/*
 * Cypress E2E support file
 * This file is processed and loaded automatically before test files
 */

/*
 * Prevent Cypress from failing tests on uncaught exceptions
 */
Cypress.on("uncaught:exception", (_err, _runnable) => {
  /*
   * Returning false here prevents Cypress from failing the test
   */
  return false;
});

before(function () {
  cy.request({
    url: "/api/db-health",
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 503) {
      cy.log("Database health check failed (e.g. Neon DB compute quota exceeded). Skipping all E2E tests.");
      this.skip();
    }
  });
});
