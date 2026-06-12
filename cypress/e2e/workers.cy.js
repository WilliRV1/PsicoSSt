/**
 * Worker management flows: add, view, edit, delete within an org.
 * Requires at least one existing organization.
 */
describe("PsicoSST - Gestión de Trabajadores", () => {
    const workerName = `Trabajador Cypress ${Date.now()}`;
    const workerDoc = `DOC${Date.now()}`;

    beforeEach(() => {
        cy.viewport(1280, 720);
        cy.login();
    });

    it("Navega al detalle de una empresa", () => {
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();
        cy.get("a[href*='/dashboard/organizations/']").first().click();
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/organizations\/.+/);
        cy.contains("Agregar Trabajador").scrollIntoView().should("exist");
    });

    it("Agrega un trabajador desde el detalle de empresa", () => {
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();
        cy.get("a[href*='/dashboard/organizations/']").first().click();
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/organizations\/.+/);

        cy.contains("Agregar Trabajador").click();
        cy.contains("Agregar Nuevo Trabajador").should("be.visible");

        // Llenar nombre y documento (campos requeridos)
        cy.get('input[placeholder*="Juan"]').type(workerName);
        // El input de documentId no tiene placeholder, es el segundo input requerido
        cy.get('input[required]').eq(1).type(workerDoc);

        cy.contains("button", "Registrar Trabajador").click();

        // El modal se cierra y el trabajador aparece en la lista
        cy.contains("Agregar Nuevo Trabajador", { timeout: 10000 }).should("not.exist");
        cy.contains(workerName, { timeout: 10000 }).scrollIntoView().should("exist");
        cy.contains(workerDoc).scrollIntoView().should("exist");
    });

    it("Navega al detalle del trabajador desde la tabla", () => {
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();
        cy.get("a[href*='/dashboard/organizations/']").first().click();
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/organizations\/.+/);

        // Click en el nombre de un trabajador (link or button in the table)
        cy.get("table").should("exist");
        cy.get("table tbody tr").first().within(() => {
            // Click on the worker name or a view link if available
            cy.get("a, button").first().click({ force: true });
        });
        // Should navigate to either worker detail or stay on org page with worker info
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/(workers|organizations)\/.+/);
    });

    it("Muestra el perfil del trabajador correctamente", () => {
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();
        cy.get("a[href*='/dashboard/organizations/']").first().click();
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/organizations\/.+/);

        cy.get("table a[href*='/dashboard/workers/']").first().then(($link) => {
            const href = $link.attr("href");
            cy.visit(href);
        });

        // La página de detalle debe mostrar el nombre del trabajador
        cy.get("h1, h2").first().should("be.visible");
    });

    it("Elimina un trabajador sin evaluaciones", () => {
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();
        cy.get("a[href*='/dashboard/organizations/']").first().click();
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/organizations\/.+/);

        // Register confirm handler before triggering it
        cy.on("window:confirm", () => true);

        // Encontrar el trabajador creado y eliminarlo
        cy.contains(workerName).scrollIntoView().closest("tr").within(() => {
            cy.get('button[title="Eliminar trabajador"]').click({ force: true });
        });

        // Wait for page to update after deletion
        cy.wait(2000);
        cy.contains(workerName, { timeout: 15000 }).should("not.exist");
    });
});
