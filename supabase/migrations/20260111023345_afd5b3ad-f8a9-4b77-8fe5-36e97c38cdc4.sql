-- ===========================================
-- 1. Tabela de Convites para Times
-- ===========================================
CREATE TABLE public.team_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  role TEXT NOT NULL DEFAULT 'player',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_team_invites_team_id ON public.team_invites(team_id);
CREATE INDEX idx_team_invites_invited_user_id ON public.team_invites(invited_user_id);
CREATE INDEX idx_team_invites_status ON public.team_invites(status);

-- Enable RLS
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Team owners/coaches can manage invites"
ON public.team_invites
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE team_memberships.team_id = team_invites.team_id
    AND team_memberships.profile_id = auth.uid()
    AND team_memberships.role IN ('owner', 'coach')
  )
);

CREATE POLICY "Users can see their own invites"
ON public.team_invites
FOR SELECT
USING (invited_user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can respond to their invites"
ON public.team_invites
FOR UPDATE
USING (invited_user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (invited_user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON public.team_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 2. Tabela de Audit Logs para Admin
-- ===========================================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  target_name TEXT,
  details TEXT,
  ip_address TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS - apenas admins podem ver
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'master') OR 
  public.has_role(auth.uid(), 'global_admin') OR
  public.has_role(auth.uid(), 'country_admin')
);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- ===========================================
-- 3. Storage Buckets para Imagens
-- ===========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('team-logos', 'team-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage - Avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Políticas de Storage - Team Logos
CREATE POLICY "Anyone can view team logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

CREATE POLICY "Team owners can upload logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-logos' AND 
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can update logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-logos' AND 
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Team owners can delete logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-logos' AND 
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id::text = (storage.foldername(name))[1]
    AND owner_id = auth.uid()
  )
);

-- ===========================================
-- 4. View para estatísticas globais (Admin)
-- ===========================================
CREATE OR REPLACE VIEW public.platform_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.teams) as total_teams,
  (SELECT COUNT(*) FROM public.tournaments) as total_tournaments,
  (SELECT COUNT(*) FROM public.matches) as total_matches,
  (SELECT COUNT(*) FROM public.organizations) as total_organizations,
  (SELECT COUNT(DISTINCT code) FROM public.countries WHERE is_active = true) as active_countries,
  (SELECT COALESCE(SUM(balance), 0) FROM public.wallets) as total_efa_coins,
  (SELECT COUNT(*) FROM public.transactions) as total_transactions;

-- ===========================================
-- 5. Função para estatísticas por país
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_country_stats(country_code_param TEXT)
RETURNS TABLE (
  users_count BIGINT,
  teams_count BIGINT,
  tournaments_count BIGINT,
  matches_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.profiles WHERE country_code = country_code_param),
    (SELECT COUNT(*) FROM public.teams t JOIN public.countries c ON t.country_id = c.id WHERE c.code = country_code_param),
    (SELECT COUNT(*) FROM public.tournaments t JOIN public.countries c ON t.country_id = c.id WHERE c.code = country_code_param),
    (SELECT COUNT(*) FROM public.matches m 
     JOIN public.fixtures f ON m.fixture_id = f.id 
     JOIN public.stages s ON f.stage_id = s.id 
     JOIN public.tournaments t ON s.tournament_id = t.id 
     JOIN public.countries c ON t.country_id = c.id 
     WHERE c.code = country_code_param);
$$;

-- ===========================================
-- 6. Função para ranking de times
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_team_rankings(limit_count INT DEFAULT 50)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_tag TEXT,
  team_logo_url TEXT,
  country_code TEXT,
  total_matches BIGINT,
  wins BIGINT,
  losses BIGINT,
  draws BIGINT,
  win_rate NUMERIC,
  total_points BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id as team_id,
    t.name as team_name,
    t.tag as team_tag,
    t.logo_url as team_logo_url,
    c.code as country_code,
    COUNT(DISTINCT m.id) as total_matches,
    COUNT(DISTINCT CASE WHEN m.winner_team_id = t.id THEN m.id END) as wins,
    COUNT(DISTINCT CASE WHEN m.status = 'finished' AND m.winner_team_id IS NOT NULL AND m.winner_team_id != t.id THEN m.id END) as losses,
    COUNT(DISTINCT CASE WHEN m.status = 'finished' AND m.winner_team_id IS NULL THEN m.id END) as draws,
    CASE 
      WHEN COUNT(DISTINCT m.id) > 0 THEN 
        ROUND(COUNT(DISTINCT CASE WHEN m.winner_team_id = t.id THEN m.id END)::NUMERIC / COUNT(DISTINCT m.id) * 100, 1)
      ELSE 0 
    END as win_rate,
    COALESCE(SUM(st.points), 0) as total_points
  FROM public.teams t
  LEFT JOIN public.countries c ON t.country_id = c.id
  LEFT JOIN public.matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.status = 'finished'
  LEFT JOIN public.standings st ON st.team_id = t.id
  GROUP BY t.id, t.name, t.tag, t.logo_url, c.code
  HAVING COUNT(DISTINCT m.id) >= 5
  ORDER BY wins DESC, win_rate DESC, total_matches DESC
  LIMIT limit_count;
$$;