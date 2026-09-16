import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { isAccountLocked, incrementFailedAttempts, resetFailedAttempts } from "@/lib/auth/lockout";
import { logAudit } from "@/lib/auth/audit";
import { generateEmailCode } from "@/lib/auth/mfa";
import { sendEmail } from "@/lib/email/resend";
import { mfaEmailCodeEmail } from "@/lib/email/templates";

const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Contraseña", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Find psychologist by email
                const psychologist = await prisma.psychologist.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        passwordHash: true,
                        status: true,
                        isAdmin: true,
                        mfaEnabled: true,
                        mfaSecret: true,
                        mfaMethod: true,
                        failedAttempts: true,
                        lockedUntil: true,
                        licenseNumber: true,
                    },
                });

                if (!psychologist) {
                    return null;
                }

                // Check account lockout
                const locked = await isAccountLocked(psychologist.id);
                if (locked) {
                    throw new Error("ACCOUNT_LOCKED");
                }

                // Check account status
                if (psychologist.status === "INACTIVE") {
                    throw new Error("ACCOUNT_INACTIVE");
                }

                if (psychologist.status === "SUSPENDED") {
                    throw new Error("ACCOUNT_SUSPENDED");
                }

                // Verify password
                const isValid = await verifyPassword(password, psychologist.passwordHash);
                
                if (!isValid) {
                    await incrementFailedAttempts(psychologist.id);
                    await logAudit({
                        userId: psychologist.id,
                        action: "LOGIN_FAILED",
                        resourceType: "psychologist",
                        resourceId: psychologist.id,
                        metadata: { reason: "Invalid password" },
                    });
                    return null;
                }

                // Reset failed attempts on successful login
                await resetFailedAttempts(psychologist.id);

                // Log successful login
                await logAudit({
                    userId: psychologist.id,
                    action: "LOGIN",
                    resourceType: "psychologist",
                    resourceId: psychologist.id,
                });

                // Si el método vigente es correo, el código debe estar en su
                // bandeja de entrada para cuando llegue a /mfa-verify — no
                // tiene sentido pedírselo y enviarlo en una segunda vuelta.
                if (psychologist.mfaEnabled && psychologist.mfaMethod === "EMAIL") {
                    const { code, codeHash, expiresAt } = generateEmailCode();
                    await prisma.psychologist.update({
                        where: { id: psychologist.id },
                        data: { mfaEmailCodeHash: codeHash, mfaEmailCodeExpiresAt: expiresAt },
                    });
                    const template = mfaEmailCodeEmail(psychologist.fullName, code);
                    sendEmail({ to: psychologist.email, ...template }).catch(console.error);
                }

                // Return user object for JWT
                return {
                    id: psychologist.id,
                    email: psychologist.email,
                    fullName: psychologist.fullName,
                    status: psychologist.status,
                    isAdmin: psychologist.isAdmin,
                    mfaEnabled: psychologist.mfaEnabled,
                    mfaMethod: psychologist.mfaMethod,
                    mfaVerified: !psychologist.mfaEnabled,
                    licenseNumber: psychologist.licenseNumber,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60, // 8 hours max session
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Initial sign in — populate token with user data
            if (user) {
                token.id = user.id!;
                token.fullName = user.fullName;
                token.status = user.status;
                token.isAdmin = user.isAdmin;
                token.mfaEnabled = user.mfaEnabled;
                token.mfaMethod = user.mfaMethod;
                token.mfaVerified = user.mfaVerified;
                token.licenseNumber = user.licenseNumber;
                token.lastDbCheck = Date.now();
            }

            // Un cliente puede llamar a POST /api/auth/session con cualquier
            // `data` que se le ocurra — es un endpoint público protegido
            // solo por cookie de sesión + CSRF, no por haber probado nada.
            // Por eso `session` aquí NUNCA se trata como dato de confianza:
            // solo se usa como señal de "algo cambió, refresca ya" y todo el
            // contenido real se relee de la base de datos. La única
            // excepción sería tratar boolean del cliente como verdad, que es
            // exactamente el hueco que permitía auto-aprobarse como ACTIVE o
            // marcarse mfaVerified sin validar ningún código.
            if (trigger === "update" && token.id) {
                const fresh = await prisma.psychologist.findUnique({
                    where: { id: token.id as string },
                    select: { status: true, isAdmin: true, mfaEnabled: true, mfaMethod: true, mfaVerifiedAt: true },
                });
                if (fresh) {
                    token.status = fresh.status;
                    token.isAdmin = fresh.isAdmin;
                    token.mfaEnabled = fresh.mfaEnabled;
                    token.mfaMethod = fresh.mfaMethod;
                    // Válido solo si el servidor confirmó un código DESPUÉS
                    // de que este token se emitió — una verificación vieja
                    // de una sesión anterior no puede colarse hacia adelante.
                    token.mfaVerified =
                        !fresh.mfaEnabled ||
                        (fresh.mfaVerifiedAt != null &&
                            typeof token.iat === "number" &&
                            fresh.mfaVerifiedAt.getTime() / 1000 > token.iat);
                }
                token.lastDbCheck = Date.now();
            }

            // Re-validate status from DB every 5 minutes so that suspensions
            // and admin revocations take effect without waiting for session expiry.
            const FIVE_MINUTES = 5 * 60 * 1000;
            const lastCheck = (token.lastDbCheck as number) ?? 0;
            if (token.id && Date.now() - lastCheck > FIVE_MINUTES) {
                const fresh = await prisma.psychologist.findUnique({
                    where: { id: token.id as string },
                    select: { status: true, isAdmin: true },
                });
                if (fresh) {
                    token.status = fresh.status;
                    token.isAdmin = fresh.isAdmin;
                }
                token.lastDbCheck = Date.now();
            }

            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.fullName = token.fullName;
            session.user.status = token.status;
            session.user.isAdmin = token.isAdmin;
            session.user.mfaEnabled = token.mfaEnabled;
            session.user.mfaMethod = token.mfaMethod;
            session.user.mfaVerified = token.mfaVerified;
            session.user.licenseNumber = token.licenseNumber;
            return session;
        },
    },
};

export const {
    handlers: { GET, POST },
    signIn,
    signOut,
    auth
} = NextAuth(authConfig);
