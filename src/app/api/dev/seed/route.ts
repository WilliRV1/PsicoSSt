import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/dev/seed — Creates test organization + workers for the logged-in psychologist.
 * Only works in development. Safe to call multiple times (upsert).
 */
export async function POST() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const org = await prisma.organization.upsert({
            where: { nit: "900123456-1" },
            update: {},
            create: {
                name: "Empresa Demo S.A.S.",
                nit: "900123456-1",
                economicSector: "TECNOLOGIA",
                city: "Bogotá",
                department: "Cundinamarca",
                employeeCount: 50,
                createdByPsychologist: session.user.id
            }
        });

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const testWorkers: any[] = [
            {
                documentType: "CC",
                documentId: "1023456789",
                fullName: "María García López",
                jobTitle: "Analista de Sistemas",
                jobLevel: "PROFESIONAL",
                educationLevel: "PROFESIONAL",
                departmentArea: "Tecnología",
                organizationId: org.id
            },
            {
                documentType: "CC",
                documentId: "1087654321",
                fullName: "Carlos Rodríguez Muñoz",
                jobTitle: "Coordinador de Proyectos",
                jobLevel: "JEFATURA",
                educationLevel: "ESPECIALIZACION",
                departmentArea: "Gestión",
                organizationId: org.id
            },
            {
                documentType: "CC",
                documentId: "1045678901",
                fullName: "Ana Martínez Pérez",
                jobTitle: "Auxiliar Administrativo",
                jobLevel: "AUXILIAR",
                educationLevel: "TECNICO_TECNOLOGO",
                departmentArea: "Administración",
                organizationId: org.id
            },
            {
                documentType: "CC",
                documentId: "1056789012",
                fullName: "Juan David Hernández",
                jobTitle: "Operario de Producción",
                jobLevel: "OPERATIVO",
                educationLevel: "BACHILLERATO",
                departmentArea: "Producción",
                organizationId: org.id
            },
            {
                documentType: "CE",
                documentId: "E-456789",
                fullName: "Laura Sánchez Rivera",
                jobTitle: "Técnica en Salud Ocupacional",
                jobLevel: "TECNICO",
                educationLevel: "TECNICO_TECNOLOGO",
                departmentArea: "SST",
                organizationId: org.id
            }
        ];

        const created = [];
        for (const worker of testWorkers) {
            const w = await prisma.worker.upsert({
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
            created.push({ fullName: w.fullName, documentId: w.documentId });
        }

        return NextResponse.json({
            message: "Datos de prueba creados",
            organization: { name: org.name, id: org.id },
            workers: created
        });
    } catch (error) {
        console.error("[SEED] Error:", error);
        return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
    }
}
