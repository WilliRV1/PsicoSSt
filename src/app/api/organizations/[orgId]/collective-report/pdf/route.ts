import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { CollectiveDiagnosticPDF } from "@/components/organizations/collective-diagnostic-pdf";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, nit: true, city: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const workers = await prisma.worker.findMany({
        where: { organizationId: orgId },
        select: {
            jobLevel: true,
            assessments: {
                where: {
                    psychologistId: session.user.id,
                    status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                },
                select: {
                    questionnaireType: true,
                    scoredResult: { select: { overallRiskCategory: true } },
                },
            },
        },
    });

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, licenseNumber: true, professionalCard: true },
    });

    // 1. Prepare risk summary for AI
    const riskSummary = { workersEvaluated: workers.length, highRiskCount: 0 };
    workers.forEach(w => {
        const hasHighRisk = w.assessments.some(a => 
            a.scoredResult?.overallRiskCategory === "ALTO" || 
            a.scoredResult?.overallRiskCategory === "MUY_ALTO"
        );
        if (hasHighRisk) riskSummary.highRiskCount++;
    });

    // 2. Fetch AI Recommendations locally
    let aiRecommendations = "";
    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
             aiRecommendations = `[SIMULACIÓN IA] Basado en los riesgos encontrados en la empresa ${org.name}, se recomienda:
1. Implementar pausas activas para mitigar demandas físicas.
2. Mejorar canales de comunicación para reducir fricciones en relaciones interpersonales.
3. Evaluar la carga de trabajo en los departamentos con mayor riesgo.`;
        } else {
             const prompt = `Eres un psicólogo especialista en Seguridad y Salud en el Trabajo (SST) en Colombia.
Basado en los siguientes resultados de la Batería de Riesgo Psicosocial para la empresa ${org.name}:

${JSON.stringify(riskSummary)}

Redacta en un tono profesional, objetivo y en primera persona, las conclusiones generales y un plan de acción sugerido (a corto, mediano y largo plazo) enfocado en los posibles riesgos. Máximo 150 palabras.`;

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                    "X-Title": "PsicoSST",
                },
                body: JSON.stringify({
                    model: "anthropic/claude-3.5-haiku",
                    messages: [{ role: "user", content: prompt }],
                })
            });
            if (response.ok) {
                const data = await response.json();
                aiRecommendations = data.choices[0].message.content;
            }
        }
    } catch (e) {
        console.error("AI Error:", e);
    }

    // 3. Render PDF
    const docElement = React.createElement(CollectiveDiagnosticPDF, {
        organization: { name: org.name, nit: org.nit || "", city: org.city },
        psychologist: { 
            fullName: psychologist?.fullName || "", 
            licenseNumber: psychologist?.licenseNumber || "", 
            professionalCard: psychologist?.professionalCard || "" 
        },
        totalWorkers: workers.length,
        generatedAt: new Date().toISOString(),
        aiRecommendations
    });

    const stream = await renderToStream(docElement as any);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
        stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
        stream.on("end", resolve);
        stream.on("error", reject);
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="informe-colectivo-${orgId}.pdf"`,
            "Content-Length": String(pdfBuffer.byteLength),
        },
    });
}
