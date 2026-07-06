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
                departmentArea: true,
                hoursPerDay: true,
                hoursPerWeek: true
            }
        });

        // Agregaciones
        const genderData: Record<string, number> = {};
        const ageData: Record<string, number> = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0 };
        const maritalData: Record<string, number> = {};
        const educationData: Record<string, number> = {};
        const jobLevelData: Record<string, number> = {};
        const contractTypeData: Record<string, number> = {};
        const tenureData: Record<string, number> = { "< 1 año": 0, "1-3 años": 0, "3-5 años": 0, "5-10 años": 0, "> 10 años": 0 };
        const hoursData: Record<string, number> = { "< 40 hrs": 0, "40-48 hrs": 0, "> 48 hrs": 0 };

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

            // Contract Type
            const contract = w.contractType || "No Especificado";
            contractTypeData[contract] = (contractTypeData[contract] || 0) + 1;

            // Tenure
            if (w.yearsInCompany !== null && w.yearsInCompany !== undefined) {
                const y = w.yearsInCompany;
                if (y < 1) tenureData["< 1 año"]++;
                else if (y <= 3) tenureData["1-3 años"]++;
                else if (y <= 5) tenureData["3-5 años"]++;
                else if (y <= 10) tenureData["5-10 años"]++;
                else tenureData["> 10 años"]++;
            } else {
                tenureData["< 1 año"]++; // Default to < 1 if unknown or map properly
            }

            // Hours
            let hours = 48;
            if (w.hoursPerWeek) {
                const match = w.hoursPerWeek.match(/\d+/);
                if (match) hours = parseInt(match[0], 10);
            } else if (w.hoursPerDay) {
                const match = w.hoursPerDay.match(/\d+/);
                if (match) hours = parseInt(match[0], 10) * 6;
            }
            if (hours < 40) hoursData["< 40 hrs"]++;
            else if (hours <= 48) hoursData["40-48 hrs"]++;
            else hoursData["> 48 hrs"]++;
        });

        const formatChartData = (data: Record<string, number>) => 
            Object.entries(data).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            gender: formatChartData(genderData),
            age: formatChartData(ageData),
            marital: formatChartData(maritalData),
            education: formatChartData(educationData),
            jobLevel: formatChartData(jobLevelData),
            contractType: formatChartData(contractTypeData),
            tenure: formatChartData(tenureData),
            workingHours: formatChartData(hoursData),
            totalWorkers: workers.length
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
