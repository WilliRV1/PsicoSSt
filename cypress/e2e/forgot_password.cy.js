// Tests for Password Reset Flow
describe("Forgot Password Page", () => {
    it("displays forgot password form", () => {
        cy.visit("/forgot-password");
        cy.contains("Recuperar contrasena", { matchCase: false }).should("be.visible");
        cy.get('input[id="email"]').should("be.visible");
        cy.contains("button", "Enviar codigo", { matchCase: false }).should("be.visible");
    });

    it("has link back to login", () => {
        cy.visit("/forgot-password");
        cy.contains("Volver a iniciar sesion", { matchCase: false }).should("be.visible");
        cy.contains("Volver a iniciar sesion", { matchCase: false }).click();
        cy.url().should("include", "/login");
    });

    it("shows success message after submitting email", () => {
        cy.visit("/forgot-password");
        cy.get('input[id="email"]').type("test@example.com");
        cy.contains("button", "Enviar codigo", { matchCase: false }).click();
        // Should show step 2 (code input) or success message
        cy.contains("codigo", { matchCase: false, timeout: 10000 }).should("exist");
    });

    it("login page has forgot password link", () => {
        cy.visit("/login");
        cy.contains("Olvidaste tu contrasena", { matchCase: false }).should("be.visible");
        cy.contains("Olvidaste tu contrasena", { matchCase: false }).click();
        cy.url().should("include", "/forgot-password");
    });
});

describe("Password Reset API", () => {
    it("POST /api/auth/forgot-password returns 200 for any email (anti-enumeration)", () => {
        cy.request({
            method: "POST",
            url: "/api/auth/forgot-password",
            body: { email: "nonexistent@example.com" },
        }).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property("message");
        });
    });

    it("POST /api/auth/forgot-password returns 400 without email", () => {
        cy.request({
            method: "POST",
            url: "/api/auth/forgot-password",
            body: {},
            failOnStatusCode: false,
        }).then((res) => {
            expect(res.status).to.eq(400);
        });
    });

    it("POST /api/auth/reset-password validates required fields", () => {
        cy.request({
            method: "POST",
            url: "/api/auth/reset-password",
            body: { email: "test@test.com" },
            failOnStatusCode: false,
        }).then((res) => {
            expect(res.status).to.eq(400);
        });
    });

    it("POST /api/auth/reset-password rejects weak password", () => {
        cy.request({
            method: "POST",
            url: "/api/auth/reset-password",
            body: { email: "test@test.com", code: "123456", newPassword: "weak" },
            failOnStatusCode: false,
        }).then((res) => {
            expect(res.status).to.eq(400);
        });
    });

    it("POST /api/auth/reset-password rejects invalid code", () => {
        cy.request({
            method: "POST",
            url: "/api/auth/reset-password",
            body: {
                email: "admin@psicosst.com",
                code: "000000",
                newPassword: "NewPassword123!@#",
            },
            failOnStatusCode: false,
        }).then((res) => {
            expect(res.status).to.eq(400);
            expect(res.body.error).to.be.a("string");
        });
    });
});
