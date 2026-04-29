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
  public: {
    Tables: {
      advertise_inquiries: {
        Row: {
          archived: boolean
          brand: string
          budget: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["advertise_status"]
        }
        Insert: {
          archived?: boolean
          brand: string
          budget?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["advertise_status"]
        }
        Update: {
          archived?: boolean
          brand?: string
          budget?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["advertise_status"]
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string
          body: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          is_rtg_pick: boolean
          is_trending: boolean
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          status: Database["public"]["Enums"]["article_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_rtg_pick?: boolean
          is_trending?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_rtg_pick?: boolean
          is_trending?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          archived: boolean
          base_cost: number | null
          budget: string | null
          created_at: string
          description: string | null
          duration: string | null
          email: string
          equipment_cost: number | null
          id: string
          location_detail: string | null
          name: string
          notes: string | null
          phone: string
          preferred_contact: Database["public"]["Enums"]["contact_method"]
          project_date: string | null
          reference_link: string | null
          service: string | null
          shoot_type: Database["public"]["Enums"]["shoot_type"] | null
          status: Database["public"]["Enums"]["booking_status"]
          studio_cost: number | null
          studio_preference: string | null
          travel_cost: number | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          base_cost?: number | null
          budget?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          email: string
          equipment_cost?: number | null
          id?: string
          location_detail?: string | null
          name: string
          notes?: string | null
          phone: string
          preferred_contact?: Database["public"]["Enums"]["contact_method"]
          project_date?: string | null
          reference_link?: string | null
          service?: string | null
          shoot_type?: Database["public"]["Enums"]["shoot_type"] | null
          status?: Database["public"]["Enums"]["booking_status"]
          studio_cost?: number | null
          studio_preference?: string | null
          travel_cost?: number | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          base_cost?: number | null
          budget?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          email?: string
          equipment_cost?: number | null
          id?: string
          location_detail?: string | null
          name?: string
          notes?: string | null
          phone?: string
          preferred_contact?: Database["public"]["Enums"]["contact_method"]
          project_date?: string | null
          reference_link?: string | null
          service?: string | null
          shoot_type?: Database["public"]["Enums"]["shoot_type"] | null
          status?: Database["public"]["Enums"]["booking_status"]
          studio_cost?: number | null
          studio_preference?: string | null
          travel_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      breakdown_episodes: {
        Row: {
          breakdown_body: string | null
          category: string
          cover_image_url: string | null
          created_at: string
          duration: string | null
          episode_number: number | null
          id: string
          is_featured: boolean
          published_at: string | null
          read_url: string | null
          slug: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          watch_url: string | null
        }
        Insert: {
          breakdown_body?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          duration?: string | null
          episode_number?: number | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          read_url?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          watch_url?: string | null
        }
        Update: {
          breakdown_body?: string | null
          category?: string
          cover_image_url?: string | null
          created_at?: string
          duration?: string | null
          episode_number?: number | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          read_url?: string | null
          slug?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          watch_url?: string | null
        }
        Relationships: []
      }
      chicago_feed: {
        Row: {
          created_at: string
          detail: string | null
          event_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          kind: string
          link_url: string | null
          location: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          link_url?: string | null
          location?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          link_url?: string | null
          location?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          name: string
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          name: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          name?: string
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          archived: boolean
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
        }
        Insert: {
          archived?: boolean
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
        }
        Update: {
          archived?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rtg_picks: {
        Row: {
          created_at: string
          creator: string | null
          id: string
          image_url: string | null
          is_active: boolean
          kind: string
          link_url: string | null
          note: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          link_url?: string | null
          note?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          link_url?: string | null
          note?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          draft: Json
          id: string
          published: Json
          section: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          draft?: Json
          id?: string
          published?: Json
          section: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          draft?: Json
          id?: string
          published?: Json
          section?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          article_id: string
          caption: string | null
          created_at: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          posted_at: string | null
          status: Database["public"]["Enums"]["social_status"]
          updated_at: string
        }
        Insert: {
          article_id: string
          caption?: string | null
          created_at?: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          posted_at?: string | null
          status?: Database["public"]["Enums"]["social_status"]
          updated_at?: string
        }
        Update: {
          article_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          posted_at?: string | null
          status?: Database["public"]["Enums"]["social_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      advertise_status: "new" | "in_review" | "accepted" | "declined"
      app_role: "admin" | "editor" | "writer" | "social_manager"
      article_status:
        | "draft"
        | "submitted"
        | "revisions"
        | "approved"
        | "published"
      booking_status:
        | "new"
        | "contacted"
        | "negotiating"
        | "booked"
        | "completed"
        | "declined"
      contact_method: "email" | "phone" | "text"
      lead_source: "booking" | "newsletter" | "advertise" | "contact" | "other"
      shoot_type: "studio" | "location" | "hybrid"
      social_platform: "instagram" | "tiktok" | "x" | "youtube"
      social_status: "draft" | "ready" | "posted"
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
      advertise_status: ["new", "in_review", "accepted", "declined"],
      app_role: ["admin", "editor", "writer", "social_manager"],
      article_status: [
        "draft",
        "submitted",
        "revisions",
        "approved",
        "published",
      ],
      booking_status: [
        "new",
        "contacted",
        "negotiating",
        "booked",
        "completed",
        "declined",
      ],
      contact_method: ["email", "phone", "text"],
      lead_source: ["booking", "newsletter", "advertise", "contact", "other"],
      shoot_type: ["studio", "location", "hybrid"],
      social_platform: ["instagram", "tiktok", "x", "youtube"],
      social_status: ["draft", "ready", "posted"],
    },
  },
} as const
