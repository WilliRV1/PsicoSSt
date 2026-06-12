import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "El correo es obligatorio" },
                { status: 400 }
            );
        }

        // Always return 200 to prevent email enumeration
        const successResponse = NextResponse.json({
            message: "Si el correo existe, recibirás un código de recuperación.",
        });

        const psychologist = await prisma.psychologist.findUnique({
            where: { email },
            select: { id: true, fullName: true, email: true },
        });

        if (!psychologist) return successResponse;

        // Rate limit: max 3 requests per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentTokens = await prisma.passwordResetToken.count({
            where: {
                psychologistId: psychologist.id,
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentTokens >= 3) {
            return NextResponse.json(
                { error: "Demasiadas solicitudes. Intenta en 1 hora." },
                { status: 429 }
            );
        }

        // Generate 6-digit code
        const code = crypto.randomInt(100000, 999999).toString();
        const codeHash = await hashPassword(code);

        // Create token (10 min expiry)
        await prisma.passwordResetToken.create({
            data: {
                psychologistId: psychologist.id,
                codeHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        // Send email (fire-and-forget)
        const template = passwordResetEmail(psychologist.fullName, code);
        sendEmail({ to: psychologist.email, ...template }).catch(console.error);

        return successResponse;
    } catch (error) {
        console.error("[FORGOT-PASSWORD] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
