-- Canal de retroalimentación del piloto: comentarios del profesional y errores
-- capturados automáticamente por la aplicación.

CREATE TYPE "FeedbackKind" AS ENUM ('COMMENT', 'BUG', 'CRASH');
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'READ', 'RESOLVED');

CREATE TABLE "feedback" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "psychologist_id" UUID,
    "kind"            "FeedbackKind"   NOT NULL DEFAULT 'COMMENT',
    "message"         TEXT NOT NULL,
    "path"            TEXT,
    "stack"           TEXT,
    "context"         JSONB,
    "status"          "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "admin_note"      TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- Si se elimina la cuenta, el reporte se conserva sin autor: lo que contó
-- sobre un fallo sigue siendo útil.
ALTER TABLE "feedback"
  ADD CONSTRAINT "feedback_psychologist_id_fkey"
  FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "feedback_status_created_at_idx" ON "feedback"("status", "created_at");
CREATE INDEX "feedback_psychologist_id_idx" ON "feedback"("psychologist_id");
