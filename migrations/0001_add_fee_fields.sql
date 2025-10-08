
-- Add new fee fields to agreements table
ALTER TABLE agreements ADD COLUMN implement_fees NUMERIC(12, 2);
ALTER TABLE agreements ADD COLUMN monthly_subscription_fees NUMERIC(12, 2);
ALTER TABLE agreements ADD COLUMN change_request_fees NUMERIC(12, 2);
