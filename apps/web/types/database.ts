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
    PostgrestVersion: "14.5"
  }
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
      addons: {
        Row: {
          boat_id: string
          created_at: string
          currency: string
          description: string | null
          emoji: string | null
          id: string
          is_available: boolean
          max_quantity: number | null
          name: string
          operator_id: string
          price_cents: number
          sort_order: number | null
        }
        Insert: {
          boat_id: string
          created_at?: string
          currency?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_available?: boolean
          max_quantity?: number | null
          name: string
          operator_id: string
          price_cents: number
          sort_order?: number | null
        }
        Update: {
          boat_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_available?: boolean
          max_quantity?: number | null
          name?: string
          operator_id?: string
          price_cents?: number
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "addons_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addons_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          operator_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          operator_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          operator_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      boats: {
        Row: {
          boat_name: string
          boat_type: string
          boatsetter_url: string | null
          cancellation_policy: string | null
          captain_bio: string | null
          captain_languages: string[] | null
          captain_license: string | null
          captain_name: string | null
          captain_photo_url: string | null
          captain_rating: number | null
          captain_trip_count: number | null
          captain_years_exp: number | null
          charter_type: string
          created_at: string
          getmyboat_url: string | null
          house_rules: string | null
          id: string
          is_active: boolean
          lat: number | null
          length_ft: number | null
          lng: number | null
          marina_address: string
          marina_name: string
          max_capacity: number
          onboard_info: Json | null
          operator_id: string
          parking_instructions: string | null
          photo_urls: string[] | null
          prohibited_items: string | null
          safety_briefing: string | null
          slip_number: string | null
          updated_at: string
          waiver_text: string
          weight_limit_lbs: number | null
          what_to_bring: string | null
          year_built: number | null
        }
        Insert: {
          boat_name: string
          boat_type: string
          boatsetter_url?: string | null
          cancellation_policy?: string | null
          captain_bio?: string | null
          captain_languages?: string[] | null
          captain_license?: string | null
          captain_name?: string | null
          captain_photo_url?: string | null
          captain_rating?: number | null
          captain_trip_count?: number | null
          captain_years_exp?: number | null
          charter_type?: string
          created_at?: string
          getmyboat_url?: string | null
          house_rules?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          length_ft?: number | null
          lng?: number | null
          marina_address: string
          marina_name: string
          max_capacity: number
          onboard_info?: Json | null
          operator_id: string
          parking_instructions?: string | null
          photo_urls?: string[] | null
          prohibited_items?: string | null
          safety_briefing?: string | null
          slip_number?: string | null
          updated_at?: string
          waiver_text: string
          weight_limit_lbs?: number | null
          what_to_bring?: string | null
          year_built?: number | null
        }
        Update: {
          boat_name?: string
          boat_type?: string
          boatsetter_url?: string | null
          cancellation_policy?: string | null
          captain_bio?: string | null
          captain_languages?: string[] | null
          captain_license?: string | null
          captain_name?: string | null
          captain_photo_url?: string | null
          captain_rating?: number | null
          captain_trip_count?: number | null
          captain_years_exp?: number | null
          charter_type?: string
          created_at?: string
          getmyboat_url?: string | null
          house_rules?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          length_ft?: number | null
          lng?: number | null
          marina_address?: string
          marina_name?: string
          max_capacity?: number
          onboard_info?: Json | null
          operator_id?: string
          parking_instructions?: string | null
          photo_urls?: string[] | null
          prohibited_items?: string | null
          safety_briefing?: string | null
          slip_number?: string | null
          updated_at?: string
          waiver_text?: string
          weight_limit_lbs?: number | null
          what_to_bring?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boats_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string
          booking_link: string
          booking_ref: string
          created_at: string
          id: string
          max_guests: number
          notes: string | null
          operator_id: string
          organiser_email: string | null
          organiser_name: string
          trip_id: string
        }
        Insert: {
          booking_code: string
          booking_link: string
          booking_ref: string
          created_at?: string
          id?: string
          max_guests?: number
          notes?: string | null
          operator_id: string
          organiser_email?: string | null
          organiser_name: string
          trip_id: string
        }
        Update: {
          booking_code?: string
          booking_link?: string
          booking_ref?: string
          created_at?: string
          id?: string
          max_guests?: number
          notes?: string | null
          operator_id?: string
          organiser_email?: string | null
          organiser_name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_addon_orders: {
        Row: {
          addon_id: string
          created_at: string
          guest_id: string
          id: string
          notes: string | null
          operator_id: string
          quantity: number
          status: string
          total_cents: number
          trip_id: string
          unit_price_cents: number
        }
        Insert: {
          addon_id: string
          created_at?: string
          guest_id: string
          id?: string
          notes?: string | null
          operator_id: string
          quantity?: number
          status?: string
          total_cents: number
          trip_id: string
          unit_price_cents: number
        }
        Update: {
          addon_id?: string
          created_at?: string
          guest_id?: string
          id?: string
          notes?: string | null
          operator_id?: string
          quantity?: number
          status?: string
          total_cents?: number
          trip_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "guest_addon_orders_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_addon_orders_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_addon_orders_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_addon_orders_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          booking_id: string | null
          checked_in_at: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          dietary_requirements: string | null
          emergency_contact_name: string
          emergency_contact_phone: string
          full_name: string
          phone: string | null
          id: string
          language_preference: string | null
          operator_id: string
          qr_token: string
          qr_used_at: string | null
          trip_id: string
          waiver_ip_address: string | null
          waiver_signature_text: string | null
          waiver_signed: boolean
          waiver_signed_at: string | null
          waiver_user_agent: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          booking_id?: string | null
          checked_in_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          dietary_requirements?: string | null
          emergency_contact_name: string
          emergency_contact_phone: string
          full_name: string
          phone?: string | null
          id?: string
          language_preference?: string | null
          operator_id: string
          qr_token: string
          qr_used_at?: string | null
          trip_id: string
          waiver_ip_address?: string | null
          waiver_signature_text?: string | null
          waiver_signed?: boolean
          waiver_signed_at?: string | null
          waiver_user_agent?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          booking_id?: string | null
          checked_in_at?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          dietary_requirements?: string | null
          emergency_contact_name?: string
          emergency_contact_phone?: string
          full_name?: string
          phone?: string | null
          id?: string
          language_preference?: string | null
          operator_id?: string
          qr_token?: string
          qr_used_at?: string | null
          trip_id?: string
          waiver_ip_address?: string | null
          waiver_signature_text?: string | null
          waiver_signed?: boolean
          waiver_signed_at?: string | null
          waiver_user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          operator_id: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          operator_id: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          operator_id?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_notifications_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          max_boats: number
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_tier: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          max_boats?: number
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          max_boats?: number
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_tier?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operators_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      postcards: {
        Row: {
          created_at: string
          downloaded_at: string | null
          guest_id: string
          id: string
          image_url: string | null
          shared_at: string | null
          style: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          downloaded_at?: string | null
          guest_id: string
          id?: string
          image_url?: string | null
          shared_at?: string | null
          style?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          downloaded_at?: string | null
          guest_id?: string
          id?: string
          image_url?: string | null
          shared_at?: string | null
          style?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "postcards_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postcards_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_reviews: {
        Row: {
          ai_draft_response: string | null
          created_at: string
          feedback_text: string | null
          guest_id: string | null
          id: string
          is_public: boolean
          operator_id: string
          platform: string | null
          rating: number
          response_posted_at: string | null
          trip_id: string
        }
        Insert: {
          ai_draft_response?: string | null
          created_at?: string
          feedback_text?: string | null
          guest_id?: string | null
          id?: string
          is_public?: boolean
          operator_id: string
          platform?: string | null
          rating: number
          response_posted_at?: string | null
          trip_id: string
        }
        Update: {
          ai_draft_response?: string | null
          created_at?: string
          feedback_text?: string | null
          guest_id?: string | null
          id?: string
          is_public?: boolean
          operator_id?: string
          platform?: string | null
          rating?: number
          response_posted_at?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_reviews_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reviews_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_reviews_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          boat_id: string
          charter_type: string
          created_at: string
          departure_time: string
          duration_hours: number
          id: string
          max_guests: number
          operator_id: string
          requires_approval: boolean
          route_description: string | null
          route_stops: Json | null
          slug: string
          special_notes: string | null
          status: string
          trip_code: string
          trip_date: string
          updated_at: string
          weather_checked_at: string | null
          weather_data: Json | null
        }
        Insert: {
          boat_id: string
          charter_type?: string
          created_at?: string
          departure_time: string
          duration_hours: number
          id?: string
          max_guests: number
          operator_id: string
          requires_approval?: boolean
          route_description?: string | null
          route_stops?: Json | null
          slug: string
          special_notes?: string | null
          status?: string
          trip_code: string
          trip_date: string
          updated_at?: string
          weather_checked_at?: string | null
          weather_data?: Json | null
        }
        Update: {
          boat_id?: string
          charter_type?: string
          created_at?: string
          departure_time?: string
          duration_hours?: number
          id?: string
          max_guests?: number
          operator_id?: string
          requires_approval?: boolean
          route_description?: string | null
          route_stops?: Json | null
          slug?: string
          special_notes?: string | null
          status?: string
          trip_code?: string
          trip_date?: string
          updated_at?: string
          weather_checked_at?: string | null
          weather_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_activate_trips: { Args: never; Returns: undefined }
      gdpr_cleanup: { Args: never; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
