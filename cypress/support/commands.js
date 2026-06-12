// Custom Cypress Commands for PsicoSST

/**
 * Login command - visits /login and authenticates directly.
 * Clears all cookies/storage first to ensure a clean state.
 */
Cypress.Commands.add("login", (email = "admin@psicosst.com", password = "Admin123456!") => {
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.visit("/login");
    cy.get('input[id="email"]', { timeout: 15000 }).should("be.visible").type(email);
    cy.get('input[id="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 30000 }).should("include", "/dashboard");
});

/**
 * Wait for the page to finish loading (no spinner visible).
 */
Cypress.Commands.add("waitForLoad", () => {
    cy.get(".animate-spin", { timeout: 10000 }).should("not.exist");
});
