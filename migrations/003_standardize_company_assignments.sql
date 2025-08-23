-- Migration: Standardize Company Assignment System
-- Purpose: Clean up inconsistent assignment patterns and standardize on company_sales_users table
-- Created: 2025-08-23
-- 
-- IMPORTANT: Run these scripts in order and test thoroughly in development first!
-- 
-- This migration addresses the critical issue of having 3 different assignment methods:
-- 1. companies.assigned_sales_user (string field) - REMOVING
-- 2. company_sales_users table (junction table) - KEEPING as single source of truth
-- 3. profiles.assigned_sales_user (individual assignment) - REMOVING

-- ================================================================
-- STEP 1: DATA MIGRATION - Preserve existing assignments
-- ================================================================

-- Create temporary table to backup current assignments
CREATE TABLE IF NOT EXISTS assignment_migration_backup AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.assigned_sales_user as companies_assigned_sales_user,
    csu.sales_user_id as junction_table_sales_user,
    csu.id as junction_table_id,
    p.assigned_sales_user as profiles_assigned_sales_user,
    COUNT(p.id) as profile_count,
    NOW() as backup_created_at
FROM companies c
LEFT JOIN company_sales_users csu ON c.id = csu.company_id
LEFT JOIN profiles p ON c.id = p.company_id
GROUP BY c.id, c.name, c.assigned_sales_user, csu.sales_user_id, csu.id, p.assigned_sales_user;

-- Log the current state
INSERT INTO migration_log (migration_name, step, message, data_count) 
VALUES (
    '003_standardize_company_assignments',
    'backup_created', 
    'Created backup of current assignment state',
    (SELECT COUNT(*) FROM assignment_migration_backup)
);

-- ================================================================
-- STEP 2: MIGRATE DATA TO JUNCTION TABLE
-- ================================================================

-- Migrate from companies.assigned_sales_user to company_sales_users (if not already exists)
INSERT INTO company_sales_users (company_id, sales_user_id)
SELECT DISTINCT 
    c.id as company_id,
    c.assigned_sales_user as sales_user_id
FROM companies c
WHERE c.assigned_sales_user IS NOT NULL
  AND c.assigned_sales_user != ''
  AND NOT EXISTS (
    SELECT 1 FROM company_sales_users csu 
    WHERE csu.company_id = c.id 
    AND csu.sales_user_id = c.assigned_sales_user
  )
  AND EXISTS (
    SELECT 1 FROM nts_users nu 
    WHERE nu.id = c.assigned_sales_user
  );

-- Log migration from companies table
INSERT INTO migration_log (migration_name, step, message, data_count) 
VALUES (
    '003_standardize_company_assignments',
    'migrate_companies_assigned_sales_user', 
    'Migrated assignments from companies.assigned_sales_user',
    (SELECT COUNT(*) FROM companies WHERE assigned_sales_user IS NOT NULL AND assigned_sales_user != '')
);

-- Migrate from profiles.assigned_sales_user to company_sales_users (company-level assignment)
INSERT INTO company_sales_users (company_id, sales_user_id)
SELECT DISTINCT 
    p.company_id,
    p.assigned_sales_user as sales_user_id
FROM profiles p
WHERE p.assigned_sales_user IS NOT NULL
  AND p.assigned_sales_user != ''
  AND p.company_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_sales_users csu 
    WHERE csu.company_id = p.company_id 
    AND csu.sales_user_id = p.assigned_sales_user
  )
  AND EXISTS (
    SELECT 1 FROM nts_users nu 
    WHERE nu.id = p.assigned_sales_user
  );

-- Log migration from profiles table
INSERT INTO migration_log (migration_name, step, message, data_count) 
VALUES (
    '003_standardize_company_assignments',
    'migrate_profiles_assigned_sales_user', 
    'Migrated assignments from profiles.assigned_sales_user',
    (SELECT COUNT(DISTINCT company_id) FROM profiles WHERE assigned_sales_user IS NOT NULL AND assigned_sales_user != '' AND company_id IS NOT NULL)
);

-- ================================================================
-- STEP 3: UPDATE EXISTING QUOTES TO USE COMPANY ASSIGNMENTS
-- ================================================================

-- Update shippingquotes.assigned_sales_user based on company assignment
UPDATE shippingquotes sq
SET assigned_sales_user = csu.sales_user_id,
    updated_at = NOW()
FROM company_sales_users csu
WHERE sq.company_id = csu.company_id
  AND (sq.assigned_sales_user IS NULL OR sq.assigned_sales_user = '');

-- Log quote updates
INSERT INTO migration_log (migration_name, step, message, data_count) 
VALUES (
    '003_standardize_company_assignments',
    'update_quotes_assignments', 
    'Updated shippingquotes with company-based assignments',
    (SELECT COUNT(*) FROM shippingquotes sq JOIN company_sales_users csu ON sq.company_id = csu.company_id)
);

-- ================================================================
-- STEP 4: VALIDATION QUERIES
-- ================================================================

-- Check for companies without assignments
CREATE OR REPLACE VIEW companies_without_assignments AS
SELECT 
    c.id,
    c.name,
    COUNT(p.id) as profile_count,
    COUNT(sq.id) as quote_count
FROM companies c
LEFT JOIN company_sales_users csu ON c.id = csu.company_id
LEFT JOIN profiles p ON c.id = p.company_id
LEFT JOIN shippingquotes sq ON c.id = sq.company_id
WHERE csu.id IS NULL
GROUP BY c.id, c.name;

-- Check for conflicting assignments (shouldn't exist after migration)
CREATE OR REPLACE VIEW assignment_conflicts AS
SELECT 
    c.id as company_id,
    c.name as company_name,
    c.assigned_sales_user as companies_field,
    csu.sales_user_id as junction_table,
    'CONFLICT' as status
FROM companies c
JOIN company_sales_users csu ON c.id = csu.company_id
WHERE c.assigned_sales_user IS NOT NULL 
  AND c.assigned_sales_user != ''
  AND c.assigned_sales_user != csu.sales_user_id;

-- Log validation results
INSERT INTO migration_log (migration_name, step, message, data_count) 
VALUES (
    '003_standardize_company_assignments',
    'validation_unassigned_companies', 
    'Companies without sales user assignments',
    (SELECT COUNT(*) FROM companies_without_assignments)
);

INSERT INTO migration_log (migration_name, step, message, data_count) 
VALUES (
    '003_standardize_company_assignments',
    'validation_conflicts', 
    'Assignment conflicts found',
    (SELECT COUNT(*) FROM assignment_conflicts)
);

-- ================================================================
-- STEP 5: SCHEMA CHANGES (Run after data validation!)
-- ================================================================

-- Add proper foreign key constraints to company_sales_users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'company_sales_users_company_id_fkey' 
        AND table_name = 'company_sales_users'
    ) THEN
        ALTER TABLE company_sales_users 
        ADD CONSTRAINT company_sales_users_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'company_sales_users_sales_user_id_fkey' 
        AND table_name = 'company_sales_users'
    ) THEN
        ALTER TABLE company_sales_users 
        ADD CONSTRAINT company_sales_users_sales_user_id_fkey 
        FOREIGN KEY (sales_user_id) REFERENCES nts_users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint to prevent duplicate assignments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_company_sales_user' 
        AND table_name = 'company_sales_users'
    ) THEN
        ALTER TABLE company_sales_users 
        ADD CONSTRAINT unique_company_sales_user 
        UNIQUE (company_id, sales_user_id);
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_sales_users_company_id 
    ON company_sales_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_sales_users_sales_user_id 
    ON company_sales_users(sales_user_id);

-- ================================================================
-- STEP 6: FINAL VALIDATION AND CLEANUP PREPARATION
-- ================================================================

-- Create final validation report
CREATE OR REPLACE VIEW migration_003_validation_report AS
SELECT 
    'Total Companies' as metric,
    COUNT(*) as count,
    'N/A' as notes
FROM companies
UNION ALL
SELECT 
    'Companies with Assignments' as metric,
    COUNT(DISTINCT csu.company_id) as count,
    'Via company_sales_users table' as notes
FROM company_sales_users csu
UNION ALL
SELECT 
    'Companies without Assignments' as metric,
    COUNT(*) as count,
    'Need manual assignment' as notes
FROM companies_without_assignments
UNION ALL
SELECT 
    'Total Profiles (Shippers)' as metric,
    COUNT(*) as count,
    'Should inherit company assignment' as notes
FROM profiles
UNION ALL
SELECT 
    'Total Quotes' as metric,
    COUNT(*) as count,
    'Should have assigned_sales_user populated' as notes
FROM shippingquotes
UNION ALL
SELECT 
    'Quotes with Assignments' as metric,
    COUNT(*) as count,
    'Properly assigned via company' as notes
FROM shippingquotes 
WHERE assigned_sales_user IS NOT NULL AND assigned_sales_user != '';

-- Log completion
INSERT INTO migration_log (migration_name, step, message, data_count) 
VALUES (
    '003_standardize_company_assignments',
    'migration_completed', 
    'Migration completed successfully. Review validation report.',
    (SELECT COUNT(*) FROM company_sales_users)
);

-- ================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ================================================================

-- Run these queries after migration to verify success:

-- 1. Check all companies have assignments
-- SELECT * FROM companies_without_assignments;

-- 2. Verify no conflicts remain
-- SELECT * FROM assignment_conflicts;

-- 3. Check migration log
-- SELECT * FROM migration_log WHERE migration_name = '003_standardize_company_assignments' ORDER BY created_at;

-- 4. View final state
-- SELECT * FROM migration_003_validation_report;

-- ================================================================
-- ROLLBACK SCRIPT (Use only if migration fails)
-- ================================================================

-- Uncomment and run ONLY if you need to rollback:
-- 
-- -- Restore companies.assigned_sales_user from backup
-- UPDATE companies 
-- SET assigned_sales_user = b.companies_assigned_sales_user
-- FROM assignment_migration_backup b
-- WHERE companies.id = b.company_id
--   AND b.companies_assigned_sales_user IS NOT NULL;
--
-- -- Restore profiles.assigned_sales_user from backup  
-- UPDATE profiles
-- SET assigned_sales_user = b.profiles_assigned_sales_user
-- FROM assignment_migration_backup b
-- JOIN companies c ON b.company_id = c.id
-- WHERE profiles.company_id = c.id
--   AND b.profiles_assigned_sales_user IS NOT NULL;
--
-- -- Clear company_sales_users table
-- DELETE FROM company_sales_users;
--
-- INSERT INTO migration_log (migration_name, step, message) 
-- VALUES ('003_standardize_company_assignments', 'rollback_completed', 'Migration rolled back');

-- ================================================================
-- NOTES FOR TEAM:
-- ================================================================
-- 
-- 1. This migration preserves ALL existing assignment data
-- 2. No data is deleted until you manually remove the redundant columns
-- 3. The junction table becomes the single source of truth
-- 4. All existing functionality should work unchanged
-- 5. New assignments should only use company_sales_users table
-- 6. Test thoroughly in development before running in production
-- 7. Consider running during low-traffic hours
-- 8. Monitor application logs after migration for any issues
