# 🔧 Step 2: Schema Analysis & Updates - Complete Guide

## 📋 **Overview**
Before implementing RLS policies, we need to ensure your database schema has all the required fields and relationships. This is **CRITICAL** because RLS policies depend on specific columns (especially `company_id`) to properly isolate data.

---

## 🔍 **Step 2A: Analyze Current Schema**

### **1. Run Schema Analysis**
Copy and paste `schema_analysis.sql` into Supabase SQL Editor and run it. This will show you:

```sql
-- Key things to look for in results:
✅ All required tables exist
✅ company_id columns exist in shippingquotes/orders  
✅ nts_users table exists
✅ company_sales_users junction table exists
✅ Foreign key relationships are proper
```

### **2. Interpret Results**

**🚨 RED FLAGS (Must Fix):**
- `shippingquotes` missing `company_id` column ← **CRITICAL**
- `nts_users` table doesn't exist
- `company_sales_users` table doesn't exist  
- Many quotes have NULL `company_id`

**⚠️ YELLOW FLAGS (Should Fix):**
- `orders` missing `company_id` column
- `profiles` missing `team_role` column
- No company sales assignments exist

**✅ GREEN FLAGS (Good to Go):**
- All tables exist with proper columns
- All data has proper `company_id` values
- Foreign key relationships exist

---

## 🔧 **Step 2B: Apply Schema Updates**

### **1. Create Missing Tables**
If your analysis showed missing tables:

```sql
-- Run these sections from schema_updates.sql:
-- SECTION A: CREATE MISSING TABLES (if needed)
```

### **2. Add Missing Columns**
**Most Important**: Ensure `company_id` exists in critical tables:

```sql
-- Add company_id to shippingquotes (CRITICAL!)
ALTER TABLE public.shippingquotes 
ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Add company_id to orders
ALTER TABLE public.orders 
ADD COLUMN company_id UUID REFERENCES public.companies(id);
```

### **3. Migrate Existing Data**
**CRITICAL STEP**: Populate `company_id` for existing records:

```sql
-- Link quotes to companies via user profiles
UPDATE shippingquotes 
SET company_id = profiles.company_id
FROM profiles 
WHERE shippingquotes.user_id = profiles.id 
AND shippingquotes.company_id IS NULL;
```

---

## 📊 **Step 2C: Verify Schema is Ready**

### **Run Verification Queries:**

```sql
-- 1. Check no quotes are missing company_id
SELECT COUNT(*) as quotes_missing_company_id 
FROM shippingquotes 
WHERE company_id IS NULL;
-- Result should be: 0

-- 2. Check company assignments exist
SELECT COUNT(*) as total_assignments 
FROM company_sales_users;
-- Result should be: > 0

-- 3. Check both user types exist
SELECT 'profiles' as user_type, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'nts_users' as user_type, COUNT(*) as count FROM nts_users;
-- Both should have > 0
```

---

## 🎯 **Common Scenarios & Solutions**

### **Scenario 1: Brand New Database**
```sql
-- You'll need to run the full schema.sql first
-- Then create sample data before RLS
```

### **Scenario 2: Existing Data, Missing company_id**
```sql
-- Most common scenario
-- Run SECTION B & D from schema_updates.sql
-- Focus on data migration scripts
```

### **Scenario 3: Have Profiles, No NTS Users**
```sql
-- Create nts_users table
-- Migrate some profiles to nts_users for sales reps
-- Set up company_sales_users assignments
```

### **Scenario 4: Data Integrity Issues**
```sql
-- Orphaned quotes without valid users
-- Companies without any users
-- Users without companies
-- → Use legacy company strategy from schema_updates.sql
```

---

## 🚨 **Critical Data Integrity Checks**

### **Before Proceeding to RLS, Ensure:**

```sql
-- 1. No orphaned quotes
SELECT COUNT(*) FROM shippingquotes s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE p.id IS NULL;
-- Should be 0

-- 2. All quotes have company_id
SELECT COUNT(*) FROM shippingquotes 
WHERE company_id IS NULL;
-- Should be 0

-- 3. All companies have sales assignments
SELECT c.name 
FROM companies c
LEFT JOIN company_sales_users csu ON c.id = csu.company_id
WHERE csu.company_id IS NULL;
-- Should return no rows

-- 4. Foreign keys are valid
SELECT COUNT(*) FROM shippingquotes s
LEFT JOIN companies c ON s.company_id = c.id
WHERE s.company_id IS NOT NULL AND c.id IS NULL;
-- Should be 0
```

---

## 🛠️ **Implementation Order in Supabase**

### **1. Backup First**
```sql
-- In Supabase Dashboard:
-- Settings → Database → Backups → Create Backup
```

### **2. Run Analysis**
```sql
-- Copy/paste schema_analysis.sql into SQL Editor
-- Review all results carefully
```

### **3. Apply Updates (if needed)**
```sql
-- Run relevant sections from schema_updates.sql
-- Start with SECTION B (Add Missing Columns)
-- Then SECTION D (Data Migration)
```

### **4. Verify Everything**
```sql
-- Run verification queries
-- Ensure all critical checks pass
```

### **5. Test Basic Queries**
```sql
-- Make sure your app still works
-- No foreign key constraint errors
-- All expected data is visible
```

---

## 📋 **Pre-RLS Checklist**

Before moving to RLS implementation, verify:

- [ ] ✅ `shippingquotes.company_id` column exists
- [ ] ✅ `orders.company_id` column exists  
- [ ] ✅ `nts_users` table exists with role column
- [ ] ✅ `company_sales_users` junction table exists
- [ ] ✅ All existing quotes have `company_id` values
- [ ] ✅ All existing orders have `company_id` values
- [ ] ✅ Company sales assignments exist
- [ ] ✅ Both user types (profiles/nts_users) have test data
- [ ] ✅ Foreign key relationships are proper
- [ ] ✅ No data integrity issues found

**Only proceed to RLS implementation when ALL items are checked!**

---

## 🆘 **Troubleshooting Common Issues**

### **Foreign Key Constraint Errors**
```sql
-- Check for invalid company_id references
SELECT DISTINCT s.company_id 
FROM shippingquotes s
LEFT JOIN companies c ON s.company_id = c.id
WHERE s.company_id IS NOT NULL AND c.id IS NULL;
```

### **Performance Issues After Schema Changes**
```sql
-- Add indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_shippingquotes_company_id 
ON shippingquotes(company_id);

CREATE INDEX IF NOT EXISTS idx_company_sales_users_company_id 
ON company_sales_users(company_id);

CREATE INDEX IF NOT EXISTS idx_company_sales_users_sales_user_id 
ON company_sales_users(sales_user_id);
```

### **Data Migration Failures**
```sql
-- If migration scripts fail, check for:
-- 1. Circular dependencies
-- 2. Invalid UUID formats  
-- 3. Missing referenced records
-- 4. Constraint violations
```

Once you complete Step 2 successfully, you'll be ready to safely implement RLS policies! 🚀
