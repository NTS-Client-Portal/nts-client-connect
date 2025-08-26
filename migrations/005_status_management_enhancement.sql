-- Migration: Status Management Enhancement
-- This migration implements proper status enum validation and audit trail
-- Date: August 26, 2025

-- Start with logging
INSERT INTO migration_log (migration_name, start_time, status) 
VALUES ('005_status_management_enhancement', NOW(), 'STARTED');

-- 1. Create quote_status enum type
CREATE TYPE quote_status AS ENUM (
    'pending',      -- Initial state when quote is created
    'quoted',       -- Sales rep has provided a quote  
    'approved',     -- Customer approved the quote
    'order',        -- Converted to order (same as 'Order')
    'in_transit',   -- Order is being transported
    'delivered',    -- Successfully delivered
    'cancelled',    -- Cancelled by customer or broker
    'rejected',     -- Rejected by customer or broker
    'archived'      -- Archived for historical purposes
);

-- 2. Create brokers_status enum type  
CREATE TYPE brokers_status AS ENUM (
    'in_progress',     -- Broker is working on it
    'need_more_info',  -- Needs additional information
    'priced',          -- Broker has provided pricing
    'dispatched',      -- Dispatched to carrier
    'picked_up',       -- Picked up by carrier
    'delivered',       -- Delivered to destination
    'cancelled'        -- Cancelled
);

-- 3. Create audit trail table for status changes
CREATE TABLE IF NOT EXISTS quote_status_audit (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES shippingquotes(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_brokers_status VARCHAR(50),
    new_brokers_status VARCHAR(50), 
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX idx_quote_status_audit_quote_id ON quote_status_audit(quote_id);
CREATE INDEX idx_quote_status_audit_changed_at ON quote_status_audit(changed_at);

-- 5. Backup current data before transformation
CREATE TABLE IF NOT EXISTS status_migration_backup AS 
SELECT id, status, brokers_status FROM shippingquotes;

-- 6. Normalize current status values to match enum
-- Update status column to match new enum values
UPDATE shippingquotes SET status = CASE 
    WHEN status = 'Quote' THEN 'quoted'
    WHEN status = 'Order' THEN 'order'
    WHEN status = 'Archived' THEN 'archived'
    WHEN status = 'rejected' THEN 'rejected'
    WHEN status = 'cancelled' THEN 'cancelled'
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'Delivered' THEN 'delivered'
    WHEN status IS NULL THEN 'pending'
    ELSE LOWER(status)
END;

-- Update brokers_status column to match new enum values  
UPDATE shippingquotes SET brokers_status = CASE
    WHEN brokers_status = 'In Progress' THEN 'in_progress'
    WHEN brokers_status = 'Need More Info' THEN 'need_more_info'
    WHEN brokers_status = 'Priced' THEN 'priced'
    WHEN brokers_status = 'Dispatched' THEN 'dispatched'
    WHEN brokers_status = 'Picked Up' THEN 'picked_up'
    WHEN brokers_status = 'Delivered' THEN 'delivered'
    WHEN brokers_status = 'Cancelled' THEN 'cancelled'
    WHEN brokers_status IS NULL THEN 'in_progress'
    ELSE LOWER(REPLACE(brokers_status, ' ', '_'))
END;

-- 7. Apply the enum constraints to existing columns
ALTER TABLE shippingquotes 
    ALTER COLUMN status TYPE quote_status USING status::quote_status,
    ALTER COLUMN brokers_status TYPE brokers_status USING brokers_status::brokers_status;

-- 8. Set default values
ALTER TABLE shippingquotes 
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN brokers_status SET DEFAULT 'in_progress';

-- 9. Add constraints to ensure data integrity
ALTER TABLE shippingquotes 
    ADD CONSTRAINT check_status_not_null CHECK (status IS NOT NULL),
    ADD CONSTRAINT check_brokers_status_not_null CHECK (brokers_status IS NOT NULL);

-- 10. Create trigger function for audit trail
CREATE OR REPLACE FUNCTION track_quote_status_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if status or brokers_status actually changed
    IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.brokers_status IS DISTINCT FROM NEW.brokers_status) THEN
        INSERT INTO quote_status_audit (
            quote_id, 
            old_status, 
            new_status,
            old_brokers_status,
            new_brokers_status,
            changed_by,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.status::text,
            NEW.status::text, 
            OLD.brokers_status::text,
            NEW.brokers_status::text,
            NEW.updated_by, -- Assumes you have an updated_by column
            CASE 
                WHEN OLD.status IS DISTINCT FROM NEW.status THEN 
                    'Status changed from ' || COALESCE(OLD.status::text, 'null') || ' to ' || NEW.status::text
                WHEN OLD.brokers_status IS DISTINCT FROM NEW.brokers_status THEN
                    'Brokers status changed from ' || COALESCE(OLD.brokers_status::text, 'null') || ' to ' || NEW.brokers_status::text
                ELSE 'Status update'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to automatically track status changes
DROP TRIGGER IF EXISTS quote_status_change_trigger ON shippingquotes;
CREATE TRIGGER quote_status_change_trigger
    AFTER UPDATE OF status, brokers_status ON shippingquotes
    FOR EACH ROW
    EXECUTE FUNCTION track_quote_status_changes();

-- 12. Add updated_by column if it doesn't exist (for audit trail)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shippingquotes' AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE shippingquotes ADD COLUMN updated_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 13. Create helper function to get status display names
CREATE OR REPLACE FUNCTION get_status_display_name(status_val text)
RETURNS text AS $$
BEGIN
    RETURN CASE status_val
        WHEN 'pending' THEN 'Pending'
        WHEN 'quoted' THEN 'Quoted'
        WHEN 'approved' THEN 'Approved'  
        WHEN 'order' THEN 'Order'
        WHEN 'in_transit' THEN 'In Transit'
        WHEN 'delivered' THEN 'Delivered'
        WHEN 'cancelled' THEN 'Cancelled'
        WHEN 'rejected' THEN 'Rejected'
        WHEN 'archived' THEN 'Archived'
        WHEN 'in_progress' THEN 'In Progress'
        WHEN 'need_more_info' THEN 'Need More Info'
        WHEN 'priced' THEN 'Priced'
        WHEN 'dispatched' THEN 'Dispatched'
        WHEN 'picked_up' THEN 'Picked Up'
        ELSE INITCAP(REPLACE(status_val, '_', ' '))
    END;
END;
$$ LANGUAGE plpgsql;

-- 14. Verification queries
DO $$
DECLARE
    status_count INTEGER;
    brokers_status_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO status_count FROM shippingquotes WHERE status IS NULL;
    SELECT COUNT(*) INTO brokers_status_count FROM shippingquotes WHERE brokers_status IS NULL;
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE 'Quotes with NULL status: %', status_count;
    RAISE NOTICE 'Quotes with NULL brokers_status: %', brokers_status_count;
    
    IF status_count > 0 OR brokers_status_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: Found NULL status values';
    END IF;
END $$;

-- Complete migration logging
UPDATE migration_log 
SET end_time = NOW(), status = 'COMPLETED', details = 'Status enum validation and audit trail implemented'
WHERE migration_name = '005_status_management_enhancement' AND status = 'STARTED';

-- Final verification
SELECT 'Migration 005 completed successfully' AS result;
