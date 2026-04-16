ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS assign_all_technicians boolean NOT NULL DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS assign_all_technicians boolean NOT NULL DEFAULT false;
