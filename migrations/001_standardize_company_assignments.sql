-- Migration: Standardize Company Assignment System
-- Description: Consolidate all company-to-sales-user assignments into company_sales_users table
-- Created: August 23, 2025
-- IMPORTANT: Run this during maintenance window - test on staging first!

-- =======================
-- STEP 1: BACKUP CURRENT DATA
-- =======================
-- Create backup tables before making changes
CREATE TABLE IF NOT EXISTS backup_companies_assignments AS 
SELECT id, assigned_sales_user, created_at 
FROM companies 
WHERE assigned_sales_user IS NOT NULL;

CREATE TABLE IF NOT EXISTS backup_profiles_assignments AS 
SELECT id, assigned_sales_user, company_id, created_at 
FROM profiles 
WHERE assigned_sales_user IS NOT NULL;

-- Log current state for verification
SELECT 
    'companies.assigned_sales_user' as source,
    COUNT(*) as assignment_count,
    COUNT(DISTINCT assigned_sales_user) as unique_sales_users
FROM companies 
WHERE assigned_sales_user IS NOT NULL
UNION ALL
SELECT 
    'profiles.assigned_sales_user' as source,
    COUNT(*) as assignment_count,
    COUNT(DISTINCT assigned_sales_user) as unique_sales_users
FROM profiles 
WHERE assigned_sales_user IS NOT NULL
UNION ALL
SELECT 
    'company_sales_users existing' as source,
    COUNT(*) as assignment_count,
    COUNT(DISTINCT sales_user_id) as unique_sales_users
FROM company_sales_users;

-- =======================
-- STEP 2: MIGRATE COMPANY ASSIGNMENTS
-- =======================
-- Migrate from companies.assigned_sales_user to company_sales_users
INSERT INTO company_sales_users (company_id, sales_user_id)
SELECT 
    c.id as company_id,
    c.assigned_sales_user as sales_user_id
FROM companies c
WHERE c.assigned_sales_user IS NOT NULL
  AND c.assigned_sales_user != ''
  -- Ensure the sales user actually exists
  AND EXISTS (
    SELECT 1 FROM nts_users nu 
    WHERE nu.id = c.assigned_sales_user
  )
  -- Prevent duplicates
  AND NOT EXISTS (
    SELECT 1 FROM company_sales_users csu 
    WHERE csu.company_id = c.id 
    AND csu.sales_user_id = c.assigned_sales_user
  );

-- =======================
-- STEP 3: HANDLE PROFILE-LEVEL ASSIGNMENTS
-- =======================
-- For profiles that have assigned_sales_user but their company doesn't,
-- we need to decide: use profile-level or ignore?
-- This query shows conflicts to review:
SELECT 
    p.id as profile_id,
    p.company_id,
    p.assigned_sales_user as profile_assigned,
    c.assigned_sales_user as company_assigned,
    csu.sales_user_id as junction_assigned
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN company_sales_users csu ON p.company_id = csu.company_id
WHERE p.assigned_sales_user IS NOT NULL
  AND (c.assigned_sales_user IS NULL OR c.assigned_sales_user != p.assigned_sales_user);

-- Migrate profile-level assignments where company has no assignment
INSERT INTO company_sales_users (company_id, sales_user_id)
SELECT DISTINCT
    p.company_id,
    p.assigned_sales_user
FROM profiles p
WHERE p.assigned_sales_user IS NOT NULL
  AND p.assigned_sales_user != ''
  AND p.company_id IS NOT NULL
  -- Ensure the sales user exists
  AND EXISTS (
    SELECT 1 FROM nts_users nu 
    WHERE nu.id = p.assigned_sales_user
  )
  -- Only if company doesn't already have assignment
  AND NOT EXISTS (
    SELECT 1 FROM company_sales_users csu 
    WHERE csu.company_id = p.company_id
  );

-- =======================
-- STEP 4: VERIFICATION QUERIES
-- =======================
-- Verify migration results
SELECT 
    'After Migration' as status,
    COUNT(*) as total_assignments,
    COUNT(DISTINCT company_id) as companies_with_assignments,
    COUNT(DISTINCT sales_user_id) as sales_users_assigned
FROM company_sales_users;

-- Find companies without assignments (potential issues)
SELECT 
    c.id,
    c.name,
    'No assignment' as issue
FROM companies c
LEFT JOIN company_sales_users csu ON c.id = csu.company_id
WHERE csu.company_id IS NULL;

-- Find assignments to non-existent sales users (data integrity issues)
SELECT 
    csu.company_id,
    csu.sales_user_id,
    'Invalid sales user' as issue
FROM company_sales_users csu
LEFT JOIN nts_users nu ON csu.sales_user_id = nu.id
WHERE nu.id IS NULL;

-- =======================
-- STEP 5: DROP REDUNDANT COLUMNS (AFTER VERIFICATION!)
-- =======================
-- WARNING: Only run these after verifying migration is successful!
-- Uncomment these lines after testing:

-- ALTER TABLE companies DROP COLUMN IF EXISTS assigned_sales_user;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS assigned_sales_user;

-- =======================
-- STEP 6: ADD CONSTRAINTS AND INDEXES
-- =======================
-- Ensure referential integrity
ALTER TABLE company_sales_users 
ADD CONSTRAINT fk_company_sales_users_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE company_sales_users 
ADD CONSTRAINT fk_company_sales_users_sales_user 
FOREIGN KEY (sales_user_id) REFERENCES nts_users(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_sales_users_company 
ON company_sales_users(company_id);

CREATE INDEX IF NOT EXISTS idx_company_sales_users_sales_user 
ON company_sales_users(sales_user_id);

-- Prevent duplicate assignments (if business logic requires it)
-- ALTER TABLE company_sales_users 
-- ADD CONSTRAINT uk_company_sales_user UNIQUE(company_id, sales_user_id);

-- =======================
-- ROLLBACK SCRIPT (SAVE THIS SEPARATELY)
-- =======================
/*
-- ROLLBACK INSTRUCTIONS:
-- 1. Restore columns:
ALTER TABLE companies ADD COLUMN assigned_sales_user TEXT;
ALTER TABLE profiles ADD COLUMN assigned_sales_user TEXT;

-- 2. Restore data from backups:
UPDATE companies c 
SET assigned_sales_user = b.assigned_sales_user
FROM backup_companies_assignments b
WHERE c.id = b.id;

UPDATE profiles p 
SET assigned_sales_user = b.assigned_sales_user
FROM backup_profiles_assignments b
WHERE p.id = b.id;

-- 3. Clear junction table:
DELETE FROM company_sales_users;
*/
