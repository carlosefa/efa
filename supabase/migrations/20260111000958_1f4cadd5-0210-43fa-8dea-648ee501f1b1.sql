-- ============================================
-- EFA ESPORTS - CORE DATABASE SCHEMA (R1)
-- ============================================

-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM (
  'master', 'global_admin', 'country_admin', 'country_staff', 
  'org_admin', 'team_owner', 'coach', 'player'
);

CREATE TYPE public.tournament_format AS ENUM (
  'league', 'knockout', 'groups', 'swiss', 'groups_playoffs'
);

CREATE TYPE public.tournament_status AS ENUM (
  'draft', 'published', 'registrations_open', 'registrations_closed', 
  'in_progress', 'finished', 'cancelled'
);

CREATE TYPE public.match_status AS ENUM (
  'scheduled', 'pending_report', 'pending_confirm', 'disputed', 
  'finished', 'walkover', 'cancelled'
);

CREATE TYPE public.dispute_status AS ENUM (
  'open', 'under_review', 'resolved', 'escalated'
);

CREATE TYPE public.subscription_plan AS ENUM (
  'free', 'silver', 'gold', 'diamond'
);

CREATE TYPE public.stage_status AS ENUM (
  'pending', 'in_progress', 'finished'
);

-- ========== PROFILES (User Profiles) ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  country_code TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ========== USER ROLES (RBAC) ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  scope_type TEXT, -- 'GLOBAL', 'COUNTRY', 'ORG', 'TEAM', 'TOURNAMENT'
  scope_id UUID,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, scope_type, scope_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role_in_scope(_user_id UUID, _role app_role, _scope_type TEXT, _scope_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
      AND role = _role 
      AND (scope_type IS NULL OR (scope_type = _scope_type AND scope_id = _scope_id))
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'global_admin') OR public.has_role(auth.uid(), 'master'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'global_admin') OR public.has_role(auth.uid(), 'master'));

-- ========== COUNTRIES ==========
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN NOT NULL DEFAULT false,
  feature_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries are viewable by everyone"
  ON public.countries FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage countries"
  ON public.countries FOR ALL
  USING (public.has_role(auth.uid(), 'global_admin') OR public.has_role(auth.uid(), 'master'));

-- ========== ORGANIZATIONS ==========
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  country_id UUID REFERENCES public.countries(id),
  plan subscription_plan NOT NULL DEFAULT 'free',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are viewable by everyone"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Owners can update their organization"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ========== GAMES ==========
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_url TEXT,
  cover_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage games"
  ON public.games FOR ALL
  USING (public.has_role(auth.uid(), 'global_admin') OR public.has_role(auth.uid(), 'master'));

-- ========== GAME MODES ==========
CREATE TABLE public.game_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  team_size INTEGER NOT NULL DEFAULT 1,
  stat_fields JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, slug)
);

ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game modes are viewable by everyone"
  ON public.game_modes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage game modes"
  ON public.game_modes FOR ALL
  USING (public.has_role(auth.uid(), 'global_admin') OR public.has_role(auth.uid(), 'master'));

-- ========== RULESETS ==========
CREATE TABLE public.rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_mode_id UUID NOT NULL REFERENCES public.game_modes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rulesets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rulesets are viewable by everyone"
  ON public.rulesets FOR SELECT
  USING (true);

-- ========== TEAMS ==========
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  logo_url TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  country_id UUID REFERENCES public.countries(id),
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Owners can update their team"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their team"
  ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- ========== TEAM MEMBERSHIPS ==========
CREATE TABLE public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player', -- owner, coach, player, substitute
  jersey_number INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, profile_id)
);

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team memberships are viewable by everyone"
  ON public.team_memberships FOR SELECT
  USING (true);

CREATE POLICY "Team owners can manage memberships"
  ON public.team_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = team_memberships.team_id 
      AND teams.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave teams"
  ON public.team_memberships FOR DELETE
  USING (profile_id = auth.uid());

-- ========== TOURNAMENTS ==========
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  game_mode_id UUID NOT NULL REFERENCES public.game_modes(id),
  ruleset_id UUID REFERENCES public.rulesets(id),
  format tournament_format NOT NULL DEFAULT 'league',
  status tournament_status NOT NULL DEFAULT 'draft',
  max_teams INTEGER NOT NULL DEFAULT 16,
  min_teams INTEGER NOT NULL DEFAULT 2,
  prize_description TEXT,
  rules_text TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  registration_starts_at TIMESTAMPTZ,
  registration_ends_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  country_id UUID REFERENCES public.countries(id),
  is_international BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (status != 'draft' OR created_by = auth.uid());

CREATE POLICY "Creators can manage their tournaments"
  ON public.tournaments FOR ALL
  USING (created_by = auth.uid());

-- ========== TOURNAMENT REGISTRATIONS ==========
CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  registered_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected, withdrawn
  seed INTEGER,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, team_id)
);

ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registrations are viewable by everyone"
  ON public.tournament_registrations FOR SELECT
  USING (true);

CREATE POLICY "Team owners can register"
  ON public.tournament_registrations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id = tournament_registrations.team_id 
      AND teams.owner_id = auth.uid()
    )
  );

CREATE POLICY "Tournament creators can manage registrations"
  ON public.tournament_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments 
      WHERE tournaments.id = tournament_registrations.tournament_id 
      AND tournaments.created_by = auth.uid()
    )
  );

-- ========== STAGES ==========
CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format tournament_format NOT NULL,
  stage_order INTEGER NOT NULL DEFAULT 1,
  config JSONB DEFAULT '{}',
  status stage_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stages are viewable by everyone"
  ON public.stages FOR SELECT
  USING (true);

CREATE POLICY "Tournament creators can manage stages"
  ON public.stages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments 
      WHERE tournaments.id = stages.tournament_id 
      AND tournaments.created_by = auth.uid()
    )
  );

-- ========== FIXTURES ==========
CREATE TABLE public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  match_number INTEGER NOT NULL DEFAULT 1,
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  scheduled_at TIMESTAMPTZ,
  is_bye BOOLEAN NOT NULL DEFAULT false,
  bracket_position TEXT, -- For knockout: 'QF1', 'SF1', 'F', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fixtures are viewable by everyone"
  ON public.fixtures FOR SELECT
  USING (true);

CREATE POLICY "Stage managers can manage fixtures"
  ON public.fixtures FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stages s
      JOIN public.tournaments t ON t.id = s.tournament_id
      WHERE s.id = fixtures.stage_id 
      AND t.created_by = auth.uid()
    )
  );

-- ========== MATCHES ==========
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES public.teams(id),
  away_team_id UUID NOT NULL REFERENCES public.teams(id),
  status match_status NOT NULL DEFAULT 'scheduled',
  home_score INTEGER,
  away_score INTEGER,
  winner_team_id UUID REFERENCES public.teams(id),
  reported_by UUID REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id),
  decided_by UUID REFERENCES auth.users(id),
  decision_reason TEXT,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Team owners can report matches"
  ON public.matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teams 
      WHERE teams.id IN (matches.home_team_id, matches.away_team_id) 
      AND teams.owner_id = auth.uid()
    )
  );

-- ========== MATCH EVENTS (Audit Log) ==========
CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'result_reported', 'result_confirmed', 'dispute_opened', 'admin_decision', etc.
  actor_id UUID REFERENCES auth.users(id),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match events are viewable by participants"
  ON public.match_events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.match_events FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- ========== DISPUTES ==========
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  evidence_urls TEXT[],
  resolved_by UUID REFERENCES auth.users(id),
  resolution_reason TEXT,
  sla_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disputes are viewable by participants"
  ON public.disputes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can open disputes"
  ON public.disputes FOR INSERT
  WITH CHECK (auth.uid() = opened_by);

CREATE POLICY "Admins can resolve disputes"
  ON public.disputes FOR UPDATE
  USING (public.has_role(auth.uid(), 'global_admin') OR public.has_role(auth.uid(), 'country_admin'));

-- ========== STANDINGS ==========
CREATE TABLE public.standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  group_number INTEGER DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  drawn INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stage_id, team_id)
);

ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Standings are viewable by everyone"
  ON public.standings FOR SELECT
  USING (true);

-- ========== RATING PROFILES (Rankings) ==========
CREATE TABLE public.rating_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_mode_id UUID NOT NULL REFERENCES public.game_modes(id) ON DELETE CASCADE,
  country_id UUID REFERENCES public.countries(id),
  rating DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
  uncertainty DECIMAL(10,2) NOT NULL DEFAULT 350.00,
  matches_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  last_match_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, game_mode_id)
);

ALTER TABLE public.rating_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone"
  ON public.rating_profiles FOR SELECT
  USING (true);

-- ========== NOTIFICATIONS ==========
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (profile_id = auth.uid());

-- ========== TRIGGERS ==========

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== INITIAL DATA ==========

-- Insert default countries
INSERT INTO public.countries (code, name, timezone, is_active) VALUES
  ('BR', 'Brasil', 'America/Sao_Paulo', true),
  ('PT', 'Portugal', 'Europe/Lisbon', true),
  ('US', 'Estados Unidos', 'America/New_York', false),
  ('AR', 'Argentina', 'America/Argentina/Buenos_Aires', false),
  ('MX', 'México', 'America/Mexico_City', false);

-- Insert default games
INSERT INTO public.games (name, slug, is_active) VALUES
  ('EA FC 25', 'ea-fc-25', true),
  ('Valorant', 'valorant', true),
  ('Counter-Strike 2', 'cs2', true),
  ('Fortnite', 'fortnite', true),
  ('League of Legends', 'lol', true);

-- Insert game modes
INSERT INTO public.game_modes (game_id, name, slug, team_size, stat_fields) VALUES
  ((SELECT id FROM public.games WHERE slug = 'ea-fc-25'), 'Pro Clubs 11v11', 'clubs-11v11', 11, '["goals", "assists", "rating"]'),
  ((SELECT id FROM public.games WHERE slug = 'ea-fc-25'), 'Pro Clubs 5v5', 'clubs-5v5', 5, '["goals", "assists", "rating"]'),
  ((SELECT id FROM public.games WHERE slug = 'ea-fc-25'), 'Ultimate Team 1v1', 'fut-1v1', 1, '["goals", "possession"]'),
  ((SELECT id FROM public.games WHERE slug = 'valorant'), '5v5 Competitive', '5v5', 5, '["kills", "deaths", "assists", "acs"]'),
  ((SELECT id FROM public.games WHERE slug = 'cs2'), '5v5 Competitive', '5v5', 5, '["kills", "deaths", "assists", "adr"]'),
  ((SELECT id FROM public.games WHERE slug = 'fortnite'), 'Solo', 'solo', 1, '["placement", "kills", "damage"]'),
  ((SELECT id FROM public.games WHERE slug = 'fortnite'), 'Duo', 'duo', 2, '["placement", "kills", "damage"]'),
  ((SELECT id FROM public.games WHERE slug = 'lol'), '5v5 Summoner Rift', '5v5-sr', 5, '["kills", "deaths", "assists", "cs"]');

-- Insert default rulesets
INSERT INTO public.rulesets (game_mode_id, name, config, is_default) VALUES
  ((SELECT id FROM public.game_modes WHERE slug = 'clubs-11v11'), 'Liga Padrão', '{"legs": 1, "overtime_enabled": true, "walkover_score": [3, 0], "tiebreakers": ["goal_difference", "goals_for", "head_to_head"], "confirmation_timeout_hours": 24, "dispute_timeout_hours": 48}', true),
  ((SELECT id FROM public.game_modes WHERE slug = 'fut-1v1'), 'BO1 Padrão', '{"legs": 1, "overtime_enabled": true, "walkover_score": [3, 0], "confirmation_timeout_hours": 24, "dispute_timeout_hours": 48}', true),
  ((SELECT id FROM public.game_modes WHERE slug = '5v5' AND game_id = (SELECT id FROM games WHERE slug = 'valorant')), 'BO3 Padrão', '{"legs": 3, "overtime_enabled": true, "walkover_score": [2, 0], "confirmation_timeout_hours": 24, "dispute_timeout_hours": 48}', true);