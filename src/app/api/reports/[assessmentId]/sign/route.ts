import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

        const hash = crypto.createHash('sha256').update(dataToSign).digest('hex');

        // Prepare report data
        const reportData = {
            analysis,
            recommendations,
            signedBy: assessment.psychologist.fullName,
            licenseNumber: assessment.psychologist.licenseNumber,
            signedAt: new Date().toISOString()
        };

        // Get signature image if available (prefer drawn over uploaded, fallback to legacy field)
        const signatureImage = psychologistSignature
            ? (psychologistSignature.dataUrl || psychologistSignature.imageUrl)
            : assessment.psychologist.signature ?? null;

        const report = await prisma.generatedReport.upsert({
            where: { assessmentId: assessment.id },
            update: {
                status: "SIGNED",
                contentHash: hash,
                signatureImage: signatureImage,
                signedBy: assessment.psychologist.fullName,
                signedAt: new Date(),
                reportData,
                isFinalized: true
            },
            create: {
                assessmentId: assessment.id,
                psychologistId: session.user.id,
                status: "SIGNED",
                contentHash: hash,
                signatureImage: signatureImage,
                signedBy: assessment.psychologist.fullName,
                signedAt: new Date(),
                reportData,
                isFinalized: true
            }
        });

        await prisma.assessment.update({
            where: { id: assessmentId },
            data: { status: "SIGNED" }
        });

        await prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "SIGN_REPORT",
                resourceType: "REPORT",
                resourceId: report.id,
                metadata: {
                    assessmentId: assessment.id,
                    hash: hash
                }
            }
        });

        return NextResponse.json({ success: true, reportId: report.id });
    } catch (error) {
        console.error("Sign Report error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
