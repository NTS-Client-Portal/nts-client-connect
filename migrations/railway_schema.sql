-- ============================================================================
-- NTS LOGISTICS - PostgreSQL Schema (Railway)
-- With NextAuth Integration
-- Date: January 13, 2026
-- ============================================================================

-- ============================================================================
-- NextAuth Required Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================================================
-- Application Tables
-- ============================================================================

-- Companies (shipper organizations)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  assigned_broker_id UUID,  -- FK added after nts_users table
  company_size TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shippers (customer users)
CREATE TABLE IF NOT EXISTS shippers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NTS Users (staff/brokers)
CREATE TABLE IF NOT EXISTS nts_users (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for companies.assigned_broker_id
ALTER TABLE companies 
  ADD CONSTRAINT fk_companies_broker 
  FOREIGN KEY (assigned_broker_id) 
  REFERENCES nts_users(id) ON DELETE SET NULL;

-- Quotes (pre-acceptance quote requests)
CREATE TABLE IF NOT EXISTS quotes (
  id BIGSERIAL PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assigned_broker_id UUID REFERENCES nts_users(id) ON DELETE SET NULL,
  
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
  price NUMERIC(10,2),
  carrier_pay NUMERIC(10,2),
  
  -- Dates
  due_date DATE,
  pickup_date DATE,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'priced', 'accepted', 'rejected')),
  
  -- Notes
  notes TEXT,
  special_instructions TEXT,
  
  -- Metadata
  is_complete BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (accepted quotes)
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT UNIQUE REFERENCES quotes(id) ON DELETE SET NULL,
  
  -- User references
  shipper_id UUID NOT NULL REFERENCES shippers(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  assigned_broker_id UUID NOT NULL REFERENCES nts_users(id) ON DELETE RESTRICT,
  
  -- Snapshot of quote data
  origin_city TEXT,
  origin_state TEXT,
  origin_zip TEXT,
  destination_city TEXT,
  destination_state TEXT,
  destination_zip TEXT,
  
  freight_type TEXT,
  shipment_items JSONB,
  
  price NUMERIC(10,2) NOT NULL,
  carrier_pay NUMERIC(10,2),
  deposit NUMERIC(10,2),
  
  due_date DATE,
  pickup_date DATE,
  delivery_date DATE,
  
  -- Order-specific
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

-- Edit Requests
CREATE TABLE IF NOT EXISTS edit_requests (
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
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
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
CREATE TABLE IF NOT EXISTS templates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Edit History
CREATE TABLE IF NOT EXISTS edit_history (
  id BIGSERIAL PRIMARY KEY,
  quote_id BIGINT REFERENCES quotes(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES users(id),
  changes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- NextAuth indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);

-- Shippers indexes
CREATE INDEX IF NOT EXISTS idx_shippers_company_id ON shippers(company_id);
CREATE INDEX IF NOT EXISTS idx_shippers_email ON shippers(email);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_shipper_id ON quotes(shipper_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_assigned_broker_id ON quotes(assigned_broker_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_shipper_id ON orders(shipper_id);
CREATE INDEX IF NOT EXISTS idx_orders_company_id ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_broker_id ON orders(assigned_broker_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_quote_id ON orders(quote_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_assigned_broker_id ON companies(assigned_broker_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shippers_updated_at BEFORE UPDATE ON shippers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nts_users_updated_at BEFORE UPDATE ON nts_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Data (Optional)
-- ============================================================================

-- Create first admin user (change email/password as needed)
-- This will be done via NextAuth signup + manual role assignment

SELECT 'Schema created successfully!' as status;
