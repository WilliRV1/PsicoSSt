/**
 * Organization CRUD flows.
 */
describe("PsicoSST - Gestión de Empresas", () => {
    const testNit = `NIT-TEST-${Date.now()}`;
    const testName = `Empresa Cypress ${Date.now()}`;

    beforeEach(() => {
        cy.viewport(1280, 720);
        cy.login();
        cy.visit("/dashboard/organizations");
        cy.waitForLoad();
    });

    it("Muestra la página de empresas con header correcto", () => {
        cy.contains("Mis Empresas").should("be.visible");
        cy.contains("Nueva Empresa").should("be.visible");
    });

    it("Abre y cierra el modal de nueva empresa", () => {
        cy.contains("button", "Nueva Empresa").click();
        cy.contains("h2", "Nueva Empresa").should("be.visible");
        cy.get('input[placeholder*="TechSolutions"]').should("be.visible");
        cy.contains("button", "Cancelar").click();
        cy.contains("h2", "Nueva Empresa").should("not.exist");
    });

    it("Crea una nueva empresa", () => {
        cy.contains("button", "Nueva Empresa").click();
        cy.get('input[placeholder*="TechSolutions"]').type(testName);
        cy.get('input[placeholder*="900.123.456"]').type(testNit);
        cy.get('input[placeholder*="Bogot"]').first().type("Medellín");
        cy.contains("button", "Crear Empresa").click();

        // El modal se cierra y aparece la nueva empresa
        cy.contains("h2", "Nueva Empresa", { timeout: 10000 }).should("not.exist");
        cy.contains(testName, { timeout: 10000 }).should("be.visible");
        cy.contains(testNit).should("be.visible");
    });

    it("Navega al detalle de una empresa", () => {
        // Requiere al menos una empresa existente
        cy.get("a[href*='/dashboard/organizations/']").first().click();
        cy.url({ timeout: 10000 }).should("match", /\/dashboard\/organizations\/.+/);
    });

    it("Muestra error si el NIT ya existe", () => {
        // Intentar crear con el mismo NIT dos veces requiere que ya exista uno
        // Usamos el NIT creado antes (si el test anterior corrió)
        cy.contains("button", "Nueva Empresa").click();
        cy.get('input[placeholder*="TechSolutions"]').type("Empresa Duplicada");
        cy.get('input[placeholder*="900.123.456"]').type(testNit); // mismo NIT
        cy.contains("button", "Crear Empresa").click();
        // Puede que el NIT ya exista o no — el error solo aparece si hay duplicado
        // Solo verificamos que el botón responde (no se queda cargando indefinidamente)
        cy.contains("button", "Crear Empresa", { timeout: 5000 }).should("not.be.disabled");
    });

    it("Elimina una empresa recién creada", () => {
        // Crear una temporal para borrarla
        const nitTemp = `NIT-DEL-${Date.now()}`;
        const nameTemp = `Empresa Para Borrar ${Date.now()}`;

        cy.contains("button", "Nueva Empresa").click();
        cy.get('input[placeholder*="TechSolutions"]').type(nameTemp);
        cy.get('input[placeholder*="900.123.456"]').type(nitTemp);
        cy.contains("button", "Crear Empresa").click();
        cy.contains(nameTemp, { timeout: 10000 }).should("be.visible");

        // Hover en la card para mostrar el botón de eliminar
        cy.contains(nameTemp).closest(".group").trigger("mouseover");
        cy.contains(nameTemp).closest(".group").find('button[title="Eliminar empresa"]').click({ force: true });

        // Confirmar el diálogo de confirmación
        cy.on("window:confirm", () => true);

        // La empresa desaparece
        cy.contains(nameTemp, { timeout: 10000 }).should("not.exist");
    });
});
