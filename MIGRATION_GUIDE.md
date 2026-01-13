# Database Migration Guide

## Pre-Migration Checklist

### ✅ **CRITICAL: Backup First!**

1. **Export current database:**
```bash
# Using Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Or via Supabase Dashboard:
# Settings → Database → Backups → Create Backup
```

2. **Export data as JSON (extra safety):**
```sql
-- Run these queries and save results
COPY (SELECT * FROM profiles) TO '/tmp/profiles_backup.json';
COPY (SELECT * FROM companies) TO '/tmp/companies_backup.json';
COPY (SELECT * FROM shippingquotes) TO '/tmp/quotes_backup.json';
```

3. **Test in staging environment first** (if available)

---

## Migration Options

### Option A: New Supabase Project (Recommended for Clean Start)

**Pros:**
- Zero risk to production data
- Can run old and new side-by-side
- Easy rollback (just switch back)

**Cons:**
- Need to migrate users manually
- New database URLs

**Steps:**
1. Create new Supabase project
2. Run migration SQL on new project
3. Export production data
4. Import into new project
5. Update environment variables
6. Test thoroughly
7. Switch over when ready

### Option B: In-Place Migration (Faster but Riskier)

**Pros:**
- No new project needed
- Faster transition

**Cons:**
- Requires downtime
- Harder to rollback

**Steps:**
1. Set maintenance mode
2. Final backup
3. Run migration SQL
4. Verify data integrity
5. Update application code
6. Deploy new code
7. Remove maintenance mode

---

## Running the Migration

### Step 1: Backup (REQUIRED)
```bash
# Create timestamped backup
supabase db dump -f "backup_pre_refactor_$(date +%Y%m%d_%H%M%S).sql"
```

### Step 2: Run Migration SQL
```bash
# Via Supabase SQL Editor (recommended)
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of migrations/2026_refactor_schema.sql
# 3. Review carefully
# 4. Run migration

# Or via psql:
psql -h your-db-host -U postgres -d your-database -f migrations/2026_refactor_schema.sql
```

### Step 3: Verify Migration
```sql
-- Check table counts
SELECT 'shippers' as table_name, COUNT(*) as count FROM shippers
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'nts_users', COUNT(*) FROM nts_users;

-- Check for orphaned records
SELECT COUNT(*) as orphaned_shippers FROM shippers
WHERE company_id NOT IN (SELECT id FROM companies);

SELECT COUNT(*) as orphaned_quotes FROM quotes
WHERE shipper_id NOT IN (SELECT id FROM shippers);

-- Verify foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('shippers', 'quotes', 'orders', 'companies');
```

### Step 4: Test RLS Policies
```sql
-- Test as shipper
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "shipper-uuid-here"}';
SELECT COUNT(*) FROM quotes; -- Should only see own quotes

-- Test as broker
SET request.jwt.claims TO '{"sub": "broker-uuid-here"}';
SELECT COUNT(*) FROM quotes; -- Should see assigned company quotes

-- Reset
RESET ROLE;
```

---

## Post-Migration Tasks

### Update Application Code

1. **Update Supabase types:**
```bash
npx supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
```

2. **Update imports:**
```typescript
// Old
import { Database['public']['Tables']['profiles']['Row'] }

// New
import { Database['public']['Tables']['shippers']['Row'] }
```

3. **Update queries:**
```typescript
// Old
.from('profiles')
.from('shippingquotes')

// New
.from('shippers')
.from('quotes')
.from('orders')
```

4. **Update context providers:**
```typescript
// Rename ProfilesUserProvider → ShippersProvider
// Update all references
```

---

## Rollback Procedure

If something goes wrong:

### Immediate Rollback (Within 5 minutes)
1. Stop application
2. Run rollback SQL: `migrations/2026_refactor_rollback.sql`
3. Restore from backup
4. Restart application

### Later Rollback
1. Restore entire database from backup
2. May lose data created after migration
3. Document what was lost

---

## Testing Checklist

After migration, test these flows:

- [ ] Shipper signup creates company + shipper record
- [ ] Shipper login works
- [ ] NTS user login works
- [ ] Create quote (shipper)
- [ ] Price quote (broker)
- [ ] Accept quote → creates order
- [ ] View orders
- [ ] Admin can assign broker to company
- [ ] Edit requests work
- [ ] Notifications work
- [ ] Document generation works

---

## Common Issues & Solutions

### Issue: Foreign key violations
**Solution:** Some profiles may not have valid company_id
```sql
-- Find orphaned profiles
SELECT id, email FROM profiles WHERE company_id IS NULL OR company_id NOT IN (SELECT id FROM companies);

-- Option 1: Create placeholder company
INSERT INTO companies (id, name) VALUES (gen_random_uuid(), 'Uncategorized');

-- Option 2: Delete orphaned profiles
DELETE FROM profiles WHERE company_id IS NULL;
```

### Issue: Duplicate company names
**Solution:** Companies table now requires unique names
```sql
-- Find duplicates
SELECT name, COUNT(*) FROM companies GROUP BY name HAVING COUNT(*) > 1;

-- Rename duplicates
UPDATE companies SET name = name || ' (2)' WHERE ...;
```

### Issue: Missing assigned_broker_id
**Solution:** Some companies may not have assigned brokers
```sql
-- Find unassigned companies
SELECT id, name FROM companies WHERE assigned_broker_id IS NULL;

-- Assign default broker (or leave NULL)
UPDATE companies SET assigned_broker_id = 'default-broker-uuid' WHERE assigned_broker_id IS NULL;
```

---

## Support

If migration fails:
1. Don't panic
2. Run rollback script
3. Restore from backup
4. Document the error
5. Fix migration script
6. Try again

**Remember:** Backups are your friend. Never run migration without backup!
