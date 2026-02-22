import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTOTPSecret, generateQRCodeDataURL } from "@/lib/auth/mfa";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "UNAUTHORIZED", message: "No autenticado" },
                { status: 401 }
            );
        }

        // Check if MFA is already enabled
        const psychologist = await prisma.psychologist.findUnique({
            where: { id: session.user.id },
            select: { mfaEnabled: true, email: true },
        });

        if (!psychologist) {
            return NextResponse.json(
                { error: "NOT_FOUND", message: "Usuario no encontrado" },
                { status: 404 }
            );
        }

        if (psychologist.mfaEnabled) {
            return NextResponse.json(
                { error: "CONFLICT", message: "MFA ya está habilitado" },
                { status: 409 }
            );
        }

        // Generate TOTP secret
        const { secret, uri } = generateTOTPSecret(psychologist.email);

        // Store secret temporarily (will be confirmed on first verification)
        await prisma.psychologist.update({
            where: { id: session.user.id },
            data: { mfaSecret: secret },
        });

        // Generate QR code
        const qrCode = await generateQRCodeDataURL(uri);

        return NextResponse.json({
            qrCode,
            secret, // Show base32 secret as backup for manual entry
            message: "Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)",
        });
    } catch (error) {
        console.error("[MFA_SETUP] Error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
