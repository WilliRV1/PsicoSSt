import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyOrgOwnership(orgId: string, psychologistId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { createdByPsychologist: true },
  });
  return org && org.createdByPsychologist === psychologistId ? org : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;

    const org = await verifyOrgOwnership(orgId, session.user.id);
    if (!org && !session.user.isAdmin) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    const whereClause: any = { organizationId: orgId };
    if (yearParam) {
      whereClause.year = parseInt(yearParam);
    }

    const reports = await prisma.assessmentReport.findMany({
      where: whereClause,
      orderBy: { year: 'desc' }
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error("Error fetching assessment reports:", error);
    return NextResponse.json(
      { error: "Error fetching reports" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await params;

    const org = await verifyOrgOwnership(orgId, session.user.id);
    if (!org) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { year, fieldFindings, status } = body;

    if (!year) {
      return NextResponse.json({ error: "Year is required" }, { status: 400 });
    }

    const report = await prisma.assessmentReport.upsert({
      where: {
        organizationId_year: {
          organizationId: orgId,
          year: parseInt(year)
        }
      },
      update: {
        fieldFindings,
        status: status || "DRAFT",
        psychologistId: session.user.id
      },
      create: {
        organizationId: orgId,
        psychologistId: session.user.id,
        year: parseInt(year),
        fieldFindings,
        status: status || "DRAFT"
      }
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error saving assessment report:", error);
    return NextResponse.json(
      { error: "Error saving report" },
      { status: 500 }
    );
  }
}
