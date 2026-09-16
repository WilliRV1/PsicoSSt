-- Contador de límite de peticiones compartido entre instancias serverless.
-- Reemplaza el Map en memoria por instancia (ver src/lib/security/rate-limit.ts).
CREATE TABLE "rate_limit_entries" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rate_limit_entries_reset_at_idx" ON "rate_limit_entries"("reset_at");
CREATE INDEX "rate_limit_entries_locked_until_idx" ON "rate_limit_entries"("locked_until");
