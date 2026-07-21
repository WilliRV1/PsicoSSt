import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { ExecutiveReportPDF } from "@/components/organizations/executive-report-pdf";
import { computeCollectiveMetrics } from "@/lib/pdf/engine/metrics";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const url = new URL(req.url);
    const reportType = url.searchParams.get("type") || "executive"; // executive or technical
    
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

    const settings = await prisma.psychologistSettings.findUnique({
        where: { psychologistId: session.user.id },
    });

    // 1. Prepare risk summary for AI using the new Metrics engine
    const metrics = computeCollectiveMetrics(workers);

    // 2. Fetch AI Recommendations locally
    let aiRecommendations = "";
    let aiProjectMatrix = [];
    try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (!OPENROUTER_API_KEY) {
             aiRecommendations = `Los resultados muestran una organización con condiciones psicosociales mayoritariamente favorables. Sin embargo, el comportamiento observado en las Demandas Psicológicas representa un foco de atención prioritario debido a su impacto potencial sobre la productividad y el clima organizacional.`;
             aiProjectMatrix = [
                 { priority: "Alta", action: "Capacitación a líderes en manejo de estrés", responsible: "SST", time: "30 días", impact: "Alto" }
             ];
        } else {
             const prompt = `Actúa como un consultor senior de una firma top mundial (ej. Deloitte) especializado en Riesgo Psicosocial y Salud Ocupacional.
Analiza las siguientes métricas de la organización ${org.name}:
- Health Score: ${metrics.healthScore}/100
- Trabajadores Evaluados: ${metrics.totalEvaluated}
- Hallazgos principales: ${JSON.stringify(metrics.topFindings)}
- Factores protectores: ${JSON.stringify(metrics.protectiveFactors)}

Debes responder estrictamente en un bloque de código JSON con este formato:
{
  "narrative": "Un solo párrafo (máximo 120 palabras) interpretando la situación general en tono de consultoría de alto nivel. Céntrate en decisiones estratégicas e impacto de negocio, no solo en repetir porcentajes.",
  "projectMatrix": [
    { "priority": "Alta|Media|Baja", "action": "Breve descripción de la acción", "responsible": "Ej: Talento Humano", "time": "Ej: 30 días", "impact": "Alto|Medio|Bajo" }
  ]
}
Genera de 3 a 5 acciones estratégicas para la projectMatrix basadas en los hallazgos.`;

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
                const content = data.choices[0].message.content;
                // Extraer el JSON del string
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    aiRecommendations = parsed.narrative;
                    aiProjectMatrix = parsed.projectMatrix;
                } else {
                    aiRecommendations = content;
                }
            }
        }
    } catch (e) {
        console.error("AI Error:", e);
    }

    // 3. Render PDF
    const pdfProps = {
        organization: { name: org.name, nit: org.nit || "", city: org.city },
        psychologist: { 
            fullName: psychologist?.fullName || "", 
            licenseNumber: psychologist?.licenseNumber || "", 
            professionalCard: psychologist?.professionalCard || "" 
        },
        settings: settings || undefined,
        metrics,
        generatedAt: new Date().toISOString(),
        aiRecommendations,
        aiProjectMatrix
    };

    const docElement = React.createElement(ExecutiveReportPDF, pdfProps);

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
