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
          created_at: string | null
          currency: string | null
          default_price_per_litre: number | null
          distance_unit: string | null
          fuel_unit: string | null
          id: string
          km_per_litre: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          default_price_per_litre?: number | null
          distance_unit?: string | null
          fuel_unit?: string | null
          id?: string
          km_per_litre?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          default_price_per_litre?: number | null
          distance_unit?: string | null
          fuel_unit?: string | null
          id?: string
          km_per_litre?: number | null
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          car_id: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          payer_id: string
          split_with: string[] | null
          type: string
        }
        Insert: {
          amount: number
          car_id: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          payer_id: string
          split_with?: string[] | null
          type: string
        }
        Update: {
          amount?: number
          car_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          payer_id?: string
          split_with?: string[] | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          car_id: string
          created_at: string | null
          id: string
          invite_code: string
          invited_at: string | null
          is_admin: boolean | null
          joined_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          car_id: string
          created_at?: string | null
          id?: string
          invite_code: string
          invited_at?: string | null
          is_admin?: boolean | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          car_id?: string
          created_at?: string | null
          id?: string
          invite_code?: string
          invited_at?: string | null
          is_admin?: boolean | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
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
          from_id: string
          id: string
          settled_at: string | null
          status: Database["public"]["Enums"]["settlement_status"] | null
          to_id: string
        }
        Insert: {
          amount: number
          car_id: string
          created_at?: string | null
          from_id: string
          id?: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["settlement_status"] | null
          to_id: string
        }
        Update: {
          amount?: number
          car_id?: string
          created_at?: string | null
          from_id?: string
          id?: string
          settled_at?: string | null
          status?: Database["public"]["Enums"]["settlement_status"] | null
          to_id?: string
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
            foreignKeyName: "settlements_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_id_fkey"
            columns: ["to_id"]
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
          distance: number
          id: string
          name: string | null
          passengers: string[]
        }
        Insert: {
          car_id: string
          created_at?: string | null
          date?: string
          distance: number
          id?: string
          name?: string | null
          passengers: string[]
        }
        Update: {
          car_id?: string
          created_at?: string | null
          date?: string
          distance?: number
          id?: string
          name?: string | null
          passengers?: string[]
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
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { p_invite_code: string; p_user_id: string }
        Returns: string
      }
      auto_link_member_by_phone: {
        Args: { p_phone: string; p_user_id: string }
        Returns: boolean
      }
      generate_invite_code: { Args: never; Returns: string }
      get_car_expenses: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          car_id: string
          created_at: string
          date: string
          description: string
          id: string
          payer_id: string
          payer_name: string
          split_with: string[]
          type: string
        }[]
      }
      get_car_members: {
        Args: { p_user_id: string }
        Returns: {
          archived: boolean
          car_id: string
          id: string
          invite_code: string
          invited_at: string
          is_admin: boolean
          joined_at: string
          name: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }[]
      }
      get_car_settlements: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          car_id: string
          created_at: string
          from_id: string
          from_name: string
          id: string
          settled_at: string
          status: Database["public"]["Enums"]["settlement_status"]
          to_id: string
          to_name: string
        }[]
      }
      get_car_trips: {
        Args: { p_user_id: string }
        Returns: {
          car_id: string
          created_at: string
          date: string
          distance: number
          id: string
          name: string
          passengers: string[]
        }[]
      }
      get_user_car: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          currency: string
          default_price_per_litre: number
          distance_unit: string
          fuel_unit: string
          id: string
          km_per_litre: number
          name: string
        }[]
      }
    }
    Enums: {
      member_role: "owner" | "guest"
      settlement_status: "pending" | "settled"
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
      member_role: ["owner", "guest"],
      settlement_status: ["pending", "settled"],
    },
  },
} as const
