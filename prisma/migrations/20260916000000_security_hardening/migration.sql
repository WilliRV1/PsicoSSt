-- Prueba server-side de que un código MFA real fue validado (nunca un
-- booleano que el cliente pueda mandar directo a /api/auth/session).
ALTER TABLE "psychologists" ADD COLUMN "mfa_verified_at" TIMESTAMP(3);

-- Rate limiting de intentos fallidos de cédula contra el enlace de empresa.
ALTER TABLE "organization_invitation_links" ADD COLUMN "failed_identify_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "organization_invitation_links" ADD COLUMN "identify_locked_until" TIMESTAMP(3);
