export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chrome_quotes: {
        Row: {
          created_at: string | null
          destinationzip: string | null
          email: string | null
          freightdescription: string | null
          height: string | null
          id: number
          length: string | null
          make: string | null
          model: string | null
          name: string | null
          originzip: string | null
          phone: string | null
          quote: number | null
          user_id: string | null
          weight: string | null
          width: string | null
          year: string | null
        }
        Insert: {
          created_at?: string | null
          destinationzip?: string | null
          email?: string | null
          freightdescription?: string | null
          height?: string | null
          id?: number
          length?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          originzip?: string | null
          phone?: string | null
          quote?: number | null
          user_id?: string | null
          weight?: string | null
          width?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string | null
          destinationzip?: string | null
          email?: string | null
          freightdescription?: string | null
          height?: string | null
          id?: number
          length?: string | null
          make?: string | null
          model?: string | null
          name?: string | null
          originzip?: string | null
          phone?: string | null
          quote?: number | null
          user_id?: string | null
          weight?: string | null
          width?: string | null
          year?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          inserted_at: string
          name: string
          size: string | null
        }
        Insert: {
          id?: string
          inserted_at?: string
          name: string
          size?: string | null
        }
        Update: {
          id?: string
          inserted_at?: string
          name?: string
          size?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: number
          is_favorite: boolean | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_favorite?: boolean | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_favorite?: boolean | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      freight: {
        Row: {
          commodity: string | null
          freight_type: string | null
          height: string | null
          height_unit: string | null
          id: number
          inserted_at: string
          inventory_number: string | null
          length: string | null
          length_unit: string | null
          make: string | null
          model: string | null
          pallet_count: string | null
          serial_number: string | null
          user_id: string | null
          weight: string | null
          weight_unit: string | null
          width: string | null
          width_unit: string | null
          year: string | null
        }
        Insert: {
          commodity?: string | null
          freight_type?: string | null
          height?: string | null
          height_unit?: string | null
          id?: number
          inserted_at?: string
          inventory_number?: string | null
          length?: string | null
          length_unit?: string | null
          make?: string | null
          model?: string | null
          pallet_count?: string | null
          serial_number?: string | null
          user_id?: string | null
          weight?: string | null
          weight_unit?: string | null
          width?: string | null
          width_unit?: string | null
          year?: string | null
        }
        Update: {
          commodity?: string | null
          freight_type?: string | null
          height?: string | null
          height_unit?: string | null
          id?: number
          inserted_at?: string
          inventory_number?: string | null
          length?: string | null
          length_unit?: string | null
          make?: string | null
          model?: string | null
          pallet_count?: string | null
          serial_number?: string | null
          user_id?: string | null
          weight?: string | null
          weight_unit?: string | null
          width?: string | null
          width_unit?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freight_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          token: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          token: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          is_read: boolean | null
          message: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_read?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_read?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null;
          created_at: string | null;
          destination_street: string | null;
          earliest_pickup_date: string | null;
          id: number;
          is_archived: boolean | null;
          latest_pickup_date: string | null;
          notes: string | null;
          origin_street: string | null;
          quote_id: number | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          cancellation_reason?: string | null;
          created_at?: string | null;
          destination_street?: string | null;
          earliest_pickup_date?: string | null;
          id?: number;
          is_archived?: boolean | null;
          latest_pickup_date?: string | null;
          notes?: string | null;
          origin_street?: string | null;
          quote_id?: number | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          cancellation_reason?: string | null;
          created_at?: string | null;
          destination_street?: string | null;
          earliest_pickup_date?: string | null;
          id?: number;
          is_archived?: boolean | null;
          latest_pickup_date?: string | null;
          notes?: string | null;
          origin_street?: string | null;
          quote_id?: number | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_orders_shippingquotes";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "shippingquotes";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          company_id: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          inserted_at: string;
          last_name: string | null;
          role: string | null;
          company_name: string | null;
          company_size: string | null;
          phone_number: string | null;
          address: string | null;
          profile_picture: string | null;
          email_notifications: boolean | null;
          profile_complete: boolean | null;
        };
        Insert: {
          company_id?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          inserted_at?: string;
          last_name?: string | null;
          role?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          phone_number?: string | null;
          address?: string | null;
          profile_picture?: string | null;
          email_notifications?: boolean | null;
          profile_complete?: boolean | null;
        };
        Update: {
          company_id?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          inserted_at?: string;
          last_name?: string | null;
          role?: string | null;
          company_name?: string | null;
          company_size?: string | null;
          phone_number?: string | null;
          address?: string | null;
          profile_picture?: string | null;
          email_notifications?: boolean | null;
          profile_complete?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      shippingquotes: {
        Row: {
          commodity: string | null;
          destination_city: string | null;
          destination_state: string | null;
          destination_street: string | null;
          destination_zip: string | null;
          due_date: string | null;
          email: string | null;
          first_name: string | null;
          height: string | null;
          id: number;
          inserted_at: string;
          last_name: string | null;
          length: string | null;
          make: string | null;
          model: string | null;
          pallet_count: string | null;
          price: number | null;
          user_id: string | null;
          weight: string | null;
          width: string | null;
          year: string | null;
          is_complete: boolean | null;
          is_archived: boolean | null;
          origin_zip: string | null;
          origin_city: string | null; // Add origin_city
          origin_state: string | null; // Add origin_state
          origin_address: string | null; // Add origin_address
        };
        Insert: {
          commodity?: string | null;
          destination_city?: string | null;
          destination_state?: string | null;
          destination_street?: string | null;
          destination_zip?: string | null;
          due_date?: string | null;
          email?: string | null;
          first_name?: string | null;
          height?: string | null;
          id?: number;
          inserted_at?: string;
          last_name?: string | null;
          length?: string | null;
          make?: string | null;
          model?: string | null;
          pallet_count?: string | null;
          price?: number | null;
          user_id?: string | null;
          weight?: string | null;
          width?: string | null;
          year?: string | null;
          is_complete?: boolean | null;
          is_archived?: boolean | null;
          origin_zip?: string | null;
          origin_city?: string | null; // Add origin_city
          origin_state?: string | null; // Add origin_state
          origin_address?: string | null; // Add origin_address
        };
        Update: {
          commodity?: string | null;
          destination_city?: string | null;
          destination_state?: string | null;
          destination_street?: string | null;
          destination_zip?: string | null;
          due_date?: string | null;
          email?: string | null;
          first_name?: string | null;
          height?: string | null;
          id?: number;
          inserted_at?: string;
          last_name?: string | null;
          length?: string | null;
          make?: string | null;
          model?: string | null;
          pallet_count?: string | null;
          price?: number | null;
          user_id?: string | null;
          weight?: string | null;
          width?: string | null;
          year?: string | null;
          is_complete?: boolean | null;
          is_archived?: boolean | null;
          origin_zip?: string | null;
          origin_city?: string | null; // Add origin_city
          origin_state?: string | null; // Add origin_state
          origin_address?: string | null; // Add origin_address
        };
        Relationships: [
          {
            foreignKeyName: "shippingquotes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      usage_stats: {
        Row: {
          active_time: number
          created_at: string | null
          id: number
          login_count: number
          user_id: string | null
        }
        Insert: {
          active_time: number
          created_at?: string | null
          id?: number
          login_count: number
          user_id?: string | null
        }
        Update: {
          active_time?: number
          created_at?: string | null
          id?: number
          login_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
      purchase_order: {
        Row: {
          id: number;
          createddate: string | null;
          expecteddate: string | null;
          order_description: string | null;
          ponumber: string | null;
          status: string | null;
          user_id: string | null;
          vendorname: string | null;
          vendornumber: string | null;
        };
        Insert: {
          id?: number;
          createddate?: string | null;
          expecteddate?: string | null;
          order_description?: string | null;
          ponumber?: string | null;
          status?: string | null;
          user_id?: string | null;
          vendorname?: string | null;
          vendornumber?: string | null;
        };
        Update: {
          id?: number;
          createddate?: string | null;
          expecteddate?: string | null;
          order_description?: string | null;
          ponumber?: string | null;
          status?: string | null;
          user_id?: string | null;
          vendorname?: string | null;
          vendornumber?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_order_vendornumber_fkey";
            columns: ["vendornumber"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["vendornumber"];
          }
        ];
      };
      vendors: {
        Row: {
          businesscity: string | null
          businessstate: string | null
          businessstreet: string | null
          email: string | null
          id: number
          phone: string | null
          vendorname: string | null
          vendornumber: string
        }
        Insert: {
          businesscity?: string | null
          businessstate?: string | null
          businessstreet?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          vendorname?: string | null
          vendornumber: string
        }
        Update: {
          businesscity?: string | null
          businessstate?: string | null
          businessstreet?: string | null
          email?: string | null
          id?: number
          phone?: string | null
          vendorname?: string | null
          vendornumber?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never


export type Freight = Database['public']['Tables']['freight']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
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