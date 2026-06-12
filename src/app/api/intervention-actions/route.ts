import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    planId,
    measure,
    responsible,
    dueDate,
    riskCategory,
    area,
    notes,
  } = body as {
    planId: string;
    measure: string;
    responsible: string;
    dueDate?: string;
    riskCategory?: string;
    area?: string;
    notes?: string;
  };

  if (!planId || !measure || !responsible) {
    return NextResponse.json(
      { error: "planId, measure, and responsible are required" },
      { status: 400 }
    );
  }

  const plan = await prisma.interventionPlan.findUnique({
    where: { id: planId },
    select: { psychologistId: true },
  });

  if (!plan || plan.psychologistId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const action = await prisma.interventionAction.create({
    data: {
      planId,
      measure,
      responsible,
      dueDate: dueDate ? new Date(dueDate) : null,
      riskCategory,
      area,
      notes,
      status: "PENDING",
    },
  });

  return NextResponse.json(action, { status: 201 });
}
