import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { Sku } from "@/config/plans";

/**
 * Libro de unidades del psicólogo.
 *
 * `Psychologist.creditBalance` es un saldo ALMACENADO: cada movimiento deja un
 * `CreditTransaction` con `balanceAfter`, de modo que el saldo nunca se
 * recomputa sumando asientos. El consumo vive en `lib/entitlements.ts`
 * (`consumeUnit`), no aquí: este servicio sólo otorga, revierte y lista.
 */
export class CreditService {
    static async getBalance(psychologistId: string): Promise<number> {
        const psych = await prisma.psychologist.findUnique({
            where: { id: psychologistId },
            select: { creditBalance: true },
        });
        return psych?.creditBalance ?? 0;
    }

    /** Unidades sueltas asignadas por un administrador (no vencen). */
    static async adminGrant(
        psychologistId: string,
        amount: number,
        description?: string
    ): Promise<number> {
        return await prisma.$transaction(async (tx) => {
            const psych = await tx.psychologist.update({
                where: { id: psychologistId },
                data: { creditBalance: { increment: amount } },
                select: { creditBalance: true },
            });

            await tx.creditTransaction.create({
                data: {
                    psychologistId,
                    type: "ADMIN_GRANT",
                    amount,
                    balanceAfter: psych.creditBalance,
                    description: description || `Asignación manual: ${amount} unidades`,
                },
            });

            return psych.creditBalance;
        });
    }

    static async getTransactions(
        psychologistId: string,
        limit = 20,
        offset = 0
    ) {
        return prisma.creditTransaction.findMany({
            where: { psychologistId },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Acredita un SKU comprado DENTRO de la transacción del cobro.
     *
     * Comparte la transacción de `PaymentService.applyPayment` para que marcar
     * la orden como pagada y otorgar las unidades sean el mismo hecho atómico.
     * El asiento devuelto es el cerrojo de idempotencia de la orden
     * (`PaymentOrder.creditTransactionId`), por eso se escribe SIEMPRE, incluso
     * para un módulo sin unidades (amount 0).
     *
     * Un plan otorga su cupo con vencimiento (`expiresAt = periodEnd`, ver
     * `SubscriptionService.activateInTx`); las unidades sueltas no vencen.
     */
    static async creditPurchaseInTx(
        tx: Prisma.TransactionClient,
        params: { psychologistId: string; pkg: Sku; paymentRef: string | null; expiresAt?: Date | null }
    ): Promise<{ transactionId: string; balance: number }> {
        const psych = await tx.psychologist.update({
            where: { id: params.psychologistId },
            data: { creditBalance: { increment: params.pkg.credits } },
            select: { creditBalance: true },
        });

        const description =
            params.pkg.kind === "plan"
                ? `${params.pkg.name}: ${params.pkg.credits} trabajadores gestionados`
                : params.pkg.kind === "feature"
                  ? `Módulo: ${params.pkg.name}`
                  : `Compra ${params.pkg.name}: ${params.pkg.credits} unidades`;

        const transaction = await tx.creditTransaction.create({
            data: {
                psychologistId: params.psychologistId,
                type: params.pkg.kind === "plan" ? "PLAN_QUOTA" : "PURCHASE",
                amount: params.pkg.credits,
                balanceAfter: psych.creditBalance,
                packageId: params.pkg.id,
                priceCOP: params.pkg.priceCOP,
                paymentRef: params.paymentRef,
                expiresAt: params.expiresAt ?? null,
                description,
            },
            select: { id: true },
        });

        return { transactionId: transaction.id, balance: psych.creditBalance };
    }

    /**
     * Retira unidades tras un reembolso o un contracargo en la pasarela.
     *
     * El saldo PUEDE quedar negativo, y es intencional: si el psicólogo ya gastó
     * las unidades antes de que llegara el contracargo, dejarlo en cero le
     * regalaría el consumo. En negativo, `consumeUnit` lo frena (exige saldo
     * >= 1) hasta que regularice, y el libro conserva la historia completa.
     */
    static async reverseInTx(
        tx: Prisma.TransactionClient,
        params: {
            psychologistId: string;
            credits: number;
            paymentRef: string;
            reason: string;
        }
    ): Promise<{ transactionId: string; balance: number }> {
        const psych = await tx.psychologist.update({
            where: { id: params.psychologistId },
            data: { creditBalance: { decrement: params.credits } },
            select: { creditBalance: true },
        });

        const transaction = await tx.creditTransaction.create({
            data: {
                psychologistId: params.psychologistId,
                type: "REVERSAL",
                amount: -params.credits,
                balanceAfter: psych.creditBalance,
                paymentRef: params.paymentRef,
                description: `Reversión de pago (${params.reason}): -${params.credits} unidades`,
            },
            select: { id: true },
        });

        return { transactionId: transaction.id, balance: psych.creditBalance };
    }
}
