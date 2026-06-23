import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, createdByPsychologist: true, name: true },
    });
    
    if (!org || org.createdByPsychologist !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const body = await req.json();
        const { riskSummary } = body; // This should be a string summarizing the highest risks

        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

        if (!OPENROUTER_API_KEY) {
            // Mock response if no API key is provided
            return NextResponse.json({
                recommendation: `[SIMULACIÓN IA] Basado en los riesgos encontrados en la empresa ${org.name}, se recomienda:
1. Implementar pausas activas para mitigar demandas físicas.
2. Mejorar canales de comunicación para reducir fricciones en relaciones interpersonales.
3. Evaluar la carga de trabajo en los departamentos con mayor riesgo.`
            });
        }

        const prompt = `Eres un psicólogo especialista en Seguridad y Salud en el Trabajo (SST) en Colombia.
Basado en los siguientes resultados de la Batería de Riesgo Psicosocial para la empresa ${org.name}:

${JSON.stringify(riskSummary)}

Redacta en un tono profesional, objetivo y en primera persona, las conclusiones generales y un plan de acción sugerido (a corto, mediano y largo plazo) enfocado en las dimensiones que salieron en Riesgo Alto o Muy Alto.`;

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

        if (!response.ok) {
            throw new Error("Failed to fetch from OpenRouter");
        }

        const data = await response.json();
        const recommendation = data.choices[0].message.content;

        return NextResponse.json({ recommendation });
    } catch (error) {
        console.error("Error generating AI recommendations:", error);
        return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }
}
