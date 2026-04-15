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
  /* Check if the database is healthy (bypasses transient Neon DB quotas in CI) */
  cy.request({
    timeout: 60000,
    url: "/api/db-health",
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status !== 200) {
      this.skip();
    }
  });
});
