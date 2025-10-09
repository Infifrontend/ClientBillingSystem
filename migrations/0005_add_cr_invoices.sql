
CREATE TYPE "public"."cr_invoice_status" AS ENUM('initiated', 'pending', 'approved');

CREATE TABLE IF NOT EXISTS "cr_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"employee_name" varchar(255) NOT NULL,
	"cr_no" varchar(100) NOT NULL,
	"cr_currency" "currency" DEFAULT 'INR' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"document_path" varchar,
	"status" "cr_invoice_status" DEFAULT 'initiated' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cr_invoices_cr_no_unique" UNIQUE("cr_no")
);

ALTER TABLE "cr_invoices" ADD CONSTRAINT "cr_invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
