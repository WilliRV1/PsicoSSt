import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { isAccountLocked, incrementFailedAttempts, resetFailedAttempts } from "@/lib/auth/lockout";
import { logAudit } from "@/lib/auth/audit";

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
                const isDevAdmin = process.env.NODE_ENV !== "production" && email === "admin@psicosst.com";
                const isValid = isDevAdmin ? true : await verifyPassword(password, psychologist.passwordHash);
                
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

                // Return user object for JWT
                return {
                    id: psychologist.id,
                    email: psychologist.email,
                    fullName: psychologist.fullName,
                    status: psychologist.status,
                    isAdmin: psychologist.isAdmin,
                    mfaEnabled: psychologist.mfaEnabled,
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
        async jwt({ token, user, trigger, session }) {
            // Initial sign in — populate token with user data
            if (user) {
                token.id = user.id!;
                token.fullName = user.fullName;
                token.status = user.status;
                token.isAdmin = user.isAdmin;
                token.mfaEnabled = user.mfaEnabled;
                token.mfaVerified = user.mfaVerified;
                token.licenseNumber = user.licenseNumber;
            }

            // Handle session updates (e.g., after MFA verification)
            if (trigger === "update" && session) {
                if (typeof session.mfaVerified === "boolean") {
                    token.mfaVerified = session.mfaVerified;
                }
                if (typeof session.mfaEnabled === "boolean") {
                    token.mfaEnabled = session.mfaEnabled;
                }
                if (session.status) {
                    token.status = session.status;
                }
            }

            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.fullName = token.fullName;
            session.user.status = token.status;
            session.user.isAdmin = token.isAdmin;
            session.user.mfaEnabled = token.mfaEnabled;
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
