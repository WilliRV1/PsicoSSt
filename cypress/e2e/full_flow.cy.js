/**
 * Full end-to-end lifecycle test:
 * Login → Dashboard → Empresa → Trabajador → Evaluaciones → Reportes → Configuración
 *
 * This is a smoke test to verify the entire application is connected and working.
 */
describe("PsicoSST - Flujo Completo de Trabajo", () => {
    const testNit = `FLOW-${Date.now()}`;
    const testOrgName = `Empresa Flow ${Date.now()}`;
    const testWorkerName = `Trabajador Flow ${Date.now()}`;
    const testWorkerDoc = `FLOW${Date.now()}`;

    before(() => {
        cy.viewport(1280, 720);
    });

    it("1. Login → Dashboard muestra resumen correcto", () => {
        cy.login();
        cy.visit("/dashboard");

        // La sidebar debe estar visible con los nav items
        cy.get("nav").contains("Empresas").should("be.visible");
        cy.get("nav").contains("Evaluaciones").should("be.visible");
        cy.get("nav").contains("Reportes").should("be.visible");
        cy.get("nav").contains("Configuración").should("be.visible");

        // El header del topbar debe decir "Dashboard"
        cy.get("header").contains("Dashboard").should("be.visible");
    });

    it("2. Crear una empresa nueva", () => {
        cy.login();
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();

        cy.contains("button", "Nueva Empresa").click();
        cy.get('input[placeholder*="TechSolutions"]').type(testOrgName);
        cy.get('input[placeholder*="900.123.456"]').type(testNit);
        cy.contains("button", "Crear Empresa").click();

        cy.contains(testOrgName, { timeout: 10000 }).should("be.visible");
    });

    it("3. Agregar un trabajador a la empresa", () => {
        cy.login();
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();

        // Navegar a la empresa recién creada
        cy.contains(testOrgName).click();
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/organizations\/.+/);

        cy.contains("Agregar Trabajador").click();
        cy.get('input[placeholder*="Juan"]').type(testWorkerName);
        cy.get('input[required]').eq(1).type(testWorkerDoc);
        cy.contains("button", "Registrar Trabajador").click();

        cy.contains(testWorkerName, { timeout: 10000 }).scrollIntoView().should("exist");
    });

    it("4. La página de evaluaciones carga correctamente", () => {
        cy.login();
        cy.visit("/dashboard/assessments");
        cy.contains("Evaluaciones Completadas").should("be.visible");
    });

    it("5. La página de reportes carga correctamente", () => {
        cy.login();
        cy.visit("/dashboard/reports");
        // Debe cargar con algún contenido del dashboard (heading o tabla)
        cy.get("h2, h1", { timeout: 20000 }).first().should("be.visible");
    });

    it("6. La configuración carga correctamente", () => {
        cy.login();
        cy.visit("/dashboard/settings");
        cy.contains("Configuración", { timeout: 10000 }).should("be.visible");
    });

    it("7. El perfil del psicólogo carga correctamente", () => {
        cy.login();
        cy.visit("/dashboard/profile");
        cy.get("h1, h2").first({ timeout: 10000 }).should("be.visible");
    });

    it("8. Limpiar: eliminar la empresa de prueba", () => {
        cy.login();
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();

        // Registrar el handler del confirm antes de hacer hover
        cy.on("window:confirm", () => true);

        cy.contains(testOrgName, { timeout: 10000 }).closest(".group").within(() => {
            cy.get('button[title="Eliminar empresa"]').click({ force: true });
        });

        cy.contains(testOrgName, { timeout: 15000 }).should("not.exist");
    });
});
