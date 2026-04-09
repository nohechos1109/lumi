-- 002_cobranza.sql  —  Módulo de Cobranza (Ventas, Notas, Pagos, Convenios)

-- ═══════════════════════════════════════════════════════════════
-- 1. SALES  (Ventas)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id"              uuid          DEFAULT gen_random_uuid() NOT NULL,
    "number"          text          NOT NULL,
    "quote_id"        uuid          NOT NULL,
    "customer_id"     uuid          NOT NULL,
    "project_id"      uuid,
    "user_id"         uuid,
    "state"           text          NOT NULL DEFAULT 'active',
    "amount_untaxed"  numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_tax"      numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_total"    numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_paid"     numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_balance"  numeric(14,2) DEFAULT 0 NOT NULL,
    "unit_count"      integer       DEFAULT 1 NOT NULL,
    "created_at"      timestamptz   DEFAULT now() NOT NULL,
    "archived_at"     timestamptz,
    CONSTRAINT "sales_pkey"             PRIMARY KEY ("id"),
    CONSTRAINT "sales_state_check"      CHECK (state IN ('active','paid','cancelled')),
    CONSTRAINT "sales_unit_count_check" CHECK (unit_count >= 1)
) WITH (oids = false);

CREATE UNIQUE INDEX IF NOT EXISTS sales_number_key    ON public.sales USING btree (number);
CREATE INDEX IF NOT EXISTS idx_sales_quote            ON public.sales USING btree (quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer          ON public.sales USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_project           ON public.sales USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_sales_user              ON public.sales USING btree (user_id);

ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_quote_id_fkey"    FOREIGN KEY (quote_id)    REFERENCES quotes(id),
    ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id),
    ADD CONSTRAINT "sales_project_id_fkey"  FOREIGN KEY (project_id)  REFERENCES projects(id),
    ADD CONSTRAINT "sales_user_id_fkey"     FOREIGN KEY (user_id)     REFERENCES users(id);


-- ═══════════════════════════════════════════════════════════════
-- 2. SALE_NOTES  (Notas de venta)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "public"."sale_notes" (
    "id"              uuid          DEFAULT gen_random_uuid() NOT NULL,
    "number"          text          NOT NULL,
    "sale_id"         uuid          NOT NULL,
    "state"           text          NOT NULL DEFAULT 'draft',
    "concept"         text,
    "amount_untaxed"  numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_tax"      numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_total"    numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_paid"     numeric(14,2) DEFAULT 0 NOT NULL,
    "amount_balance"  numeric(14,2) DEFAULT 0 NOT NULL,
    "created_at"      timestamptz   DEFAULT now() NOT NULL,
    CONSTRAINT "sale_notes_pkey"        PRIMARY KEY ("id"),
    CONSTRAINT "sale_notes_state_check" CHECK (state IN ('draft','confirmed','cancelled','paid'))
) WITH (oids = false);

CREATE UNIQUE INDEX IF NOT EXISTS sale_notes_number_key ON public.sale_notes USING btree (number);
CREATE INDEX IF NOT EXISTS idx_sale_notes_sale          ON public.sale_notes USING btree (sale_id);

ALTER TABLE ONLY "public"."sale_notes"
    ADD CONSTRAINT "sale_notes_sale_id_fkey" FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;


-- ═══════════════════════════════════════════════════════════════
-- 3. SALE_NOTE_LINES  (Líneas de nota)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "public"."sale_note_lines" (
    "id"              uuid          DEFAULT gen_random_uuid() NOT NULL,
    "sale_note_id"    uuid          NOT NULL,
    "sequence"        integer       NOT NULL,
    "display_type"    text,
    "product_id"      uuid,
    "name"            text          NOT NULL,
    "qty"             numeric(14,4),
    "unit_price_mxn"  numeric(14,4) DEFAULT 0 NOT NULL,
    "subtotal"        numeric(14,2) DEFAULT 0 NOT NULL,
    "tax_amount"      numeric(14,2) DEFAULT 0 NOT NULL,
    "total"           numeric(14,2) DEFAULT 0 NOT NULL,
    CONSTRAINT "sale_note_lines_pkey"              PRIMARY KEY ("id"),
    CONSTRAINT "sale_note_lines_display_type_check" CHECK (display_type IS NULL OR display_type IN ('product','section','note','discount'))
) WITH (oids = false);

CREATE INDEX IF NOT EXISTS idx_sale_note_lines_note ON public.sale_note_lines USING btree (sale_note_id);

ALTER TABLE ONLY "public"."sale_note_lines"
    ADD CONSTRAINT "sale_note_lines_note_fkey"    FOREIGN KEY (sale_note_id) REFERENCES sale_notes(id) ON DELETE CASCADE,
    ADD CONSTRAINT "sale_note_lines_product_fkey" FOREIGN KEY (product_id)   REFERENCES products(id);


-- ═══════════════════════════════════════════════════════════════
-- 4. PAYMENTS  (Pagos)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id"              uuid          DEFAULT gen_random_uuid() NOT NULL,
    "number"          text          NOT NULL,
    "sale_id"         uuid          NOT NULL,
    "state"           text          NOT NULL DEFAULT 'draft',
    "concept"         text,
    "amount"          numeric(14,2) NOT NULL,
    "payment_method"  text          NOT NULL,
    "payment_date"    date          DEFAULT CURRENT_DATE NOT NULL,
    "reference"       text,
    "notes"           text,
    "registered_by"   uuid          NOT NULL,
    "confirmed_by"    uuid,
    "confirmed_at"    timestamptz,
    "created_at"      timestamptz   DEFAULT now() NOT NULL,
    CONSTRAINT "payments_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "payments_state_check"   CHECK (state IN ('draft','confirmed','cancelled')),
    CONSTRAINT "payments_amount_check"  CHECK (amount > 0),
    CONSTRAINT "payments_method_check"  CHECK (payment_method IN ('efectivo','transferencia','cheque','tarjeta','otro'))
) WITH (oids = false);

CREATE UNIQUE INDEX IF NOT EXISTS payments_number_key ON public.payments USING btree (number);
CREATE INDEX IF NOT EXISTS idx_payments_sale           ON public.payments USING btree (sale_id);

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_sale_id_fkey"        FOREIGN KEY (sale_id)       REFERENCES sales(id),
    ADD CONSTRAINT "payments_registered_by_fkey"  FOREIGN KEY (registered_by) REFERENCES users(id),
    ADD CONSTRAINT "payments_confirmed_by_fkey"   FOREIGN KEY (confirmed_by)  REFERENCES users(id);


-- ═══════════════════════════════════════════════════════════════
-- 5. PAYMENT_APPLICATIONS  (Aplicación de pagos a notas)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "public"."payment_applications" (
    "id"              uuid          DEFAULT gen_random_uuid() NOT NULL,
    "payment_id"      uuid          NOT NULL,
    "sale_note_id"    uuid          NOT NULL,
    "amount"          numeric(14,2) NOT NULL,
    "created_at"      timestamptz   DEFAULT now() NOT NULL,
    CONSTRAINT "payment_applications_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "payment_applications_amount_check"  CHECK (amount > 0)
) WITH (oids = false);

CREATE INDEX IF NOT EXISTS idx_pa_payment ON public.payment_applications USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_pa_note    ON public.payment_applications USING btree (sale_note_id);

ALTER TABLE ONLY "public"."payment_applications"
    ADD CONSTRAINT "pa_payment_fkey" FOREIGN KEY (payment_id)   REFERENCES payments(id) ON DELETE CASCADE,
    ADD CONSTRAINT "pa_note_fkey"    FOREIGN KEY (sale_note_id)  REFERENCES sale_notes(id);


-- ═══════════════════════════════════════════════════════════════
-- 6. PAYMENT_SCHEDULE_ITEMS  (Convenio de pago)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "public"."payment_schedule_items" (
    "id"          uuid          DEFAULT gen_random_uuid() NOT NULL,
    "sale_id"     uuid          NOT NULL,
    "due_date"    date          NOT NULL,
    "amount"      numeric(14,2) NOT NULL,
    "label"       text,
    "sequence"    integer       NOT NULL,
    "created_at"  timestamptz   DEFAULT now() NOT NULL,
    CONSTRAINT "psi_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "psi_amount_check"  CHECK (amount > 0)
) WITH (oids = false);

CREATE INDEX IF NOT EXISTS idx_psi_sale ON public.payment_schedule_items USING btree (sale_id);

ALTER TABLE ONLY "public"."payment_schedule_items"
    ADD CONSTRAINT "psi_sale_fkey" FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
