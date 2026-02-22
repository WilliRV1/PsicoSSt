import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Verify organization ownership/access
        const org = await prisma.organization.findFirst({
            where: {
                id: orgId,
                createdByPsychologist: session.user.id
            }
        });

        if (!org && !session.user.isAdmin) {
            return NextResponse.json({ error: "Organization not found or access denied" }, { status: 404 });
        }

        // 2. Fetch all workers in the organization
        const workers = await prisma.worker.findMany({
            where: { organizationId: orgId }
        });

        if (workers.length === 0) {
            return NextResponse.json({
                count: 0,
                message: "No workers found for this organization."
            });
        }

        // 3. Process Epidemiological Data
        const stats = {
            totalWorkers: workers.length,
            ageDistribution: calculateAgeDistribution(workers),
            genderDistribution: calculateGenericDistribution(workers, "gender"),
            educationDistribution: calculateGenericDistribution(workers, "educationLevel"),
            jobLevelDistribution: calculateGenericDistribution(workers, "jobLevel"),
            tenureDistribution: calculateTenureDistribution(workers),
            housingDistribution: calculateGenericDistribution(workers, "housingType"),
            stratumDistribution: calculateGenericDistribution(workers, "socioeconomicStratum"),
            freeTimeDistribution: calculateFreeTimeDistribution(workers)
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Sociodemographic Report API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function calculateAgeDistribution(workers: any[]) {
    const groups: Record<string, number> = {
        "18-25": 0,
        "26-35": 0,
        "36-45": 0,
        "46-55": 0,
        "55+": 0,
        "No especificado": 0
    };

    workers.forEach(w => {
        if (!w.birthDate) {
            groups["No especificado"]++;
            return;
        }

        const age = Math.abs(new Date(Date.now() - new Date(w.birthDate).getTime()).getUTCFullYear() - 1970);

        if (age >= 18 && age <= 25) groups["18-25"]++;
        else if (age >= 26 && age <= 35) groups["26-35"]++;
        else if (age >= 36 && age <= 45) groups["36-45"]++;
        else if (age >= 46 && age <= 55) groups["46-55"]++;
        else if (age > 55) groups["55+"]++;
    });

    return convertToPercentages(groups, workers.length);
}

function calculateTenureDistribution(workers: any[]) {
    const groups: Record<string, number> = {
        "Menos de 1 año": 0,
        "1-3 años": 0,
        "4-7 años": 0,
        "8-12 años": 0,
        "Más de 12 años": 0,
        "No especificado": 0
    };

    workers.forEach(w => {
        const tenure = w.yearsInCompany;
        if (tenure === null || tenure === undefined) {
            groups["No especificado"]++;
            return;
        }

        if (tenure < 1) groups["Menos de 1 año"]++;
        else if (tenure >= 1 && tenure <= 3) groups["1-3 años"]++;
        else if (tenure >= 4 && tenure <= 7) groups["4-7 años"]++;
        else if (tenure >= 8 && tenure <= 12) groups["8-12 años"]++;
        else if (tenure > 12) groups["Más de 12 años"]++;
    });

    return convertToPercentages(groups, workers.length);
}

function calculateGenericDistribution(workers: any[], field: string) {
    const groups: Record<string, number> = {};

    workers.forEach(w => {
        const val = w[field] || "No especificado";
        groups[val] = (groups[val] || 0) + 1;
    });

    return convertToPercentages(groups, workers.length);
}

function calculateFreeTimeDistribution(workers: any[]) {
    const counts: Record<string, number> = {};
    let totalInterests = 0;

    workers.forEach(w => {
        const interests = w.freeTimeUsage || [];
        interests.forEach((intr: string) => {
            counts[intr] = (counts[intr] || 0) + 1;
            totalInterests++;
        });
    });

    if (totalInterests === 0) return {};

    const percentages: Record<string, number> = {};
    for (const key in counts) {
        percentages[key] = Math.round((counts[key] / workers.length) * 100);
    }

    return percentages;
}

function convertToPercentages(groups: Record<string, number>, total: number) {
    if (total === 0) return groups;
    const percentages: Record<string, number> = {};
    for (const key in groups) {
        percentages[key] = Math.round((groups[key] / total) * 100);
    }
    return percentages;
}
