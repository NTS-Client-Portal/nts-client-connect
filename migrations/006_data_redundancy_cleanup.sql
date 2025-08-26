-- Migration: Data Redundancy Cleanup
-- This migration removes duplicate company_name fields and standardizes on canonical names
-- Date: August 26, 2025

-- Start with logging
INSERT INTO migration_log (migration_name, start_time, status) 
VALUES ('006_data_redundancy_cleanup', NOW(), 'STARTED');

-- Step 1: Create backup tables for safety
CREATE TABLE IF NOT EXISTS companies_backup_006 AS 
SELECT * FROM companies;

CREATE TABLE IF NOT EXISTS profiles_backup_006 AS 
SELECT * FROM profiles;

-- Step 2: Analyze and log current redundancy issues
DO $$
DECLARE
    companies_with_redundant_names INTEGER;
    profiles_with_redundant_names INTEGER;
    mismatch_count INTEGER;
BEGIN
    -- Count companies with redundant company_name field
    SELECT COUNT(*) INTO companies_with_redundant_names 
    FROM companies 
    WHERE company_name IS NOT NULL;
    
    -- Count profiles with redundant company_name field  
    SELECT COUNT(*) INTO profiles_with_redundant_names
    FROM profiles 
    WHERE company_name IS NOT NULL;
    
    -- Count mismatches between companies.name and companies.company_name
    SELECT COUNT(*) INTO mismatch_count
    FROM companies 
    WHERE company_name IS NOT NULL 
    AND name != company_name;
    
    RAISE NOTICE 'Data redundancy analysis:';
    RAISE NOTICE '- Companies with redundant company_name: %', companies_with_redundant_names;
    RAISE NOTICE '- Profiles with redundant company_name: %', profiles_with_redundant_names;
    RAISE NOTICE '- Name mismatches in companies table: %', mismatch_count;
END $$;

-- Step 3: Handle mismatches before cleanup
-- For companies table: if company_name differs from name, we need to decide which to keep
-- Strategy: Keep the 'name' field as canonical, but log mismatches for manual review

CREATE TEMP TABLE company_name_mismatches AS
SELECT 
    id,
    name as canonical_name,
    company_name as redundant_name,
    'MISMATCH: Review needed' as resolution_notes
FROM companies 
WHERE company_name IS NOT NULL 
AND name != company_name;

-- Log mismatches for review
DO $$
DECLARE
    mismatch_record RECORD;
BEGIN
    FOR mismatch_record IN SELECT * FROM company_name_mismatches LOOP
        RAISE NOTICE 'MISMATCH FOUND - Company ID: %, Name: "%" vs Company_Name: "%"', 
            mismatch_record.id, 
            mismatch_record.canonical_name, 
            mismatch_record.redundant_name;
    END LOOP;
END $$;

-- Step 4: Handle profiles with company_name that doesn't match companies.name
-- Strategy: Remove profiles.company_name as it should come from the JOIN with companies

CREATE TEMP TABLE profile_company_mismatches AS
SELECT 
    p.id as profile_id,
    p.company_name as profile_company_name,
    c.name as canonical_company_name,
    p.company_id
FROM profiles p
JOIN companies c ON p.company_id = c.id
WHERE p.company_name IS NOT NULL 
AND p.company_name != c.name;

-- Log profile mismatches
DO $$
DECLARE
    mismatch_record RECORD;
BEGIN
    FOR mismatch_record IN SELECT * FROM profile_company_mismatches LOOP
        RAISE NOTICE 'PROFILE MISMATCH - Profile ID: %, Profile Company Name: "%" vs Canonical: "%"', 
            mismatch_record.profile_id, 
            mismatch_record.profile_company_name, 
            mismatch_record.canonical_company_name;
    END LOOP;
END $$;

-- Step 5: Check for queries that might be using the redundant fields
-- This is informational - actual query updates happen in application code

DO $$
BEGIN
    RAISE NOTICE 'WARNING: The following application areas will need updates:';
    RAISE NOTICE '1. Any queries using companies.company_name should use companies.name';
    RAISE NOTICE '2. Any queries using profiles.company_name should JOIN with companies.name';
    RAISE NOTICE '3. Components displaying company names should use the canonical companies.name';
END $$;

-- Step 6: Remove redundant columns (commented out for safety - uncomment after verification)
-- ALTER TABLE companies DROP COLUMN IF EXISTS company_name;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS company_name;

-- For now, we'll just mark them as deprecated by adding comments
COMMENT ON COLUMN companies.company_name IS 'DEPRECATED: Use companies.name instead. Will be removed in future migration.';
COMMENT ON COLUMN profiles.company_name IS 'DEPRECATED: Use JOIN with companies.name instead. Will be removed in future migration.';

-- Step 7: Create views to help transition away from redundant fields
CREATE OR REPLACE VIEW companies_clean AS
SELECT 
    id,
    name,
    -- company_name excluded intentionally
    created_at,
    updated_at
FROM companies;

CREATE OR REPLACE VIEW profiles_with_company AS
SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.company_id,
    c.name as company_name,  -- Canonical company name from JOIN
    p.created_at,
    p.updated_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id;

-- Step 8: Create helper functions for safe company name access
CREATE OR REPLACE FUNCTION get_canonical_company_name(company_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT name FROM companies WHERE id = company_uuid LIMIT 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_profile_company_name(profile_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT c.name 
        FROM profiles p 
        JOIN companies c ON p.company_id = c.id 
        WHERE p.id = profile_uuid 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update any existing data inconsistencies
-- Set NULL values for company_name fields to indicate they should use the canonical source
UPDATE companies 
SET company_name = NULL 
WHERE company_name IS NOT NULL AND company_name = name;

UPDATE profiles 
SET company_name = NULL 
WHERE company_name IS NOT NULL 
AND company_id IN (
    SELECT c.id FROM companies c 
    WHERE c.name = profiles.company_name
);

-- Step 10: Verification queries
DO $$
DECLARE
    remaining_company_redundancy INTEGER;
    remaining_profile_redundancy INTEGER;
    companies_total INTEGER;
    profiles_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_company_redundancy 
    FROM companies WHERE company_name IS NOT NULL;
    
    SELECT COUNT(*) INTO remaining_profile_redundancy
    FROM profiles WHERE company_name IS NOT NULL;
    
    SELECT COUNT(*) INTO companies_total FROM companies;
    SELECT COUNT(*) INTO profiles_total FROM profiles;
    
    RAISE NOTICE 'Cleanup verification:';
    RAISE NOTICE '- Remaining company_name entries in companies: %', remaining_company_redundancy;
    RAISE NOTICE '- Remaining company_name entries in profiles: %', remaining_profile_redundancy;
    RAISE NOTICE '- Total companies: %', companies_total;
    RAISE NOTICE '- Total profiles: %', profiles_total;
    
    -- Fail if we still have too much redundancy
    IF remaining_company_redundancy > (companies_total * 0.1) THEN
        RAISE EXCEPTION 'Too many redundant company_name entries remain: %', remaining_company_redundancy;
    END IF;
END $$;

-- Complete migration logging
UPDATE migration_log 
SET end_time = NOW(), status = 'COMPLETED', 
    details = 'Data redundancy cleanup phase 1 completed - deprecated redundant fields, created helper views and functions'
WHERE migration_name = '006_data_redundancy_cleanup' AND status = 'STARTED';

-- Final verification
SELECT 'Migration 006 phase 1 completed successfully - Redundant fields deprecated and helper utilities created' AS result;
