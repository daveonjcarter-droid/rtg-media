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
      admin_invites: {
        Row: {
          app_roles: Database["public"]["Enums"]["app_role"][]
          created_at: string
          created_by: string | null
          email: string
          email_error: string | null
          email_sent: boolean
          email_sent_at: string | null
          expires_at: string | null
          id: string
          invite_code: string
          role_type: string
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          app_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          created_by?: string | null
          email: string
          email_error?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code: string
          role_type: string
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          app_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          created_by?: string | null
          email?: string
          email_error?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          expires_at?: string | null
          id?: string
          invite_code?: string
          role_type?: string
          status?: string
          used_at?: string | null
          used_by?: string | null
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
      analytics_events: {
        Row: {
          article_id: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          metadata: Json
          page_path: string | null
          referrer: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      application_rate_limits: {
        Row: {
          created_at: string
          email: string | null
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          availability: string
          captcha_verified: boolean
          city: string
          completeness_score: number
          created_at: string
          email: string
          email_verified: boolean
          experience: string
          experience_level:
            | Database["public"]["Enums"]["application_experience"]
            | null
          full_name: string
          id: string
          instagram_url: string | null
          internal_notes: string | null
          invite_id: string | null
          invited_at: string | null
          ip_address: string | null
          is_low_priority: boolean
          linkedin_url: string | null
          phone: string
          portfolio_url: string
          priority: Database["public"]["Enums"]["application_priority"]
          resume_filename: string | null
          resume_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_applying_for: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_agent: string | null
          why_join: string
        }
        Insert: {
          availability: string
          captcha_verified?: boolean
          city: string
          completeness_score?: number
          created_at?: string
          email: string
          email_verified?: boolean
          experience: string
          experience_level?:
            | Database["public"]["Enums"]["application_experience"]
            | null
          full_name: string
          id?: string
          instagram_url?: string | null
          internal_notes?: string | null
          invite_id?: string | null
          invited_at?: string | null
          ip_address?: string | null
          is_low_priority?: boolean
          linkedin_url?: string | null
          phone: string
          portfolio_url: string
          priority?: Database["public"]["Enums"]["application_priority"]
          resume_filename?: string | null
          resume_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_applying_for: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_agent?: string | null
          why_join: string
        }
        Update: {
          availability?: string
          captcha_verified?: boolean
          city?: string
          completeness_score?: number
          created_at?: string
          email?: string
          email_verified?: boolean
          experience?: string
          experience_level?:
            | Database["public"]["Enums"]["application_experience"]
            | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          internal_notes?: string | null
          invite_id?: string | null
          invited_at?: string | null
          ip_address?: string | null
          is_low_priority?: boolean
          linkedin_url?: string | null
          phone?: string
          portfolio_url?: string
          priority?: Database["public"]["Enums"]["application_priority"]
          resume_filename?: string | null
          resume_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_applying_for?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_agent?: string | null
          why_join?: string
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
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          after_data: Json | null
          before_data: Json | null
          changed_fields: string[]
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json
          summary: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[]
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json
          summary?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[]
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json
          summary?: string | null
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
          client_id: string | null
          created_at: string
          crew_price_modifier: number
          crew_request_type: string
          crew_response_notes: string | null
          crew_response_status: string
          deposit_paid: boolean
          description: string | null
          duration: string | null
          email: string
          equipment_cost: number | null
          id: string
          instagram: string | null
          internal_assignment_locked: boolean
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
          service_details: Json
          service_id: string | null
          service_type: string | null
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
          client_id?: string | null
          created_at?: string
          crew_price_modifier?: number
          crew_request_type?: string
          crew_response_notes?: string | null
          crew_response_status?: string
          deposit_paid?: boolean
          description?: string | null
          duration?: string | null
          email: string
          equipment_cost?: number | null
          id?: string
          instagram?: string | null
          internal_assignment_locked?: boolean
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
          service_details?: Json
          service_id?: string | null
          service_type?: string | null
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
          client_id?: string | null
          created_at?: string
          crew_price_modifier?: number
          crew_request_type?: string
          crew_response_notes?: string | null
          crew_response_status?: string
          deposit_paid?: boolean
          description?: string | null
          duration?: string | null
          email?: string
          equipment_cost?: number | null
          id?: string
          instagram?: string | null
          internal_assignment_locked?: boolean
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
          service_details?: Json
          service_id?: string | null
          service_type?: string | null
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
      calendar_events: {
        Row: {
          all_day: boolean
          assigned_user_ids: string[]
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          id: string
          location: string | null
          related_id: string | null
          related_type: Database["public"]["Enums"]["calendar_related_type"]
          start_time: string
          status: Database["public"]["Enums"]["calendar_event_status"]
          title: string
          type: Database["public"]["Enums"]["calendar_event_type"]
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          assigned_user_ids?: string[]
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          related_id?: string | null
          related_type?: Database["public"]["Enums"]["calendar_related_type"]
          start_time: string
          status?: Database["public"]["Enums"]["calendar_event_status"]
          title: string
          type?: Database["public"]["Enums"]["calendar_event_type"]
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          assigned_user_ids?: string[]
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          related_id?: string | null
          related_type?: Database["public"]["Enums"]["calendar_related_type"]
          start_time?: string
          status?: Database["public"]["Enums"]["calendar_event_status"]
          title?: string
          type?: Database["public"]["Enums"]["calendar_event_type"]
          updated_at?: string
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
      clients: {
        Row: {
          artist_name: string | null
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          tags: string[]
          total_spend: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          artist_name?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[]
          total_spend?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          artist_name?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tags?: string[]
          total_spend?: number
          updated_at?: string
          user_id?: string | null
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
      crew_assignments: {
        Row: {
          booking_id: string
          call_time: string | null
          created_at: string
          created_by: string | null
          id: string
          is_backup: boolean
          notes: string | null
          pay_rate: number | null
          role_label: string
          sort_order: number
          staff_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          call_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_backup?: boolean
          notes?: string | null
          pay_rate?: number | null
          role_label: string
          sort_order?: number
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          call_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_backup?: boolean
          notes?: string | null
          pay_rate?: number | null
          role_label?: string
          sort_order?: number
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crew_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      invited_users: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          availability_required: boolean
          created_at: string
          default_rate: number | null
          email: string
          email_delivery_status: string
          email_error: string | null
          email_sent_at: string | null
          expires_at: string | null
          full_name: string | null
          id: string
          internal_title: string | null
          invite_code: string | null
          invite_token: string | null
          invite_type: string
          invite_url: string | null
          invited_by: string | null
          notes: string | null
          portfolio_required: boolean
          reports_to: string | null
          roles: Database["public"]["Enums"]["app_role"][]
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          availability_required?: boolean
          created_at?: string
          default_rate?: number | null
          email: string
          email_delivery_status?: string
          email_error?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          full_name?: string | null
          id?: string
          internal_title?: string | null
          invite_code?: string | null
          invite_token?: string | null
          invite_type?: string
          invite_url?: string | null
          invited_by?: string | null
          notes?: string | null
          portfolio_required?: boolean
          reports_to?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          availability_required?: boolean
          created_at?: string
          default_rate?: number | null
          email?: string
          email_delivery_status?: string
          email_error?: string | null
          email_sent_at?: string | null
          expires_at?: string | null
          full_name?: string | null
          id?: string
          internal_title?: string | null
          invite_code?: string | null
          invite_token?: string | null
          invite_type?: string
          invite_url?: string | null
          invited_by?: string | null
          notes?: string | null
          portfolio_required?: boolean
          reports_to?: string | null
          roles?: Database["public"]["Enums"]["app_role"][]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          booking_id: string | null
          client_id: string | null
          created_at: string
          created_by: string
          currency: string
          due_date: string | null
          id: string
          issued_at: string | null
          number: string | null
          paid_at: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_provider: Database["public"]["Enums"]["payment_provider"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_url: string | null
          project_id: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          booking_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          due_date?: string | null
          id?: string
          issued_at?: string | null
          number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_provider?: Database["public"]["Enums"]["payment_provider"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_url?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          booking_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          due_date?: string | null
          id?: string
          issued_at?: string | null
          number?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_provider?: Database["public"]["Enums"]["payment_provider"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_url?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
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
      message_threads: {
        Row: {
          booking_id: string | null
          client_id: string | null
          client_visible: boolean
          created_at: string
          created_by: string
          id: string
          kind: Database["public"]["Enums"]["thread_kind"]
          last_message_at: string | null
          participant_ids: string[]
          project_id: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          client_id?: string | null
          client_visible?: boolean
          created_at?: string
          created_by: string
          id?: string
          kind?: Database["public"]["Enums"]["thread_kind"]
          last_message_at?: string | null
          participant_ids?: string[]
          project_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          client_id?: string | null
          client_visible?: boolean
          created_at?: string
          created_by?: string
          id?: string
          kind?: Database["public"]["Enums"]["thread_kind"]
          last_message_at?: string | null
          participant_ids?: string[]
          project_id?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          mentions: string[]
          read_by: string[]
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          mentions?: string[]
          read_by?: string[]
          sender_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          mentions?: string[]
          read_by?: string[]
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link_url: string | null
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link_url?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link_url?: string | null
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          user_id?: string
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
          approval_status: string
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
          submitted_by: string | null
          tags: string[]
          thumbnail_url: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          approval_status?: string
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
          submitted_by?: string | null
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          approval_status?: string
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
          submitted_by?: string | null
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
      profile_meta: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          internal_notes: string | null
          profile_photo_url: string | null
          profile_type: string
          role_type: string | null
          social_links: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          profile_photo_url?: string | null
          profile_type?: string
          role_type?: string | null
          social_links?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          profile_photo_url?: string | null
          profile_type?: string
          role_type?: string | null
          social_links?: Json
          status?: string
          updated_at?: string
          user_id?: string
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
      project_clients: {
        Row: {
          client_id: string
          created_at: string
          is_primary: boolean
          project_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          is_primary?: boolean
          project_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          is_primary?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_clients_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["project_priority"]
          project_id: string | null
          related_article_id: string | null
          related_booking_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          project_id?: string | null
          related_article_id?: string | null
          related_booking_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["project_priority"]
          project_id?: string | null
          related_article_id?: string | null
          related_booking_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_user_ids: string[]
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: Database["public"]["Enums"]["project_priority"]
          project_manager_id: string | null
          related_article_id: string | null
          related_booking_id: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          assigned_user_ids?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["project_priority"]
          project_manager_id?: string | null
          related_article_id?: string | null
          related_booking_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          assigned_user_ids?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: Database["public"]["Enums"]["project_priority"]
          project_manager_id?: string | null
          related_article_id?: string | null
          related_booking_id?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: []
      }
      quote_line_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          label: string
          qty: number
          quote_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          label: string
          qty?: number
          quote_id: string
          sort_order?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          label?: string
          qty?: number
          quote_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          addons_total: number
          approved_at: string | null
          base_price: number
          booking_id: string | null
          client_id: string | null
          created_at: string
          created_by: string
          currency: string
          discount: number
          id: string
          notes: string | null
          number: string | null
          project_id: string | null
          rejected_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          tax: number
          title: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          addons_total?: number
          approved_at?: string | null
          base_price?: number
          booking_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          discount?: number
          id?: string
          notes?: string | null
          number?: string | null
          project_id?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tax?: number
          title?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          addons_total?: number
          approved_at?: string | null
          base_price?: number
          booking_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          discount?: number
          id?: string
          notes?: string | null
          number?: string | null
          project_id?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tax?: number
          title?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          access_analytics: boolean
          access_articles: boolean
          access_audit: boolean
          access_bookings: boolean
          access_calendar: boolean
          access_dashboard: boolean
          access_invites: boolean
          access_pricing: boolean
          access_production: boolean
          access_role_management: boolean
          access_staff: boolean
          access_website_content: boolean
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
          access_analytics?: boolean
          access_articles?: boolean
          access_audit?: boolean
          access_bookings?: boolean
          access_calendar?: boolean
          access_dashboard?: boolean
          access_invites?: boolean
          access_pricing?: boolean
          access_production?: boolean
          access_role_management?: boolean
          access_staff?: boolean
          access_website_content?: boolean
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
          access_analytics?: boolean
          access_articles?: boolean
          access_audit?: boolean
          access_bookings?: boolean
          access_calendar?: boolean
          access_dashboard?: boolean
          access_invites?: boolean
          access_pricing?: boolean
          access_production?: boolean
          access_role_management?: boolean
          access_staff?: boolean
          access_website_content?: boolean
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
          available_crew_packages: string[]
          base_price: number | null
          cover_image_url: string | null
          created_at: string
          default_crew_package: string
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
          available_crew_packages?: string[]
          base_price?: number | null
          cover_image_url?: string | null
          created_at?: string
          default_crew_package?: string
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
          available_crew_packages?: string[]
          base_price?: number | null
          cover_image_url?: string | null
          created_at?: string
          default_crew_package?: string
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
      signup_code_redemptions: {
        Row: {
          code_id: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signup_code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "signup_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          label: string | null
          max_uses: number
          status: string
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          max_uses?: number
          status?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          max_uses?: number
          status?: string
          updated_at?: string
          used_count?: number
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
          is_recurring: boolean
          notes: string | null
          staff_id: string
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          staff_id: string
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          staff_id?: string
          start_time?: string
          updated_at?: string
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
          accepting_bookings: boolean
          availability_notes: string | null
          availability_updated_at: string | null
          bio: string | null
          booking_notes: string | null
          cover_image_url: string | null
          created_at: string
          day_rate: number | null
          display_name: string
          email: string | null
          equipment: string | null
          hourly_rate: number | null
          id: string
          instagram: string | null
          internal_notes: string | null
          is_bookable: boolean
          is_crew: boolean
          is_featured: boolean
          is_public: boolean
          location: string | null
          phone: string | null
          photo_url: string | null
          preferred_service_ids: string[]
          production_position: string | null
          reel_links: Json
          role_title: string | null
          service_ids: string[]
          show_email_publicly: boolean
          show_phone_publicly: boolean
          skills: string[]
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
          accepting_bookings?: boolean
          availability_notes?: string | null
          availability_updated_at?: string | null
          bio?: string | null
          booking_notes?: string | null
          cover_image_url?: string | null
          created_at?: string
          day_rate?: number | null
          display_name: string
          email?: string | null
          equipment?: string | null
          hourly_rate?: number | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          is_bookable?: boolean
          is_crew?: boolean
          is_featured?: boolean
          is_public?: boolean
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_service_ids?: string[]
          production_position?: string | null
          reel_links?: Json
          role_title?: string | null
          service_ids?: string[]
          show_email_publicly?: boolean
          show_phone_publicly?: boolean
          skills?: string[]
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
          accepting_bookings?: boolean
          availability_notes?: string | null
          availability_updated_at?: string | null
          bio?: string | null
          booking_notes?: string | null
          cover_image_url?: string | null
          created_at?: string
          day_rate?: number | null
          display_name?: string
          email?: string | null
          equipment?: string | null
          hourly_rate?: number | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          is_bookable?: boolean
          is_crew?: boolean
          is_featured?: boolean
          is_public?: boolean
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          preferred_service_ids?: string[]
          production_position?: string | null
          reel_links?: Json
          role_title?: string | null
          service_ids?: string[]
          show_email_publicly?: boolean
          show_phone_publicly?: boolean
          skills?: string[]
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
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
      can_access_thread: {
        Args: { _thread_id: string; _uid: string }
        Returns: boolean
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      fn_notify: {
        Args: {
          _body: string
          _kind: string
          _link: string
          _related_id: string
          _related_type: string
          _title: string
          _user_id: string
        }
        Returns: undefined
      }
      generate_invite_code: { Args: never; Returns: string }
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
      is_calendar_ops: { Args: { _uid: string }; Returns: boolean }
      is_pm_or_admin: { Args: { _uid: string }; Returns: boolean }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      link_staff_profile_to_user: {
        Args: { _profile_id: string; _user_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      redeem_admin_invite: {
        Args: { _code: string; _email: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      redeem_signup_code: {
        Args: { _code: string; _user_id: string }
        Returns: boolean
      }
      validate_signup_code: { Args: { _code: string }; Returns: Json }
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
        | "crew"
        | "photographer"
        | "videographer"
        | "video_editor"
        | "director"
        | "producer"
        | "audio_engineer"
        | "grip_lighting"
        | "makeup_artist"
        | "production_assistant"
        | "studio_staff"
        | "owner"
        | "co_ceo"
        | "journalist"
        | "designer"
        | "intern"
        | "client"
        | "project_manager"
      application_experience:
        | "none"
        | "beginner"
        | "intermediate"
        | "professional"
      application_priority: "low" | "normal" | "high"
      application_status:
        | "new"
        | "strong"
        | "needs_review"
        | "rejected"
        | "approved"
        | "invited"
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
      calendar_event_status: "scheduled" | "completed" | "canceled"
      calendar_event_type:
        | "shoot"
        | "interview"
        | "article_deadline"
        | "edit_deadline"
        | "client_booking"
        | "team_meeting"
        | "release_date"
        | "content_drop"
        | "personal_block"
      calendar_related_type: "article" | "booking" | "project" | "none"
      client_status: "lead" | "active" | "past" | "vip"
      contact_method: "email" | "phone" | "text"
      film_verdict: "recommended" | "mixed" | "not_recommended"
      invoice_status:
        | "draft"
        | "sent"
        | "partial"
        | "paid"
        | "overdue"
        | "void"
        | "refunded"
      lead_source: "booking" | "newsletter" | "advertise" | "contact" | "other"
      payment_provider: "manual" | "stripe"
      payment_status: "unpaid" | "partial" | "paid" | "failed" | "refunded"
      project_priority: "low" | "normal" | "high" | "urgent"
      project_status:
        | "idea"
        | "planning"
        | "active"
        | "editing"
        | "review"
        | "completed"
        | "archived"
      project_type:
        | "article"
        | "shoot"
        | "music_video"
        | "film"
        | "event"
        | "campaign"
        | "client_booking"
        | "internal"
      quote_status: "draft" | "sent" | "approved" | "rejected" | "expired"
      shoot_type: "studio" | "location" | "hybrid"
      social_platform: "instagram" | "tiktok" | "x" | "youtube"
      social_status: "draft" | "ready" | "posted" | "scheduled" | "archived"
      task_status: "todo" | "in_progress" | "blocked" | "review" | "completed"
      thread_kind: "project" | "booking" | "client" | "direct" | "team"
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
        "crew",
        "photographer",
        "videographer",
        "video_editor",
        "director",
        "producer",
        "audio_engineer",
        "grip_lighting",
        "makeup_artist",
        "production_assistant",
        "studio_staff",
        "owner",
        "co_ceo",
        "journalist",
        "designer",
        "intern",
        "client",
        "project_manager",
      ],
      application_experience: [
        "none",
        "beginner",
        "intermediate",
        "professional",
      ],
      application_priority: ["low", "normal", "high"],
      application_status: [
        "new",
        "strong",
        "needs_review",
        "rejected",
        "approved",
        "invited",
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
      calendar_event_status: ["scheduled", "completed", "canceled"],
      calendar_event_type: [
        "shoot",
        "interview",
        "article_deadline",
        "edit_deadline",
        "client_booking",
        "team_meeting",
        "release_date",
        "content_drop",
        "personal_block",
      ],
      calendar_related_type: ["article", "booking", "project", "none"],
      client_status: ["lead", "active", "past", "vip"],
      contact_method: ["email", "phone", "text"],
      film_verdict: ["recommended", "mixed", "not_recommended"],
      invoice_status: [
        "draft",
        "sent",
        "partial",
        "paid",
        "overdue",
        "void",
        "refunded",
      ],
      lead_source: ["booking", "newsletter", "advertise", "contact", "other"],
      payment_provider: ["manual", "stripe"],
      payment_status: ["unpaid", "partial", "paid", "failed", "refunded"],
      project_priority: ["low", "normal", "high", "urgent"],
      project_status: [
        "idea",
        "planning",
        "active",
        "editing",
        "review",
        "completed",
        "archived",
      ],
      project_type: [
        "article",
        "shoot",
        "music_video",
        "film",
        "event",
        "campaign",
        "client_booking",
        "internal",
      ],
      quote_status: ["draft", "sent", "approved", "rejected", "expired"],
      shoot_type: ["studio", "location", "hybrid"],
      social_platform: ["instagram", "tiktok", "x", "youtube"],
      social_status: ["draft", "ready", "posted", "scheduled", "archived"],
      task_status: ["todo", "in_progress", "blocked", "review", "completed"],
      thread_kind: ["project", "booking", "client", "direct", "team"],
    },
  },
} as const
