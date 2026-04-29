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
      activity_log: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          detail: string | null
          id: string
          kind: string
          link_url: string | null
          meta: Json
          title: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          link_url?: string | null
          meta?: Json
          title: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          link_url?: string | null
          meta?: Json
          title?: string
        }
        Relationships: []
      }
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
      article_engagement: {
        Row: {
          article_id: string
          avg_read_seconds: number
          avg_scroll_pct: number
          reactions: number
          shares: number
          unique_views: number
          updated_at: string
          views: number
        }
        Insert: {
          article_id: string
          avg_read_seconds?: number
          avg_scroll_pct?: number
          reactions?: number
          shares?: number
          unique_views?: number
          updated_at?: string
          views?: number
        }
        Update: {
          article_id?: string
          avg_read_seconds?: number
          avg_scroll_pct?: number
          reactions?: number
          shares?: number
          unique_views?: number
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      article_revisions: {
        Row: {
          article_id: string
          created_at: string
          id: string
          reason: string | null
          saved_by: string
          snapshot: Json
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          reason?: string | null
          saved_by: string
          snapshot: Json
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          saved_by?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "article_revisions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          article_type: Database["public"]["Enums"]["article_type"]
          audience_score: number | null
          author_id: string
          body: string | null
          body_blocks: Json
          breakdown_category: string | null
          breakdown_episode: string | null
          breakdown_spoiler: boolean
          breakdown_subject: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          featured_until: string | null
          film_director: string | null
          film_genre: string | null
          film_mpaa_rating: string | null
          film_release_date: string | null
          film_review_date: string | null
          film_reviewer: string | null
          film_runtime: string | null
          film_studio: string | null
          film_title: string | null
          game_developer: string | null
          game_esrb_rating: string | null
          game_genre: string | null
          game_platforms: string | null
          game_publisher: string | null
          game_release_date: string | null
          game_reviewer: string | null
          game_screenshots: Json
          game_title: string | null
          game_trailer_url: string | null
          id: string
          imdb_score: number | null
          interview_date: string | null
          interview_interviewee: string | null
          interview_location: string | null
          interview_photographer: string | null
          interview_role: string | null
          is_featured: boolean
          is_official_rtg_review: boolean
          is_rtg_pick: boolean
          is_trending: boolean
          metacritic_score: number | null
          music_album_title: string | null
          music_artist: string | null
          music_embed_url: string | null
          music_genre: string | null
          music_label: string | null
          music_producer: string | null
          music_release_date: string | null
          music_runtime: string | null
          music_song_title: string | null
          music_track_count: number | null
          music_tracklist: Json | null
          news_date: string | null
          news_location: string | null
          news_source: string | null
          news_subheadline: string | null
          published_at: string | null
          rotten_tomatoes_score: number | null
          rtg_rating: number | null
          scheduled_for: string | null
          scheduled_timezone: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          status: Database["public"]["Enums"]["article_status"]
          steam_score: number | null
          tags: string[] | null
          title: string
          updated_at: string
          verdict_headline: string | null
          verdict_paragraph: string | null
          verdict_recommendation:
            | Database["public"]["Enums"]["film_verdict"]
            | null
          writer_name: string | null
        }
        Insert: {
          article_type?: Database["public"]["Enums"]["article_type"]
          audience_score?: number | null
          author_id: string
          body?: string | null
          body_blocks?: Json
          breakdown_category?: string | null
          breakdown_episode?: string | null
          breakdown_spoiler?: boolean
          breakdown_subject?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured_until?: string | null
          film_director?: string | null
          film_genre?: string | null
          film_mpaa_rating?: string | null
          film_release_date?: string | null
          film_review_date?: string | null
          film_reviewer?: string | null
          film_runtime?: string | null
          film_studio?: string | null
          film_title?: string | null
          game_developer?: string | null
          game_esrb_rating?: string | null
          game_genre?: string | null
          game_platforms?: string | null
          game_publisher?: string | null
          game_release_date?: string | null
          game_reviewer?: string | null
          game_screenshots?: Json
          game_title?: string | null
          game_trailer_url?: string | null
          id?: string
          imdb_score?: number | null
          interview_date?: string | null
          interview_interviewee?: string | null
          interview_location?: string | null
          interview_photographer?: string | null
          interview_role?: string | null
          is_featured?: boolean
          is_official_rtg_review?: boolean
          is_rtg_pick?: boolean
          is_trending?: boolean
          metacritic_score?: number | null
          music_album_title?: string | null
          music_artist?: string | null
          music_embed_url?: string | null
          music_genre?: string | null
          music_label?: string | null
          music_producer?: string | null
          music_release_date?: string | null
          music_runtime?: string | null
          music_song_title?: string | null
          music_track_count?: number | null
          music_tracklist?: Json | null
          news_date?: string | null
          news_location?: string | null
          news_source?: string | null
          news_subheadline?: string | null
          published_at?: string | null
          rotten_tomatoes_score?: number | null
          rtg_rating?: number | null
          scheduled_for?: string | null
          scheduled_timezone?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          steam_score?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          verdict_headline?: string | null
          verdict_paragraph?: string | null
          verdict_recommendation?:
            | Database["public"]["Enums"]["film_verdict"]
            | null
          writer_name?: string | null
        }
        Update: {
          article_type?: Database["public"]["Enums"]["article_type"]
          audience_score?: number | null
          author_id?: string
          body?: string | null
          body_blocks?: Json
          breakdown_category?: string | null
          breakdown_episode?: string | null
          breakdown_spoiler?: boolean
          breakdown_subject?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured_until?: string | null
          film_director?: string | null
          film_genre?: string | null
          film_mpaa_rating?: string | null
          film_release_date?: string | null
          film_review_date?: string | null
          film_reviewer?: string | null
          film_runtime?: string | null
          film_studio?: string | null
          film_title?: string | null
          game_developer?: string | null
          game_esrb_rating?: string | null
          game_genre?: string | null
          game_platforms?: string | null
          game_publisher?: string | null
          game_release_date?: string | null
          game_reviewer?: string | null
          game_screenshots?: Json
          game_title?: string | null
          game_trailer_url?: string | null
          id?: string
          imdb_score?: number | null
          interview_date?: string | null
          interview_interviewee?: string | null
          interview_location?: string | null
          interview_photographer?: string | null
          interview_role?: string | null
          is_featured?: boolean
          is_official_rtg_review?: boolean
          is_rtg_pick?: boolean
          is_trending?: boolean
          metacritic_score?: number | null
          music_album_title?: string | null
          music_artist?: string | null
          music_embed_url?: string | null
          music_genre?: string | null
          music_label?: string | null
          music_producer?: string | null
          music_release_date?: string | null
          music_runtime?: string | null
          music_song_title?: string | null
          music_track_count?: number | null
          music_tracklist?: Json | null
          news_date?: string | null
          news_location?: string | null
          news_source?: string | null
          news_subheadline?: string | null
          published_at?: string | null
          rotten_tomatoes_score?: number | null
          rtg_rating?: number | null
          scheduled_for?: string | null
          scheduled_timezone?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          steam_score?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          verdict_headline?: string | null
          verdict_paragraph?: string | null
          verdict_recommendation?:
            | Database["public"]["Enums"]["film_verdict"]
            | null
          writer_name?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          archived: boolean
          assigned_staff_id: string | null
          assignment_priority: string
          assignment_status: string
          base_cost: number | null
          budget: string | null
          created_at: string
          deposit_paid: boolean
          description: string | null
          duration: string | null
          email: string
          equipment_cost: number | null
          id: string
          instagram: string | null
          location_detail: string | null
          name: string
          no_preference: boolean
          notes: string | null
          phone: string
          preferred_contact: Database["public"]["Enums"]["contact_method"]
          project_date: string | null
          project_time: string | null
          project_type: string | null
          reference_link: string | null
          requested_staff_id: string | null
          service: string | null
          service_id: string | null
          shoot_type: Database["public"]["Enums"]["shoot_type"] | null
          status: Database["public"]["Enums"]["booking_status"]
          studio_cost: number | null
          studio_preference: string | null
          timeline: string | null
          total_estimate: number | null
          travel_cost: number | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          assigned_staff_id?: string | null
          assignment_priority?: string
          assignment_status?: string
          base_cost?: number | null
          budget?: string | null
          created_at?: string
          deposit_paid?: boolean
          description?: string | null
          duration?: string | null
          email: string
          equipment_cost?: number | null
          id?: string
          instagram?: string | null
          location_detail?: string | null
          name: string
          no_preference?: boolean
          notes?: string | null
          phone: string
          preferred_contact?: Database["public"]["Enums"]["contact_method"]
          project_date?: string | null
          project_time?: string | null
          project_type?: string | null
          reference_link?: string | null
          requested_staff_id?: string | null
          service?: string | null
          service_id?: string | null
          shoot_type?: Database["public"]["Enums"]["shoot_type"] | null
          status?: Database["public"]["Enums"]["booking_status"]
          studio_cost?: number | null
          studio_preference?: string | null
          timeline?: string | null
          total_estimate?: number | null
          travel_cost?: number | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          assigned_staff_id?: string | null
          assignment_priority?: string
          assignment_status?: string
          base_cost?: number | null
          budget?: string | null
          created_at?: string
          deposit_paid?: boolean
          description?: string | null
          duration?: string | null
          email?: string
          equipment_cost?: number | null
          id?: string
          instagram?: string | null
          location_detail?: string | null
          name?: string
          no_preference?: boolean
          notes?: string | null
          phone?: string
          preferred_contact?: Database["public"]["Enums"]["contact_method"]
          project_date?: string | null
          project_time?: string | null
          project_type?: string | null
          reference_link?: string | null
          requested_staff_id?: string | null
          service?: string | null
          service_id?: string | null
          shoot_type?: Database["public"]["Enums"]["shoot_type"] | null
          status?: Database["public"]["Enums"]["booking_status"]
          studio_cost?: number | null
          studio_preference?: string | null
          timeline?: string | null
          total_estimate?: number | null
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
      editor_notes: {
        Row: {
          article_id: string
          author_id: string
          body: string
          created_at: string
          id: string
        }
        Insert: {
          article_id: string
          author_id: string
          body: string
          created_at?: string
          id?: string
        }
        Update: {
          article_id?: string
          author_id?: string
          body?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editor_notes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      invited_users: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          id: string
          internal_title: string | null
          invited_by: string | null
          notes: string | null
          reports_to: string | null
          roles: Database["public"]["Enums"]["app_role"][]
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          internal_title?: string | null
          invited_by?: string | null
          notes?: string | null
          reports_to?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          internal_title?: string | null
          invited_by?: string | null
          notes?: string | null
          reports_to?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          status?: string
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
      page_views: {
        Row: {
          article_id: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          source: string
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          article_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          source?: string
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          article_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          source?: string
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          category: string
          client: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_public: boolean
          media_type: string
          media_url: string | null
          sort_order: number
          staff_id: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string
          client?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          media_type?: string
          media_url?: string | null
          sort_order?: number
          staff_id?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string
          client?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          media_type?: string
          media_url?: string | null
          sort_order?: number
          staff_id?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      role_permissions: {
        Row: {
          booking_can_override_availability: boolean
          editor_can_publish: boolean
          id: string
          media_can_delete: boolean
          role: Database["public"]["Enums"]["app_role"]
          social_can_autopost: boolean
          updated_at: string
          updated_by: string | null
          writer_can_edit_published: boolean
        }
        Insert: {
          booking_can_override_availability?: boolean
          editor_can_publish?: boolean
          id?: string
          media_can_delete?: boolean
          role: Database["public"]["Enums"]["app_role"]
          social_can_autopost?: boolean
          updated_at?: string
          updated_by?: string | null
          writer_can_edit_published?: boolean
        }
        Update: {
          booking_can_override_availability?: boolean
          editor_can_publish?: boolean
          id?: string
          media_can_delete?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          social_can_autopost?: boolean
          updated_at?: string
          updated_by?: string | null
          writer_can_edit_published?: boolean
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
      services: {
        Row: {
          add_ons: Json
          base_price: number | null
          cover_image_url: string | null
          created_at: string
          icon: string | null
          id: string
          is_available: boolean
          is_featured: boolean
          long_description: string | null
          name: string
          packages: Json
          pricing_model: string
          sale_price: number | null
          short_description: string | null
          slug: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          add_ons?: Json
          base_price?: number | null
          cover_image_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_available?: boolean
          is_featured?: boolean
          long_description?: string | null
          name: string
          packages?: Json
          pricing_model?: string
          sale_price?: number | null
          short_description?: string | null
          slug?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          add_ons?: Json
          base_price?: number | null
          cover_image_url?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_available?: boolean
          is_featured?: boolean
          long_description?: string | null
          name?: string
          packages?: Json
          pricing_model?: string
          sale_price?: number | null
          short_description?: string | null
          slug?: string | null
          sort_order?: number
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
      social_ideas: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_post_metrics: {
        Row: {
          comments: number
          engagement_rate: number
          id: string
          likes: number
          reach: number
          recorded_at: string
          shares: number
          social_post_id: string
          views: number
        }
        Insert: {
          comments?: number
          engagement_rate?: number
          id?: string
          likes?: number
          reach?: number
          recorded_at?: string
          shares?: number
          social_post_id: string
          views?: number
        }
        Update: {
          comments?: number
          engagement_rate?: number
          id?: string
          likes?: number
          reach?: number
          recorded_at?: string
          shares?: number
          social_post_id?: string
          views?: number
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          archived: boolean
          article_id: string
          caption: string | null
          created_at: string
          hashtags: string | null
          id: string
          link_url: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          posted_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["social_status"]
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          article_id: string
          caption?: string | null
          created_at?: string
          hashtags?: string | null
          id?: string
          link_url?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          posted_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["social_status"]
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          article_id?: string
          caption?: string | null
          created_at?: string
          hashtags?: string | null
          id?: string
          link_url?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          posted_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["social_status"]
          thumbnail_url?: string | null
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
      staff_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          staff_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          staff_id: string
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_blackouts: {
        Row: {
          blackout_date: string
          created_at: string
          id: string
          reason: string | null
          staff_id: string
        }
        Insert: {
          blackout_date: string
          created_at?: string
          id?: string
          reason?: string | null
          staff_id: string
        }
        Update: {
          blackout_date?: string
          created_at?: string
          id?: string
          reason?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_blackouts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          bio: string | null
          cover_image_url: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          instagram: string | null
          internal_notes: string | null
          is_bookable: boolean
          is_public: boolean
          location: string | null
          photo_url: string | null
          preferred_service_ids: string[]
          production_position: string | null
          role_title: string | null
          service_ids: string[]
          slug: string
          sort_order: number
          specialties: string[]
          status: string
          travel_radius_miles: number | null
          twitter: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          is_bookable?: boolean
          is_public?: boolean
          location?: string | null
          photo_url?: string | null
          preferred_service_ids?: string[]
          production_position?: string | null
          role_title?: string | null
          service_ids?: string[]
          slug: string
          sort_order?: number
          specialties?: string[]
          status?: string
          travel_radius_miles?: number | null
          twitter?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          is_bookable?: boolean
          is_public?: boolean
          location?: string | null
          photo_url?: string | null
          preferred_service_ids?: string[]
          production_position?: string | null
          role_title?: string | null
          service_ids?: string[]
          slug?: string
          sort_order?: number
          specialties?: string[]
          status?: string
          travel_radius_miles?: number | null
          twitter?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_hierarchy: {
        Row: {
          internal_title: string | null
          reports_to: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          internal_title?: string | null
          reports_to?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          internal_title?: string | null
          reports_to?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      workspace_settings: {
        Row: {
          config: Json
          section: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          section: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          section?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_article_view: { Args: { article_uuid: string }; Returns: undefined }
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
      app_role:
        | "admin"
        | "editor"
        | "writer"
        | "social_manager"
        | "head_admin"
        | "booking_manager"
        | "media_manager"
        | "social_articles_lead"
      article_status:
        | "draft"
        | "submitted"
        | "revisions"
        | "approved"
        | "published"
        | "scheduled"
        | "archived"
      article_type:
        | "standard"
        | "film_review"
        | "interview"
        | "opinion"
        | "breakdown"
        | "news"
        | "album_review"
        | "single_review"
        | "game_review"
      booking_status:
        | "new"
        | "contacted"
        | "negotiating"
        | "booked"
        | "completed"
        | "declined"
        | "pending_deposit"
      contact_method: "email" | "phone" | "text"
      film_verdict: "recommended" | "mixed" | "not_recommended"
      lead_source: "booking" | "newsletter" | "advertise" | "contact" | "other"
      shoot_type: "studio" | "location" | "hybrid"
      social_platform: "instagram" | "tiktok" | "x" | "youtube"
      social_status: "draft" | "ready" | "posted" | "scheduled" | "archived"
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
      app_role: [
        "admin",
        "editor",
        "writer",
        "social_manager",
        "head_admin",
        "booking_manager",
        "media_manager",
        "social_articles_lead",
      ],
      article_status: [
        "draft",
        "submitted",
        "revisions",
        "approved",
        "published",
        "scheduled",
        "archived",
      ],
      article_type: [
        "standard",
        "film_review",
        "interview",
        "opinion",
        "breakdown",
        "news",
        "album_review",
        "single_review",
        "game_review",
      ],
      booking_status: [
        "new",
        "contacted",
        "negotiating",
        "booked",
        "completed",
        "declined",
        "pending_deposit",
      ],
      contact_method: ["email", "phone", "text"],
      film_verdict: ["recommended", "mixed", "not_recommended"],
      lead_source: ["booking", "newsletter", "advertise", "contact", "other"],
      shoot_type: ["studio", "location", "hybrid"],
      social_platform: ["instagram", "tiktok", "x", "youtube"],
      social_status: ["draft", "ready", "posted", "scheduled", "archived"],
    },
  },
} as const
