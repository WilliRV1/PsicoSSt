import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { extractRequestMeta, logAudit } from "@/lib/auth/audit";
import { buildIndividualData } from "@/lib/reports/individual-data";
import { compileTypstPdf } from "@/lib/reports/typst";
import {
    archiveSignedPdf,
    assertArchiveConfigured,
    ReportArchiveError,
    sha256,
} from "@/lib/reports/archive";

// Firmar compila el PDF definitivo con Typst, que es un addon nativo.
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Una revocación explícita, si la hay, vive dentro de `reportData`.
 *
 * `GeneratedReport.assessmentId` es `@unique`: la tabla sólo admite un informe
 * por evaluación, así que no existe versionado. Mientras eso siga así, la única
 * forma de volver a firmar sin borrar la historia es dejar constancia de la
 * revocación en el propio JSON del informe anterior.
 */
function isRevoked(reportData: unknown): boolean {
    const revocation = (reportData as { revocation?: { revokedAt?: string } } | null)?.revocation;
    return !!revocation?.revokedAt;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ assessmentId: string }> }
) {
    const { assessmentId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analysis, recommendations } = body;

    if (!analysis || !recommendations) {
        return NextResponse.json({ error: "Missing analysis or recommendations" }, { status: 400 });
    }

    try {
        const assessment = await prisma.assessment.findUnique({
            where: { id: assessmentId },
            include: {
                scoredResult: true,
                psychologist: {
                    include: {
                        signatures: true
                    }
                },
                generatedReports: {
                    take: 1,
                    orderBy: { generatedAt: 'desc' }
                }
            }
        });

        if (!assessment || assessment.psychologistId !== session.user.id) {
            return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
        }

        if (!assessment.scoredResult) {
            return NextResponse.json({ error: "Assessment not scored yet" }, { status: 400 });
        }

        const previous = assessment.generatedReports[0] ?? null;
        const previousAssessmentStatus = assessment.status;

        // Un informe ya firmado no se vuelve a firmar encima: el `upsert`
        // sobrescribía el documento anterior y su huella, y con ello la única
        // prueba de qué se entregó. Para re-firmar hay que revocar primero.
        if (
            previous &&
            (previous.isFinalized ||
                previous.status === "SIGNED" ||
                previous.status === "DELIVERED") &&
            !isRevoked(previous.reportData)
        ) {
            return NextResponse.json(
                {
                    error:
                        "Este informe ya está firmado y no puede volver a firmarse. " +
                        "Para emitir uno nuevo hay que revocar primero el anterior, dejando constancia del motivo.",
                    reportId: previous.id,
                    signedAt: previous.signedAt,
                },
                { status: 409 }
            );
        }

        // La interpretación es un acto reservado al psicólogo con licencia SST
        // (Res. 2646/2008 art. 12). Si el texto salió de un borrador generado
        // automáticamente, no puede firmarse sin que el profesional lo haya
        // revisado y asumido: la casilla de la interfaz no basta, porque esta
        // ruta es invocable directamente.
        const prevData = (previous?.reportData ?? {}) as {
            analysisDraft?: unknown;
            analysisReviewedAt?: unknown;
        };
        if (prevData.analysisDraft != null && !prevData.analysisReviewedAt) {
            return NextResponse.json(
                {
                    error: "Debes revisar y asumir la interpretación profesional antes de firmar el informe."
                },
                { status: 409 }
            );
        }

        // Falla antes de tocar la base: firmar sin archivar dejaría un informe
        // firmado del que no queda copia del documento entregado.
        try {
            assertArchiveConfigured();
        } catch (error) {
            console.error("[SIGN] Archivo de informes no configurado:", error);
            return NextResponse.json(
                { error: (error as ReportArchiveError).message },
                { status: 503 }
            );
        }

        // Get psychologist's signature (optional — name-only signing is allowed)
        const psychologistSignature = assessment.psychologist.signatures.find(sig => sig.signatureType === 'drawn') ||
                                     assessment.psychologist.signatures.find(sig => sig.signatureType === 'uploaded');

        // We sign based on the scored results and assessment metadata
        const dataToSign = JSON.stringify({
            assessmentId: assessment.id,
            workerId: assessment.workerId,
            scoredAt: assessment.scoredResult.scoredAt,
            dimensionScores: assessment.scoredResult.dimensionScores,
            domainScores: assessment.scoredResult.domainScores,
            totalScores: assessment.scoredResult.totalScores,
            analysis,
            recommendations
        });

        // Huella de los DATOS calificados. `contentHash` queda reservado para la
        // huella de los bytes del PDF archivado, que es lo que la descarga
        // verifica antes de entregar el documento.
        const versionHash = sha256(Buffer.from(dataToSign, "utf8"));

        const signedAt = new Date();

        // Prepare report data
        const reportData: Record<string, unknown> = {
            analysis,
            recommendations,
            signedBy: assessment.psychologist.fullName,
            licenseNumber: assessment.psychologist.licenseNumber,
            signedAt: signedAt.toISOString()
        };

        // Al re-firmar tras una revocación, la firma anterior no desaparece: se
        // conserva su rastro aquí, que es lo único que el esquema actual permite.
        if (previous && isRevoked(previous.reportData)) {
            const history =
                ((previous.reportData as { signatureHistory?: unknown[] } | null)
                    ?.signatureHistory ?? []) as unknown[];
            reportData.signatureHistory = [
                ...history,
                {
                    signedAt: previous.signedAt,
                    signedBy: previous.signedBy,
                    contentHash: previous.contentHash,
                    versionHash: previous.versionHash,
                    pdfUrl: previous.pdfUrl,
                    revocation: (previous.reportData as { revocation?: unknown } | null)?.revocation,
                },
            ];
        }

        // Get signature image if available (prefer drawn over uploaded, fallback to legacy field)
        const signatureImage = psychologistSignature
            ? (psychologistSignature.dataUrl || psychologistSignature.imageUrl)
            : assessment.psychologist.signature ?? null;

        // El PDF definitivo se compila DESPUÉS de persistir la firma, porque la
        // plantilla toma el análisis, las recomendaciones y la imagen de firma
        // del propio `GeneratedReport`.
        const report = await prisma.generatedReport.upsert({
            where: { assessmentId: assessment.id },
            update: {
                status: "SIGNED",
                contentHash: null,
                versionHash,
                pdfUrl: null,
                pdfSize: null,
                signatureImage: signatureImage,
                signedBy: assessment.psychologist.fullName,
                signedAt,
                reportData: reportData as Prisma.InputJsonObject,
                isFinalized: true
            },
            create: {
                assessmentId: assessment.id,
                psychologistId: session.user.id,
                status: "SIGNED",
                contentHash: null,
                versionHash,
                signatureImage: signatureImage,
                signedBy: assessment.psychologist.fullName,
                signedAt,
                reportData: reportData as Prisma.InputJsonObject,
                isFinalized: true
            }
        });

        await prisma.assessment.update({
            where: { id: assessmentId },
            data: { status: "SIGNED" }
        });

        let archived;
        try {
            const built = await buildIndividualData(assessmentId, session.user.id, false, false);
            if (!built) throw new Error("No se pudo armar el informe para archivarlo.");
            const pdf = await compileTypstPdf("individual.typ", built.data, built.assets);
            archived = await archiveSignedPdf(assessmentId, pdf);
        } catch (error) {
            // Sin archivo no hay firma: se deshace todo en vez de dejar un
            // informe marcado como firmado sin documento que lo respalde.
            console.error("[SIGN] Falló el archivado del informe firmado:", error);
            if (previous) {
                await prisma.generatedReport.update({
                    where: { id: report.id },
                    data: {
                        status: previous.status,
                        contentHash: previous.contentHash,
                        versionHash: previous.versionHash,
                        pdfUrl: previous.pdfUrl,
                        pdfSize: previous.pdfSize,
                        signatureImage: previous.signatureImage,
                        signedBy: previous.signedBy,
                        signedAt: previous.signedAt,
                        reportData: previous.reportData as Prisma.InputJsonValue,
                        isFinalized: previous.isFinalized,
                    },
                });
            } else {
                await prisma.generatedReport.delete({ where: { id: report.id } });
            }
            await prisma.assessment.update({
                where: { id: assessmentId },
                data: { status: previousAssessmentStatus },
            });

            return NextResponse.json(
                {
                    error:
                        error instanceof ReportArchiveError
                            ? error.message
                            : "No se pudo archivar el informe firmado; la firma se deshizo.",
                },
                { status: error instanceof ReportArchiveError ? 503 : 500 }
            );
        }

        await prisma.generatedReport.update({
            where: { id: report.id },
            data: {
                pdfUrl: archived.url,
                pdfSize: archived.size,
                contentHash: archived.hash,
            },
        });

        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: session.user.id,
            action: "SIGN_REPORT",
            resourceType: "REPORT",
            resourceId: report.id,
            metadata: {
                assessmentId: assessment.id,
                contentHash: archived.hash,
                versionHash,
                pdfSize: archived.size,
                resigned: !!previous,
            },
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            reportId: report.id,
            contentHash: archived.hash,
            pdfSize: archived.size,
        });
    } catch (error) {
        console.error("Sign Report error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
