-- Conformidad del motor de puntuación con los manuales de la Batería.
--
-- Dos cambios de esquema acompañan la corrección del motor:
--
-- 1. `INVALIDO` en RiskCategory. El manual prohíbe calcular el puntaje de un
--    cuestionario al que le faltan ítems. Hasta ahora esos casos se guardaban
--    como SIN_RIESGO, de modo que una evaluación incompleta se leía como un
--    trabajador sano y engrosaba ese grupo en los informes.
--
-- 2. `has_people_in_charge` en workers. Es la respuesta del trabajador a "soy
--    jefe de otras personas en mi trabajo", la pregunta de control que decide
--    si aplica la dimensión "relación con los colaboradores". Antes se deducía
--    del nivel del cargo, que no la determina.
--
-- Nada de esto recalifica las evaluaciones existentes: eso lo hace
-- `scripts/rescore-assessments.ts`, que debe ejecutarse después de aplicar
-- esta migración.

ALTER TYPE "RiskCategory" ADD VALUE IF NOT EXISTS 'INVALIDO' BEFORE 'SIN_RIESGO';

ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "has_people_in_charge" BOOLEAN;
