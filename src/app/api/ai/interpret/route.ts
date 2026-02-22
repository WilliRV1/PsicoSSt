import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ScoredResultData } from "@/types/battery";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { scores, demographics } = await request.json();

        if (!scores) {
            return NextResponse.json({ error: "Missing scores for interpretation" }, { status: 400 });
        }

        // Prompt construction for AI interpretation
        // In a real scenario, this would call OpenAI/Gemini
        // For now, we simulate a professional interpretation based on risk levels

        const riskLevel = scores.total.riskCategory;
        let interpretation = "";
        let recommendations: string[] = [];

        if (riskLevel === "MUY_ALTO" || riskLevel === "ALTO") {
            interpretation = "Se observa un nivel de riesgo psicosocial crítico que requiere intervención inmediata. Las dimensiones con mayor afectación sugieren una carga mental y emocional significativa.";
            recommendations = [
                "Realizar evaluación clínica individual para casos con estrés muy alto.",
                "Implementar programas de vigilancia epidemiológica para riesgo psicosocial.",
                "Revisar cargas de trabajo y distribución de tareas en las áreas críticas.",
                "Capacitación en manejo de estrés y resiliencia para el personal afectado."
            ];
        } else if (riskLevel === "MEDIO") {
            interpretation = "El nivel de riesgo es moderado. Se recomienda monitorear las dimensiones con puntajes más altos para prevenir el escalamiento del riesgo.";
            recommendations = [
                "Reforzar el apoyo social y el liderazgo positivo.",
                "Realizar talleres preventivos sobre clima organizacional.",
                "Fomentar el equilibrio vida-trabajo a través de flexibilización horaria si es posible."
            ];
        } else {
            interpretation = "El nivel de riesgo se encuentra en niveles aceptables. Se recomienda mantener las condiciones actuales y realizar seguimiento periódico.";
            recommendations = [
                "Continuar con las actividades de bienestar vigentes.",
                "Realizar la próxima medición según los plazos establecidos por ley.",
                "Promover estilos de vida y trabajo saludables."
            ];
        }

        return NextResponse.json({
            interpretation,
            recommendations,
            aiModel: "PsicoSST-Analyzer-v1",
            createdAt: new Date()
        });
    } catch (error) {
        console.error("AI Interpretation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
