-- ============================================================================
-- Créditos + pagos con Mercado Pago
-- ============================================================================
-- Esta migración es IDEMPOTENTE a propósito.
--
-- El sistema de créditos (`psychologists.credit_balance`, `credit_transactions`)
-- llegó al esquema vía `prisma db push`, sin migración que lo respaldara. Las
-- bases de datos ya desplegadas tienen esas tablas; una base limpia no. Un
-- `CREATE TABLE` plano rompería el deploy en la primera con
-- «relation already exists», así que todo va guardado por IF [NOT] EXISTS.
--
-- Ejecutar con `prisma migrate deploy` sobre una conexión DIRECTA a Neon
-- (la que NO lleva `-pooler`): PgBouncer en modo transaction no soporta DDL
-- con advisory locks.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Saldo de créditos del psicólogo
-- ---------------------------------------------------------------------------
ALTER TABLE "psychologists"
    ADD COLUMN IF NOT EXISTS "credit_balance" INTEGER NOT NULL DEFAULT 0;


-- ---------------------------------------------------------------------------
-- 2. Tipos de movimiento del libro de créditos
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CreditTxType') THEN
        CREATE TYPE "CreditTxType" AS ENUM (
            'PURCHASE', 'TRIAL_GRANT', 'ADMIN_GRANT', 'CONSUMPTION', 'REFUND', 'REVERSAL'
        );
    END IF;
END
$$;

-- REVERSAL es nuevo (reembolso/contracargo: resta créditos). En una base que ya
-- tenía el tipo hay que añadirlo; en una recién creada arriba, es un no-op.
-- PostgreSQL 12+ admite ADD VALUE dentro de una transacción siempre que el
-- valor no se USE en esa misma transacción — aquí no se usa.
ALTER TYPE "CreditTxType" ADD VALUE IF NOT EXISTS 'REVERSAL';


-- ---------------------------------------------------------------------------
-- 3. Libro de créditos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "credit_transactions" (
    "id"              UUID         NOT NULL,
    "psychologist_id" UUID         NOT NULL,
    "type"            "CreditTxType" NOT NULL,
    "amount"          INTEGER      NOT NULL,
    "balance_after"   INTEGER      NOT NULL,
    "package_id"      TEXT,
    "price_cop"       INTEGER,
    "payment_ref"     TEXT,
    "assessment_id"   UUID,
    "description"     TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "credit_transactions_psychologist_id_created_at_idx"
    ON "credit_transactions" ("psychologist_id", "created_at" DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'credit_transactions_psychologist_id_fkey'
    ) THEN
        ALTER TABLE "credit_transactions"
            ADD CONSTRAINT "credit_transactions_psychologist_id_fkey"
            FOREIGN KEY ("psychologist_id") REFERENCES "psychologists" ("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;


-- ---------------------------------------------------------------------------
-- 4. Órdenes de pago
-- ---------------------------------------------------------------------------
-- `payment_orders` se diseñó para Wompi y NUNCA recibió un pago: la ruta de
-- checkout jamás existió en el código. Por eso se recrea desde cero en vez de
-- parchear columna por columna (wompi_ref → mercado_pago_payment_id,
-- amount_cents → amount_cop, más 6 columnas nuevas y un enum distinto).
--
-- La guarda de abajo es deliberada: si alguien SÍ tiene datos ahí, la migración
-- se detiene con un mensaje claro en vez de borrarlos en silencio.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = current_schema() AND table_name = 'payment_orders') THEN

        IF EXISTS (SELECT 1 FROM "payment_orders" LIMIT 1) THEN
            RAISE EXCEPTION
                'payment_orders contiene datos. Esta migración la recrea desde cero y los perdería. Respalda la tabla y migra las filas a mano antes de continuar.';
        END IF;

        DROP TABLE "payment_orders";
    END IF;
END
$$;

DROP TYPE IF EXISTS "PaymentStatus";

CREATE TYPE "PaymentStatus" AS ENUM (
    'CREATED', 'PROCESSING', 'PENDING', 'IN_PROCESS', 'APPROVED',
    'REJECTED', 'CANCELLED', 'REFUNDED', 'CHARGED_BACK', 'EXPIRED', 'ERROR'
);

CREATE TABLE "payment_orders" (
    "id"                      UUID            NOT NULL,
    "psychologist_id"         UUID            NOT NULL,
    "package_id"              TEXT            NOT NULL,
    -- Pesos enteros: el COP no tiene decimales en Mercado Pago.
    "amount_cop"              INTEGER         NOT NULL,
    "internal_ref"            TEXT            NOT NULL,
    "mercado_pago_payment_id" TEXT,
    "status"                  "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "payment_method_id"       TEXT,
    "payment_type_id"         TEXT,
    "external_resource_url"   TEXT,
    "status_detail"           TEXT,
    "credit_transaction_id"   UUID,
    "expires_at"              TIMESTAMP(3)    NOT NULL,
    "created_at"              TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"              TIMESTAMP(3)    NOT NULL,
    "completed_at"            TIMESTAMP(3),

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- `internal_ref` correlaciona el webhook con la orden; `mercado_pago_payment_id`
-- es la llave de idempotencia que impide acreditar dos veces el mismo pago.
-- Ambos ÚNICOS: son garantías de integridad, no optimizaciones de consulta.
CREATE UNIQUE INDEX "payment_orders_internal_ref_key"
    ON "payment_orders" ("internal_ref");
CREATE UNIQUE INDEX "payment_orders_mercado_pago_payment_id_key"
    ON "payment_orders" ("mercado_pago_payment_id");
CREATE UNIQUE INDEX "payment_orders_credit_transaction_id_key"
    ON "payment_orders" ("credit_transaction_id");

CREATE INDEX "payment_orders_psychologist_id_created_at_idx"
    ON "payment_orders" ("psychologist_id", "created_at" DESC);
CREATE INDEX "payment_orders_status_created_at_idx"
    ON "payment_orders" ("status", "created_at");

ALTER TABLE "payment_orders"
    ADD CONSTRAINT "payment_orders_psychologist_id_fkey"
    FOREIGN KEY ("psychologist_id") REFERENCES "psychologists" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
