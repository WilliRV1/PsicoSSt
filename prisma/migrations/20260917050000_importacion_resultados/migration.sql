-- Importación de resultados ya calificados y trazabilidad de la modalidad.
--
-- InputMethod gana SELF_SERVICE (el autoservicio se registraba como MANUAL y
-- ocultaba la modalidad real, justo la evidencia que pide un inspector) e
-- IMPORTED (puntajes calificados en SIRPSI u otra herramienta, sin respuestas
-- crudas). ImportJob pasa a usarse: cada evaluación importada apunta a su
-- carga, que guarda el hash del archivo recibido.

-- AlterEnum
ALTER TYPE "InputMethod" ADD VALUE 'SELF_SERVICE';
ALTER TYPE "InputMethod" ADD VALUE 'IMPORTED';

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "import_job_id" UUID;

-- AlterTable
ALTER TABLE "import_jobs" ADD COLUMN     "file_hash" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'RESPONSES',
ADD COLUMN     "source" TEXT;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
