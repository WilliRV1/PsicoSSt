import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { logAudit, extractRequestMeta } from "@/lib/auth/audit";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { assertLegalIdentityForSignup } from "@/lib/legal-config";
import { sendEmail } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
    try {
        // Sin Responsable del Tratamiento identificado no puede abrirse una
        // cuenta: todo lo que se recoja después carecería de autorización
        // válida (Ley 1581/2012, arts. 6 y 12).
        const legal = assertLegalIdentityForSignup();
        if (!legal.ok) {
            console.error("[REGISTER] Configuración legal incompleta:", legal.missing.join(", "));
            return NextResponse.json(
                {
                    error: "LEGAL_CONFIG_INCOMPLETE",
                    message:
                        "El registro está deshabilitado: falta configurar los datos del Responsable del Tratamiento.",
                },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { email, password, fullName, licenseNumber, professionalCard, sstCredential } = body;

        // Validate required fields
        if (!email || !password || !fullName || !licenseNumber || !professionalCard || !sstCredential) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "Todos los campos son obligatorios" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "Formato de email inválido" },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.valid) {
            return NextResponse.json(
                { error: "VALIDATION_ERROR", message: "Contraseña débil", details: passwordCheck.errors },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existing = await prisma.psychologist.findUnique({
            where: { email },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json(
                { error: "CONFLICT", message: "Ya existe una cuenta con este correo electrónico" },
                { status: 409 }
            );
        }

        // Check if license already exists
        const existingLicense = await prisma.psychologist.findUnique({
            where: { licenseNumber },
            select: { id: true },
        });
        if (existingLicense) {
            return NextResponse.json(
                { error: "CONFLICT", message: "Ya existe una cuenta con este número de licencia" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Check if this is the first user — auto-approve as admin
        const userCount = await prisma.psychologist.count();
        const isFirstUser = userCount === 0;

        // Create psychologist account
        const psychologist = await prisma.psychologist.create({
            data: {
                email,
                passwordHash,
                fullName,
                licenseNumber,
                professionalCard,
                sstCredential,
                status: isFirstUser ? "ACTIVE" : "PENDING",
                isAdmin: isFirstUser,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                status: true,
                isAdmin: true,
            },
        });

        // Periodo de prueba Residente: cupo con vencimiento, informes en borrador.
        await SubscriptionService.startTrial(psychologist.id);

        // Send welcome email (fire-and-forget)
        const template = welcomeEmail(psychologist.fullName);
        sendEmail({ to: psychologist.email, ...template }).catch(console.error);

        // Audit log
        const { ipAddress, userAgent } = extractRequestMeta(request);
        await logAudit({
            userId: psychologist.id,
            action: "CREATE",
            resourceType: "psychologist",
            resourceId: psychologist.id,
            metadata: { reason: isFirstUser ? "First user — auto-approved as admin" : "Registration pending approval" },
            ipAddress,
            userAgent,
        });

        if (isFirstUser) {
            return NextResponse.json(
                {
                    message: "Cuenta creada y activada. Eres el administrador del sistema.",
                    status: "ACTIVE",
                    isAdmin: true,
                },
                { status: 201 }
            );
        }

        return NextResponse.json(
            {
                message: "Solicitud enviada. Un administrador revisará tu registro.",
                status: "PENDING",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[REGISTER] Error:", error);
        return NextResponse.json(
            { error: "INTERNAL_ERROR", message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
