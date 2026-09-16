-- Evidencia SG-SST y prueba del consentimiento (auditoría legal 2026-09-15).
--
-- workers.archived_at: archivado lógico. El Dec. 1072/2015 art. 2.2.4.6.13 obliga
-- a conservar la evidencia 20 años desde el cese laboral; un trabajador con
-- evaluaciones calificadas nunca se borra, se archiva.
--
-- informed_consents.consent_version / ip_address / user_agent: sin la versión
-- exacta del texto mostrado no puede reconstruirse qué autorizó el titular
-- (Ley 1581/2012 arts. 6 y 12).
--
-- generated_reports.pdf_url: el PDF firmado se archiva tal cual se entregó;
-- recompilarlo con los datos del día impide probar qué documento se firmó.

-- AlterTable
ALTER TABLE "workers" ADD COLUMN     "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "informed_consents" ADD COLUMN     "consent_version" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- AlterTable
ALTER TABLE "generated_reports" ADD COLUMN     "pdf_url" TEXT;
