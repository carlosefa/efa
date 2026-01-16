
-- =====================================================
-- FRIENDLIES (AMISTOSOS) SYSTEM
-- =====================================================

CREATE TABLE public.friendly_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  to_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  mode_id UUID REFERENCES public.game_modes(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friendly_invite_type CHECK (
    (from_user_id IS NOT NULL AND to_user_id IS NOT NULL AND from_team_id IS NULL AND to_team_id IS NULL) OR
    (from_team_id IS NOT NULL AND to_team_id IS NOT NULL AND from_user_id IS NULL AND to_user_id IS NULL)
  )
);

CREATE TABLE public.friendly_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID REFERENCES public.friendly_invites(id) ON DELETE SET NULL,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  mode_id UUID REFERENCES public.game_modes(id) ON DELETE SET NULL,
  player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  team1_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  team2_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  score1 INTEGER,
  score2 INTEGER,
  winner_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friendly_match_type CHECK (
    (player1_id IS NOT NULL AND player2_id IS NOT NULL AND team1_id IS NULL AND team2_id IS NULL) OR
    (team1_id IS NOT NULL AND team2_id IS NOT NULL AND player1_id IS NULL AND player2_id IS NULL)
  )
);

-- =====================================================
-- CHAT SYSTEM
-- =====================================================

CREATE TABLE public.chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct', 'team', 'tournament', 'group')),
  name TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  last_read_at TIMESTAMPTZ,
  muted_until TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- MODERATION SYSTEM
-- =====================================================

CREATE TABLE public.moderation_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  reported_content_type TEXT NOT NULL CHECK (reported_content_type IN ('user', 'team', 'message', 'match', 'tournament')),
  reported_content_id UUID,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'cheating', 'inappropriate_content', 'impersonation', 'match_fixing', 'other')),
  description TEXT,
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  country_code TEXT REFERENCES public.countries(code) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.moderation_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
  action_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'mute', 'temp_ban', 'perm_ban', 'content_removal', 'restriction', 'dismiss', 'escalate')),
  reason TEXT NOT NULL,
  duration_hours INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('muted', 'chat_banned', 'match_banned', 'tournament_banned', 'fully_banned')),
  reason TEXT NOT NULL,
  case_id UUID REFERENCES public.moderation_cases(id) ON DELETE SET NULL,
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ECONOMY SYSTEM (EFA COINS)
-- =====================================================

CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned DECIMAL(12,2) NOT NULL DEFAULT 0,
  lifetime_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category TEXT NOT NULL CHECK (category IN ('purchase', 'reward', 'prize', 'refund', 'transfer_in', 'transfer_out', 'admin_adjustment')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  balance_after DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shop_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('avatar', 'banner', 'badge', 'title', 'boost', 'other')),
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  limited_quantity INTEGER,
  sold_count INTEGER NOT NULL DEFAULT 0,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.friendly_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendly_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - FRIENDLIES (using team_memberships)
-- =====================================================

CREATE POLICY "Users can view their friendly invites" ON public.friendly_invites
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id OR
    from_team_id IN (SELECT team_id FROM team_memberships WHERE profile_id = auth.uid()) OR
    to_team_id IN (SELECT team_id FROM team_memberships WHERE profile_id = auth.uid())
  );

CREATE POLICY "Users can create friendly invites" ON public.friendly_invites
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id OR
    from_team_id IN (SELECT team_id FROM team_memberships WHERE profile_id = auth.uid() AND role IN ('owner', 'captain'))
  );

CREATE POLICY "Users can update their own invites" ON public.friendly_invites
  FOR UPDATE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id OR
    from_team_id IN (SELECT team_id FROM team_memberships WHERE profile_id = auth.uid() AND role IN ('owner', 'captain')) OR
    to_team_id IN (SELECT team_id FROM team_memberships WHERE profile_id = auth.uid() AND role IN ('owner', 'captain'))
  );

CREATE POLICY "Users can view their friendly matches" ON public.friendly_matches
  FOR SELECT USING (
    auth.uid() = player1_id OR auth.uid() = player2_id OR
    team1_id IN (SELECT team_id FROM team_memberships WHERE profile_id = auth.uid()) OR
    team2_id IN (SELECT team_id FROM team_memberships WHERE profile_id = auth.uid())
  );

CREATE POLICY "Users can create friendly matches" ON public.friendly_matches
  FOR INSERT WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Users can update their friendly matches" ON public.friendly_matches
  FOR UPDATE USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- =====================================================
-- RLS POLICIES - CHAT
-- =====================================================

CREATE POLICY "Users can view threads they participate in" ON public.chat_threads
  FOR SELECT USING (
    id IN (SELECT thread_id FROM chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create threads" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their participations" ON public.chat_participants
  FOR SELECT USING (user_id = auth.uid() OR thread_id IN (
    SELECT thread_id FROM chat_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can join threads" ON public.chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Thread owners can manage participants" ON public.chat_participants
  FOR UPDATE USING (
    thread_id IN (SELECT thread_id FROM chat_participants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Thread owners can remove participants" ON public.chat_participants
  FOR DELETE USING (
    user_id = auth.uid() OR
    thread_id IN (SELECT thread_id FROM chat_participants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Users can view messages in their threads" ON public.chat_messages
  FOR SELECT USING (
    thread_id IN (SELECT thread_id FROM chat_participants WHERE user_id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can send messages to their threads" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    thread_id IN (SELECT thread_id FROM chat_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can edit their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- RLS POLICIES - MODERATION
-- =====================================================

CREATE POLICY "Users can view their own reports" ON public.moderation_cases
  FOR SELECT USING (
    auth.uid() = reporter_id OR
    auth.uid() = reported_user_id OR
    has_role(auth.uid(), 'country_admin') OR
    has_role(auth.uid(), 'global_admin') OR
    has_role(auth.uid(), 'master')
  );

CREATE POLICY "Users can create reports" ON public.moderation_cases
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update cases" ON public.moderation_cases
  FOR UPDATE USING (
    has_role(auth.uid(), 'country_admin') OR
    has_role(auth.uid(), 'global_admin') OR
    has_role(auth.uid(), 'master')
  );

CREATE POLICY "Admins can view moderation actions" ON public.moderation_actions
  FOR SELECT USING (
    has_role(auth.uid(), 'country_admin') OR
    has_role(auth.uid(), 'global_admin') OR
    has_role(auth.uid(), 'master')
  );

CREATE POLICY "Admins can create moderation actions" ON public.moderation_actions
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'country_admin') OR
    has_role(auth.uid(), 'global_admin') OR
    has_role(auth.uid(), 'master')
  );

CREATE POLICY "Users can view their own restrictions" ON public.user_restrictions
  FOR SELECT USING (
    auth.uid() = user_id OR
    has_role(auth.uid(), 'country_admin') OR
    has_role(auth.uid(), 'global_admin') OR
    has_role(auth.uid(), 'master')
  );

CREATE POLICY "Admins can manage restrictions" ON public.user_restrictions
  FOR ALL USING (
    has_role(auth.uid(), 'country_admin') OR
    has_role(auth.uid(), 'global_admin') OR
    has_role(auth.uid(), 'master')
  );

-- =====================================================
-- RLS POLICIES - ECONOMY
-- =====================================================

CREATE POLICY "Users can view their own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System creates wallets" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (
    wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view active shop items" ON public.shop_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage shop items" ON public.shop_items
  FOR ALL USING (
    has_role(auth.uid(), 'global_admin') OR
    has_role(auth.uid(), 'master')
  );

CREATE POLICY "Users can view their inventory" ON public.user_inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their inventory" ON public.user_inventory
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- REALTIME FOR CHAT
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_friendly_invites_updated_at BEFORE UPDATE ON public.friendly_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendly_matches_updated_at BEFORE UPDATE ON public.friendly_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_cases_updated_at BEFORE UPDATE ON public.moderation_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON public.shop_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Create wallet on profile creation
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_profile_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_created_create_wallet
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile_wallet();
