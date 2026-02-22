import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@/generated/prisma/client";

interface AuditLogInput {
    userId?: string;
    action: AuditAction;
    resourceType: string;
    resourceId?: string;
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Append an immutable audit log entry.
 * This function never throws — audit failures are logged to console but don't break the flow.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: input.userId ?? null,
                action: input.action,
                resourceType: input.resourceType,
                resourceId: input.resourceId ?? null,
                metadata: input.metadata ?? undefined,
                ipAddress: input.ipAddress ?? null,
                userAgent: input.userAgent ?? null,
            },
        });
    } catch (error) {
        console.error("[AUDIT] Failed to write audit log:", error);
    }
}

/**
 * Extract IP and user agent from a Request object.
 */
export function extractRequestMeta(request: Request): {
    ipAddress: string;
    userAgent: string;
} {
    const ipAddress =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
    const userAgent = request.headers.get("user-agent") ?? "unknown";
    return { ipAddress, userAgent };
}
