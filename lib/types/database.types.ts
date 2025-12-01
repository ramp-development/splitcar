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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cars: {
        Row: {
          avg_price_per_litre: number
          created_at: string | null
          currency: string | null
          distance_unit: string | null
          efficiency_km_per_litre: number
          fuel_unit: string | null
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          avg_price_per_litre: number
          created_at?: string | null
          currency?: string | null
          distance_unit?: string | null
          efficiency_km_per_litre: number
          fuel_unit?: string | null
          id?: string
          name: string
          owner_id?: string | null
        }
        Update: {
          avg_price_per_litre?: number
          created_at?: string | null
          currency?: string | null
          distance_unit?: string | null
          efficiency_km_per_litre?: number
          fuel_unit?: string | null
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_fills: {
        Row: {
          amount: number
          car_id: string
          created_at: string | null
          date: string
          id: string
          payer_member_id: string
        }
        Insert: {
          amount: number
          car_id: string
          created_at?: string | null
          date?: string
          id?: string
          payer_member_id: string
        }
        Update: {
          amount?: number
          car_id?: string
          created_at?: string | null
          date?: string
          id?: string
          payer_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_fills_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_fills_payer_member_id_fkey"
            columns: ["payer_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          archived: boolean | null
          car_id: string
          created_at: string | null
          id: string
          is_guest: boolean | null
          name: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          car_id: string
          created_at?: string | null
          id?: string
          is_guest?: boolean | null
          name: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          car_id?: string
          created_at?: string | null
          id?: string
          is_guest?: boolean | null
          name?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          car_id: string
          created_at: string | null
          from_member_id: string
          id: string
          to_member_id: string
        }
        Insert: {
          amount: number
          car_id: string
          created_at?: string | null
          from_member_id: string
          id?: string
          to_member_id: string
        }
        Update: {
          amount?: number
          car_id?: string
          created_at?: string | null
          from_member_id?: string
          id?: string
          to_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_from_member_id_fkey"
            columns: ["from_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_member_id_fkey"
            columns: ["to_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          car_id: string
          created_at: string | null
          date: string
          distance_km: number
          id: string
          name: string | null
          passenger_member_ids: string[]
        }
        Insert: {
          car_id: string
          created_at?: string | null
          date?: string
          distance_km: number
          id?: string
          name?: string | null
          passenger_member_ids: string[]
        }
        Update: {
          car_id?: string
          created_at?: string | null
          date?: string
          distance_km?: number
          id?: string
          name?: string | null
          passenger_member_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "trips_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          phone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          phone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_link_member_by_phone: {
        Args: { p_phone: string; p_user_id: string }
        Returns: boolean
      }
      get_car_fuel_fills: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          car_id: string
          created_at: string
          date: string
          id: string
          payer_member_id: string
          payer_name: string
        }[]
      }
      get_car_members: {
        Args: { p_user_id: string }
        Returns: {
          archived: boolean
          car_id: string
          created_at: string
          id: string
          is_guest: boolean
          name: string
          phone: string
          user_id: string
        }[]
      }
      get_car_settlements: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          car_id: string
          created_at: string
          from_member_id: string
          from_member_name: string
          id: string
          to_member_id: string
          to_member_name: string
        }[]
      }
      get_car_trips: {
        Args: { p_user_id: string }
        Returns: {
          car_id: string
          created_at: string
          date: string
          distance_km: number
          id: string
          name: string
          passenger_member_ids: string[]
        }[]
      }
      get_user_car: {
        Args: { p_user_id: string }
        Returns: {
          avg_price_per_litre: number
          created_at: string
          currency: string
          distance_unit: string
          efficiency_km_per_litre: number
          fuel_unit: string
          id: string
          name: string
          owner_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
