-- Renovación automática vía preapproval de Mercado Pago.
-- Aditivo: sin autorización (columnas nulas) la suscripción se renueva a mano,
-- que es el comportamiento que ya existía.
CREATE TYPE "AutoRenewStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAUSED', 'CANCELLED');

ALTER TABLE "subscriptions" ADD COLUMN "preapproval_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "auto_renew_sku" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "auto_renew_status" "AutoRenewStatus";
ALTER TABLE "subscriptions" ADD COLUMN "auto_renew_updated_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "subscriptions_preapproval_id_key" ON "subscriptions"("preapproval_id");
