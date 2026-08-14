import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import { MegaReportPDF } from "@/components/organizations/mega-report-pdf";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { orgId } = await params;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true, nit: true, createdByPsychologist: true },
    });
    if (!org || org.createdByPsychologist !== session.user.id)
        return NextResponse.json({ error: "Not found" }, { status: 404 });

    const workers = await prisma.worker.findMany({
        where: { organizationId: orgId },
        select: {
            documentId: true,
            fullName: true,
            jobTitle: true,
            departmentArea: true,
            gender: true,
            birthYear: true,
            assessments: {
                where: {
                    psychologistId: session.user.id,
                    status: { in: ["SCORED", "REVIEWED", "SIGNED"] },
                },
                select: {
                    formType: true,
                    questionnaireType: true,
                    scoredResult: { select: { overallRiskCategory: true } },
                },
            },
        },
    });

    const psychologist = await prisma.psychologist.findUnique({
        where: { id: session.user.id },
        select: { fullName: true, licenseNumber: true },
    });

    const settings = await prisma.psychologistSettings.findUnique({
        where: { psychologistId: session.user.id },
    });

    const pdfProps = {
        organization: { name: org.name, nit: org.nit || "" },
        psychologist: { 
            fullName: psychologist?.fullName || "", 
            licenseNumber: psychologist?.licenseNumber || ""
        },
        settings: settings || undefined,
        workers,
        generatedAt: new Date().toISOString(),
    };

    const docElement = React.createElement(MegaReportPDF, pdfProps);
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
            "Content-Disposition": `attachment; filename="mega-informe-${orgId}.pdf"`,
            "Content-Length": String(pdfBuffer.byteLength),
        },
    });
}
