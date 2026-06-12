import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActionStatus } from "@/generated/prisma";

interface RouteContext {
  params: Promise<{ actionId: string }>;
}

async function verifyOwnership(actionId: string, userId: string) {
  const action = await prisma.interventionAction.findUnique({
    where: { id: actionId },
    include: { plan: { select: { psychologistId: true } } },
  });

  if (!action || action.plan.psychologistId !== userId) {
    return null;
  }

  return action;
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { actionId } = await params;

  const action = await verifyOwnership(actionId, session.user.id);
  if (!action) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    measure,
    responsible,
    dueDate,
    status,
    riskCategory,
    area,
    notes,
  } = body as {
    measure?: string;
    responsible?: string;
    dueDate?: string | null;
    status?: ActionStatus;
    riskCategory?: string;
    area?: string;
    notes?: string;
  };

  const updated = await prisma.interventionAction.update({
    where: { id: actionId },
    data: {
      ...(measure !== undefined && { measure }),
      ...(responsible !== undefined && { responsible }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(status !== undefined && { status }),
      ...(riskCategory !== undefined && { riskCategory }),
      ...(area !== undefined && { area }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { actionId } = await params;

  const action = await verifyOwnership(actionId, session.user.id);
  if (!action) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.interventionAction.delete({ where: { id: actionId } });

  return NextResponse.json({ success: true });
}
