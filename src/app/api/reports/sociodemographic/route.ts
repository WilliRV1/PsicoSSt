import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
        return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    try {
        const workers = await prisma.worker.findMany({
            where: { organizationId },
            select: {
                gender: true,
                birthYear: true,
                maritalStatus: true,
                educationLevel: true,
                jobLevel: true,
                contractType: true,
                yearsInCompany: true,
                departmentArea: true
            }
        });

        // Agregaciones
        const genderData: Record<string, number> = {};
        const ageData: Record<string, number> = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0 };
        const maritalData: Record<string, number> = {};
        const educationData: Record<string, number> = {};
        const jobLevelData: Record<string, number> = {};
        const currentYear = new Date().getFullYear();

        workers.forEach(w => {
            // Gender
            const gender = w.gender || "No Especificado";
            genderData[gender] = (genderData[gender] || 0) + 1;

            // Age
            if (w.birthYear) {
                const age = currentYear - w.birthYear;
                if (age <= 25) ageData["18-25"]++;
                else if (age <= 35) ageData["26-35"]++;
                else if (age <= 45) ageData["36-45"]++;
                else if (age <= 55) ageData["46-55"]++;
                else ageData["56+"]++;
            }

            // Marital Status
            const marital = w.maritalStatus || "No Especificado";
            maritalData[marital] = (maritalData[marital] || 0) + 1;

            // Education
            const edu = w.educationLevel || "No Especificado";
            educationData[edu] = (educationData[edu] || 0) + 1;

            // Job Level
            const job = w.jobLevel || "No Especificado";
            jobLevelData[job] = (jobLevelData[job] || 0) + 1;
        });

        const formatChartData = (data: Record<string, number>) => 
            Object.entries(data).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            gender: formatChartData(genderData),
            age: formatChartData(ageData),
            marital: formatChartData(maritalData),
            education: formatChartData(educationData),
            jobLevel: formatChartData(jobLevelData),
            totalWorkers: workers.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
