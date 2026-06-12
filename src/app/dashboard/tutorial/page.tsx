import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ClipboardList, PenLine, FileDown, PieChart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Guía Rápida | PsicoSST",
    description: "Aprende a utilizar la plataforma para calificar la batería de riesgo psicosocial.",
};

const steps = [
    {
        icon: Building2,
        title: "1. Crea tu primera Empresa",
        description: "El primer paso es registrar la empresa a la cual le estás prestando el servicio de evaluación. Los datos básicos como NIT y nombre aparecerán luego en los reportes.",
        action: "Ir a Empresas",
        href: "/dashboard/organizations",
        color: "text-blue-600",
        bg: "bg-blue-100",
    },
    {
        icon: Users,
        title: "2. Registra los Trabajadores",
        description: "Dentro del perfil de la empresa, podrás registrar a los trabajadores uno por uno, o usar la plantilla Excel para hacer un cargue masivo de todos los empleados.",
        action: "Ver Trabajadores",
        href: "/dashboard/workers",
        color: "text-emerald-600",
        bg: "bg-emerald-100",
    },
    {
        icon: ClipboardList,
        title: "3. Digitaliza las Evaluaciones",
        description: "Si aplicaste la batería en físico (papel), usa la herramienta 'Digitalizar Batería'. Es un formulario optimizado donde puedes tipear las respuestas rápidamente usando tu teclado numérico (0 a 4).",
        action: "Nueva Evaluación",
        href: "/dashboard/assessments/new/manual",
        color: "text-indigo-600",
        bg: "bg-indigo-100",
    },
    {
        icon: PenLine,
        title: "4. Revisa y Firma el Informe",
        description: "Una vez digitalizadas las respuestas, el sistema calcula automáticamente los puntajes transformados y el riesgo (Intralaboral, Extralaboral, Estrés). Solo te queda añadir tu análisis clínico y firmar digitalmente el reporte.",
        action: "Ir a Reportes",
        href: "/dashboard/reports",
        color: "text-amber-600",
        bg: "bg-amber-100",
    },
    {
        icon: FileDown,
        title: "5. Descarga los PDFs",
        description: "Cada informe firmado genera automáticamente un documento PDF con todos los requisitos legales, los puntajes exactos y tu tarjeta profesional / licencia en salud ocupacional incrustada.",
        color: "text-red-600",
        bg: "bg-red-100",
    },
    {
        icon: PieChart,
        title: "6. Entrega el Consolidado a la Empresa",
        description: "Puedes descargar un 'Informe Organizacional' en Excel (CSV) con las métricas agregadas y la distribución de riesgo de todos los evaluados. Es el insumo vital para el programa de vigilancia epidemiológica de la empresa.",
        action: "Ver Empresas",
        href: "/dashboard/organizations",
        color: "text-purple-600",
        bg: "bg-purple-100",
    },
];

export default function TutorialPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Guía Rápida de PsicoSST</h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Sigue estos pasos para llevar a cabo tu primera evaluación de riesgo psicosocial de inicio a fin.
                </p>
            </div>

            <div className="relative mt-8">
                {/* Vertical line connecting steps */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-border hidden md:block"></div>

                <div className="space-y-6 relative">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <Card key={index} className="relative overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row gap-6 p-6">
                                    <div className="flex-shrink-0 z-10">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-background ${step.bg} ${step.color} shadow-sm`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                    </div>
                                    <div className="flex-1 pt-2">
                                        <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed mb-4">
                                            {step.description}
                                        </p>
                                        {step.action && step.href && (
                                            <Button variant="outline" asChild className="mt-2 hover:bg-primary hover:text-primary-foreground">
                                                <Link href={step.href}>{step.action}</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            <Card className="bg-primary/5 border-primary/20 mt-12">
                <CardHeader>
                    <CardTitle className="text-primary">¿Tienes dudas adicionales?</CardTitle>
                    <CardDescription>
                        Recuerda que todas las evaluaciones de la batería de riesgo psicosocial en Colombia se rigen por la Resolución 2764 de 2022. PsicoSST se encarga del cómputo complejo para que tú puedas concentrarte en el análisis clínico.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard">Volver al Panel</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
