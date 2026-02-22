-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "QuestionnaireType" AS ENUM ('INTRALABORAL', 'EXTRALABORAL', 'STRESS');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SCORED', 'REVIEWED', 'SIGNED');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('SIN_RIESGO', 'BAJO', 'MEDIO', 'ALTO', 'MUY_ALTO');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('MANUAL', 'BULK');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEWED', 'SIGNED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "ConsentMethod" AS ENUM ('VERBAL', 'WRITTEN', 'DIGITAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CC', 'CE', 'TI', 'PA', 'OTHER');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('PRIMARIA', 'BACHILLERATO', 'TECNICO', 'TECNOLOGO', 'PROFESIONAL', 'ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO');

-- CreateEnum
CREATE TYPE "JobLevel" AS ENUM ('JEFATURA', 'PROFESIONAL', 'TECNICO', 'AUXILIAR', 'OPERATIVO');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'SCORE', 'SIGN_REPORT', 'EXPORT', 'IMPORT', 'CONSENT_RECORDED', 'PASSWORD_CHANGE', 'MFA_SETUP');

-- CreateTable
CREATE TABLE "psychologists" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "professional_card" TEXT NOT NULL,
    "sst_credential" TEXT NOT NULL,
    "mfa_secret" TEXT,
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "psychologists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "economic_sector" TEXT,
    "city" TEXT,
    "department" TEXT,
    "employee_count" INTEGER,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "created_by_psychologist" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers" (
    "id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "gender" TEXT,
    "birth_date" TIMESTAMP(3),
    "marital_status" TEXT,
    "education_level" "EducationLevel" NOT NULL,
    "job_title" TEXT,
    "job_level" "JobLevel" NOT NULL,
    "department_area" TEXT,
    "years_in_company" INTEGER,
    "years_in_position" INTEGER,
    "contract_type" TEXT,
    "work_schedule" TEXT,
    "hours_per_week" INTEGER,
    "organization_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "form_type" "FormType" NOT NULL,
    "questionnaire_type" "QuestionnaireType" NOT NULL,
    "assessment_date" DATE NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "input_method" "InputMethod" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_sets" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "responses" JSONB NOT NULL,
    "total_items" INTEGER NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "response_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scored_results" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "dimension_scores" JSONB NOT NULL,
    "domain_scores" JSONB NOT NULL,
    "total_scores" JSONB NOT NULL,
    "overall_risk_category" "RiskCategory" NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scored_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informed_consents" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "consent_text" TEXT NOT NULL,
    "consent_granted" BOOLEAN NOT NULL,
    "consent_method" "ConsentMethod" NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "informed_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "report_type" TEXT NOT NULL DEFAULT 'individual',
    "report_data" JSONB NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "signature_hash" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "psychologist_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "success_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_email_key" ON "psychologists"("email");

-- CreateIndex
CREATE UNIQUE INDEX "psychologists_license_number_key" ON "psychologists"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_nit_key" ON "organizations"("nit");

-- CreateIndex
CREATE INDEX "workers_organization_id_idx" ON "workers"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "workers_document_type_document_id_organization_id_key" ON "workers"("document_type", "document_id", "organization_id");

-- CreateIndex
CREATE INDEX "assessments_psychologist_id_status_idx" ON "assessments"("psychologist_id", "status");

-- CreateIndex
CREATE INDEX "assessments_organization_id_assessment_date_idx" ON "assessments"("organization_id", "assessment_date");

-- CreateIndex
CREATE INDEX "assessments_worker_id_idx" ON "assessments"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "response_sets_assessment_id_key" ON "response_sets"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "scored_results_assessment_id_key" ON "scored_results"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "informed_consents_assessment_id_key" ON "informed_consents"("assessment_id");

-- CreateIndex
CREATE INDEX "reports_assessment_id_status_idx" ON "reports"("assessment_id", "status");

-- CreateIndex
CREATE INDEX "reports_psychologist_id_idx" ON "reports"("psychologist_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "import_jobs_psychologist_id_idx" ON "import_jobs"("psychologist_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_psychologist_fkey" FOREIGN KEY ("created_by_psychologist") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_sets" ADD CONSTRAINT "response_sets_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scored_results" ADD CONSTRAINT "scored_results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informed_consents" ADD CONSTRAINT "informed_consents_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informed_consents" ADD CONSTRAINT "informed_consents_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "psychologists"("id") ON DELETE SET NULL ON UPDATE CASCADE;
