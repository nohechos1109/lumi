-- Schema-only dump from cotizador.sql
-- Adminer 5.4.2 PostgreSQL 15.17

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS "audit_events";
CREATE TABLE "public"."audit_events" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "entity" text,
    "entity_id" uuid,
    "type" text,
    "payload" jsonb,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE INDEX idx_audit_entity ON public.audit_events USING btree (entity);
CREATE INDEX idx_audit_entity_id ON public.audit_events USING btree (entity_id);
CREATE INDEX idx_audit_type ON public.audit_events USING btree (type);


DROP TABLE IF EXISTS "customers";
CREATE TABLE "public"."customers" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "email" text,
    "phone" text,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "files";
CREATE TABLE "public"."files" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "entity" text,
    "entity_id" uuid,
    "provider" text NOT NULL,
    "bucket" text NOT NULL,
    "key" text NOT NULL,
    "mime" text NOT NULL,
    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX files_key_key ON public.files USING btree (key);
CREATE INDEX idx_files_entity ON public.files USING btree (entity);
CREATE INDEX idx_files_entity_id ON public.files USING btree (entity_id);


DROP TABLE IF EXISTS "global_settings";
CREATE TABLE "public"."global_settings" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "fx_mxn_per_usd" numeric(14,6) NOT NULL,
    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "global_settings_fx_mxn_per_usd_check" CHECK (((fx_mxn_per_usd > (0)::numeric)))
)
WITH (oids = false);


DROP TABLE IF EXISTS "payment_terms";
CREATE TABLE "public"."payment_terms" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);

CREATE UNIQUE INDEX payment_terms_name_key ON public.payment_terms USING btree (name);


DROP TABLE IF EXISTS "plantilla_items";
CREATE TABLE "public"."plantilla_items" (
    "plantilla_id" uuid,
    "sequence" integer NOT NULL,
    "product_id" uuid,
    "qty" numeric(10,2) DEFAULT '1' NOT NULL
)
WITH (oids = false);


DROP TABLE IF EXISTS "plantillas";
CREATE TABLE "public"."plantillas" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "nombre" text NOT NULL,
    "requerimiento" text,
    CONSTRAINT "plantillas_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "products";
CREATE TABLE "public"."products" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "sku" text,
    "name" text NOT NULL,
    "description" text,
    "currency" character(3),
    "cost_base" numeric(14,4) NOT NULL,
    "utility_fixed" numeric(14,4) DEFAULT '0' NOT NULL,
    "utility_factor" numeric(14,6) DEFAULT '1' NOT NULL,
    "codigo_sat" text,
    "codigo_proveedor" text,
    "image_url" text,
    "category" text,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_currency_check" CHECK (((currency = ANY (ARRAY['MXN'::bpchar, 'USD'::bpchar])))),
    CONSTRAINT "products_cost_base_check" CHECK (((cost_base >= (0)::numeric))),
    CONSTRAINT "products_utility_factor_check" CHECK (((utility_factor >= (0)::numeric)))
)
WITH (oids = false);

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);


DROP TABLE IF EXISTS "projects";
CREATE TABLE "public"."projects" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "customer_id" uuid,
    "date" date DEFAULT CURRENT_DATE NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "description" text,
    "user_id" uuid,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "quote_lines";
CREATE TABLE "public"."quote_lines" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "quote_id" uuid NOT NULL,
    "sequence" integer NOT NULL,
    "display_type" text,
    "product_id" uuid,
    "name" text NOT NULL,
    "qty" numeric(14,4),
    "discount_percent" numeric(6,2) DEFAULT '0' NOT NULL,
    "currency_snapshot" character(3),
    "cost_base_snapshot" numeric(14,4) DEFAULT '0' NOT NULL,
    "utility_fixed_snapshot" numeric(14,4) DEFAULT '0' NOT NULL,
    "utility_factor_snapshot" numeric(14,6) DEFAULT '1' NOT NULL,
    "fx_snapshot" numeric(14,6) DEFAULT '1' NOT NULL,
    "unit_price_mxn_suggested" numeric(14,4) DEFAULT '0' NOT NULL,
    "unit_price_mxn_manual" numeric(14,4),
    "unit_price_mxn_effective" numeric(14,4) DEFAULT '0' NOT NULL,
    "subtotal" numeric(14,2) DEFAULT '0' NOT NULL,
    "tax_amount" numeric(14,2) DEFAULT '0' NOT NULL,
    "total" numeric(14,2) DEFAULT '0' NOT NULL,
    "margin_amount" numeric(14,2) DEFAULT '0' NOT NULL,
    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quote_lines_display_type_check" CHECK (((display_type = ANY (ARRAY['product'::text, 'section'::text, 'note'::text, 'discount'::text])))),
    CONSTRAINT "quote_lines_discount_percent_check" CHECK ((((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric))))
)
WITH (oids = false);

CREATE INDEX idx_quote_lines_quote_id ON public.quote_lines USING btree (quote_id);


DROP TABLE IF EXISTS "quotes";
CREATE TABLE "public"."quotes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "number" text NOT NULL,
    "state" text NOT NULL,
    "customer_id" uuid NOT NULL,
    "payment_term_id" uuid,
    "user_id" uuid,
    "quotation_date" timestamptz NOT NULL,
    "expiration_date" date,
    "fx_mxn_per_usd_snapshot" numeric(14,6) NOT NULL,
    "renewed_from_id" uuid,
    "description" text,
    "unit_count" integer DEFAULT '1' NOT NULL,
    "terms" text,
    "amount_untaxed" numeric(14,2) DEFAULT '0' NOT NULL,
    "amount_tax" numeric(14,2) DEFAULT '0' NOT NULL,
    "amount_total" numeric(14,2) DEFAULT '0' NOT NULL,
    "margin_amount" numeric(14,2) DEFAULT '0' NOT NULL,
    "margin_percent" numeric(6,2) DEFAULT '0' NOT NULL,
    "version" integer DEFAULT '1' NOT NULL,
    "project_id" uuid,
    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "quotes_state_check" CHECK (((state = ANY (ARRAY['draft'::text, 'sent'::text, 'confirmed'::text, 'cancelled'::text, 'expired'::text])))),
    CONSTRAINT "quotes_fx_mxn_per_usd_snapshot_check" CHECK (((fx_mxn_per_usd_snapshot > (0)::numeric))),
    CONSTRAINT "quotes_unit_count_check" CHECK (((unit_count >= 1)))
)
WITH (oids = false);

CREATE UNIQUE INDEX quotes_number_key ON public.quotes USING btree (number);


DROP TABLE IF EXISTS "users";
CREATE TABLE "public"."users" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "role" text NOT NULL,
    "username" text NOT NULL,
    "password_hash" text NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_role_check" CHECK (((role = ANY (ARRAY['sales'::text, 'manager'::text, 'admin'::text]))))
)
WITH (oids = false);

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


-- Foreign keys

ALTER TABLE ONLY "public"."plantilla_items" ADD CONSTRAINT "plantilla_items_plantilla_id_fkey" FOREIGN KEY (plantilla_id) REFERENCES plantillas(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."plantilla_items" ADD CONSTRAINT "plantilla_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id);

ALTER TABLE ONLY "public"."projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE ONLY "public"."projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE ONLY "public"."quote_lines" ADD CONSTRAINT "quote_lines_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE ONLY "public"."quote_lines" ADD CONSTRAINT "quote_lines_quote_id_fkey" FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE;

ALTER TABLE ONLY "public"."quotes" ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id);
ALTER TABLE ONLY "public"."quotes" ADD CONSTRAINT "quotes_payment_term_id_fkey" FOREIGN KEY (payment_term_id) REFERENCES payment_terms(id);
ALTER TABLE ONLY "public"."quotes" ADD CONSTRAINT "quotes_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE ONLY "public"."quotes" ADD CONSTRAINT "quotes_renewed_from_id_fkey" FOREIGN KEY (renewed_from_id) REFERENCES quotes(id);
ALTER TABLE ONLY "public"."quotes" ADD CONSTRAINT "quotes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id);
