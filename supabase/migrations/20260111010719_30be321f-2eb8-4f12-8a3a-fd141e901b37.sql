-- Create achievements table (badge definitions)
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  category TEXT NOT NULL DEFAULT 'general',
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  efa_coins_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table (earned achievements)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (has_role(auth.uid(), 'global_admin') OR has_role(auth.uid(), 'master'));

-- RLS policies for user_achievements
CREATE POLICY "Users can view all unlocked achievements"
  ON public.user_achievements FOR SELECT
  USING (unlocked_at IS NOT NULL OR user_id = auth.uid());

CREATE POLICY "System can manage user achievements"
  ON public.user_achievements FOR ALL
  USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (slug, name, description, icon, category, tier, requirement_type, requirement_value, efa_coins_reward) VALUES
-- Vitórias
('first_win', 'Primeira Vitória', 'Vença sua primeira partida', 'trophy', 'wins', 'bronze', 'wins', 1, 10),
('wins_10', 'Vencedor', 'Vença 10 partidas', 'trophy', 'wins', 'silver', 'wins', 10, 50),
('wins_50', 'Campeão', 'Vença 50 partidas', 'trophy', 'wins', 'gold', 'wins', 50, 200),
('wins_100', 'Lenda', 'Vença 100 partidas', 'crown', 'wins', 'platinum', 'wins', 100, 500),
('wins_500', 'Imortal', 'Vença 500 partidas', 'crown', 'wins', 'diamond', 'wins', 500, 2000),

-- Torneios
('first_tournament', 'Estreia', 'Participe do seu primeiro torneio', 'medal', 'tournaments', 'bronze', 'tournaments_played', 1, 20),
('tournaments_5', 'Competidor', 'Participe de 5 torneios', 'medal', 'tournaments', 'silver', 'tournaments_played', 5, 100),
('tournaments_20', 'Veterano', 'Participe de 20 torneios', 'medal', 'tournaments', 'gold', 'tournaments_played', 20, 400),
('tournament_win', 'Campeão de Torneio', 'Vença um torneio', 'award', 'tournaments', 'gold', 'tournaments_won', 1, 500),
('tournament_wins_5', 'Multi-Campeão', 'Vença 5 torneios', 'award', 'tournaments', 'diamond', 'tournaments_won', 5, 2500),

-- Partidas
('matches_10', 'Iniciante', 'Jogue 10 partidas', 'gamepad-2', 'matches', 'bronze', 'matches_played', 10, 15),
('matches_50', 'Jogador', 'Jogue 50 partidas', 'gamepad-2', 'matches', 'silver', 'matches_played', 50, 75),
('matches_200', 'Dedicado', 'Jogue 200 partidas', 'gamepad-2', 'matches', 'gold', 'matches_played', 200, 300),
('matches_1000', 'Incansável', 'Jogue 1000 partidas', 'gamepad-2', 'matches', 'diamond', 'matches_played', 1000, 1500),

-- Sequências
('win_streak_3', 'Em Alta', 'Vença 3 partidas seguidas', 'flame', 'streaks', 'bronze', 'win_streak', 3, 30),
('win_streak_5', 'Imparável', 'Vença 5 partidas seguidas', 'flame', 'streaks', 'silver', 'win_streak', 5, 75),
('win_streak_10', 'Dominante', 'Vença 10 partidas seguidas', 'flame', 'streaks', 'gold', 'win_streak', 10, 200),

-- Social
('first_team', 'Trabalho em Equipe', 'Entre em um time', 'users', 'social', 'bronze', 'teams_joined', 1, 15),
('team_owner', 'Líder', 'Crie seu próprio time', 'shield', 'social', 'silver', 'teams_created', 1, 50),
('friendly_10', 'Amigável', 'Jogue 10 amistosos', 'handshake', 'social', 'bronze', 'friendlies_played', 10, 25);