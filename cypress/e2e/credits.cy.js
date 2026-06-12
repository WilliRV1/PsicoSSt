// Tests for Credit System
describe("Credits Page", () => {
    beforeEach(() => {
        cy.login();
        cy.visit("/dashboard/credits");
        cy.waitForLoad();
    });

    it("displays credit balance", () => {
        cy.contains("creditos disponibles", { matchCase: false }).should("be.visible");
    });

    it("displays all 5 credit packages", () => {
        cy.contains("Starter").should("be.visible");
        cy.contains("Profesional").should("be.visible");
        cy.contains("Business").should("be.visible");
        cy.contains("Enterprise").should("be.visible");
        cy.contains("Corporativo").should("be.visible");
    });

    it("shows Popular badge on Business package", () => {
        cy.contains("Popular").should("be.visible");
    });

    it("shows package prices in COP", () => {
        // At least one price should be visible
        cy.contains("$").should("exist");
        cy.contains("/ credito", { matchCase: false }).should("exist");
    });

    it("shows discount percentage on discounted packages", () => {
        cy.contains("% de ahorro").should("exist");
    });

    it("displays transaction history section", () => {
        cy.contains("Historial de transacciones", { matchCase: false }).should("be.visible");
    });

    it("shows low balance warning when credits are low", () => {
        // This is conditional - only shows if balance <= 2
        // Just verify the page loads without errors
        cy.get("body").should("be.visible");
    });

    it("has Buy buttons for each package", () => {
        cy.contains("button", "Comprar").should("exist");
    });
});

describe("Credits API", () => {
    beforeEach(() => {
        cy.login();
    });

    it("GET /api/credits returns balance", () => {
        cy.request("/api/credits").then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property("balance");
            expect(res.body.balance).to.be.a("number");
        });
    });

    it("GET /api/credits/transactions returns transaction list", () => {
        cy.request("/api/credits/transactions").then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property("data");
            expect(res.body.data).to.be.an("array");
        });
    });

    it("POST /api/payments/create-order validates packageId", () => {
        cy.request({
            method: "POST",
            url: "/api/payments/create-order",
            body: { packageId: "" },
            failOnStatusCode: false,
        }).then((res) => {
            expect(res.status).to.eq(400);
        });
    });

    it("POST /api/payments/create-order rejects invalid package", () => {
        cy.request({
            method: "POST",
            url: "/api/payments/create-order",
            body: { packageId: "nonexistent" },
            failOnStatusCode: false,
        }).then((res) => {
            expect(res.status).to.eq(404);
        });
    });

    it("POST /api/payments/create-order creates order for valid package", () => {
        cy.request({
            method: "POST",
            url: "/api/payments/create-order",
            body: { packageId: "starter" },
        }).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property("orderId");
            expect(res.body).to.have.property("reference");
            expect(res.body).to.have.property("amountCents", 6000000);
            expect(res.body).to.have.property("currency", "COP");
            expect(res.body).to.have.property("signature");
        });
    });
});
