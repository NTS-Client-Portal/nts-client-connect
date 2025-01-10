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
      boats: {
        Row: {
          beam: string | null
          cradle: boolean | null
          height: string | null
          id: number
          length: string | null
          shipping_quote_id: number | null
          trailer: boolean | null
          type: string | null
          weight: string | null
        }
        Insert: {
          beam?: string | null
          cradle?: boolean | null
          height?: string | null
          id?: never
          length?: string | null
          shipping_quote_id?: number | null
          trailer?: boolean | null
          type?: string | null
          weight?: string | null
        }
        Update: {
          beam?: string | null
          cradle?: boolean | null
          height?: string | null
          id?: never
          length?: string | null
          shipping_quote_id?: number | null
          trailer?: boolean | null
          type?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boats_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
        ]
      }
      cd_data: {
        Row: {
          additional_info: string | null
          available_date: string
          desired_delivery_date: string | null
          destination_city: string
          destination_geocode_latitude: number | null
          destination_geocode_longitude: number | null
          destination_metro_area: string | null
          destination_state: string
          destination_zip: string
          distance: number | null
          external_id: string | null
          has_in_op_vehicle: boolean
          id: string
          origin_city: string
          origin_geocode_latitude: number | null
          origin_geocode_longitude: number | null
          origin_metro_area: string | null
          origin_state: string
          origin_zip: string
          partner_reference_id: string | null
          price_balance_amount: number | null
          price_balance_balance_payment_method:
            | Database["public"]["Enums"]["balance_payment_method_enum"]
            | null
          price_balance_balance_payment_terms_begin_on:
            | Database["public"]["Enums"]["balance_payment_terms_begin_on_enum"]
            | null
          price_balance_payment_time:
            | Database["public"]["Enums"]["balance_payment_time_enum"]
            | null
          price_cod_amount: number
          price_cod_payment_location: Database["public"]["Enums"]["cod_payment_location_enum"]
          price_cod_payment_method: Database["public"]["Enums"]["cod_payment_method_enum"]
          price_total: number
          shipper_id: string
          shipper_order_id: string | null
          shippingquote_id: number | null
          trailer_type: Database["public"]["Enums"]["trailer_type_enum"]
        }
        Insert: {
          additional_info?: string | null
          available_date: string
          desired_delivery_date?: string | null
          destination_city: string
          destination_geocode_latitude?: number | null
          destination_geocode_longitude?: number | null
          destination_metro_area?: string | null
          destination_state: string
          destination_zip: string
          distance?: number | null
          external_id?: string | null
          has_in_op_vehicle: boolean
          id?: string
          origin_city: string
          origin_geocode_latitude?: number | null
          origin_geocode_longitude?: number | null
          origin_metro_area?: string | null
          origin_state: string
          origin_zip: string
          partner_reference_id?: string | null
          price_balance_amount?: number | null
          price_balance_balance_payment_method?:
            | Database["public"]["Enums"]["balance_payment_method_enum"]
            | null
          price_balance_balance_payment_terms_begin_on?:
            | Database["public"]["Enums"]["balance_payment_terms_begin_on_enum"]
            | null
          price_balance_payment_time?:
            | Database["public"]["Enums"]["balance_payment_time_enum"]
            | null
          price_cod_amount: number
          price_cod_payment_location: Database["public"]["Enums"]["cod_payment_location_enum"]
          price_cod_payment_method: Database["public"]["Enums"]["cod_payment_method_enum"]
          price_total: number
          shipper_id: string
          shipper_order_id?: string | null
          shippingquote_id?: number | null
          trailer_type: Database["public"]["Enums"]["trailer_type_enum"]
        }
        Update: {
          additional_info?: string | null
          available_date?: string
          desired_delivery_date?: string | null
          destination_city?: string
          destination_geocode_latitude?: number | null
          destination_geocode_longitude?: number | null
          destination_metro_area?: string | null
          destination_state?: string
          destination_zip?: string
          distance?: number | null
          external_id?: string | null
          has_in_op_vehicle?: boolean
          id?: string
          origin_city?: string
          origin_geocode_latitude?: number | null
          origin_geocode_longitude?: number | null
          origin_metro_area?: string | null
          origin_state?: string
          origin_zip?: string
          partner_reference_id?: string | null
          price_balance_amount?: number | null
          price_balance_balance_payment_method?:
            | Database["public"]["Enums"]["balance_payment_method_enum"]
            | null
          price_balance_balance_payment_terms_begin_on?:
            | Database["public"]["Enums"]["balance_payment_terms_begin_on_enum"]
            | null
          price_balance_payment_time?:
            | Database["public"]["Enums"]["balance_payment_time_enum"]
            | null
          price_cod_amount?: number
          price_cod_payment_location?: Database["public"]["Enums"]["cod_payment_location_enum"]
          price_cod_payment_method?: Database["public"]["Enums"]["cod_payment_method_enum"]
          price_total?: number
          shipper_id?: string
          shipper_order_id?: string | null
          shippingquote_id?: number | null
          trailer_type?: Database["public"]["Enums"]["trailer_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "cd_data_shippingquote_id_fkey"
            columns: ["shippingquote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_requests: {
        Row: {
          accepted: boolean | null
          broker_id: string | null
          id: number
          priority: string | null
          request_time: string | null
          session: string
          shipper_id: string | null
          topic: string
        }
        Insert: {
          accepted?: boolean | null
          broker_id?: string | null
          id?: number
          priority?: string | null
          request_time?: string | null
          session: string
          shipper_id?: string | null
          topic: string
        }
        Update: {
          accepted?: boolean | null
          broker_id?: string | null
          id?: number
          priority?: string | null
          request_time?: string | null
          session?: string
          shipper_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_requests_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "nts_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_requests_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "chrome_quotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          assigned_at: string | null
          assigned_sales_user: string | null
          company_name: string | null
          company_size: string | null
          id: string
          industry: string | null
          name: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_sales_user?: string | null
          company_name?: string | null
          company_size?: string | null
          id: string
          industry?: string | null
          name: string
        }
        Update: {
          assigned_at?: string | null
          assigned_sales_user?: string | null
          company_name?: string | null
          company_size?: string | null
          id?: string
          industry?: string | null
          name?: string
        }
        Relationships: []
      }
      company_sales_users: {
        Row: {
          company_id: string | null
          id: string
          sales_user_id: string | null
        }
        Insert: {
          company_id?: string | null
          id?: string
          sales_user_id?: string | null
        }
        Update: {
          company_id?: string | null
          id?: string
          sales_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_sales_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_sales_users_sales_user_id_fkey"
            columns: ["sales_user_id"]
            isOneToOne: false
            referencedRelation: "nts_users"
            referencedColumns: ["id"]
          },
        ]
      }
      containers: {
        Row: {
          container_length: number | null
          container_type: string | null
          contents_description: string | null
          destination_surface_type: string | null
          destination_type: boolean | null
          goods_value: string | null
          id: number
          is_loaded: boolean | null
          loading_by: boolean | null
          origin_surface_type: string | null
          origin_type: boolean | null
          shipping_quote_id: number | null
          unloading_by: boolean | null
        }
        Insert: {
          container_length?: number | null
          container_type?: string | null
          contents_description?: string | null
          destination_surface_type?: string | null
          destination_type?: boolean | null
          goods_value?: string | null
          id?: number
          is_loaded?: boolean | null
          loading_by?: boolean | null
          origin_surface_type?: string | null
          origin_type?: boolean | null
          shipping_quote_id?: number | null
          unloading_by?: boolean | null
        }
        Update: {
          container_length?: number | null
          container_type?: string | null
          contents_description?: string | null
          destination_surface_type?: string | null
          destination_type?: boolean | null
          goods_value?: string | null
          id?: number
          is_loaded?: boolean | null
          loading_by?: boolean | null
          origin_surface_type?: string | null
          origin_type?: boolean | null
          shipping_quote_id?: number | null
          unloading_by?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "containers_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: number
          is_favorite: boolean | null
          nts_user_id: string | null
          template_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_favorite?: boolean | null
          nts_user_id?: string | null
          template_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_favorite?: boolean | null
          nts_user_id?: string | null
          template_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_nts_user_id"
            columns: ["nts_user_id"]
            isOneToOne: false
            referencedRelation: "nts_users"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_history: {
        Row: {
          changes: string | null
          company_id: string | null
          edited_at: string | null
          edited_by: string
          id: number
          quote_id: number
        }
        Insert: {
          changes?: string | null
          company_id?: string | null
          edited_at?: string | null
          edited_by: string
          id?: number
          quote_id: number
        }
        Update: {
          changes?: string | null
          company_id?: string | null
          edited_at?: string | null
          edited_by?: string
          id?: number
          quote_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "edit_history_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          auction: string | null
          buyer_number: string | null
          company_id: string | null
          height: string | null
          id: number
          inserted_at: string | null
          length: string | null
          loading_unloading_requirements: string | null
          lot_number: string | null
          make: string | null
          model: string | null
          operational_condition: boolean | null
          profile_id: string | null
          shipping_quote_id: number | null
          tarping: boolean | null
          weight: string | null
          width: string | null
          year: number | null
        }
        Insert: {
          auction?: string | null
          buyer_number?: string | null
          company_id?: string | null
          height?: string | null
          id?: number
          inserted_at?: string | null
          length?: string | null
          loading_unloading_requirements?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          operational_condition?: boolean | null
          profile_id?: string | null
          shipping_quote_id?: number | null
          tarping?: boolean | null
          weight?: string | null
          width?: string | null
          year?: number | null
        }
        Update: {
          auction?: string | null
          buyer_number?: string | null
          company_id?: string | null
          height?: string | null
          id?: number
          inserted_at?: string | null
          length?: string | null
          loading_unloading_requirements?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          operational_condition?: boolean | null
          profile_id?: string | null
          shipping_quote_id?: number | null
          tarping?: boolean | null
          weight?: string | null
          width?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
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
          inserted_at: string | null
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
          inserted_at?: string | null
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
          inserted_at?: string | null
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
      global_settings: {
        Row: {
          id: number
          key: string
          value: boolean
        }
        Insert: {
          id?: number
          key: string
          value: boolean
        }
        Update: {
          id?: number
          key?: string
          value?: boolean
        }
        Relationships: []
      }
      invitations: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          team_role: string | null
          token: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          id: string
          invited_by?: string | null
          team_role?: string | null
          token: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          team_role?: string | null
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
      lanes_inventory: {
        Row: {
          company_id: string
          destination_address: string
          destination_city: string
          destination_state: string
          destination_zip: string
          id: string
          notes: string | null
          origin_address: string
          origin_city: string
          origin_state: string
          origin_zip: string
          user_id: string
        }
        Insert: {
          company_id: string
          destination_address: string
          destination_city: string
          destination_state: string
          destination_zip: string
          id: string
          notes?: string | null
          origin_address: string
          origin_city: string
          origin_state: string
          origin_zip: string
          user_id: string
        }
        Update: {
          company_id?: string
          destination_address?: string
          destination_city?: string
          destination_state?: string
          destination_zip?: string
          id?: string
          notes?: string | null
          origin_address?: string
          origin_city?: string
          origin_state?: string
          origin_zip?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_id"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ltl_ftl: {
        Row: {
          company_id: string | null
          dock_no_dock: boolean | null
          freight_class: string | null
          height: string | null
          id: number
          length: string | null
          load_description: string | null
          loading_assistance: string | null
          packaging_type: string | null
          shipping_quote_id: number | null
          user_id: string | null
          weight: string | null
          weight_per_pallet_unit: string | null
        }
        Insert: {
          company_id?: string | null
          dock_no_dock?: boolean | null
          freight_class?: string | null
          height?: string | null
          id?: number
          length?: string | null
          load_description?: string | null
          loading_assistance?: string | null
          packaging_type?: string | null
          shipping_quote_id?: number | null
          user_id?: string | null
          weight?: string | null
          weight_per_pallet_unit?: string | null
        }
        Update: {
          company_id?: string | null
          dock_no_dock?: boolean | null
          freight_class?: string | null
          height?: string | null
          id?: number
          length?: string | null
          load_description?: string | null
          loading_assistance?: string | null
          packaging_type?: string | null
          shipping_quote_id?: number | null
          user_id?: string | null
          weight?: string | null
          weight_per_pallet_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ltl_ftl_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltl_ftl_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ltl_ftl_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          broker_id: string | null
          id: number
          message_body: string
          message_time: string | null
          shipper_id: string | null
          user_type: string | null
        }
        Insert: {
          broker_id?: string | null
          id?: number
          message_body: string
          message_time?: string | null
          shipper_id?: string | null
          user_type?: string | null
        }
        Update: {
          broker_id?: string | null
          id?: number
          message_body?: string
          message_time?: string | null
          shipper_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "nts_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_shipper_id_fkey"
            columns: ["shipper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          document_id: number | null
          id: number
          is_read: boolean | null
          message: string | null
          nts_user_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: number | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          nts_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: number | null
          id?: number
          is_read?: boolean | null
          message?: string | null
          nts_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_nts_user_id_fkey"
            columns: ["nts_user_id"]
            isOneToOne: false
            referencedRelation: "nts_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nts_users: {
        Row: {
          address: string | null
          auth_uid: string | null
          company_id: string | null
          email: string
          email_notifications: boolean | null
          extension: string | null
          first_name: string | null
          id: string
          inserted_at: string | null
          last_name: string | null
          office: string | null
          phone_number: string | null
          profile_id: string | null
          profile_picture: string | null
          role: string
        }
        Insert: {
          address?: string | null
          auth_uid?: string | null
          company_id?: string | null
          email: string
          email_notifications?: boolean | null
          extension?: string | null
          first_name?: string | null
          id: string
          inserted_at?: string | null
          last_name?: string | null
          office?: string | null
          phone_number?: string | null
          profile_id?: string | null
          profile_picture?: string | null
          role: string
        }
        Update: {
          address?: string | null
          auth_uid?: string | null
          company_id?: string | null
          email?: string
          email_notifications?: boolean | null
          extension?: string | null
          first_name?: string | null
          id?: string
          inserted_at?: string | null
          last_name?: string | null
          office?: string | null
          phone_number?: string | null
          profile_id?: string | null
          profile_picture?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "nts_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nts_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_sales_user: string | null
          auction: string | null
          beam: string | null
          buyer_number: string | null
          class_type: string | null
          commodity: string | null
          company_id: string | null
          container_length: number | null
          container_type: string | null
          contents_description: string | null
          cradle: boolean | null
          created_at: string | null
          destination_city: string | null
          destination_state: string | null
          destination_street: string | null
          destination_surface_type: string | null
          destination_type: boolean | null
          destination_type_description: string | null
          destination_zip: string | null
          dock_no_dock: boolean | null
          driveaway_or_towaway: boolean | null
          due_date: string | null
          earliest_pickup_date: string | null
          email: string | null
          first_name: string | null
          freight_class: string | null
          freight_type: string | null
          goods_value: string | null
          height: string | null
          id: number
          inserted_at: string | null
          is_archived: boolean | null
          is_complete: boolean | null
          is_loaded: boolean | null
          last_name: string | null
          latest_pickup_date: string | null
          length: string | null
          load_description: string | null
          loading_assistance: string | null
          loading_by: boolean | null
          loading_unloading_requirements: string | null
          lot_number: string | null
          make: string | null
          model: string | null
          motorized_or_trailer: string | null
          notes: string | null
          operational_condition: boolean | null
          origin_address: string | null
          origin_city: string | null
          origin_state: string | null
          origin_street: string | null
          origin_surface_type: string | null
          origin_type: boolean | null
          origin_type_description: string | null
          origin_zip: string | null
          packaging_type: string | null
          pallet_count: string | null
          price: number | null
          quote_id: number | null
          roadworthy: boolean | null
          save_to_inventory: boolean | null
          shipment_items: Json | null
          status: string | null
          tarping: boolean | null
          trailer: boolean | null
          type: string | null
          unloading_by: boolean | null
          updated_at: string | null
          user_id: string | null
          vin: string | null
          weight: string | null
          weight_per_pallet_unit: string | null
          width: string | null
          year: string | null
        }
        Insert: {
          assigned_sales_user?: string | null
          auction?: string | null
          beam?: string | null
          buyer_number?: string | null
          class_type?: string | null
          commodity?: string | null
          company_id?: string | null
          container_length?: number | null
          container_type?: string | null
          contents_description?: string | null
          cradle?: boolean | null
          created_at?: string | null
          destination_city?: string | null
          destination_state?: string | null
          destination_street?: string | null
          destination_surface_type?: string | null
          destination_type?: boolean | null
          destination_type_description?: string | null
          destination_zip?: string | null
          dock_no_dock?: boolean | null
          driveaway_or_towaway?: boolean | null
          due_date?: string | null
          earliest_pickup_date?: string | null
          email?: string | null
          first_name?: string | null
          freight_class?: string | null
          freight_type?: string | null
          goods_value?: string | null
          height?: string | null
          id?: number
          inserted_at?: string | null
          is_archived?: boolean | null
          is_complete?: boolean | null
          is_loaded?: boolean | null
          last_name?: string | null
          latest_pickup_date?: string | null
          length?: string | null
          load_description?: string | null
          loading_assistance?: string | null
          loading_by?: boolean | null
          loading_unloading_requirements?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          motorized_or_trailer?: string | null
          notes?: string | null
          operational_condition?: boolean | null
          origin_address?: string | null
          origin_city?: string | null
          origin_state?: string | null
          origin_street?: string | null
          origin_surface_type?: string | null
          origin_type?: boolean | null
          origin_type_description?: string | null
          origin_zip?: string | null
          packaging_type?: string | null
          pallet_count?: string | null
          price?: number | null
          quote_id?: number | null
          roadworthy?: boolean | null
          save_to_inventory?: boolean | null
          shipment_items?: Json | null
          status?: string | null
          tarping?: boolean | null
          trailer?: boolean | null
          type?: string | null
          unloading_by?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          weight?: string | null
          weight_per_pallet_unit?: string | null
          width?: string | null
          year?: string | null
        }
        Update: {
          assigned_sales_user?: string | null
          auction?: string | null
          beam?: string | null
          buyer_number?: string | null
          class_type?: string | null
          commodity?: string | null
          company_id?: string | null
          container_length?: number | null
          container_type?: string | null
          contents_description?: string | null
          cradle?: boolean | null
          created_at?: string | null
          destination_city?: string | null
          destination_state?: string | null
          destination_street?: string | null
          destination_surface_type?: string | null
          destination_type?: boolean | null
          destination_type_description?: string | null
          destination_zip?: string | null
          dock_no_dock?: boolean | null
          driveaway_or_towaway?: boolean | null
          due_date?: string | null
          earliest_pickup_date?: string | null
          email?: string | null
          first_name?: string | null
          freight_class?: string | null
          freight_type?: string | null
          goods_value?: string | null
          height?: string | null
          id?: number
          inserted_at?: string | null
          is_archived?: boolean | null
          is_complete?: boolean | null
          is_loaded?: boolean | null
          last_name?: string | null
          latest_pickup_date?: string | null
          length?: string | null
          load_description?: string | null
          loading_assistance?: string | null
          loading_by?: boolean | null
          loading_unloading_requirements?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          motorized_or_trailer?: string | null
          notes?: string | null
          operational_condition?: boolean | null
          origin_address?: string | null
          origin_city?: string | null
          origin_state?: string | null
          origin_street?: string | null
          origin_surface_type?: string | null
          origin_type?: boolean | null
          origin_type_description?: string | null
          origin_zip?: string | null
          packaging_type?: string | null
          pallet_count?: string | null
          price?: number | null
          quote_id?: number | null
          roadworthy?: boolean | null
          save_to_inventory?: boolean | null
          shipment_items?: Json | null
          status?: string | null
          tarping?: boolean | null
          trailer?: boolean | null
          type?: string | null
          unloading_by?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          weight?: string | null
          weight_per_pallet_unit?: string | null
          width?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_shippingquotes"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_pictures: {
        Row: {
          id: number
          picture_url: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          id?: number
          picture_url: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          id?: number
          picture_url?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          assigned_sales_user: string | null
          company_id: string | null
          company_name: string | null
          company_size: string | null
          email: string
          email_notifications: boolean | null
          first_name: string | null
          id: string
          industry: string | null
          inserted_at: string | null
          last_name: string | null
          phone_number: string | null
          profile_complete: boolean | null
          profile_picture: string | null
          team_role: string | null
        }
        Insert: {
          address?: string | null
          assigned_sales_user?: string | null
          company_id?: string | null
          company_name?: string | null
          company_size?: string | null
          email: string
          email_notifications?: boolean | null
          first_name?: string | null
          id: string
          industry?: string | null
          inserted_at?: string | null
          last_name?: string | null
          phone_number?: string | null
          profile_complete?: boolean | null
          profile_picture?: string | null
          team_role?: string | null
        }
        Update: {
          address?: string | null
          assigned_sales_user?: string | null
          company_id?: string | null
          company_name?: string | null
          company_size?: string | null
          email?: string
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          industry?: string | null
          inserted_at?: string | null
          last_name?: string | null
          phone_number?: string | null
          profile_complete?: boolean | null
          profile_picture?: string | null
          team_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order: {
        Row: {
          createddate: string | null
          expecteddate: string | null
          id: number
          order_description: string | null
          ponumber: string | null
          status: string | null
          user_id: string | null
          vendorname: string | null
          vendornumber: string | null
        }
        Insert: {
          createddate?: string | null
          expecteddate?: string | null
          id?: number
          order_description?: string | null
          ponumber?: string | null
          status?: string | null
          user_id?: string | null
          vendorname?: string | null
          vendornumber?: string | null
        }
        Update: {
          createddate?: string | null
          expecteddate?: string | null
          id?: number
          order_description?: string | null
          ponumber?: string | null
          status?: string | null
          user_id?: string | null
          vendorname?: string | null
          vendornumber?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_vendornumber"
            columns: ["vendornumber"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendornumber"]
          },
          {
            foreignKeyName: "purchase_order_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rv_trailers: {
        Row: {
          class_type: string | null
          id: number
          make: string | null
          model: string | null
          motorized_or_trailer: string | null
          roadworthy: boolean | null
          shipping_quote_id: number | null
          vin: string | null
          year: number | null
        }
        Insert: {
          class_type?: string | null
          id?: number
          make?: string | null
          model?: string | null
          motorized_or_trailer?: string | null
          roadworthy?: boolean | null
          shipping_quote_id?: number | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          class_type?: string | null
          id?: number
          make?: string | null
          model?: string | null
          motorized_or_trailer?: string | null
          roadworthy?: boolean | null
          shipping_quote_id?: number | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rv_trailers_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
        ]
      }
      semi_trucks: {
        Row: {
          driveaway_or_towaway: boolean | null
          height: string | null
          id: number
          length: string | null
          make: string | null
          model: string | null
          shipping_quote_id: number | null
          vin: string | null
          weight: string | null
          width: string | null
          year: number | null
        }
        Insert: {
          driveaway_or_towaway?: boolean | null
          height?: string | null
          id?: number
          length?: string | null
          make?: string | null
          model?: string | null
          shipping_quote_id?: number | null
          vin?: string | null
          weight?: string | null
          width?: string | null
          year?: number | null
        }
        Update: {
          driveaway_or_towaway?: boolean | null
          height?: string | null
          id?: number
          length?: string | null
          make?: string | null
          model?: string | null
          shipping_quote_id?: number | null
          vin?: string | null
          weight?: string | null
          width?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "semi_trucks_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shippingquotes"
            referencedColumns: ["id"]
          },
        ]
      }
      shippingquotes: {
        Row: {
          assigned_sales_user: string | null
          auction: string | null
          beam: string | null
          brokers_status: string | null
          buyer_number: string | null
          carrier_pay: number | null
          class_type: string | null
          commodity: string | null
          company_id: string | null
          container_length: number | null
          container_type: string | null
          contents_description: string | null
          cradle: boolean | null
          created_at: string | null
          deposit: number | null
          destination_city: string | null
          destination_name: string | null
          destination_phone: string | null
          destination_state: string | null
          destination_street: string | null
          destination_surface_type: string | null
          destination_type: boolean | null
          destination_type_description: string | null
          destination_zip: string | null
          dock_no_dock: boolean | null
          driveaway_or_towaway: boolean | null
          due_date: string | null
          earliest_pickup_date: string | null
          email: string | null
          first_name: string | null
          freight_class: string | null
          freight_type: string | null
          goods_value: string | null
          height: string | null
          height_unit: string | null
          id: number
          inserted_at: string | null
          is_archived: boolean | null
          is_complete: boolean | null
          is_loaded: boolean | null
          last_name: string | null
          latest_pickup_date: string | null
          length: string | null
          length_unit: string | null
          load_description: string | null
          loading_assistance: string | null
          loading_by: boolean | null
          loading_unloading_requirements: string | null
          lot_number: string | null
          make: string | null
          model: string | null
          motorized_or_trailer: string | null
          notes: string | null
          operational_condition: boolean | null
          origin_address: string | null
          origin_city: string | null
          origin_name: string | null
          origin_phone: string | null
          origin_state: string | null
          origin_street: string | null
          origin_surface_type: string | null
          origin_type: boolean | null
          origin_type_description: string | null
          origin_zip: string | null
          packaging_type: string | null
          pallet_count: string | null
          price: number | null
          quote_id: number | null
          roadworthy: boolean | null
          save_to_inventory: boolean | null
          shipment_items: Json | null
          status: string | null
          tarping: boolean | null
          template_id: string | null
          trailer: boolean | null
          type: string | null
          unloading_by: boolean | null
          updated_at: string | null
          user_id: string | null
          vin: string | null
          weight: string | null
          weight_per_pallet_unit: string | null
          weight_unit: string | null
          width: string | null
          width_unit: string | null
          year: string | null
        }
        Insert: {
          assigned_sales_user?: string | null
          auction?: string | null
          beam?: string | null
          brokers_status?: string | null
          buyer_number?: string | null
          carrier_pay?: number | null
          class_type?: string | null
          commodity?: string | null
          company_id?: string | null
          container_length?: number | null
          container_type?: string | null
          contents_description?: string | null
          cradle?: boolean | null
          created_at?: string | null
          deposit?: number | null
          destination_city?: string | null
          destination_name?: string | null
          destination_phone?: string | null
          destination_state?: string | null
          destination_street?: string | null
          destination_surface_type?: string | null
          destination_type?: boolean | null
          destination_type_description?: string | null
          destination_zip?: string | null
          dock_no_dock?: boolean | null
          driveaway_or_towaway?: boolean | null
          due_date?: string | null
          earliest_pickup_date?: string | null
          email?: string | null
          first_name?: string | null
          freight_class?: string | null
          freight_type?: string | null
          goods_value?: string | null
          height?: string | null
          height_unit?: string | null
          id?: number
          inserted_at?: string | null
          is_archived?: boolean | null
          is_complete?: boolean | null
          is_loaded?: boolean | null
          last_name?: string | null
          latest_pickup_date?: string | null
          length?: string | null
          length_unit?: string | null
          load_description?: string | null
          loading_assistance?: string | null
          loading_by?: boolean | null
          loading_unloading_requirements?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          motorized_or_trailer?: string | null
          notes?: string | null
          operational_condition?: boolean | null
          origin_address?: string | null
          origin_city?: string | null
          origin_name?: string | null
          origin_phone?: string | null
          origin_state?: string | null
          origin_street?: string | null
          origin_surface_type?: string | null
          origin_type?: boolean | null
          origin_type_description?: string | null
          origin_zip?: string | null
          packaging_type?: string | null
          pallet_count?: string | null
          price?: number | null
          quote_id?: number | null
          roadworthy?: boolean | null
          save_to_inventory?: boolean | null
          shipment_items?: Json | null
          status?: string | null
          tarping?: boolean | null
          template_id?: string | null
          trailer?: boolean | null
          type?: string | null
          unloading_by?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          weight?: string | null
          weight_per_pallet_unit?: string | null
          weight_unit?: string | null
          width?: string | null
          width_unit?: string | null
          year?: string | null
        }
        Update: {
          assigned_sales_user?: string | null
          auction?: string | null
          beam?: string | null
          brokers_status?: string | null
          buyer_number?: string | null
          carrier_pay?: number | null
          class_type?: string | null
          commodity?: string | null
          company_id?: string | null
          container_length?: number | null
          container_type?: string | null
          contents_description?: string | null
          cradle?: boolean | null
          created_at?: string | null
          deposit?: number | null
          destination_city?: string | null
          destination_name?: string | null
          destination_phone?: string | null
          destination_state?: string | null
          destination_street?: string | null
          destination_surface_type?: string | null
          destination_type?: boolean | null
          destination_type_description?: string | null
          destination_zip?: string | null
          dock_no_dock?: boolean | null
          driveaway_or_towaway?: boolean | null
          due_date?: string | null
          earliest_pickup_date?: string | null
          email?: string | null
          first_name?: string | null
          freight_class?: string | null
          freight_type?: string | null
          goods_value?: string | null
          height?: string | null
          height_unit?: string | null
          id?: number
          inserted_at?: string | null
          is_archived?: boolean | null
          is_complete?: boolean | null
          is_loaded?: boolean | null
          last_name?: string | null
          latest_pickup_date?: string | null
          length?: string | null
          length_unit?: string | null
          load_description?: string | null
          loading_assistance?: string | null
          loading_by?: boolean | null
          loading_unloading_requirements?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          motorized_or_trailer?: string | null
          notes?: string | null
          operational_condition?: boolean | null
          origin_address?: string | null
          origin_city?: string | null
          origin_name?: string | null
          origin_phone?: string | null
          origin_state?: string | null
          origin_street?: string | null
          origin_surface_type?: string | null
          origin_type?: boolean | null
          origin_type_description?: string | null
          origin_zip?: string | null
          packaging_type?: string | null
          pallet_count?: string | null
          price?: number | null
          quote_id?: number | null
          roadworthy?: boolean | null
          save_to_inventory?: boolean | null
          shipment_items?: Json | null
          status?: string | null
          tarping?: boolean | null
          template_id?: string | null
          trailer?: boolean | null
          type?: string | null
          unloading_by?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          vin?: string | null
          weight?: string | null
          weight_per_pallet_unit?: string | null
          weight_unit?: string | null
          width?: string | null
          width_unit?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shippingquotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shippingquotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shippingquotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string
          context: string | null
          created_at: string | null
          id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          context?: string | null
          created_at?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          context?: string | null
          created_at?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
        Relationships: [
          {
            foreignKeyName: "usage_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          additional_info: string | null
          cd_data_id: string | null
          color: string | null
          external_vehicle_id: string | null
          id: string
          license_plate: string | null
          license_plate_state: string | null
          lot_number: string | null
          make: string | null
          model: string | null
          qty: number
          shipping_specs_height: number | null
          shipping_specs_length: number | null
          shipping_specs_weight: number | null
          shipping_specs_width: number | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type_enum"]
          vehicle_type_other: string | null
          vin: string | null
          wide_load: boolean | null
          year: string | null
        }
        Insert: {
          additional_info?: string | null
          cd_data_id?: string | null
          color?: string | null
          external_vehicle_id?: string | null
          id?: string
          license_plate?: string | null
          license_plate_state?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          qty: number
          shipping_specs_height?: number | null
          shipping_specs_length?: number | null
          shipping_specs_weight?: number | null
          shipping_specs_width?: number | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type_enum"]
          vehicle_type_other?: string | null
          vin?: string | null
          wide_load?: boolean | null
          year?: string | null
        }
        Update: {
          additional_info?: string | null
          cd_data_id?: string | null
          color?: string | null
          external_vehicle_id?: string | null
          id?: string
          license_plate?: string | null
          license_plate_state?: string | null
          lot_number?: string | null
          make?: string | null
          model?: string | null
          qty?: number
          shipping_specs_height?: number | null
          shipping_specs_length?: number | null
          shipping_specs_weight?: number | null
          shipping_specs_width?: number | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type_enum"]
          vehicle_type_other?: string | null
          vin?: string | null
          wide_load?: boolean | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_cd_data_id_fkey"
            columns: ["cd_data_id"]
            isOneToOne: false
            referencedRelation: "cd_data"
            referencedColumns: ["id"]
          },
        ]
      }
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
      purge_user: {
        Args: {
          email_to_purge: string
        }
        Returns: undefined
      }
    }
    Enums: {
      balance_payment_method_enum:
        | "CASH"
        | "CERTIFIED_FUNDS"
        | "COMCHEK"
        | "COMPANY_CHECK"
      balance_payment_terms_begin_on_enum:
        | "PICKUP"
        | "DELIVERY"
        | "RECEIVING_SIGNED_BOL"
      balance_payment_time_enum:
        | "IMMEDIATELY"
        | "TWO_BUSINESS_DAYS"
        | "FIVE_BUSINESS_DAYS"
        | "TEN_BUSINESS_DAYS"
        | "FIFTEEN_BUSINES_DAYS"
        | "THIRTY_BUSINESS_DAYS"
      cod_payment_location_enum: "PICKUP" | "DELIVERY"
      cod_payment_method_enum: "CASH_CERTIFIED_FUNDS" | "CHECK"
      trailer_type_enum: "OPEN" | "ENCLOSED" | "DRIVEAWAY"
      vehicle_type_enum:
        | "ATV"
        | "BOAT"
        | "CAR"
        | "HEAVY_EQUIPMENT"
        | "LARGE_YACHT"
        | "MOTORCYCLE"
        | "PICKUP"
        | "RV"
        | "SUV"
        | "TRAVEL_TRAILER"
        | "VAN"
        | "OTHER"
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
