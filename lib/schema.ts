// interface.types.ts
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
};
export type Company = Database['public']['Tables']['companies']['Row'];
export type ShippingQuote = Database['public']['Tables']['shippingquotes']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type Invitation = Database['public']['Tables']['invitations']['Row'];
export type ChromeQuotes = Database['public']['Tables']['chrome_quotes']['Row'];
export type Vendor = Database['public']['Tables']['vendors']['Row'];
export type UsageStats = Database['public']['Tables']['usage_stats']['Row'];
export type PurchaseOrder = Database['public']['Tables']['purchase_order']['Row'];