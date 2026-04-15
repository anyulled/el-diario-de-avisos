const fs = require('fs');
const path = 'cypress/support/e2e.ts';

let content = fs.readFileSync(path, 'utf8');

// The DB query might take more than the default 30000ms if the DB is asleep.
content = content.replace(
  'cy.request({',
  'cy.request({\n    timeout: 60000,'
);

fs.writeFileSync(path, content);
