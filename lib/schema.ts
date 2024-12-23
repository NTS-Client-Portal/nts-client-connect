import { Database } from '@/lib/database.types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Freight = Database['public']['Tables']['freight']['Row'];

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  team_role: 'manager' | 'member' | null; // Extend the team_role type
  assigned_sales_user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null; // Add assigned sales user information
};

export type Company = Database['public']['Tables']['companies']['Row'] & {
  assigned_sales_user: string | null; // Add assigned_sales_user field
  assigned_at: string | null; // Add assigned_at field
  company_name: string | null; // Add company_name field
  company_size: string | null; // Add company_size field
  profile_complete: boolean | null; // Add profile_complete field
};

export type NtsUser = Database['public']['Tables']['nts_users']['Row']; // Add NtsUser type

export type ShippingQuote = Database['public']['Tables']['shippingquotes']['Row'];

export type Order = Database['public']['Tables']['orders']['Row'] & {
  quote: ShippingQuote | null; // Add relationship to ShippingQuote
};

export type Notification = Database['public']['Tables']['notifications']['Row'];

export type Document = Database['public']['Tables']['documents']['Row'] & {
  nts_user_id: string | null; // Add nts_user_id field
};

export type Invitation = Database['public']['Tables']['invitations']['Row'];

export type ChromeQuotes = Database['public']['Tables']['chrome_quotes']['Row'];

export type Vendor = Database['public']['Tables']['vendors']['Row'];

export type UsageStats = Database['public']['Tables']['usage_stats']['Row'];

export type PurchaseOrder = Database['public']['Tables']['purchase_order']['Row'];

export type Equipment = {
  id: number;
  year: number | null;
  make: string | null;
  model: string | null;
  operational_condition: boolean | null;
  length: string | null;
  width: string | null;
  height: string | null;
  weight: string | null;
  loading_unloading_requirements: string | null;
  tarping: boolean | null;
  auction: string | null;
  buyer_number: string | null;
  lot_number: string | null;
  user_id: string | null;
  company_id: string | null;
};

export type LtlFtl = {
  id: number;
  load_description: string | null;
  length: string | null;
  height: string | null;
  weight: string | null;
  freight_class: string | null;
  loading_assistance: string | null;
  packaging_type: string | null;
  weight_per_pallet_unit: string | null;
  dock_no_dock: boolean | null;
  user_id: string | null;
  company_id: string | null;
};