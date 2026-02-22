import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const adminId = "26063614-8293-44d7-8644-54bce23b6d12";

    console.log("--- SEEDING SYSTEM DATA ---");

    try {
        console.log("Cleaning up old assessment data...");
        await prisma.auditLog.deleteMany({});
        await prisma.report.deleteMany({});
        await prisma.scoredResult.deleteMany({});
        await prisma.assessment.deleteMany({});
        console.log("Cleanup complete.");

        // 1. Ensure Psychologist is active
        await prisma.psychologist.update({
            where: { id: adminId },
            data: { status: 'ACTIVE' }
        });
        console.log("Psychologist status set to ACTIVE");

        // 2. Create Organization
        const org = await prisma.organization.upsert({
            where: { nit: "900.555.444-1" },
            update: {},
            create: {
                name: "Transportes Atlántico S.A.",
                nit: "900.555.444-1",
                economicSector: "Transporte y Logística",
                city: "Barranquilla",
                department: "Atlántico",
                employeeCount: 120,
                contactName: "Javier Rodriguez",
                contactEmail: "javier.r@transatlantico.com",
                createdByPsychologist: adminId
            }
        });
        console.log("Organization created:", org.name);

        // 3. Create Workers
        const workersData = [
            { doc: "1020304050", name: "Ricardo Arjona", job: "Conductor", level: "OPERATIVO", edu: "BACHILLERATO", area: "Operaciones" },
            { doc: "1020304051", name: "Shakira Mebarak", job: "Logística", level: "TECNICO", edu: "TECNOLOGO", area: "Operaciones" },
            { doc: "1020304052", name: "Gabriel Garcia", job: "Gerente", level: "JEFATURA", edu: "MAESTRIA", area: "Gerencia" },
            { doc: "1020304053", name: "Sofia Vergara", job: "Secretaria", level: "AUXILIAR", edu: "TECNOLOGO", area: "Administración" },
            { doc: "1020304054", name: "Juanes Aristizabal", job: "Analista", level: "PROFESIONAL", edu: "PROFESIONAL", area: "Finanzas" },
        ];

        const workers = [];
        for (const w of workersData) {
            const worker = await prisma.worker.upsert({
                where: {
                    documentType_documentId_organizationId: {
                        documentType: "CC",
                        documentId: w.doc,
                        organizationId: org.id
                    }
                },
                update: {},
                create: {
                    documentType: "CC",
                    documentId: w.doc,
                    fullName: w.name,
                    jobTitle: w.job,
                    jobLevel: w.level,
                    educationLevel: w.edu,
                    departmentArea: w.area,
                    organizationId: org.id
                }
            });
            workers.push(worker);
            console.log(`  Worker created: ${worker.fullName}`);
        }

        // 4. Create Assessments with Results
        // Mocking some varied risk categories for the heatmap
        const risks = ["SIN_RIESGO", "BAJO", "MEDIO", "ALTO", "MUY_ALTO"];
        const dimensionList = [
            { key: "liderazgo", name: "Liderazgo y relaciones sociales" },
            { key: "control", name: "Control sobre el trabajo" },
            { key: "demandas", name: "Demandas del trabajo" },
            { key: "recompensas", name: "Recompensas" }
        ];

        for (let i = 0; i < workers.length; i++) {
            const worker = workers[i];
            const risk = risks[i % risks.length];

            // Create Assessment
            const assessment = await prisma.assessment.create({
                data: {
                    workerId: worker.id,
                    psychologistId: adminId,
                    organizationId: org.id,
                    formType: worker.jobLevel === "JEFATURA" || worker.jobLevel === "PROFESIONAL" ? "A" : "B",
                    questionnaireType: "INTRALABORAL",
                    assessmentDate: new Date(),
                    status: "SCORED",
                    inputMethod: "MANUAL"
                }
            });

            // Create ScoredResult with realistic dimensions
            const dimensionScores = {};
            dimensionList.forEach((d, idx) => {
                const score = 20 + (i * 10) + (idx * 5);
                dimensionScores[d.key] = {
                    dimensionKey: d.key,
                    dimensionName: d.name,
                    rawScore: Math.floor(score / 5),
                    maxPossible: 20,
                    transformedScore: score,
                    riskCategory: risks[Math.floor(score / 25)] || "MUY_ALTO"
                };
            });

            await prisma.scoredResult.create({
                data: {
                    assessmentId: assessment.id,
                    dimensionScores: dimensionScores,
                    domainScores: {}, // Empty for simplicity in this flat view
                    totalScores: {
                        rawScore: 50 + (i * 10),
                        maxPossible: 200,
                        transformedScore: 25 + (i * 15),
                        riskCategory: risk,
                        riskLevel: i + 1
                    },
                    overallRiskCategory: risk,
                    scoredAt: new Date()
                }
            });
            console.log(`  Assessment & Score created for ${worker.fullName} (Risk: ${risk})`);
        }

        console.log("--- SEEDING COMPLETED ---");
    } catch (err) {
        console.error("Seed error details:");
        console.error(err);
        if (err.message) console.error("Message:", err.message);
        if (err.stack) console.error("Stack:", err.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();
