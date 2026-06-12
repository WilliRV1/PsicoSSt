import './commands'

// Warm up the dev server before tests run.
// Next.js Turbopack compiles routes lazily - the first request triggers compilation
// which can take 30+ seconds. We warm up key routes before the test suite starts.
before(() => {
    // Hit key routes to trigger Turbopack lazy compilation before tests start
    cy.request({ url: 'http://localhost:3000/login', failOnStatusCode: false });
    cy.request({ url: 'http://localhost:3000/api/auth/session', failOnStatusCode: false });
    // Give Turbopack time to compile
    cy.wait(5000);
});
