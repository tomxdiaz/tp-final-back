export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity: {
        Row: {
          base_price: number
          business_id: number
          category: string
          country: string
          created_at: string
          currency: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          duration_minutes: number | null
          id: number
          is_active: boolean
          latitude: number | null
          location_name: string | null
          longitude: number | null
          max_participants: number | null
          meeting_point: string | null
          min_age: number | null
          province: string | null
          title: string
          updated_at: string
        }
        Insert: {
          base_price: number
          business_id: number
          category: string
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          duration_minutes?: number | null
          id?: number
          is_active?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_participants?: number | null
          meeting_point?: string | null
          min_age?: number | null
          province?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          business_id?: number
          category?: string
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          duration_minutes?: number | null
          id?: number
          is_active?: boolean
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          max_participants?: number | null
          meeting_point?: string | null
          min_age?: number | null
          province?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_schedule_rule: {
        Row: {
          activity_id: number
          amount_of_days: number
          created_at: string
          days_of_week: number[]
          id: number
          updated_at: string
        }
        Insert: {
          activity_id: number
          amount_of_days: number
          created_at?: string
          days_of_week: number[]
          id?: number
          updated_at?: string
        }
        Update: {
          activity_id?: number
          amount_of_days?: number
          created_at?: string
          days_of_week?: number[]
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_schedule_rule_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_session: {
        Row: {
          activity_id: number
          booked_spots: number
          created_at: string
          datetime: string
          id: number
          schedule_rule_id: number | null
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
        }
        Insert: {
          activity_id: number
          booked_spots?: number
          created_at?: string
          datetime: string
          id?: number
          schedule_rule_id?: number | null
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Update: {
          activity_id?: number
          booked_spots?: number
          created_at?: string
          datetime?: string
          id?: number
          schedule_rule_id?: number | null
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_session_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_session_schedule_rule_id_fkey"
            columns: ["schedule_rule_id"]
            isOneToOne: false
            referencedRelation: "activity_schedule_rule"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          global_role: Database["public"]["Enums"]["global_role"]
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          global_role?: Database["public"]["Enums"]["global_role"]
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          global_role?: Database["public"]["Enums"]["global_role"]
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      booking: {
        Row: {
          activity_session_id: number
          app_user_id: string
          created_at: string
          customer_notes: string | null
          id: number
          number_of_people: number
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          activity_session_id: number
          app_user_id: string
          created_at?: string
          customer_notes?: string | null
          id?: number
          number_of_people: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          activity_session_id?: number
          app_user_id?: string
          created_at?: string
          customer_notes?: string | null
          id?: number
          number_of_people?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_activity_session_id_fkey"
            columns: ["activity_session_id"]
            isOneToOne: false
            referencedRelation: "activity_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      business: {
        Row: {
          app_user_id: string
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          app_user_id: string
          business_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          app_user_id?: string
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "business_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: true
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter: {
        Row: {
          email: string
          id: string
        }
        Insert: {
          email: string
          id?: string
        }
        Update: {
          email?: string
          id?: string
        }
        Relationships: []
      }
      review: {
        Row: {
          activity_id: number
          app_user_id: string
          booking_id: number
          comment: string | null
          created_at: string
          id: number
          rating: number
          updated_at: string
        }
        Insert: {
          activity_id: number
          app_user_id: string
          booking_id: number
          comment?: string | null
          created_at?: string
          id?: number
          rating: number
          updated_at?: string
        }
        Update: {
          activity_id?: number
          app_user_id?: string
          booking_id?: number
          comment?: string | null
          created_at?: string
          id?: number
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "PENDING" | "CONFIRMED" | "CANCELLED"
      difficulty_level: "BAJA" | "MEDIA" | "ALTA" | "EXTREMA"
      global_role: "SUPER_USER" | "USER"
      session_status: "AVAILABLE" | "CANCELLED" | "COMPLETED"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["PENDING", "CONFIRMED", "CANCELLED"],
      difficulty_level: ["BAJA", "MEDIA", "ALTA", "EXTREMA"],
      global_role: ["SUPER_USER", "USER"],
      session_status: ["AVAILABLE", "CANCELLED", "COMPLETED"],
    },
  },
} as const

