/**
 * Recalifica las evaluaciones ya almacenadas con el motor corregido.
 *
 * Las respuestas crudas de cada cuestionario se conservan en `response_sets`,
 * de modo que todo puntaje es reproducible: no hace falta volver a aplicar
 * nada a nadie. Este script las vuelve a pasar por el motor y reescribe el
 * resultado.
 *
 *   npx tsx scripts/rescore-assessments.ts            # simulación, no escribe
 *   npx tsx scripts/rescore-assessments.ts --apply    # aplica los cambios
 *   npx tsx scripts/rescore-assessments.ts --apply --org <uuid>
 *
 * Sin `--apply` sólo informa qué cambiaría, que es como conviene ejecutarlo la
 * primera vez contra producción.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { scoreQuestionnaire } from "../src/lib/scoring";
import type { FormType, ItemResponses, QuestionnaireType } from "../src/types/battery";

const apply = process.argv.includes("--apply");
const orgFlag = process.argv.indexOf("--org");
const orgId = orgFlag !== -1 ? process.argv[orgFlag + 1] : undefined;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/** Movimientos entre niveles, para ver la magnitud del cambio de un vistazo. */
const transitions = new Map<string, number>();
const byQuestionnaire = new Map<string, { total: number; changed: number }>();

function track(questionnaire: string, before: string, after: string) {
    const q = byQuestionnaire.get(questionnaire) ?? { total: 0, changed: 0 };
    q.total++;
    if (before !== after) {
        q.changed++;
        const key = `${before} → ${after}`;
        transitions.set(key, (transitions.get(key) ?? 0) + 1);
    }
    byQuestionnaire.set(questionnaire, q);
}

async function main() {
    const assessments = await prisma.assessment.findMany({
        where: {
            ...(orgId ? { organizationId: orgId } : {}),
            responseSet: { isNot: null },
            scoredResult: { isNot: null },
        },
        include: {
            responseSet: { select: { responses: true } },
            scoredResult: { select: { id: true, overallRiskCategory: true } },
            worker: {
                select: {
                    id: true,
                    jobLevel: true,
                    gender: true,
                    hasCustomerInteraction: true,
                    hasPeopleInCharge: true,
                },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    console.log(
        `${assessments.length} evaluaciones con respuestas guardadas${orgId ? ` en la organización ${orgId}` : ""}.`
    );
    console.log(apply ? "Modo APLICAR: se reescribirán los resultados.\n" : "Simulación: no se escribe nada.\n");

    let failed = 0;

    for (const a of assessments) {
        const responses = a.responseSet!.responses as ItemResponses;
        const worker = a.worker;

        try {
            const scored = scoreQuestionnaire(
                responses,
                a.formType as FormType,
                a.questionnaireType as QuestionnaireType,
                {
                    jobLevel: worker.jobLevel,
                    gender: worker.gender ?? undefined,
                    occupationalGroup:
                        worker.jobLevel === "AUXILIAR" || worker.jobLevel === "OPERATIVO"
                            ? "auxiliares_operativos"
                            : "jefes_profesionales_tecnicos",
                    hasCustomerInteraction: worker.hasCustomerInteraction,
                    // Si nunca se registró la respuesta a la pregunta de control,
                    // se deja sin filtrar: suponer que no es jefe pondría en cero
                    // una dimensión que el trabajador sí respondió.
                    hasPeopleInCharge: worker.hasPeopleInCharge ?? undefined,
                }
            );

            const before = a.scoredResult!.overallRiskCategory as string;
            const after = scored.total.riskCategory;
            track(a.questionnaireType, before, after);

            if (apply) {
                await prisma.scoredResult.update({
                    where: { id: a.scoredResult!.id },
                    data: {
                        dimensionScores: scored.dimensions as never,
                        domainScores: scored.domains as never,
                        totalScores: scored.total as never,
                        overallRiskCategory: after as never,
                        scoredAt: new Date(),
                    },
                });
            }
        } catch (error) {
            failed++;
            console.error(`  ✗ ${a.id} (${a.questionnaireType}):`, (error as Error).message);
        }
    }

    console.log("\n── Resultado por cuestionario ──");
    for (const [q, v] of byQuestionnaire) {
        const pct = v.total ? Math.round((v.changed / v.total) * 100) : 0;
        console.log(`  ${q.padEnd(14)} ${v.changed} de ${v.total} cambian de nivel (${pct}%)`);
    }

    if (transitions.size > 0) {
        console.log("\n── Movimientos de nivel ──");
        for (const [k, n] of [...transitions.entries()].sort((x, y) => y[1] - x[1])) {
            console.log(`  ${String(n).padStart(5)}  ${k}`);
        }
    } else {
        console.log("\nNingún nivel cambia.");
    }

    if (failed > 0) console.log(`\n${failed} evaluaciones no pudieron recalificarse.`);
    if (!apply) console.log("\nVuelve a ejecutarlo con --apply para escribir los cambios.");
}

main()
    .catch(e => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
