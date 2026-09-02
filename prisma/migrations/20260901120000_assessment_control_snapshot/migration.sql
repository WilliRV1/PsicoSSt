-- Snapshot de las respuestas de control ("atiende clientes" / "es jefe de
-- otras personas") vigentes cuando se hizo cada evaluación puntual.
--
-- Antes solo vivían en workers.has_customer_interaction / has_people_in_charge,
-- compartidas por todas las evaluaciones de un mismo trabajador. Editar una
-- evaluación vieja la recalificaba con el valor ACTUAL del trabajador, que
-- pudo cambiar por una evaluación posterior — alterando retroactivamente un
-- resultado ya emitido.
--
-- Backfill de mejor esfuerzo: para las evaluaciones ya existentes no hay forma
-- de saber qué se respondió en su momento, así que se copia el valor actual
-- del trabajador como aproximación. Las filas nuevas guardan la respuesta real
-- de control de ESA evaluación desde AssessmentService.createAssessment.

ALTER TABLE "assessments"
  ADD COLUMN "has_customer_interaction" BOOLEAN,
  ADD COLUMN "has_people_in_charge" BOOLEAN;

UPDATE "assessments" a
SET
  "has_customer_interaction" = w.has_customer_interaction,
  "has_people_in_charge" = w.has_people_in_charge
FROM "workers" w
WHERE w.id = a.worker_id;
