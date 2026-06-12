// Tests for Legal Pages (Terms and Privacy)
describe("Terms of Service Page", () => {
    it("loads terms page", () => {
        cy.visit("/terms");
        cy.contains("Terminos y Condiciones", { matchCase: false }).should("be.visible");
    });

    it("contains key legal sections", () => {
        cy.visit("/terms");
        cy.contains("Objeto del Servicio").should("exist");
        cy.contains("Requisitos del Usuario").should("exist");
        cy.contains("Sistema de Creditos", { matchCase: false }).should("exist");
        cy.contains("Proteccion de Datos", { matchCase: false }).should("exist");
        cy.contains("Ley Aplicable").should("exist");
    });

    it("shows preliminary document warning", () => {
        cy.visit("/terms");
        cy.contains("Documento preliminar").should("be.visible");
    });

    it("has link to privacy policy", () => {
        cy.visit("/terms");
        cy.get('a[href="/privacy"]').should("exist");
    });

    it("has navigation to login and register", () => {
        cy.visit("/terms");
        cy.contains("Iniciar sesion", { matchCase: false }).should("exist");
        cy.contains("Registrarse").should("exist");
    });
});

describe("Privacy Policy Page", () => {
    it("loads privacy page", () => {
        cy.visit("/privacy");
        cy.contains("Politica de Privacidad", { matchCase: false }).should("be.visible");
    });

    it("contains Ley 1581 references", () => {
        cy.visit("/privacy");
        cy.contains("Ley 1581 de 2012").should("exist");
    });

    it("contains ARCO rights section", () => {
        cy.visit("/privacy");
        cy.contains("Derechos del Titular").should("exist");
        cy.contains("Acceso").should("exist");
        cy.contains("Rectificacion", { matchCase: false }).should("exist");
    });

    it("contains security measures section", () => {
        cy.visit("/privacy");
        cy.contains("Medidas de Seguridad").should("exist");
        cy.contains("bcrypt").should("exist");
    });

    it("mentions SIC as data protection authority", () => {
        cy.visit("/privacy");
        cy.contains("Superintendencia de Industria y Comercio").should("exist");
    });
});

describe("Legal Links in Auth Pages", () => {
    it("login page has legal links", () => {
        cy.visit("/login");
        cy.contains("Terminos y Condiciones", { matchCase: false }).should("exist");
        cy.contains("Politica de Privacidad", { matchCase: false }).should("exist");
    });

    it("register page has legal acceptance text", () => {
        cy.visit("/register");
        cy.contains("Al registrarte, aceptas", { matchCase: false }).should("exist");
        cy.get('a[href="/terms"]').should("exist");
        cy.get('a[href="/privacy"]').should("exist");
    });
});
