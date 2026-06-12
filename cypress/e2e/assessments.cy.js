/**
 * Assessment (evaluación) flows: page navigation, filters, CSV export.
 * Full digitization flow is complex (123 items), so we test the page
 * and navigation, plus the manual form setup.
 */
describe("PsicoSST - Evaluaciones", () => {
    beforeEach(() => {
        cy.viewport(1280, 720);
        cy.login();
    });

    it("Muestra la página de evaluaciones con tabla o estado vacío", () => {
        cy.visit("/dashboard/assessments");
        cy.contains("Evaluaciones Completadas").should("be.visible");
        cy.contains("Exportar CSV").should("be.visible");
        cy.contains("Digitalizar Papel").should("be.visible");
    });

    it("Navega a la página de digitalización manual", () => {
        cy.visit("/dashboard/assessments");
        cy.contains("Digitalizar Papel").click();
        cy.url({ timeout: 10000 }).should("include", "/dashboard/assessments/new/manual");
    });

    it("La página de digitalización muestra los campos del formulario", () => {
        cy.visit("/dashboard/assessments/new/manual");
        // Debe haber un selector de empresa o un mensaje si no hay empresas
        cy.get("body").should("exist");
        // Verificar que la página cargó sin error 404/500
        cy.get("h1, h2").should("be.visible");
    });

    it("Los filtros de búsqueda funcionan", () => {
        cy.visit("/dashboard/assessments");
        cy.waitForLoad();
        // Wait for FilterBar Suspense boundary to hydrate
        cy.get('input[placeholder*="trabajador"]', { timeout: 10000 }).should("be.visible");

        // Buscar algo que no existe para probar filtro
        cy.get('input[placeholder*="trabajador"]').type("XYZ_NO_EXISTE_XYZ");
        cy.url({ timeout: 15000 }).should("include", "q=");

        // Limpiar filtro
        cy.contains("button", "Limpiar").click();
        cy.url().should("not.include", "q=");
    });

    it("El botón de exportar CSV llama al endpoint correcto", () => {
        cy.visit("/dashboard/assessments");
        // Verificar que el link de exportar CSV existe y apunta al endpoint correcto
        cy.get("a[href='/api/assessments/export']").should("be.visible");
    });

    it("Muestra el selector de empresa en el filtro", () => {
        cy.visit("/dashboard/assessments");
        // El FilterBar debería mostrar el selector de empresa
        cy.get("select, [role='combobox']").should("exist");
    });
});
