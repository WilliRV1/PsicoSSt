/**
 * Dashboard page tests: panels, navigation, links.
 */
describe("PsicoSST - Dashboard Principal", () => {
    beforeEach(() => {
        cy.viewport(1280, 720);
        cy.login();
        cy.visit("/dashboard");
    });

    it("Muestra los nav items de la sidebar", () => {
        cy.get("nav").first().within(() => {
            cy.contains("Dashboard").should("be.visible");
            cy.contains("Empresas").should("be.visible");
            cy.contains("Evaluaciones").should("be.visible");
            cy.contains("Reportes").should("be.visible");
            cy.contains("Configuración").should("be.visible");
        });
    });

    it("La sidebar colapsa al presionar el botón", () => {
        // El botón de colapso tiene aria-label
        cy.get('button[aria-label*="Colapsar"]').click();
        cy.get("aside").should("have.class", "w-16");

        // Expandir de nuevo
        cy.get('button[aria-label*="Expandir"]').click();
        cy.get("aside").should("have.class", "w-60");
    });

    it("El dropdown de usuario en el topbar tiene opciones", () => {
        cy.get("header").find("button").last().click();
        cy.contains("Mi Perfil").should("be.visible");
        cy.contains("Configuracion").should("be.visible");
        cy.contains("Cerrar sesion").should("be.visible");
        // Cerrar el dropdown con Escape
        cy.get("body").type("{esc}");
    });

    it("Navega desde sidebar a Empresas", () => {
        cy.get("nav").contains("a", "Empresas").click();
        cy.url({ timeout: 15000 }).should("include", "/dashboard/organizations");
    });

    it("Navega desde sidebar a Evaluaciones", () => {
        cy.get("nav").contains("Evaluaciones").click();
        cy.url().should("include", "/dashboard/assessments");
    });

    it("Navega desde sidebar a Reportes", () => {
        cy.get("nav").contains("a", "Reportes").click();
        cy.url({ timeout: 15000 }).should("include", "/dashboard/reports");
    });

    it("Navega desde sidebar a Configuración", () => {
        cy.get("nav").contains("Configuración").click();
        cy.url().should("include", "/dashboard/settings");
    });

    it("El link de perfil en la sidebar lleva al perfil", () => {
        // El perfil está en la parte inferior de la sidebar
        cy.get("aside").contains("Mi Perfil").click();
        cy.url({ timeout: 10000 }).should("include", "/dashboard/profile");
    });
});
