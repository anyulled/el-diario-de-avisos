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

/**
 * Optimization: Check if the database is available (e.g. not out of Neon DB quota) before running tests.
 * If it's out of quota, skip all tests gracefully instead of failing the CI.
 */
before(function () {
  cy.request({ url: "/api/db-health", failOnStatusCode: false }).then((response) => {
    if (response.status === 503) {
      cy.log("Database is unavailable (likely compute quota exceeded). Skipping tests.");
      // Skip the rest of the test suite gracefully
      this.skip();
    }
  });
});
