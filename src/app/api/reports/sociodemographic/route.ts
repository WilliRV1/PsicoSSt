import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const department = searchParams.get("department");

    if (!organizationId) {
        return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    try {
        const whereClause: any = {
            organizationId
        };

        if (department && department !== "ALL") {
            whereClause.departmentArea = department;
        }

        // Only count workers that have actually completed an assessment
        // so we don't skew data with invited but pending workers.
        whereClause.assessments = {
            some: {} // requires at least one assessment
        };

        const workers = await prisma.worker.findMany({
            where: whereClause
        });

        const workerCount = workers.length;

        // Anonimato Legal
        if (workerCount < 5 && workerCount > 0 && department !== "ALL") {
            return NextResponse.json({ 
                privacyWarning: true, 
                message: "Reserva Legal por Muestra Insuficiente" 
            }, { status: 403 });
        }

        const currentYear = new Date().getFullYear();

        // Agregaciones Sociodemográficas
        const genderData = { MASCULINO: 0, FEMENINO: 0, NO_BINARIO: 0, NO_RESPONDE: 0 };
        const ageData = { "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56+": 0, "No Data": 0 };
        const educationData: Record<string, number> = {};
        const maritalData: Record<string, number> = {};
        const stratumData: Record<string, number> = {};
        const housingData: Record<string, number> = {};
        const dependentsData = { "0": 0, "1-2": 0, "3+": 0 };

        // Agregaciones Ocupacionales
        const seniorityCompanyData = { "< 6 meses": 0, "6 meses - 1 año": 0, "1 a 5 años": 0, "5 a 10 años": 0, "> 10 años": 0, "No Data": 0 };
        const seniorityRoleData = { "< 6 meses": 0, "6 meses - 1 año": 0, "1 a 5 años": 0, "5 a 10 años": 0, "> 10 años": 0, "No Data": 0 };
        const roleData = { "JEFATURA/PROFESIONAL": 0, "AUXILIAR/OPERATIVO": 0 };
        const contractData: Record<string, number> = {};
        const hoursData = { "<= 8 horas": 0, "> 8 horas": 0, "No Data": 0 };
        const paymentData: Record<string, number> = {};

        for (const w of workers) {
            // Sexo
            if (w.gender === "M" || w.gender === "MASCULINO") genderData.MASCULINO++;
            else if (w.gender === "F" || w.gender === "FEMENINO") genderData.FEMENINO++;
            else if (w.gender === "NB" || w.gender === "NO BINARIO" || w.gender === "NO_BINARIO") genderData.NO_BINARIO++;
            else genderData.NO_RESPONDE++;

            // Edad
            let age: number | null = null;
            if (w.birthYear) age = currentYear - w.birthYear;
            else if (w.birthDate) age = currentYear - w.birthDate.getFullYear();
            
            if (age !== null) {
                if (age <= 25) ageData["18-25"]++;
                else if (age <= 35) ageData["26-35"]++;
                else if (age <= 45) ageData["36-45"]++;
                else if (age <= 55) ageData["46-55"]++;
                else ageData["56+"]++;
            } else {
                ageData["No Data"]++;
            }

            // Escolaridad
            const edu = w.educationLevel || "NO RESPONDE";
            educationData[edu] = (educationData[edu] || 0) + 1;

            // Estado Civil
            const marital = w.maritalStatus || "NO RESPONDE";
            maritalData[marital] = (maritalData[marital] || 0) + 1;

            // Estrato
            const stratum = w.socioeconomicStratum || "NO RESPONDE";
            stratumData[stratum] = (stratumData[stratum] || 0) + 1;

            // Vivienda
            const housing = w.housingType || "NO RESPONDE";
            housingData[housing] = (housingData[housing] || 0) + 1;

            // Dependientes
            const deps = w.dependentsCount;
            if (deps === 0) dependentsData["0"]++;
            else if (deps === 1 || deps === 2) dependentsData["1-2"]++;
            else if (deps && deps >= 3) dependentsData["3+"]++;
            else dependentsData["0"]++; // Asumimos 0 si no hay data explícita

            // Antigüedad Empresa
            if (w.lessThanOneYearInCompany) {
                seniorityCompanyData["6 meses - 1 año"]++; // Aproximación
            } else if (w.yearsInCompany !== null) {
                const y = w.yearsInCompany;
                if (y === 0) seniorityCompanyData["< 6 meses"]++;
                else if (y >= 1 && y <= 5) seniorityCompanyData["1 a 5 años"]++;
                else if (y > 5 && y <= 10) seniorityCompanyData["5 a 10 años"]++;
                else if (y > 10) seniorityCompanyData["> 10 años"]++;
                else seniorityCompanyData["No Data"]++;
            } else {
                seniorityCompanyData["No Data"]++;
            }

            // Antigüedad Cargo
            if (w.lessThanOneYearInPosition) {
                seniorityRoleData["< 6 meses"]++; // Asumimos crítico
            } else if (w.yearsInPosition !== null) {
                const y = w.yearsInPosition;
                if (y === 0) seniorityRoleData["< 6 meses"]++;
                else if (y >= 1 && y <= 5) seniorityRoleData["1 a 5 años"]++;
                else if (y > 5 && y <= 10) seniorityRoleData["5 a 10 años"]++;
                else if (y > 10) seniorityRoleData["> 10 años"]++;
                else seniorityRoleData["No Data"]++;
            } else {
                seniorityRoleData["No Data"]++;
            }

            // Nivel de Cargo
            if (w.jobLevel === "JEFATURA" || w.jobLevel === "PROFESIONAL" || w.jobLevel === "TECNICO") {
                roleData["JEFATURA/PROFESIONAL"]++;
            } else {
                roleData["AUXILIAR/OPERATIVO"]++;
            }

            // Contrato
            const contract = w.contractType || "NO RESPONDE";
            contractData[contract] = (contractData[contract] || 0) + 1;

            // Horas
            const hrs = w.hoursPerDay || "";
            if (hrs.includes(">") || hrs.includes("Mas") || hrs.includes("Más") || parseInt(hrs) > 8) {
                hoursData["> 8 horas"]++;
            } else if (hrs !== "") {
                hoursData["<= 8 horas"]++;
            } else {
                hoursData["No Data"]++;
            }

            // Pago
            const payment = w.paymentModality || "NO RESPONDE";
            paymentData[payment] = (paymentData[payment] || 0) + 1;
        }

        const formatData = (obj: Record<string, number>) => {
            return Object.entries(obj)
                .filter(([_, v]) => v > 0)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        };

        const formatDataFixed = (obj: Record<string, number>) => {
            return Object.entries(obj).map(([name, value]) => ({ name, value }));
        };

        const reportData = {
            totalWorkers: workerCount,
            sociodemographic: {
                gender: formatDataFixed(genderData),
                age: formatDataFixed(ageData),
                education: formatData(educationData),
                maritalStatus: formatData(maritalData),
                stratum: formatData(stratumData),
                housing: formatData(housingData),
                dependents: formatDataFixed(dependentsData)
            },
            occupational: {
                seniorityCompany: formatDataFixed(seniorityCompanyData),
                seniorityRole: formatDataFixed(seniorityRoleData),
                roleLevel: formatDataFixed(roleData),
                contractType: formatData(contractData),
                hoursPerDay: formatDataFixed(hoursData),
                paymentModality: formatData(paymentData)
            },
            alerts: {
                fatigueRisk: hoursData["> 8 horas"] > (workerCount * 0.3),
                highTurnoverRisk: seniorityRoleData["< 6 meses"] > (workerCount * 0.4),
            }
        };

        return NextResponse.json(reportData);

    } catch (error: any) {
        console.error("Error generating sociodemographic report:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
