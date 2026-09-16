-- Suscripción del psicólogo y cupo con vencimiento.
--
-- El cobro deja de ser «por batería aplicada» (Res. 2764/2022 art. 4 par.) y
-- pasa a ser un plan anual del profesional. El cupo del periodo se otorga como
-- créditos con vencimiento, así que Psychologist.credit_balance sigue siendo
-- el saldo almacenado y la pasarela de pago único no cambia.

-- CreateEnum
CREATE TYPE "PlanId" AS ENUM ('RESIDENTE', 'PROFESIONAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'EXPIRED');

-- AlterEnum
ALTER TYPE "CreditTxType" ADD VALUE 'PLAN_QUOTA';
ALTER TYPE "CreditTxType" ADD VALUE 'QUOTA_EXPIRY';

-- AlterTable
ALTER TABLE "credit_transactions" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "unit_family" TEXT,
ADD COLUMN     "worker_id" UUID;

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "plan" "PlanId" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "quota_granted" INTEGER NOT NULL,
    "features" JSONB NOT NULL DEFAULT '{}',
    "payment_order_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_psychologist_id_key" ON "subscriptions"("psychologist_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_payment_order_id_key" ON "subscriptions"("payment_order_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_period_end_idx" ON "subscriptions"("status", "period_end");

-- CreateIndex
CREATE INDEX "credit_transactions_psychologist_id_worker_id_unit_family_c_idx" ON "credit_transactions"("psychologist_id", "worker_id", "unit_family", "created_at");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_order_id_fkey" FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Datos: toda cuenta existente recibe un periodo Residente de 60 días para
-- que ninguna quede sin plan al desplegar. Su saldo actual NO se toca ni
-- vence (quota_granted = 0): los créditos comprados u otorgados antes del
-- pivote no tenían fecha de vencimiento, y así lo decían los términos.
INSERT INTO "subscriptions" ("id", "psychologist_id", "plan", "status", "period_start", "period_end", "quota_granted", "features", "created_at", "updated_at")
SELECT gen_random_uuid(), p."id", 'RESIDENTE', 'TRIAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 0, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "psychologists" p
WHERE NOT EXISTS (SELECT 1 FROM "subscriptions" s WHERE s."psychologist_id" = p."id");
