import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ConsentMethod = "VERBAL" | "WRITTEN" | "DIGITAL";

interface ConsentBody {
  consentMethod: ConsentMethod;
  consentText?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
  });

  if (!assessment) {
    return NextResponse.json(
      { error: "Evaluación no encontrada" },
      { status: 404 }
    );
  }

  if (assessment.psychologistId !== session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existing = await prisma.informedConsent.findUnique({
    where: { assessmentId: id },
  });

  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const body: ConsentBody = await req.json();
  const { consentMethod, consentText } = body;

  const VALID_METHODS: ConsentMethod[] = ["VERBAL", "WRITTEN", "DIGITAL"];
  if (!consentMethod || !VALID_METHODS.includes(consentMethod)) {
    return NextResponse.json(
      { error: `consentMethod inválido. Debe ser uno de: ${VALID_METHODS.join(", ")}` },
      { status: 400 }
    );
  }

  const consent = await prisma.informedConsent.create({
    data: {
      assessmentId: id,
      workerId: assessment.workerId,
      consentMethod,
      consentGranted: true,
      consentText:
        consentText ??
        "Consentimiento informado obtenido por el psicólogo antes de la aplicación de la batería.",
    },
  });

  return NextResponse.json(consent, { status: 201 });
}
