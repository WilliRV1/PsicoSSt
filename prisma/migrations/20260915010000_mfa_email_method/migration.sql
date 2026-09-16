-- Método de verificación en dos pasos
CREATE TYPE "MfaMethod" AS ENUM ('TOTP', 'EMAIL');

ALTER TABLE "psychologists" ADD COLUMN "mfa_method" "MfaMethod" NOT NULL DEFAULT 'TOTP';
ALTER TABLE "psychologists" ADD COLUMN "mfa_email_code_hash" TEXT;
ALTER TABLE "psychologists" ADD COLUMN "mfa_email_code_expires_at" TIMESTAMP(3);
