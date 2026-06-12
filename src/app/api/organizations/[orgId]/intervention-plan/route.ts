import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ orgId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { createdByPsychologist: true },
  });

  if (!org || org.createdByPsychologist !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const plan = await prisma.interventionPlan.findFirst({
    where: { organizationId: orgId, psychologistId: session.user.id },
    include: { actions: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plan ?? null);
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orgId } = await params;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { createdByPsychologist: true },
  });

  if (!org || org.createdByPsychologist !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, period } = body as { title: string; period: string };

  if (!title || !period) {
    return NextResponse.json({ error: "title and period are required" }, { status: 400 });
  }

  const plan = await prisma.interventionPlan.create({
    data: { organizationId: orgId, psychologistId: session.user.id, title, period },
    include: { actions: true },
  });

  return NextResponse.json(plan, { status: 201 });
}
