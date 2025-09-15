export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          notes: string | null
          payment_status: string | null
          price: number | null
          room_id: string | null
          service_id: string
          staff_id: string | null
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          price?: number | null
          room_id?: string | null
          service_id: string
          staff_id?: string | null
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          price?: number | null
          room_id?: string | null
          service_id?: string
          staff_id?: string | null
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      client_memberships: {
        Row: {
          auto_renew: boolean | null
          client_id: string
          created_at: string | null
          end_date: string | null
          id: string
          membership_id: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          client_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          membership_id: string
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          client_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          membership_id?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          package_id: string
          purchase_date: string | null
          sessions_remaining: number
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          package_id: string
          purchase_date?: string | null
          sessions_remaining: number
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          package_id?: string
          purchase_date?: string | null
          sessions_remaining?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_waivers: {
        Row: {
          client_id: string
          id: string
          ip_address: unknown | null
          signature_data: string | null
          signed_at: string | null
          waiver_id: string
        }
        Insert: {
          client_id: string
          id?: string
          ip_address?: unknown | null
          signature_data?: string | null
          signed_at?: string | null
          waiver_id: string
        }
        Update: {
          client_id?: string
          id?: string
          ip_address?: unknown | null
          signature_data?: string | null
          signed_at?: string | null
          waiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_waivers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_waivers_waiver_id_fkey"
            columns: ["waiver_id"]
            isOneToOne: false
            referencedRelation: "waivers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          medical_notes: string | null
          phone: string | null
          preferences: Json | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          medical_notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          medical_notes?: string | null
          phone?: string | null
          preferences?: Json | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sku: string | null
          stock_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mb_classes: {
        Row: {
          booking_available: boolean | null
          created_at: string
          current_bookings: number | null
          description: string | null
          end_time: string
          id: string
          instructor_name: string | null
          is_cancelled: boolean | null
          location_id: string | null
          location_name: string | null
          max_capacity: number | null
          mb_class_id: string
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          booking_available?: boolean | null
          created_at?: string
          current_bookings?: number | null
          description?: string | null
          end_time: string
          id?: string
          instructor_name?: string | null
          is_cancelled?: boolean | null
          location_id?: string | null
          location_name?: string | null
          max_capacity?: number | null
          mb_class_id: string
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          booking_available?: boolean | null
          created_at?: string
          current_bookings?: number | null
          description?: string | null
          end_time?: string
          id?: string
          instructor_name?: string | null
          is_cancelled?: boolean | null
          location_id?: string | null
          location_name?: string | null
          max_capacity?: number | null
          mb_class_id?: string
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      mb_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          benefits: Json | null
          billing_cycle: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          monthly_price: number
          name: string
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_price: number
          name: string
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          billing_cycle?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          monthly_price?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          service_id: string | null
          sessions_included: number
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          service_id?: string | null
          sessions_included: number
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          service_id?: string | null
          sessions_included?: number
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string
          processed_by: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          processed_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          processed_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number | null
          created_at: string | null
          equipment: Json | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          equipment?: Json | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          equipment?: Json | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          max_capacity: number | null
          name: string
          price: number
          requires_room: boolean | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name: string
          price: number
          requires_room?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          name?: string
          price?: number
          requires_room?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          email: string | null
          first_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          last_name: string
          phone: string | null
          specialties: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          first_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_name: string
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waivers: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          version?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "receptionist" | "practitioner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "receptionist", "practitioner"],
    },
  },
} as const
