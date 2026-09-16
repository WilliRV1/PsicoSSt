import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyDashboardState from "@/components/dashboard/empty-dashboard-state";
import { StatCard } from "@/components/dashboard/StatCard";
import type { ComplianceStatus } from "@/components/psicosst/compliance-badge";
import { OrgCardGrid, type OrgCard } from "@/components/dashboard/org-card-grid";
import { dueInfo, organizationValidity } from "@/lib/compliance/cadence";

const statusOrder: ComplianceStatus[] = ["vencida", "por_vencer", "sin_evaluar", "vigente"];

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const psychId = session.user.id;
    const firstName = session.user.fullName?.split(" ")[0] || "Profesional";

    const orgsRaw = await prisma.organization.findMany({
        where: { createdByPsychologist: psychId },
        select: {
            id: true,
            name: true,
            city: true,
            _count: { select: { workers: true } },
            assessments: {
                where: { psychologistId: psychId, status: { in: ["SCORED", "REVIEWED", "SIGNED"] } },
                select: {
                    workerId: true,
                    status: true,
                    assessmentDate: true,
                    scoredResult: { select: { overallRiskCategory: true } },
                },
                orderBy: { assessmentDate: "desc" },
            },
        },
        orderBy: { name: "asc" },
    });

    if (orgsRaw.length === 0) {
        return <EmptyDashboardState firstName={firstName} />;
    }

    // Server Component: se ejecuta una vez por petición, sin el re-render
    // concurrente que esta regla vigila en componentes de cliente — la hora
    // real del servidor es exactamente lo que necesita este cálculo.
    // eslint-disable-next-line react-hooks/purity
    const now = new Date();

    const orgCards: OrgCard[] = orgsRaw.map(org => {
        const signed   = org.assessments.filter(a => a.status === "SIGNED");
        const pending  = org.assessments.filter(a => a.status === "SCORED" || a.status === "REVIEWED");

        const evaluatedIds = new Set(signed.map(a => a.workerId));
        const criticalIds  = new Set(
            signed
                .filter(a => ["ALTO", "MUY_ALTO"].includes(a.scoredResult?.overallRiskCategory ?? ""))
                .map(a => a.workerId)
        );

        const evaluatedCount = evaluatedIds.size;
        const criticalCount  = criticalIds.size;
        const criticalPct    = evaluatedCount > 0 ? (criticalCount / evaluatedCount) * 100 : 0;

        const lastSigned = signed[0]?.assessmentDate ?? null;

        let complianceStatus: ComplianceStatus;
        let expiryDate: Date | null = null;
        let daysLeft: number | null = null;

        if (!lastSigned) {
            complianceStatus = "sin_evaluar";
        } else {
            // Aquí sólo se conoce el % de críticos; los otros dos criterios de
            // vigencia anual (área saturada, dominio muy alto) los aplica el
            // informe diagnóstico, que tiene los datos.
            const info = dueInfo(new Date(lastSigned), organizationValidity({ criticalWorkerPercent: criticalPct }), now);
            expiryDate = info.dueDate;
            daysLeft = info.daysLeft;
            complianceStatus = info.status === "VENCIDA" ? "vencida" : info.status === "POR_VENCER" ? "por_vencer" : "vigente";
        }

        return {
            id: org.id,
            name: org.name,
            city: org.city,
            totalWorkers: org._count.workers,
            evaluatedWorkers: evaluatedCount,
            criticalWorkers: criticalCount,
            pendingSignatures: pending.length,
            complianceStatus,
            expiryDate: expiryDate ? expiryDate.toISOString() : null,
            daysLeft,
        };
    });

    orgCards.sort((a, b) =>
        statusOrder.indexOf(a.complianceStatus) - statusOrder.indexOf(b.complianceStatus)
    );

    // Requiere una decisión hoy: vencidas, por vencer, o con firmas pendientes.
    const needsActionCount  = orgCards.filter(o => o.complianceStatus === "vencida" || o.complianceStatus === "por_vencer").length;
    const totalPending      = orgCards.reduce((s, o) => s + o.pendingSignatures, 0);
    const totalCritical     = orgCards.reduce((s, o) => s + o.criticalWorkers, 0);

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-5">
                <div>
                    <h1 className="text-[26px] font-semibold text-foreground tracking-[-0.02em]">
                        Bienvenido/a, {firstName}
                    </h1>
                    <p className="text-[13px] text-text-secondary mt-1">
                        {orgsRaw.length} empresa{orgsRaw.length !== 1 ? "s" : ""} registrada{orgsRaw.length !== 1 ? "s" : ""} · corte a hoy
                    </p>
                </div>
                <Button asChild size="sm" className="press-feedback">
                    <Link href="/dashboard/organizations">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva empresa
                    </Link>
                </Button>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard index={0} title="Requieren atención" value={needsActionCount} trendLabel="vencidas o por vencer" />
                <StatCard index={1} title="Pendientes de firma" value={totalPending} trendLabel="evaluaciones sin firmar" />
                <StatCard index={2} title="Riesgo alto o muy alto" value={totalCritical} trendLabel="trabajadores firmados" />
            </div>

            {/* Org cards */}
            <div>
                <h2 className="text-[15px] font-semibold text-foreground mb-3">Estado por empresa</h2>
                <OrgCardGrid orgs={orgCards} />
            </div>
        </div>
    );
}
