import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    MIN_GROUP_SIZE,
    belowThresholdPayload,
    meetsMinGroupSize,
    suppressSmallCounts,
} from "@/lib/reports/anonymity";

/**
 * Bloque sociodemográfico del informe colectivo.
 *
 * Camino paralelo al de /reports/sociodemographic y con el mismo defecto: aquí
 * se devolvían conteos crudos por categoría, que identifican todavía más que un
 * porcentaje ("estrato 1: 1"). Se aplica el mismo umbral único.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Describe la planta vigente (no filtra por evaluación), así que excluye
    // archivados; ver la nota equivalente en /reports/sociodemographic.
    const workers = await prisma.worker.findMany({
        where: { organizationId: orgId, archivedAt: null },
        select: {
            gender: true,
            birthYear: true,
            educationLevel: true,
            maritalStatus: true,
            housingType: true,
            contractType: true,
            jobLevel: true,
        },
    });

    if (!meetsMinGroupSize(workers.length)) {
        return NextResponse.json(belowThresholdPayload(workers.length), { status: 409 });
    }

    const currentYear = new Date().getFullYear();

    const data = {
        totalWorkers: workers.length,
        gender: {} as Record<string, number>,
        age: {
            "18-25": 0,
            "26-35": 0,
            "36-45": 0,
            "46-55": 0,
            "56+": 0,
            "Desconocido": 0,
        } as Record<string, number>,
        educationLevel: {} as Record<string, number>,
        maritalStatus: {} as Record<string, number>,
        housingType: {} as Record<string, number>,
        contractType: {} as Record<string, number>,
        jobLevel: {} as Record<string, number>,
    };

    workers.forEach(worker => {
        // Gender
        const gender = worker.gender || "Desconocido";
        data.gender[gender] = (data.gender[gender] || 0) + 1;

        // Age
        if (worker.birthYear) {
            const age = currentYear - worker.birthYear;
            if (age >= 18 && age <= 25) data.age["18-25"]++;
            else if (age >= 26 && age <= 35) data.age["26-35"]++;
            else if (age >= 36 && age <= 45) data.age["36-45"]++;
            else if (age >= 46 && age <= 55) data.age["46-55"]++;
            else if (age >= 56) data.age["56+"]++;
            else data.age["Desconocido"]++;
        } else {
            data.age["Desconocido"]++;
        }

        // Education Level
        const education = worker.educationLevel || "Desconocido";
        data.educationLevel[education] = (data.educationLevel[education] || 0) + 1;

        // Marital Status
        const marital = worker.maritalStatus || "Desconocido";
        data.maritalStatus[marital] = (data.maritalStatus[marital] || 0) + 1;

        // Housing Type
        const housing = worker.housingType || "Desconocido";
        data.housingType[housing] = (data.housingType[housing] || 0) + 1;

        // Contract Type
        const contract = worker.contractType || "Desconocido";
        data.contractType[contract] = (data.contractType[contract] || 0) + 1;

        // Job Level
        const job = worker.jobLevel || "Desconocido";
        data.jobLevel[job] = (data.jobLevel[job] || 0) + 1;
    });

    // Cada variable se publica ya suprimida y con su propia señal, para que el
    // informe pueda escribir "grupo omitido por confidencialidad" en vez de
    // dejar un hueco sin explicación. No se reagrupa en "otros": si el residual
    // también quedara bajo umbral, restarlo del total revelaría lo suprimido.
    const suppressed = {
        gender: suppressSmallCounts(data.gender),
        age: suppressSmallCounts(data.age),
        educationLevel: suppressSmallCounts(data.educationLevel),
        maritalStatus: suppressSmallCounts(data.maritalStatus),
        housingType: suppressSmallCounts(data.housingType),
        contractType: suppressSmallCounts(data.contractType),
        jobLevel: suppressSmallCounts(data.jobLevel),
    };

    return NextResponse.json({
        totalWorkers: data.totalWorkers,
        minGroupSize: MIN_GROUP_SIZE,
        ...suppressed,
    });
}
