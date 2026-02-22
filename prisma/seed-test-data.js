const { PrismaClient } = require("@prisma/client");

/**
 * Seed script: creates a test organization and 5 workers
 * for the first active psychologist found in the database.
 *
 * Usage: node prisma/seed-test-data.js
 */
async function main() {
    const prisma = new PrismaClient();

    try {
        // Find the first active psychologist
        const psychologist = await prisma.psychologist.findFirst({
            where: { status: "ACTIVE" },
            select: { id: true, fullName: true }
        });

        if (!psychologist) {
            console.error("No hay psicologos activos. Registra uno primero.");
            process.exit(1);
        }

        console.log("Psicologo: " + psychologist.fullName + " (" + psychologist.id + ")");

        // Create test organization
        const org = await prisma.organization.upsert({
            where: { nit: "900123456-1" },
            update: {},
            create: {
                name: "Empresa Demo S.A.S.",
                nit: "900123456-1",
                sector: "TECNOLOGIA",
                city: "Bogota",
                department: "Cundinamarca",
                employeeCount: 50,
                createdByPsychologist: psychologist.id
            }
        });

        console.log("Organizacion: " + org.name + " (" + org.id + ")");

        // Test workers
        const testWorkers = [
            {
                documentType: "CC",
                documentId: "1023456789",
                fullName: "Maria Garcia Lopez",
                jobTitle: "Analista de Sistemas",
                jobLevel: "PROFESIONAL",
                educationLevel: "PROFESIONAL",
                area: "Tecnologia",
                organizationId: org.id
            },
            {
                documentType: "CC",
                documentId: "1087654321",
                fullName: "Carlos Rodriguez Munoz",
                jobTitle: "Coordinador de Proyectos",
                jobLevel: "JEFATURA",
                educationLevel: "ESPECIALIZACION",
                area: "Gestion",
                organizationId: org.id
            },
            {
                documentType: "CC",
                documentId: "1045678901",
                fullName: "Ana Martinez Perez",
                jobTitle: "Auxiliar Administrativo",
                jobLevel: "AUXILIAR",
                educationLevel: "TECNICO_TECNOLOGO",
                area: "Administracion",
                organizationId: org.id
            },
            {
                documentType: "CC",
                documentId: "1056789012",
                fullName: "Juan David Hernandez",
                jobTitle: "Operario de Produccion",
                jobLevel: "OPERATIVO",
                educationLevel: "BACHILLERATO",
                area: "Produccion",
                organizationId: org.id
            },
            {
                documentType: "CE",
                documentId: "E-456789",
                fullName: "Laura Sanchez Rivera",
                jobTitle: "Tecnica en Salud Ocupacional",
                jobLevel: "TECNICO",
                educationLevel: "TECNICO_TECNOLOGO",
                area: "SST",
                organizationId: org.id
            }
        ];

        for (const worker of testWorkers) {
            const created = await prisma.worker.upsert({
                where: {
                    documentType_documentId_organizationId: {
                        documentType: worker.documentType,
                        documentId: worker.documentId,
                        organizationId: worker.organizationId
                    }
                },
                update: {},
                create: worker
            });
            console.log("  Worker: " + created.fullName + " - " + created.documentId);
        }

        console.log("\nDatos de prueba creados exitosamente.");
        console.log("Ahora puedes buscar: Maria, Carlos, Ana, Juan, Laura");
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
