import { prisma } from "@/lib/prisma";
import { TRIAL_CREDITS, getPackageById } from "@/config/credit-packages";

export class CreditService {
    /**
     * Get the current credit balance for a psychologist.
     */
    static async getBalance(psychologistId: string): Promise<number> {
        const psych = await prisma.psychologist.findUnique({
            where: { id: psychologistId },
            select: { creditBalance: true },
        });
        return psych?.creditBalance ?? 0;
    }

    /**
     * Check if a psychologist has enough credits for an assessment.
     */
    static async hasCredits(psychologistId: string, amount = 1): Promise<boolean> {
        const balance = await this.getBalance(psychologistId);
        return balance >= amount;
    }

    /**
     * Grant trial credits to a newly registered psychologist.
     */
    static async grantTrialCredits(psychologistId: string): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const psych = await tx.psychologist.update({
                where: { id: psychologistId },
                data: { creditBalance: { increment: TRIAL_CREDITS } },
                select: { creditBalance: true },
            });

            await tx.creditTransaction.create({
                data: {
                    psychologistId,
                    type: "TRIAL_GRANT",
                    amount: TRIAL_CREDITS,
                    balanceAfter: psych.creditBalance,
                    description: `Créditos de prueba: ${TRIAL_CREDITS} baterías gratis`,
                },
            });
        });
    }

    /**
     * Purchase a credit package. Returns the new balance.
     */
    static async purchasePackage(
        psychologistId: string,
        packageId: string,
        paymentRef?: string
    ): Promise<{ balance: number; transactionId: string }> {
        const pkg = getPackageById(packageId);
        if (!pkg) throw new Error("Paquete no encontrado");

        return await prisma.$transaction(async (tx) => {
            const psych = await tx.psychologist.update({
                where: { id: psychologistId },
                data: { creditBalance: { increment: pkg.credits } },
                select: { creditBalance: true },
            });

            const transaction = await tx.creditTransaction.create({
                data: {
                    psychologistId,
                    type: "PURCHASE",
                    amount: pkg.credits,
                    balanceAfter: psych.creditBalance,
                    packageId: pkg.id,
                    priceCOP: pkg.priceCOP,
                    paymentRef,
                    description: `Compra paquete ${pkg.name}: ${pkg.credits} créditos`,
                },
            });

            return { balance: psych.creditBalance, transactionId: transaction.id };
        });
    }

    /**
     * Consume 1 credit for an assessment. Throws if insufficient balance.
     */
    static async consumeCredit(
        psychologistId: string,
        assessmentId: string
    ): Promise<number> {
        return await prisma.$transaction(async (tx) => {
            const psych = await tx.psychologist.findUnique({
                where: { id: psychologistId },
                select: { creditBalance: true },
            });

            if (!psych || psych.creditBalance < 1) {
                throw new Error("INSUFFICIENT_CREDITS");
            }

            const updated = await tx.psychologist.update({
                where: { id: psychologistId },
                data: { creditBalance: { decrement: 1 } },
                select: { creditBalance: true },
            });

            await tx.creditTransaction.create({
                data: {
                    psychologistId,
                    type: "CONSUMPTION",
                    amount: -1,
                    balanceAfter: updated.creditBalance,
                    assessmentId,
                    description: "Evaluación de batería completa",
                },
            });

            return updated.creditBalance;
        });
    }

    /**
     * Admin grant credits to a psychologist.
     */
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
                    description: description || `Asignación manual: ${amount} créditos`,
                },
            });

            return psych.creditBalance;
        });
    }

    /**
     * Get transaction history for a psychologist.
     */
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
}
