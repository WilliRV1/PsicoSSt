import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmailCode } from "@/lib/auth/mfa";
import { sendEmail } from "@/lib/email/resend";
import { mfaEmailCodeEmail } from "@/lib/email/templates";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "UNAUTHORIZED", message: "No autenticado" }, { status: 401 });
        }

        const psychologist = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: { mfaEnabled: true, email: true, fullName: true },
        });
        if (!psychologist) {
            return NextResponse.json({ error: "NOT_FOUND", message: "Usuario no encontrado" }, { status: 404 });
        }
        if (psychologist.mfaEnabled) {
            return NextResponse.json({ error: "CONFLICT", message: "MFA ya está habilitado" }, { status: 409 });
        }

        const { code, codeHash, expiresAt } = generateEmailCode();
        await prisma.psychologist.update({
            where: { id: session.user.id },
            data: { mfaMethod: "EMAIL", mfaEmailCodeHash: codeHash, mfaEmailCodeExpiresAt: expiresAt },
        });

        const template = mfaEmailCodeEmail(psychologist.fullName, code);
        await sendEmail({ to: psychologist.email, ...template });

        return NextResponse.json({
            sent: true,
            message: `Enviamos un código de 6 dígitos a ${psychologist.email}.`,
        });
    } catch (error) {
        console.error("[MFA_SETUP_EMAIL] Error:", error);
        return NextResponse.json({ error: "INTERNAL_ERROR", message: "Error interno del servidor" }, { status: 500 });
    }
}
