# NTS Logistics Platform Refactor Plan
**Date:** January 13, 2026
**Goal:** Simplify architecture, clean naming, remove technical debt

---

## 🎯 Core Objectives

1. **Rename** `profiles` → `shippers`
2. **Split** `shippingquotes` → `quotes` + `orders`
3. **Simplify** company-broker assignment (1:1 relationship)
4. **Clean** role system (admin/user only)
5. **Organize** project structure (App Router + clean components)
6. **Remove** unused tables and code

---

## 📊 Database Schema Changes

### **Tables to Rename**
- `profiles` → `shippers`

### **Tables to Split**
- `shippingquotes` → `quotes` (pre-acceptance) + `orders` (post-acceptance)

### **Tables to Delete**
- ❌ `boats`
- ❌ `freight`
- ❌ `company_sales_users` (replaced by direct FK)
- ❌ `assignment_migration_backup`
- ❌ Any other unused freight-specific tables

### **New Schema Structure**

```sql
-- Companies (shipper organizations)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  assigned_broker_id UUID REFERENCES nts_users(id),
  company_size TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shippers (customer users)
CREATE TABLE shippers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NTS Users (staff/brokers)
CREATE TABLE nts_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes (pre-acceptance)
CREATE TABLE quotes (
  id BIGSERIAL PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES shippers(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  assigned_broker_id UUID REFERENCES nts_users(id),
  
  -- Origin
  origin_city TEXT,
  origin_state TEXT,
  origin_zip TEXT,
  
  -- Destination
  destination_city TEXT,
  destination_state TEXT,
  destination_zip TEXT,
  
  -- Details
  freight_type TEXT,
  shipment_items JSONB,
  
  -- Pricing
  price NUMERIC,
  carrier_pay NUMERIC,
  
  -- Dates
  due_date DATE,
  pickup_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'priced', 'accepted', 'rejected')),
  
  -- Notes
  notes TEXT,
  special_instructions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (accepted quotes)
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT UNIQUE REFERENCES quotes(id),
  
  shipper_id UUID NOT NULL REFERENCES shippers(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  assigned_broker_id UUID NOT NULL REFERENCES nts_users(id),
  
  -- Copy all quote data at time of acceptance
  origin_city TEXT,
  origin_state TEXT,
  origin_zip TEXT,
  destination_city TEXT,
  destination_state TEXT,
  destination_zip TEXT,
  
  freight_type TEXT,
  shipment_items JSONB,
  
  price NUMERIC NOT NULL,
  carrier_pay NUMERIC,
  deposit NUMERIC,
  
  due_date DATE,
  pickup_date DATE,
  delivery_date DATE,
  
  -- Order-specific fields
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'carrier_assigned',
    'picked_up',
    'in_transit',
    'delivered',
    'cancelled'
  )),
  
  carrier_name TEXT,
  carrier_contact TEXT,
  tracking_number TEXT,
  
  notes TEXT,
  special_instructions TEXT,
  
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edit Requests (shippers request quote changes)
CREATE TABLE edit_requests (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES shippers(id),
  requested_changes JSONB NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES nts_users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT,
  file_type TEXT,
  file_url TEXT,
  template_id BIGINT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE templates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edit History (audit trail)
CREATE TABLE edit_history (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT REFERENCES quotes(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES auth.users(id),
  changes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📁 Project Structure Changes

### **Current (Messy)**
```
pages/ (Pages Router)
components/ (multiple folders, disorganized)
lib/
```

### **New (Clean)**
```
src/
├── app/                    # App Router (Next.js 14+)
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx      # Dashboard shell with nav
│   │   ├── quotes/
│   │   ├── orders/
│   │   ├── companies/      # Admin: manage companies
│   │   └── settings/
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # Shadcn/UI primitives
│   ├── quotes/             # Quote-specific components
│   ├── orders/             # Order-specific components
│   ├── companies/          # Company management
│   └── shared/             # Shared components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts        # Generated types
│   ├── hooks/
│   ├── utils/
│   └── validations/
└── types/
    └── database.ts
```

---

## 🔄 Migration Steps

### **Phase 1: Database Migration**
1. Create new Supabase project (or use migrations)
2. Run schema creation SQL
3. Migrate existing data:
   - `profiles` → `shippers`
   - `shippingquotes` (status='accepted') → `orders`
   - `shippingquotes` (status!='accepted') → `quotes`
   - Clean up company assignments
4. Set up RLS policies

### **Phase 2: Fresh Next.js Setup**
1. Create new branch: `git checkout -b refactor-2026`
2. Delete old structure (keep .git, .env, README)
3. Initialize fresh Next.js 14+ with App Router
4. Set up TypeScript, Tailwind, Shadcn
5. Generate fresh Supabase types

### **Phase 3: Core Features Rebuild**
Priority order:
1. ✅ Authentication (login/signup)
2. ✅ Quote creation (shippers)
3. ✅ Quote pricing (brokers)
4. ✅ Order acceptance
5. ✅ Company assignment (admins)
6. ⏳ Notifications
7. ⏳ Edit requests
8. ⏳ Document generation

### **Phase 4: Testing & Deployment**
1. Seed test data
2. Test all user flows
3. Deploy to Netlify staging
4. User acceptance testing
5. Merge to main

---

## 🔑 Key Simplifications

### **Authentication**
- **Shippers:** Self-signup → creates company + shipper record
- **NTS Users:** Admin-created only (no signup form)
- **Roles:** Only `admin` and `user` in nts_users.role

### **Quote → Order Flow**
```
1. Shipper creates quote
2. Broker prices quote
3. Shipper accepts quote → Creates order record
4. Broker manages order through delivery
```

### **Company Assignment**
- 1 broker per company (simple FK)
- Multiple shippers per company (FK to companies)
- Admins can reassign brokers

---

## 🗑️ What Gets Deleted

### **Database**
- ❌ All freight-specific tables (boats, freight, etc.)
- ❌ `company_sales_users` junction table
- ❌ Complex RBAC tables
- ❌ Backup/migration tables

### **Code**
- ❌ Pages Router files
- ❌ Complex RBAC middleware
- ❌ Unused component folders
- ❌ Email verification flows (you removed these anyway)
- ❌ Old PWA service worker (rebuild fresh)

---

## 📋 Pre-Migration Checklist

- [ ] Backup production database
- [ ] Export all current data (companies, profiles, quotes)
- [ ] Document any custom business logic to preserve
- [ ] List all active users (for migration)
- [ ] Create new Supabase project (or migration scripts)
- [ ] Set up new Git branch

---

## 🚀 Next Steps

**Ready to proceed?**

1. I'll create a fresh branch
2. Set up new Next.js project with App Router
3. Create database migration scripts
4. Build authentication flows first
5. Incrementally rebuild features

**Estimated Timeline:**
- Database migration: 1-2 hours
- Fresh setup: 2-3 hours  
- Core features: 8-10 hours
- Testing: 2-3 hours

**Total: ~2 days of focused work**

---

**Questions before we start?**
