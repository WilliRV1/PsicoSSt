-- Enlace de autoservicio por empresa
CREATE TABLE "organization_invitation_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "form_type" "FormType" NOT NULL,
    "planned_types" TEXT[],
    "token_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_invitation_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_invitation_links_token_hash_key" ON "organization_invitation_links"("token_hash");
CREATE INDEX "organization_invitation_links_organization_id_is_active_idx" ON "organization_invitation_links"("organization_id", "is_active");

ALTER TABLE "organization_invitation_links" ADD CONSTRAINT "organization_invitation_links_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organization_invitation_links" ADD CONSTRAINT "organization_invitation_links_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Firma dibujada por el trabajador en el consentimiento de autoservicio
ALTER TABLE "informed_consents" ADD COLUMN "consent_signature" TEXT;

-- Marca de que el trabajador ya diligenció sus propios sociodemográficos
ALTER TABLE "workers" ADD COLUMN "sociodemographics_completed_at" TIMESTAMP(3);
