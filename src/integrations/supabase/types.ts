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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          efa_coins_reward: number
          icon: string
          id: string
          is_active: boolean
          name: string
          requirement_type: string
          requirement_value: number
          slug: string
          tier: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          efa_coins_reward?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          requirement_type: string
          requirement_value?: number
          slug: string
          tier?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          efa_coins_reward?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          requirement_type?: string
          requirement_value?: number
          slug?: string
          tier?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          country_code: string | null
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          country_code?: string | null
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          country_code?: string | null
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          file_url: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
          thread_id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id: string
          thread_id: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
          thread_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          muted_until: string | null
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
          role?: string
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          team_id: string | null
          tournament_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          team_id?: string | null
          tournament_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          team_id?: string | null
          tournament_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_threads_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_batches: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          original_amount: number
          remaining_amount: number
          source_reference: string | null
          source_type: string
          wallet_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          original_amount: number
          remaining_amount: number
          source_reference?: string | null
          source_type: string
          wallet_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          original_amount?: number
          remaining_amount?: number
          source_reference?: string | null
          source_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_batches_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_grants: {
        Row: {
          amount: number
          batch_id: string | null
          created_at: string
          expires_in_days: number | null
          granted_by: string | null
          id: string
          reason: string
          wallet_id: string
        }
        Insert: {
          amount: number
          batch_id?: string | null
          created_at?: string
          expires_in_days?: number | null
          granted_by?: string | null
          id?: string
          reason: string
          wallet_id: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          created_at?: string
          expires_in_days?: number | null
          granted_by?: string | null
          id?: string
          reason?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_grants_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "coin_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_grants_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_packages: {
        Row: {
          bonus_coins: number
          coins: number
          created_at: string
          currency: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          price_cents: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bonus_coins?: number
          coins: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bonus_coins?: number
          coins?: number
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          feature_flags: Json | null
          id: string
          is_active: boolean
          name: string
          timezone: string
        }
        Insert: {
          code: string
          created_at?: string
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          name: string
          timezone?: string
        }
        Update: {
          code?: string
          created_at?: string
          feature_flags?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          timezone?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          evidence_urls: string[] | null
          id: string
          match_id: string
          opened_by: string
          reason: string
          resolution_reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_deadline: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          match_id: string
          opened_by: string
          reason: string
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          match_id?: string
          opened_by?: string
          reason?: string
          resolution_reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_deadline?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          away_team_id: string | null
          bracket_position: string | null
          created_at: string
          home_team_id: string | null
          id: string
          is_bye: boolean
          match_number: number
          round: number
          scheduled_at: string | null
          stage_id: string
        }
        Insert: {
          away_team_id?: string | null
          bracket_position?: string | null
          created_at?: string
          home_team_id?: string | null
          id?: string
          is_bye?: boolean
          match_number?: number
          round?: number
          scheduled_at?: string | null
          stage_id: string
        }
        Update: {
          away_team_id?: string | null
          bracket_position?: string | null
          created_at?: string
          home_team_id?: string | null
          id?: string
          is_bye?: boolean
          match_number?: number
          round?: number
          scheduled_at?: string | null
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      friendly_invites: {
        Row: {
          created_at: string
          expires_at: string
          from_team_id: string | null
          from_user_id: string | null
          game_id: string
          id: string
          message: string | null
          mode_id: string | null
          scheduled_at: string | null
          status: string
          to_team_id: string | null
          to_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          from_team_id?: string | null
          from_user_id?: string | null
          game_id: string
          id?: string
          message?: string | null
          mode_id?: string | null
          scheduled_at?: string | null
          status?: string
          to_team_id?: string | null
          to_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          from_team_id?: string | null
          from_user_id?: string | null
          game_id?: string
          id?: string
          message?: string | null
          mode_id?: string | null
          scheduled_at?: string | null
          status?: string
          to_team_id?: string | null
          to_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendly_invites_from_team_id_fkey"
            columns: ["from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_invites_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_invites_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_invites_mode_id_fkey"
            columns: ["mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_invites_to_team_id_fkey"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_invites_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friendly_matches: {
        Row: {
          created_at: string
          game_id: string
          id: string
          invite_id: string | null
          mode_id: string | null
          played_at: string | null
          player1_id: string | null
          player2_id: string | null
          score1: number | null
          score2: number | null
          status: string
          team1_id: string | null
          team2_id: string | null
          updated_at: string
          winner_player_id: string | null
          winner_team_id: string | null
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          invite_id?: string | null
          mode_id?: string | null
          played_at?: string | null
          player1_id?: string | null
          player2_id?: string | null
          score1?: number | null
          score2?: number | null
          status?: string
          team1_id?: string | null
          team2_id?: string | null
          updated_at?: string
          winner_player_id?: string | null
          winner_team_id?: string | null
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          invite_id?: string | null
          mode_id?: string | null
          played_at?: string | null
          player1_id?: string | null
          player2_id?: string | null
          score1?: number | null
          score2?: number | null
          status?: string
          team1_id?: string | null
          team2_id?: string | null
          updated_at?: string
          winner_player_id?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendly_matches_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "friendly_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_mode_id_fkey"
            columns: ["mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_winner_player_id_fkey"
            columns: ["winner_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendly_matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_modes: {
        Row: {
          created_at: string
          game_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
          stat_fields: Json | null
          team_size: number
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          stat_fields?: Json | null
          team_size?: number
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          stat_fields?: Json | null
          team_size?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_modes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          cover_url: string | null
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      match_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          match_id: string
          payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          match_id: string
          payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          confirmed_by: string | null
          created_at: string
          decided_by: string | null
          decision_reason: string | null
          fixture_id: string
          home_score: number | null
          home_team_id: string
          id: string
          played_at: string | null
          reported_by: string | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          winner_team_id: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          confirmed_by?: string | null
          created_at?: string
          decided_by?: string | null
          decision_reason?: string | null
          fixture_id: string
          home_score?: number | null
          home_team_id: string
          id?: string
          played_at?: string | null
          reported_by?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          winner_team_id?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          confirmed_by?: string | null
          created_at?: string
          decided_by?: string | null
          decision_reason?: string | null
          fixture_id?: string
          home_score?: number | null
          home_team_id?: string
          id?: string
          played_at?: string | null
          reported_by?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_by: string
          action_type: string
          case_id: string
          created_at: string
          duration_hours: number | null
          expires_at: string | null
          id: string
          reason: string
        }
        Insert: {
          action_by: string
          action_type: string
          case_id: string
          created_at?: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          reason: string
        }
        Update: {
          action_by?: string
          action_type?: string
          case_id?: string
          created_at?: string
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_action_by_fkey"
            columns: ["action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_cases: {
        Row: {
          assigned_to: string | null
          country_code: string | null
          created_at: string
          description: string | null
          evidence_urls: string[] | null
          id: string
          priority: string
          reason: string
          reported_content_id: string | null
          reported_content_type: string
          reported_team_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          priority?: string
          reason: string
          reported_content_id?: string | null
          reported_content_type: string
          reported_team_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          country_code?: string | null
          created_at?: string
          description?: string | null
          evidence_urls?: string[] | null
          id?: string
          priority?: string
          reason?: string
          reported_content_id?: string | null
          reported_content_type?: string
          reported_team_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "moderation_cases_reported_team_id_fkey"
            columns: ["reported_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          profile_id: string
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          profile_id: string
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          profile_id?: string
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country_id: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          logo_url: string | null
          name: string
          owner_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          slug: string
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          slug: string
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country_code: string | null
          created_at: string
          display_name: string | null
          id: string
          timezone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rating_profiles: {
        Row: {
          country_id: string | null
          game_mode_id: string
          id: string
          last_match_at: string | null
          losses: number
          matches_played: number
          profile_id: string
          rating: number
          uncertainty: number
          updated_at: string
          wins: number
        }
        Insert: {
          country_id?: string | null
          game_mode_id: string
          id?: string
          last_match_at?: string | null
          losses?: number
          matches_played?: number
          profile_id: string
          rating?: number
          uncertainty?: number
          updated_at?: string
          wins?: number
        }
        Update: {
          country_id?: string | null
          game_mode_id?: string
          id?: string
          last_match_at?: string | null
          losses?: number
          matches_played?: number
          profile_id?: string
          rating?: number
          uncertainty?: number
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "rating_profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_profiles_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rulesets: {
        Row: {
          config: Json
          created_at: string
          game_mode_id: string
          id: string
          is_default: boolean
          name: string
          version: number
        }
        Insert: {
          config?: Json
          created_at?: string
          game_mode_id: string
          id?: string
          is_default?: boolean
          name: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          game_mode_id?: string
          id?: string
          is_default?: boolean
          name?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rulesets_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          available_from: string | null
          available_until: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          limited_quantity: number | null
          name: string
          price: number
          sold_count: number
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          limited_quantity?: number | null
          name: string
          price: number
          sold_count?: number
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          limited_quantity?: number | null
          name?: string
          price?: number
          sold_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      stages: {
        Row: {
          config: Json | null
          created_at: string
          format: Database["public"]["Enums"]["tournament_format"]
          id: string
          name: string
          stage_order: number
          status: Database["public"]["Enums"]["stage_status"]
          tournament_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          format: Database["public"]["Enums"]["tournament_format"]
          id?: string
          name: string
          stage_order?: number
          status?: Database["public"]["Enums"]["stage_status"]
          tournament_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          format?: Database["public"]["Enums"]["tournament_format"]
          id?: string
          name?: string
          stage_order?: number
          status?: Database["public"]["Enums"]["stage_status"]
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      standings: {
        Row: {
          drawn: number
          goal_difference: number
          goals_against: number
          goals_for: number
          group_number: number | null
          id: string
          lost: number
          played: number
          points: number
          position: number
          stage_id: string
          team_id: string
          updated_at: string
          won: number
        }
        Insert: {
          drawn?: number
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          group_number?: number | null
          id?: string
          lost?: number
          played?: number
          points?: number
          position?: number
          stage_id: string
          team_id: string
          updated_at?: string
          won?: number
        }
        Update: {
          drawn?: number
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          group_number?: number | null
          id?: string
          lost?: number
          played?: number
          points?: number
          position?: number
          stage_id?: string
          team_id?: string
          updated_at?: string
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string | null
          invited_user_id: string | null
          message: string | null
          responded_at: string | null
          role: string
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_email?: string | null
          invited_user_id?: string | null
          message?: string | null
          responded_at?: string | null
          role?: string
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string | null
          invited_user_id?: string | null
          message?: string | null
          responded_at?: string | null
          role?: string
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          id: string
          jersey_number: number | null
          joined_at: string
          profile_id: string
          role: string
          team_id: string
        }
        Insert: {
          id?: string
          jersey_number?: number | null
          joined_at?: string
          profile_id: string
          role?: string
          team_id: string
        }
        Update: {
          id?: string
          jersey_number?: number | null
          joined_at?: string
          profile_id?: string
          role?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          country_id: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          organization_id: string | null
          owner_id: string | null
          tag: string
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          organization_id?: string | null
          owner_id?: string | null
          tag: string
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          owner_id?: string | null
          tag?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          id: string
          registered_at: string
          registered_by: string | null
          seed: number | null
          status: string
          team_id: string
          tournament_id: string
        }
        Insert: {
          id?: string
          registered_at?: string
          registered_by?: string | null
          seed?: number | null
          status?: string
          team_id: string
          tournament_id: string
        }
        Update: {
          id?: string
          registered_at?: string
          registered_by?: string | null
          seed?: number | null
          status?: string
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          country_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          format: Database["public"]["Enums"]["tournament_format"]
          game_mode_id: string
          id: string
          is_international: boolean
          max_teams: number
          min_teams: number
          name: string
          organization_id: string | null
          prize_description: string | null
          registration_ends_at: string | null
          registration_starts_at: string | null
          rules_text: string | null
          ruleset_id: string | null
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["tournament_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          game_mode_id: string
          id?: string
          is_international?: boolean
          max_teams?: number
          min_teams?: number
          name: string
          organization_id?: string | null
          prize_description?: string | null
          registration_ends_at?: string | null
          registration_starts_at?: string | null
          rules_text?: string | null
          ruleset_id?: string | null
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          game_mode_id?: string
          id?: string
          is_international?: boolean
          max_teams?: number
          min_teams?: number
          name?: string
          organization_id?: string | null
          prize_description?: string | null
          registration_ends_at?: string | null
          registration_starts_at?: string | null
          rules_text?: string | null
          ruleset_id?: string | null
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["tournament_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_game_mode_id_fkey"
            columns: ["game_mode_id"]
            isOneToOne: false
            referencedRelation: "game_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          batch_id: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          batch_id?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          batch_id?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "coin_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          id: string
          progress: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          id?: string
          progress?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          id: string
          is_equipped: boolean
          item_id: string
          purchased_at: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean
          item_id: string
          purchased_at?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean
          item_id?: string
          purchased_at?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_restrictions: {
        Row: {
          case_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          issued_by: string | null
          reason: string
          restriction_type: string
          starts_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_by?: string | null
          reason: string
          restriction_type: string
          starts_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_by?: string | null
          reason?: string
          restriction_type?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_restrictions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_restrictions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          scope_id: string | null
          scope_type: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          scope_id?: string | null
          scope_type?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          scope_id?: string | null
          scope_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      platform_stats: {
        Row: {
          active_countries: number | null
          total_efa_coins: number | null
          total_matches: number | null
          total_organizations: number | null
          total_teams: number | null
          total_tournaments: number | null
          total_transactions: number | null
          total_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_role_by_email: {
        Args: {
          granter_id?: string
          target_email: string
          target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      consume_coins: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: boolean
      }
      expire_coin_batches: { Args: never; Returns: number }
      get_country_stats: {
        Args: { country_code_param: string }
        Returns: {
          matches_count: number
          teams_count: number
          tournaments_count: number
          users_count: number
        }[]
      }
      get_team_rankings: {
        Args: { limit_count?: number }
        Returns: {
          country_code: string
          draws: number
          losses: number
          team_id: string
          team_logo_url: string
          team_name: string
          team_tag: string
          total_matches: number
          total_points: number
          win_rate: number
          wins: number
        }[]
      }
      grant_coins: {
        Args: {
          p_amount: number
          p_expires_in_days?: number
          p_granted_by?: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_scope: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _scope_id: string
          _scope_type: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "master"
        | "global_admin"
        | "country_admin"
        | "country_staff"
        | "org_admin"
        | "team_owner"
        | "coach"
        | "player"
      dispute_status: "open" | "under_review" | "resolved" | "escalated"
      match_status:
        | "scheduled"
        | "pending_report"
        | "pending_confirm"
        | "disputed"
        | "finished"
        | "walkover"
        | "cancelled"
      stage_status: "pending" | "in_progress" | "finished"
      subscription_plan: "free" | "silver" | "gold" | "diamond"
      tournament_format:
        | "league"
        | "knockout"
        | "groups"
        | "swiss"
        | "groups_playoffs"
      tournament_status:
        | "draft"
        | "published"
        | "registrations_open"
        | "registrations_closed"
        | "in_progress"
        | "finished"
        | "cancelled"
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
      app_role: [
        "master",
        "global_admin",
        "country_admin",
        "country_staff",
        "org_admin",
        "team_owner",
        "coach",
        "player",
      ],
      dispute_status: ["open", "under_review", "resolved", "escalated"],
      match_status: [
        "scheduled",
        "pending_report",
        "pending_confirm",
        "disputed",
        "finished",
        "walkover",
        "cancelled",
      ],
      stage_status: ["pending", "in_progress", "finished"],
      subscription_plan: ["free", "silver", "gold", "diamond"],
      tournament_format: [
        "league",
        "knockout",
        "groups",
        "swiss",
        "groups_playoffs",
      ],
      tournament_status: [
        "draft",
        "published",
        "registrations_open",
        "registrations_closed",
        "in_progress",
        "finished",
        "cancelled",
      ],
    },
  },
} as const
