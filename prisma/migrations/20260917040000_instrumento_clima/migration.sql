-- Clima organizacional: instrumento libre (sin restricción legal) sobre el
-- mismo motor. La cuarta columna en assessment_invitations sigue el patrón de
-- las tres existentes (una por instrumento) para no rediseñar la invitación
-- en esta entrega.

-- AlterEnum
ALTER TYPE "QuestionnaireType" ADD VALUE 'CLIMA';

-- AlterTable
ALTER TABLE "assessment_invitations" ADD COLUMN     "clima_assessment_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "assessment_invitations_clima_assessment_id_key" ON "assessment_invitations"("clima_assessment_id");

-- AddForeignKey
ALTER TABLE "assessment_invitations" ADD CONSTRAINT "assessment_invitations_clima_assessment_id_fkey" FOREIGN KEY ("clima_assessment_id") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
