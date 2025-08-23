-- Post-Migration Cleanup Script
-- Purpose: Remove redundant columns after successful migration
-- Created: 2025-08-23
-- 
-- ⚠️  CRITICAL: Only run this AFTER verifying migration 003 was successful!
-- ⚠️  This will permanently remove the redundant assignment columns
-- ⚠️  Ensure all applications are updated to use company_sales_users table

-- ================================================================
-- PRE-CLEANUP VALIDATION (Run these checks first!)
-- ================================================================

-- Check 1: Ensure no conflicts exist
SELECT 'VALIDATION: Assignment Conflicts' as check_name, COUNT(*) as count
FROM assignment_conflicts;
-- Expected: 0 conflicts

-- Check 2: Ensure all companies have assignments
SELECT 'VALIDATION: Unassigned Companies' as check_name, COUNT(*) as count  
FROM companies_without_assignments;
-- Expected: 0 or acceptable number

-- Check 3: Verify junction table has data
SELECT 'VALIDATION: Company Assignments' as check_name, COUNT(*) as count
FROM company_sales_users;
-- Expected: > 0

-- Check 4: Verify quotes have proper assignments
SELECT 'VALIDATION: Quotes with Assignments' as check_name, COUNT(*) as count
FROM shippingquotes 
WHERE assigned_sales_user IS NOT NULL AND assigned_sales_user != '';
-- Expected: High percentage of total quotes

-- ================================================================
-- COLUMN REMOVAL (Only run after validation passes!)
-- ================================================================

-- Log the start of cleanup
INSERT INTO migration_log (migration_name, step, message) 
VALUES ('004_cleanup_redundant_columns', 'cleanup_started', 'Starting redundant column removal');

-- Remove redundant company_name columns
ALTER TABLE companies DROP COLUMN IF EXISTS company_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS company_name;

-- Log company_name removal
INSERT INTO migration_log (migration_name, step, message) 
VALUES ('004_cleanup_redundant_columns', 'removed_company_name_columns', 'Removed redundant company_name columns');

-- Remove redundant assigned_sales_user columns
ALTER TABLE companies DROP COLUMN IF EXISTS assigned_sales_user;
ALTER TABLE profiles DROP COLUMN IF EXISTS assigned_sales_user;

-- Log assigned_sales_user removal  
INSERT INTO migration_log (migration_name, step, message) 
VALUES ('004_cleanup_redundant_columns', 'removed_assigned_sales_user_columns', 'Removed redundant assigned_sales_user columns');

-- ================================================================
-- ADD HELPER FUNCTIONS
-- ================================================================

-- Function to get sales user for a company
CREATE OR REPLACE FUNCTION get_company_sales_user(company_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT sales_user_id 
        FROM company_sales_users 
        WHERE company_sales_users.company_id = $1 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if company has sales user
CREATE OR REPLACE FUNCTION company_has_sales_user(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM company_sales_users 
        WHERE company_sales_users.company_id = $1
    );
END;
$$ LANGUAGE plpgsql;

-- Log function creation
INSERT INTO migration_log (migration_name, step, message) 
VALUES ('004_cleanup_redundant_columns', 'created_helper_functions', 'Created helper functions for assignment queries');

-- ================================================================
-- CREATE UPDATED VIEWS
-- ================================================================

-- View for companies with their sales users
CREATE OR REPLACE VIEW companies_with_sales_users AS
SELECT 
    c.id,
    c.name,
    c.industry,
    csu.sales_user_id,
    nu.first_name as sales_user_first_name,
    nu.last_name as sales_user_last_name,
    nu.email as sales_user_email,
    COUNT(p.id) as shipper_count,
    COUNT(sq.id) as quote_count
FROM companies c
LEFT JOIN company_sales_users csu ON c.id = csu.company_id
LEFT JOIN nts_users nu ON csu.sales_user_id = nu.id
LEFT JOIN profiles p ON c.id = p.company_id
LEFT JOIN shippingquotes sq ON c.id = sq.company_id
GROUP BY c.id, c.name, c.industry, csu.sales_user_id, nu.first_name, nu.last_name, nu.email;

-- View for sales users with their companies
CREATE OR REPLACE VIEW sales_users_with_companies AS
SELECT 
    nu.id,
    nu.first_name,
    nu.last_name,
    nu.email,
    nu.role,
    COUNT(DISTINCT csu.company_id) as assigned_companies,
    COUNT(DISTINCT p.id) as total_shippers,
    COUNT(DISTINCT sq.id) as total_quotes
FROM nts_users nu
LEFT JOIN company_sales_users csu ON nu.id = csu.sales_user_id
LEFT JOIN profiles p ON csu.company_id = p.company_id
LEFT JOIN shippingquotes sq ON csu.company_id = sq.company_id
WHERE nu.role = 'sales' OR nu.role = 'admin'
GROUP BY nu.id, nu.first_name, nu.last_name, nu.email, nu.role;

-- Log view creation
INSERT INTO migration_log (migration_name, step, message) 
VALUES ('004_cleanup_redundant_columns', 'created_updated_views', 'Created views using standardized assignment system');

-- ================================================================
-- FINAL VALIDATION
-- ================================================================

-- Final check: Ensure cleanup was successful
CREATE OR REPLACE VIEW cleanup_validation_report AS
SELECT 
    'Column Removal Check' as validation_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'companies' 
            AND column_name IN ('assigned_sales_user', 'company_name')
        ) OR EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name IN ('assigned_sales_user', 'company_name')
        )
        THEN 'FAILED - Columns still exist'
        ELSE 'SUCCESS - Redundant columns removed'
    END as status
UNION ALL
SELECT 
    'Assignment System Check' as validation_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM company_sales_users) > 0
        THEN 'SUCCESS - Junction table has data'
        ELSE 'FAILED - No assignments found'
    END as status
UNION ALL
SELECT 
    'Helper Functions Check' as validation_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'get_company_sales_user'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'company_has_sales_user'
        )
        THEN 'SUCCESS - Helper functions created'
        ELSE 'FAILED - Helper functions missing'
    END as status;

-- Log completion
INSERT INTO migration_log (migration_name, step, message) 
VALUES ('004_cleanup_redundant_columns', 'cleanup_completed', 'Redundant column cleanup completed successfully');

-- ================================================================
-- EXAMPLE USAGE FOR DEVELOPERS
-- ================================================================

-- Examples of how to query with the new standardized system:

-- Get sales user for a company:
-- SELECT get_company_sales_user('company-uuid-here');

-- Check if company has sales user:
-- SELECT company_has_sales_user('company-uuid-here');

-- Get company with sales user info:
-- SELECT * FROM companies_with_sales_users WHERE id = 'company-uuid-here';

-- Get all companies for a sales user:
-- SELECT c.* FROM companies c
-- JOIN company_sales_users csu ON c.id = csu.company_id
-- WHERE csu.sales_user_id = 'sales-user-uuid-here';

-- ================================================================
-- ROLLBACK SCRIPT (Emergency use only!)
-- ================================================================

-- Uncomment and run ONLY if you need to rollback the cleanup:
-- 
-- -- Re-add the removed columns
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS assigned_sales_user UUID;
-- ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_sales_user UUID;  
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
--
-- -- Restore data from junction table
-- UPDATE companies 
-- SET assigned_sales_user = csu.sales_user_id,
--     company_name = companies.name
-- FROM company_sales_users csu
-- WHERE companies.id = csu.company_id;
--
-- -- Restore profiles data
-- UPDATE profiles 
-- SET assigned_sales_user = csu.sales_user_id,
--     company_name = c.name
-- FROM company_sales_users csu
-- JOIN companies c ON csu.company_id = c.id
-- WHERE profiles.company_id = c.id;
--
-- INSERT INTO migration_log (migration_name, step, message) 
-- VALUES ('004_cleanup_redundant_columns', 'rollback_completed', 'Cleanup rollback completed');

-- ================================================================
-- NOTES FOR TEAM:
-- ================================================================
--
-- 1. This cleanup is PERMANENT - columns are removed forever
-- 2. All application code must be updated before running this
-- 3. Use the helper functions for easier queries
-- 4. The views provide convenient access to related data
-- 5. Test all functionality thoroughly before running in production
-- 6. Keep the migration log table for audit purposes
-- 7. Monitor application performance after cleanup
