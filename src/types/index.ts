// EFA Esports - Core Types

// ============ ENUMS ============
export type AppRole = 'master' | 'global_admin' | 'country_admin' | 'country_staff' | 'org_admin' | 'team_owner' | 'coach' | 'player';

export type TournamentFormat = 'league' | 'knockout' | 'groups' | 'swiss' | 'groups_playoffs';

export type TournamentStatus = 'draft' | 'published' | 'in_progress' | 'finished' | 'cancelled';

export type MatchStatus = 'scheduled' | 'pending_report' | 'pending_confirm' | 'disputed' | 'finished' | 'walkover';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';

export type SubscriptionPlan = 'free' | 'silver' | 'gold' | 'diamond';

// ============ CORE ENTITIES ============
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  country_code?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  timezone: string;
  is_active: boolean;
  feature_flags: Record<string, boolean>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  country_id: string;
  plan: SubscriptionPlan;
  is_verified: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url?: string;
  organization_id?: string;
  country_id: string;
  created_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  profile_id: string;
  role: 'owner' | 'coach' | 'player' | 'substitute';
  jersey_number?: number;
  joined_at: string;
}

// ============ GAMES ============
export interface Game {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
  is_active: boolean;
}

export interface GameMode {
  id: string;
  game_id: string;
  name: string;
  slug: string;
  team_size: number;
  stat_fields: string[];
}

export interface Ruleset {
  id: string;
  game_mode_id: string;
  name: string;
  version: number;
  config: RulesetConfig;
  is_default: boolean;
}

export interface RulesetConfig {
  legs: number;
  overtime_enabled: boolean;
  walkover_score: [number, number];
  tiebreakers: string[];
  confirmation_timeout_hours: number;
  dispute_timeout_hours: number;
}

// ============ TOURNAMENTS ============
export interface Tournament {
  id: string;
  name: string;
  slug: string;
  organization_id: string;
  game_mode_id: string;
  ruleset_id: string;
  format: TournamentFormat;
  status: TournamentStatus;
  max_teams: number;
  prize_description?: string;
  starts_at: string;
  ends_at?: string;
  timezone: string;
  created_at: string;
  created_by: string;
}

export interface Stage {
  id: string;
  tournament_id: string;
  name: string;
  format: TournamentFormat;
  order: number;
  config: StageConfig;
  status: 'pending' | 'in_progress' | 'finished';
}

export interface StageConfig {
  groups_count?: number;
  teams_per_group?: number;
  advance_count?: number;
  rounds?: number;
}

export interface Fixture {
  id: string;
  stage_id: string;
  round: number;
  match_number: number;
  home_team_id?: string;
  away_team_id?: string;
  scheduled_at?: string;
  is_bye: boolean;
}

// ============ MATCHES ============
export interface Match {
  id: string;
  fixture_id: string;
  home_team_id: string;
  away_team_id: string;
  status: MatchStatus;
  home_score?: number;
  away_score?: number;
  winner_team_id?: string;
  reported_by?: string;
  confirmed_by?: string;
  decided_by?: string;
  decision_reason?: string;
  played_at?: string;
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  event_type: string;
  actor_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Dispute {
  id: string;
  match_id: string;
  opened_by: string;
  reason: string;
  status: DisputeStatus;
  evidence_urls: string[];
  resolved_by?: string;
  resolution_reason?: string;
  created_at: string;
  resolved_at?: string;
}

// ============ STANDINGS & RANKINGS ============
export interface Standing {
  id: string;
  stage_id: string;
  team_id: string;
  group_number?: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface RatingProfile {
  id: string;
  profile_id: string;
  game_mode_id: string;
  country_id?: string;
  rating: number;
  uncertainty: number;
  matches_played: number;
  last_match_at?: string;
}

// ============ SOCIAL ============
export interface ChatThread {
  id: string;
  context_type: 'match' | 'tournament' | 'team' | 'direct';
  context_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

// ============ ECONOMY (OPTIONAL) ============
export interface Wallet {
  id: string;
  profile_id: string;
  balance: number;
  reserved: number;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit' | 'reserve' | 'release';
  amount: number;
  reason: string;
  idempotency_key?: string;
  created_at: string;
}

// ============ UI HELPERS ============
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  requiredRole?: AppRole[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}
