import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an account is currently locked out.
 * Returns true if the account is locked.
 */
export async function isAccountLocked(
    psychologistId: string
): Promise<boolean> {
    const psychologist = await prisma.psychologist.findUnique({
        where: { id: psychologistId },
        select: { failedAttempts: true, lockedUntil: true },
    });

    if (!psychologist) return false;

    if (
        psychologist.lockedUntil &&
        psychologist.lockedUntil > new Date()
    ) {
        return true;
    }

    // If lock has expired, reset
    if (
        psychologist.lockedUntil &&
        psychologist.lockedUntil <= new Date()
    ) {
        await prisma.psychologist.update({
            where: { id: psychologistId },
            data: { failedAttempts: 0, lockedUntil: null },
        });
    }

    return false;
}

/**
 * Increment failed login attempts. Locks the account after MAX_FAILED_ATTEMPTS.
 * Returns whether the account is now locked.
 */
export async function incrementFailedAttempts(
    psychologistId: string
): Promise<{ locked: boolean; attemptsRemaining: number }> {
    const psychologist = await prisma.psychologist.update({
        where: { id: psychologistId },
        data: { failedAttempts: { increment: 1 } },
        select: { failedAttempts: true },
    });

    if (psychologist.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await prisma.psychologist.update({
            where: { id: psychologistId },
            data: {
                lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
            },
        });
        return { locked: true, attemptsRemaining: 0 };
    }

    return {
        locked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS - psychologist.failedAttempts,
    };
}

/**
 * Reset failed attempts after successful login.
 */
export async function resetFailedAttempts(
    psychologistId: string
): Promise<void> {
    await prisma.psychologist.update({
        where: { id: psychologistId },
        data: { failedAttempts: 0, lockedUntil: null },
    });
}
