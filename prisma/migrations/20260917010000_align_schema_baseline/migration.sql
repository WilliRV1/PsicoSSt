-- ============================================================================
-- Puesta al día del historial de migraciones
-- ============================================================================
-- Siete tablas y dieciocho columnas del esquema NUNCA tuvieron migración: se
-- crearon con `prisma db push` durante el desarrollo. Consecuencia real: un
-- `prisma migrate deploy` sobre una base limpia producía una base de datos
-- sobre la que la aplicación no arranca (faltaban, entre otras,
-- `password_reset_tokens`, `generated_reports` e `intervention_plans`).
--
-- Esta migración cierra ese hueco. Es IDEMPOTENTE y ESTRICTAMENTE ADITIVA:
-- crea lo que falte y no borra ni reescribe nada. Sobre una base que ya
-- recibió `db push` es, en su mayor parte, una sucesión de no-ops.
--
-- DELIBERADAMENTE FUERA (requieren una decisión humana, ver docs/DATABASE.md):
--   · DROP TABLE "reports"  — tabla heredada, reemplazada por
--     `generated_reports`. Puede contener informes históricos.
--   · ALTER COLUMN "id" DROP DEFAULT en `feedback` y
--     `organization_invitation_links` — puramente cosmético.
-- ============================================================================

-- ─── Tipos enumerados ───────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HousingType') THEN
        CREATE TYPE "HousingType" AS ENUM ('PROPIA', 'ARRENDADA', 'FAMILIAR', 'OTRA');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FreeTimeUsage') THEN
        CREATE TYPE "FreeTimeUsage" AS ENUM ('DEPORTE', 'ESTUDIO', 'FAMILIA', 'RECREACION', 'DESCANSO', 'OTRO');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanStatus') THEN
        CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ActionStatus') THEN
        CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransportMeans') THEN
        CREATE TYPE "TransportMeans" AS ENUM ('CAMINANDO', 'BICICLETA', 'MOTOCICLETA', 'VEHICULO_PARTICULAR', 'TRANSPORTE_MASIVO', 'TRANSPORTE_PUBLICO', 'TRANSPORTE_EMPRESA', 'OTRO');
    END IF;
END
$$;

-- Valores nuevos de enumeraciones ya existentes.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CREDIT_PURCHASE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CREDIT_CONSUME';

-- ─── Columnas nuevas ────────────────────────────────────────────────────
ALTER TABLE "psychologists"
    ADD COLUMN IF NOT EXISTS "signature" TEXT,
    ADD COLUMN IF NOT EXISTS "sst_license_date" TIMESTAMP(3);

-- Datos sociodemográficos que la batería exige (Res. 2646/2008).
ALTER TABLE "workers"
    ADD COLUMN IF NOT EXISTS "birth_year" INTEGER,
    ADD COLUMN IF NOT EXISTS "dependents_count" INTEGER,
    ADD COLUMN IF NOT EXISTS "displacement_time" INTEGER,
    ADD COLUMN IF NOT EXISTS "free_time_usage" TEXT[],
    ADD COLUMN IF NOT EXISTS "hours_per_day" TEXT,
    ADD COLUMN IF NOT EXISTS "housing_type" TEXT,
    ADD COLUMN IF NOT EXISTS "less_than_one_year_in_company" BOOLEAN,
    ADD COLUMN IF NOT EXISTS "less_than_one_year_in_position" BOOLEAN,
    ADD COLUMN IF NOT EXISTS "payment_modality" TEXT,
    ADD COLUMN IF NOT EXISTS "profession" TEXT,
    ADD COLUMN IF NOT EXISTS "residence_city" TEXT,
    ADD COLUMN IF NOT EXISTS "residence_department" TEXT,
    ADD COLUMN IF NOT EXISTS "socioeconomic_stratum" TEXT,
    ADD COLUMN IF NOT EXISTS "transport_means" TEXT,
    ADD COLUMN IF NOT EXISTS "work_city" TEXT,
    ADD COLUMN IF NOT EXISTS "work_department" TEXT;

-- `education_level` y `hours_per_week` pasaron de enumerado a TEXT en el
-- esquema. Prisma proponía DROP + ADD, que borraría los valores existentes;
-- se hace con USING, que los conserva convirtiéndolos a texto. Si la columna
-- ya es TEXT (el caso de las bases con `db push`), no se toca.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'workers' AND column_name = 'education_level'
                 AND data_type <> 'text') THEN
        ALTER TABLE "workers"
            ALTER COLUMN "education_level" TYPE TEXT USING "education_level"::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'workers' AND column_name = 'hours_per_week'
                 AND data_type <> 'text') THEN
        ALTER TABLE "workers"
            ALTER COLUMN "hours_per_week" TYPE TEXT USING "hours_per_week"::text;
    END IF;
END
$$;

-- ─── Tablas que faltaban ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "psychologist_signatures" (
    "id" TEXT NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "signature_type" TEXT NOT NULL,
    "data_url" TEXT,
    "image_url" TEXT,
    "file_name" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "psychologist_signatures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "psychologist_settings" (
    "id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "logo_url" TEXT,
    "consulting_room_name" TEXT,
    "trade_name" TEXT,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "typography" TEXT DEFAULT 'inter',
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "email" TEXT,
    "locale" TEXT DEFAULT 'es-CO',
    "timezone" TEXT DEFAULT 'America/Bogota',

    CONSTRAINT "psychologist_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "generated_reports" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL DEFAULT 'individual',
    "template_version" TEXT NOT NULL DEFAULT 'classic-v1',
    "branding_version" TEXT,
    "dictionary_version" TEXT NOT NULL DEFAULT 'v1.0',
    "content_hash" TEXT,
    "version_hash" TEXT,
    "pdf_size" INTEGER,
    "pages" INTEGER,
    "generated_by" TEXT,
    "report_data" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "signature_image" TEXT,
    "signed_by" TEXT,
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "recommendations_ai" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "intervention_plans" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervention_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assessment_reports" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "field_findings" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "intervention_actions" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "measure" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "due_date" DATE,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "risk_category" TEXT,
    "area" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervention_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);


-- ─── Índices ────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "psychologist_signatures_psychologist_id_signature_type_key" ON "psychologist_signatures"("psychologist_id", "signature_type");
CREATE UNIQUE INDEX IF NOT EXISTS "psychologist_settings_psychologist_id_key" ON "psychologist_settings"("psychologist_id");
CREATE UNIQUE INDEX IF NOT EXISTS "generated_reports_assessment_id_key" ON "generated_reports"("assessment_id");
CREATE INDEX IF NOT EXISTS "generated_reports_assessment_id_status_idx" ON "generated_reports"("assessment_id", "status");
CREATE INDEX IF NOT EXISTS "generated_reports_psychologist_id_idx" ON "generated_reports"("psychologist_id");
CREATE INDEX IF NOT EXISTS "intervention_plans_organization_id_idx" ON "intervention_plans"("organization_id");
CREATE INDEX IF NOT EXISTS "assessment_reports_organization_id_idx" ON "assessment_reports"("organization_id");
CREATE UNIQUE INDEX IF NOT EXISTS "assessment_reports_organization_id_year_key" ON "assessment_reports"("organization_id", "year");
CREATE INDEX IF NOT EXISTS "intervention_actions_plan_id_idx" ON "intervention_actions"("plan_id");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_psychologist_id_created_at_idx" ON "password_reset_tokens"("psychologist_id", "created_at" DESC);

-- ─── Claves foráneas ────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'psychologist_signatures_psychologist_id_fkey') THEN
        ALTER TABLE "psychologist_signatures" ADD CONSTRAINT "psychologist_signatures_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'psychologist_settings_psychologist_id_fkey') THEN
        ALTER TABLE "psychologist_settings" ADD CONSTRAINT "psychologist_settings_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_reports_assessment_id_fkey') THEN
        ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'generated_reports_psychologist_id_fkey') THEN
        ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_plans_organization_id_fkey') THEN
        ALTER TABLE "intervention_plans" ADD CONSTRAINT "intervention_plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_plans_psychologist_id_fkey') THEN
        ALTER TABLE "intervention_plans" ADD CONSTRAINT "intervention_plans_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_reports_organization_id_fkey') THEN
        ALTER TABLE "assessment_reports" ADD CONSTRAINT "assessment_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'assessment_reports_psychologist_id_fkey') THEN
        ALTER TABLE "assessment_reports" ADD CONSTRAINT "assessment_reports_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intervention_actions_plan_id_fkey') THEN
        ALTER TABLE "intervention_actions" ADD CONSTRAINT "intervention_actions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "intervention_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_psychologist_id_fkey') THEN
        ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
