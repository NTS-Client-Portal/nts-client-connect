-- Step 1: Drop all existing tables
DROP TABLE IF EXISTS public.freight CASCADE;
DROP TABLE IF EXISTS public.shippingquotes CASCADE;
DROP TABLE IF EXISTS public.maintenance CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.nts_users CASCADE;
DROP TABLE IF EXISTS public.company_sales_users CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.usage_stats CASCADE;

-- Step 2: Recreate the tables with the specified schema

-- Table: freight
CREATE TABLE public.freight (
    id SERIAL PRIMARY KEY,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_complete BOOLEAN,
    freight_type TEXT,
    make TEXT,
    model TEXT,
    year TEXT,
    pallets TEXT,
    serial_number TEXT,
    dimensions TEXT,
    freight_id TEXT,
    freight_class TEXT,
    status TEXT,
    user_id UUID REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    in_progress BOOLEAN,
    reminder_time TIMESTAMP WITH TIME ZONE,
    year_amount TEXT,
    pallet_count TEXT,
    commodity TEXT,
    length TEXT,
    length_unit TEXT,
    width TEXT,
    width_unit TEXT,
    height TEXT,
    height_unit TEXT,
    weight TEXT,
    weight_unit TEXT,
    inventory_number TEXT
);

-- Table: shippingquotes
CREATE TABLE public.shippingquotes (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_complete BOOLEAN,
    origin_city TEXT,
    origin_state TEXT,
    origin_zip TEXT,
    origin_street TEXT,
    destination_city TEXT,
    destination_state TEXT,
    destination_zip TEXT,
    destination_street TEXT,
    user_id UUID REFERENCES auth.users(id),
    quote_id TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    year_amount TEXT,
    make TEXT,
    model TEXT,
    pallet_count TEXT,
    commodity TEXT,
    length TEXT,
    width TEXT,
    height TEXT,
    weight TEXT,
    price NUMERIC,
    is_archived BOOLEAN
);

-- Table: maintenance
CREATE TABLE public.maintenance (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    freight_id INTEGER REFERENCES public.freight(id),
    urgency TEXT,
    notes TEXT,
    need_parts BOOLEAN,
    part TEXT,
    schedule_date TIMESTAMP WITH TIME ZONE,
    maintenance_crew TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    make TEXT,
    model TEXT,
    year TEXT,
    year_amount TEXT,
    pallets TEXT,
    serial_number TEXT,
    dimensions TEXT,
    commodity TEXT,
    inventory_number TEXT
);

-- Table: companies
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    company_size TEXT
);

-- Table: nts_users (Sales reps, admins, support staff)
CREATE TABLE public.nts_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    profile_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'sales_rep',
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    profile_picture TEXT,
    address TEXT,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    email_notifications BOOLEAN DEFAULT false,
    extension TEXT,
    office TEXT
);

-- Junction table: company_sales_users (Many-to-many relationship)
CREATE TABLE public.company_sales_users (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sales_user_id UUID NOT NULL REFERENCES public.nts_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES public.nts_users(id),
    UNIQUE(company_id, sales_user_id)
);

-- Table: shippingquotes (Updated with company_id)
CREATE TABLE public.shippingquotes (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_complete BOOLEAN DEFAULT false,
    origin_city TEXT,
    origin_state TEXT,
    origin_zip TEXT,
    origin_street TEXT,
    destination_city TEXT,
    destination_state TEXT,
    destination_zip TEXT,
    destination_street TEXT,
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id), -- CRITICAL: For RLS
    quote_id TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    year_amount TEXT,
    make TEXT,
    model TEXT,
    pallet_count TEXT,
    commodity TEXT,
    length TEXT,
    width TEXT,
    height TEXT,
    weight TEXT,
    price NUMERIC,
    is_archived BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Quote',
    assigned_sales_user UUID REFERENCES public.nts_users(id),
    freight_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Additional freight-specific fields from database.types.ts
    year TEXT,
    auto_year TEXT,
    auto_make TEXT,
    auto_model TEXT,
    length_unit TEXT,
    width_unit TEXT,
    height_unit TEXT,
    weight_unit TEXT,
    operational_condition BOOLEAN,
    loading_unloading_requirements TEXT,
    tarping BOOLEAN,
    auction TEXT,
    buyer_number TEXT,
    lot_number TEXT,
    goods_value TEXT,
    vin TEXT,
    packaging_type TEXT,
    load_description TEXT,
    container_length INTEGER,
    container_type TEXT,
    contents_description TEXT,
    earliest_pickup_date TIMESTAMP WITH TIME ZONE,
    latest_pickup_date TIMESTAMP WITH TIME ZONE,
    origin_name TEXT,
    origin_phone TEXT,
    destination_name TEXT,
    destination_phone TEXT,
    origin_address TEXT,
    save_to_inventory BOOLEAN DEFAULT false
);

-- Table: orders (Updated to match shippingquotes structure)
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES public.shippingquotes(id),
    user_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES public.companies(id), -- CRITICAL: For RLS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'Order',
    is_archived BOOLEAN DEFAULT false,
    earliest_pickup_date TIMESTAMP WITH TIME ZONE,
    latest_pickup_date TIMESTAMP WITH TIME ZONE,
    origin_street TEXT,
    destination_street TEXT,
    cancellation_reason TEXT,
    notes TEXT,
    assigned_sales_user UUID REFERENCES public.nts_users(id),
    -- Copy all relevant fields from shippingquotes for orders
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    origin_city TEXT,
    origin_state TEXT,
    origin_zip TEXT,
    destination_city TEXT,
    destination_state TEXT,
    destination_zip TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    make TEXT,
    model TEXT,
    year TEXT,
    commodity TEXT,
    freight_type TEXT,
    length TEXT,
    width TEXT,
    height TEXT,
    weight TEXT,
    price NUMERIC,
    origin_name TEXT,
    origin_phone TEXT,
    destination_name TEXT,
    destination_phone TEXT,
    origin_address TEXT
);

-- Table: profiles (Updated)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    role TEXT NOT NULL DEFAULT 'shipper',
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    company_size TEXT,
    company_id UUID REFERENCES public.companies(id), -- CRITICAL: For RLS
    profile_picture TEXT,
    address TEXT,
    phone_number TEXT,
    email_notifications BOOLEAN DEFAULT false,
    profile_complete BOOLEAN DEFAULT false,
    team_role TEXT, -- For team managers
    industry TEXT,
    assigned_sales_user UUID REFERENCES public.nts_users(id) -- Legacy field, use company_sales_users instead
);

-- Table: notifications (Updated for both user types)
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id), -- For shippers
    nts_user_id UUID REFERENCES public.nts_users(id), -- For NTS users
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    type TEXT, -- notification type
    ticket_id INTEGER -- reference to support tickets if applicable
);

-- Table: documents
CREATE TABLE public.documents (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: usage_stats
CREATE TABLE public.usage_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    login_count INTEGER NOT NULL,
    active_time INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);