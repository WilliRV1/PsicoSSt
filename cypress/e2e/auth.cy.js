/**
 * Auth flows: login, logout, error handling.
 * The app runs on port 3001 (configured in cypress.config.js).
 * Login page is at /login (Next.js (auth) route group strips the group name).
 */
describe("PsicoSST - Autenticación", () => {
    beforeEach(() => {
        cy.viewport(1280, 720);
    });

    it("Muestra la página de login correctamente", () => {
        cy.visit("/login");
        cy.contains("Iniciar sesion").should("be.visible");
        cy.get('input[id="email"]').should("be.visible");
        cy.get('input[id="password"]').should("be.visible");
        cy.get('button[type="submit"]').contains("Ingresar a PsicoSST").should("be.visible");
    });

    it("Muestra error con credenciales inválidas", () => {
        cy.visit("/login");
        cy.get('input[id="email"]').type("noexiste@test.com");
        cy.get('input[id="password"]').type("contraseñaincorrecta");
        cy.get('button[type="submit"]').click();
        cy.contains("Credenciales invalidas", { timeout: 30000 }).should("be.visible");
    });

    it("Inicia sesión con credenciales correctas y redirige al dashboard", () => {
        cy.visit("/login");
        cy.get('input[id="email"]').type("admin@psicosst.com");
        cy.get('input[id="password"]').type("Admin123456!");
        cy.get('button[type="submit"]').click();
        cy.url({ timeout: 30000 }).should("include", "/dashboard");
        cy.get("nav").contains("Empresas").should("be.visible");
        cy.get("nav").contains("Evaluaciones").should("be.visible");
        cy.get("nav").contains("Reportes").should("be.visible");
    });

    it("Redirige a /login si no hay sesión activa", () => {
        cy.clearAllCookies();
        cy.visit("/dashboard", { failOnStatusCode: false });
        cy.url({ timeout: 10000 }).should("include", "/login");
    });

    it("Cierra sesión correctamente", () => {
        cy.login();
        cy.visit("/dashboard");
        cy.get("header").find("button").last().click();
        cy.contains("Cerrar sesion").click();
        cy.url({ timeout: 10000 }).should("include", "/login");
    });

    it("Permite mostrar/ocultar la contraseña", () => {
        cy.visit("/login");
        cy.get('input[id="password"]').should("have.attr", "type", "password");
        cy.get('button[aria-label*="contrasena"]').click();
        cy.get('input[id="password"]').should("have.attr", "type", "text");
        cy.get('button[aria-label*="contrasena"]').click();
        cy.get('input[id="password"]').should("have.attr", "type", "password");
    });

    it("La página de registro es accesible", () => {
        cy.visit("/register");
        cy.contains("Solicitar Registro", { timeout: 10000 }).should("be.visible");
        cy.get("form").should("exist");
    });
});
