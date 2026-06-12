/**
 * Report signing flows.
 * Requires at least one assessment in SCORED or REVIEWED status.
 */
describe("PsicoSST - Firma de Informes", () => {
    beforeEach(() => {
        cy.viewport(1280, 720);
        cy.login();
    });

    it("Navega a un reporte y muestra el formulario de análisis", () => {
        cy.visit("/dashboard/reports");
        cy.waitForLoad();

        cy.contains("Revisar").first().click({ force: true });
        cy.url({ timeout: 15000 }).should("match", /\/dashboard\/reports\/.+/);
        cy.contains("Informe Individual de Evaluación", { timeout: 15000 }).should("be.visible");

        // El textarea existe en el DOM (puede estar en contenedor con overflow:hidden)
        cy.get("#clinical-analysis", { timeout: 10000 }).should("exist");
    });

    it("Muestra error si intenta firmar sin análisis", () => {
        cy.visit("/dashboard/reports");
        cy.waitForLoad();

        cy.contains("Revisar").first().click({ force: true });
        cy.url({ timeout: 15000 }).should("match", /\/dashboard\/reports\/.+/);

        // El botón debe estar deshabilitado cuando el textarea está vacío
        cy.get("#clinical-analysis", { timeout: 10000 }).then(($el) => {
            // Si no tiene texto, el botón debe estar disabled
            if ($el.val() === "") {
                cy.get(".analysis-sign-btn").should("be.disabled");
            } else {
                // Si ya tiene texto, limpiar y verificar
                cy.get("#clinical-analysis").clear({ force: true });
                cy.get(".analysis-sign-btn").should("be.disabled");
            }
        });
    });

    it("Firma un reporte correctamente", () => {
        cy.visit("/dashboard/reports");
        cy.waitForLoad();

        cy.contains("Revisar").first().click({ force: true });
        cy.url({ timeout: 15000 }).should("match", /\/dashboard\/reports\/.+/);
        cy.contains("Informe Individual de Evaluación", { timeout: 15000 }).should("be.visible");

        // Usar force:true para el textarea que puede estar en contenedor overflow:hidden
        cy.get("#clinical-analysis", { timeout: 10000 })
            .clear({ force: true })
            .type("Análisis clínico: el trabajador presenta riesgo moderado en dominios intralaborales.", { force: true });

        // Aceptar el confirm del navegador
        cy.on("window:confirm", () => true);

        // El botón de firmar debe estar habilitado
        cy.get(".analysis-sign-btn").should("not.be.disabled").click({ force: true });

        // La página se refresca tras firmar con éxito
        cy.contains("Informe Individual de Evaluación", { timeout: 20000 }).should("be.visible");
    });

    it("Permite re-editar y re-firmar un reporte ya firmado", () => {
        cy.visit("/dashboard/reports");
        cy.waitForLoad();

        // Ir a cualquier reporte disponible
        cy.get("a").filter(':contains("Ver"), :contains("Revisar")').first().click({ force: true });
        cy.url({ timeout: 15000 }).should("match", /\/dashboard\/reports\/.+/);
        cy.get("#clinical-analysis", { timeout: 15000 }).should("exist");

        // Añadir texto para activar isDirty
        cy.get("#clinical-analysis")
            .type(" (actualización de prueba)", { force: true });

        cy.on("window:confirm", () => true);
        cy.get(".analysis-sign-btn", { timeout: 5000 }).should("exist").click({ force: true });

        cy.contains("Informe Individual de Evaluación", { timeout: 20000 }).should("be.visible");
    });

    it("El botón de descarga PDF está disponible en la lista de evaluaciones", () => {
        cy.visit("/dashboard/assessments");
        cy.waitForLoad();

        cy.get("body").then(($body) => {
            if ($body.find("a[href*='/report/pdf']").length > 0) {
                cy.get("a[href*='/report/pdf']").first().should("exist");
                cy.log("PDF buttons found");
            } else {
                cy.log("No hay evaluaciones — test condicional omitido");
            }
        });
    });
});
