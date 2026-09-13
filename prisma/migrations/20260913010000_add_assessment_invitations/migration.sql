-- Migración escrita a mano, aislada a propósito: el resto del historial de
-- migraciones no reconstruye el schema real (drift preexistente, ajeno a
-- esta tarea — probablemente `db push` se usó en algún momento sin generar
-- migración). Esta migración SOLO agrega lo necesario para
-- AssessmentInvitation, sin tocar ninguna otra tabla.

-- CreateEnum
CREATE TYPE "AssessmentInvitationStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "assessment_invitations" (
    "id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "form_type" "FormType" NOT NULL,
    -- TEXT[] a propósito, no un array de enum: ver comentario en schema.prisma
    -- sobre el bug de Prisma 7 + @prisma/adapter-pg con enum arrays.
    "planned_types" TEXT[] NOT NULL,
    "token_hash" TEXT NOT NULL,
    "status" "AssessmentInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "contact_email" TEXT NOT NULL,
    "intralaboral_assessment_id" UUID,
    "extralaboral_assessment_id" UUID,
    "stress_assessment_id" UUID,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_invitations_token_hash_key" ON "assessment_invitations"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_invitations_intralaboral_assessment_id_key" ON "assessment_invitations"("intralaboral_assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_invitations_extralaboral_assessment_id_key" ON "assessment_invitations"("extralaboral_assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_invitations_stress_assessment_id_key" ON "assessment_invitations"("stress_assessment_id");

-- CreateIndex
CREATE INDEX "assessment_invitations_psychologist_id_status_idx" ON "assessment_invitations"("psychologist_id", "status");

-- CreateIndex
CREATE INDEX "assessment_invitations_worker_id_idx" ON "assessment_invitations"("worker_id");

-- AddForeignKey
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_intralaboral_assessment_id_fkey" FOREIGN KEY ("intralaboral_assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_extralaboral_assessment_id_fkey" FOREIGN KEY ("extralaboral_assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_stress_assessment_id_fkey" FOREIGN KEY ("stress_assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
