-- Helper functions for company assignment system
-- Description: Utility functions to use after migration
-- Created: August 23, 2025

-- =======================
-- FUNCTION: Get Sales User for Company
-- =======================
CREATE OR REPLACE FUNCTION get_sales_user_for_company(company_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    sales_user_uuid UUID;
BEGIN
    SELECT sales_user_id INTO sales_user_uuid
    FROM company_sales_users
    WHERE company_id = company_uuid
    LIMIT 1; -- In case of multiple assignments, take first one
    
    RETURN sales_user_uuid;
END;
$$;

-- =======================
-- FUNCTION: Assign Sales User to Company
-- =======================
CREATE OR REPLACE FUNCTION assign_sales_user_to_company(
    company_uuid UUID,
    sales_user_uuid UUID,
    assigned_by_uuid UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    existing_assignment RECORD;
BEGIN
    -- Check if assignment already exists
    SELECT * INTO existing_assignment
    FROM company_sales_users
    WHERE company_id = company_uuid;
    
    IF existing_assignment IS NOT NULL THEN
        -- Update existing assignment
        UPDATE company_sales_users
        SET sales_user_id = sales_user_uuid,
            assigned_at = NOW(),
            assigned_by = assigned_by_uuid
        WHERE company_id = company_uuid;
    ELSE
        -- Create new assignment
        INSERT INTO company_sales_users (company_id, sales_user_id, assigned_at, assigned_by)
        VALUES (company_uuid, sales_user_uuid, NOW(), assigned_by_uuid);
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- =======================
-- FUNCTION: Get Companies for Sales User
-- =======================
CREATE OR REPLACE FUNCTION get_companies_for_sales_user(sales_user_uuid UUID)
RETURNS TABLE(company_id UUID, company_name TEXT, assigned_at TIMESTAMP)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as company_id,
        c.name as company_name,
        csu.assigned_at
    FROM company_sales_users csu
    JOIN companies c ON c.id = csu.company_id
    WHERE csu.sales_user_id = sales_user_uuid
    ORDER BY csu.assigned_at DESC;
END;
$$;

-- =======================
-- VIEW: Assignment Summary
-- =======================
CREATE OR REPLACE VIEW v_company_assignments AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.industry,
    csu.sales_user_id,
    nu.first_name || ' ' || nu.last_name as sales_user_name,
    nu.email as sales_user_email,
    csu.assigned_at,
    csu.assigned_by,
    COUNT(p.id) as shipper_count
FROM companies c
LEFT JOIN company_sales_users csu ON c.id = csu.company_id
LEFT JOIN nts_users nu ON csu.sales_user_id = nu.id
LEFT JOIN profiles p ON c.id = p.company_id
GROUP BY c.id, c.name, c.industry, csu.sales_user_id, nu.first_name, nu.last_name, nu.email, csu.assigned_at, csu.assigned_by
ORDER BY c.name;

-- =======================
-- VIEW: Unassigned Companies
-- =======================
CREATE OR REPLACE VIEW v_unassigned_companies AS
SELECT 
    c.id,
    c.name,
    c.industry,
    COUNT(p.id) as shipper_count,
    c.created_at
FROM companies c
LEFT JOIN company_sales_users csu ON c.id = csu.company_id
LEFT JOIN profiles p ON c.id = p.company_id
WHERE csu.company_id IS NULL
GROUP BY c.id, c.name, c.industry, c.created_at
ORDER BY c.created_at DESC;

-- =======================
-- TRIGGER: Auto-assign Default Sales User
-- =======================
-- Optional: Automatically assign new companies to default sales user
/*
CREATE OR REPLACE FUNCTION auto_assign_default_sales_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    default_sales_user UUID := 'e0718128-235b-4f41-ac6c-31ee0435c64e'; -- Replace with actual default
BEGIN
    -- Only auto-assign if no manual assignment happens within 1 minute
    INSERT INTO company_sales_users (company_id, sales_user_id, assigned_at, assigned_by)
    VALUES (NEW.id, default_sales_user, NOW(), NULL)
    ON CONFLICT (company_id) DO NOTHING; -- In case manual assignment beats the trigger
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_assign_sales_user
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_default_sales_user();
*/
