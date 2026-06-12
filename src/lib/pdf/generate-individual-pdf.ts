import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import IndividualReportPDF from "@/components/reports/IndividualReportPDF";

interface AssessmentForPDF {
    assessmentDate: Date;
    questionnaireType: string;
    formType: string;
    worker: { fullName: string; documentType: string; documentId: string };
    organization: { name: string };
    psychologist: { fullName: string; licenseNumber: string; professionalCard?: string; sstCredential?: string; signature?: string | null; signatures?: { signatureType: string; dataUrl?: string | null; imageUrl?: string | null }[] };
    scoredResult: {
        overallRiskCategory: string;
        dimensionScores: unknown;
    };
    reports: {
        status: string;
        signatureImage?: string | null;
        reportData: unknown;
    }[];
}

export async function generateIndividualPDF(assessment: AssessmentForPDF): Promise<Buffer> {
    const { worker, organization, psychologist, scoredResult, reports } = assessment;
    const report = reports[0];

    const dimensionScoresRaw = scoredResult.dimensionScores as Record<string, { dimensionName?: string; transformedScore: number; riskCategory: string }>;
    const dimensionScores = Object.entries(dimensionScoresRaw).map(([key, data]) => ({
        name: data.dimensionName || key,
        score: data.transformedScore,
        level: data.riskCategory,
    }));

    // Resolve signature image: report snapshot → new model → legacy field
    let signatureImage: string | undefined;
    if (report?.status === "SIGNED" && report.signatureImage) {
        signatureImage = report.signatureImage;
    } else {
        const sig = psychologist.signatures?.find(s => s.signatureType === "drawn") ||
                    psychologist.signatures?.find(s => s.signatureType === "uploaded");
        signatureImage = sig?.dataUrl || sig?.imageUrl || psychologist.signature || undefined;
    }

    const assessmentDate = new Date(assessment.assessmentDate).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const reportData = report?.reportData as Record<string, string> | undefined;

    const element = React.createElement(IndividualReportPDF, {
        workerName: worker.fullName,
        workerId: `${worker.documentType} ${worker.documentId}`,
        orgName: organization.name,
        psychologistName: psychologist.fullName,
        licenseNumber: psychologist.licenseNumber,
        professionalCard: psychologist.professionalCard || '',
        sstCredential: psychologist.sstCredential || '',
        overallRisk: scoredResult.overallRiskCategory as any,
        dimensionScores,
        analysis: reportData?.analysis,
        recommendations: reportData?.recommendations,
        signatureImage,
        assessmentDate,
    });

    const stream = await renderToStream(element as any);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
