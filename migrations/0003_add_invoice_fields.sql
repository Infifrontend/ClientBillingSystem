
ALTER TABLE "services" ADD COLUMN "invoice_number" varchar(100);
ALTER TABLE "services" ADD COLUMN "invoice_date" timestamp;
ALTER TABLE "services" ADD COLUMN "status" varchar(20) DEFAULT 'pending';
