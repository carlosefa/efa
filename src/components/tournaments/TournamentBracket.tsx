import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useStageFixtures } from "@/hooks/useTournaments";
import { Tables } from "@/integrations/supabase/types";

interface TournamentBracketProps {
  stages: Tables<"stages">[];
  tournamentId: string;
}

interface FixtureWithTeams {
  id: string;
  round: number;
  match_number: number;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team?: { id: string; name: string; tag: string; logo_url: string | null } | null;
  away_team?: { id: string; name: string; tag: string; logo_url: string | null } | null;
  matches?: { id: string; status: string; home_score: number | null; away_score: number | null; winner_team_id: string | null }[];
}

export function TournamentBracket({ stages, tournamentId }: TournamentBracketProps) {
  const knockoutStage = stages.find(s => s.format === "knockout");
  const { data: fixtures } = useStageFixtures(knockoutStage?.id || "");

  const rounds = useMemo(() => {
    if (!fixtures) return [];
    const grouped: Record<number, FixtureWithTeams[]> = {};
    fixtures.forEach((fix: FixtureWithTeams) => {
      if (!grouped[fix.round]) grouped[fix.round] = [];
      grouped[fix.round].push(fix);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([round, matches]) => ({ round: Number(round), matches }));
  }, [fixtures]);

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Final";
    if (round === totalRounds - 1) return "Semifinal";
    if (round === totalRounds - 2) return "Quartas";
    return `Rodada ${round}`;
  };

  if (!knockoutStage) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Este torneio não possui fase de mata-mata
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bracket ainda não foi gerado
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {rounds.map(({ round, matches }) => (
          <div key={round} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground text-center">
              {getRoundName(round, rounds.length)}
            </h3>
            <div className="flex flex-col gap-4" style={{ marginTop: `${Math.pow(2, round - 1) * 20}px` }}>
              {matches.map((fixture) => (
                <BracketMatch key={fixture.id} fixture={fixture} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatch({ fixture }: { fixture: FixtureWithTeams }) {
  const match = fixture.matches?.[0];
  const homeTeam = fixture.home_team;
  const awayTeam = fixture.away_team;
  const isFinished = match?.status === "finished";

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden w-56">
      {/* Home Team */}
      <div className={`flex items-center gap-2 p-2 border-b border-border ${
        isFinished && match?.winner_team_id === homeTeam?.id ? "bg-primary/10" : ""
      }`}>
        {homeTeam ? (
          <>
            <Avatar className="h-6 w-6 rounded">
              <AvatarFallback className="text-xs rounded bg-muted">
                {homeTeam.tag?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm truncate font-medium">{homeTeam.name}</span>
            {isFinished && (
              <span className={`text-sm font-bold ${match?.winner_team_id === homeTeam.id ? "text-primary" : ""}`}>
                {match?.home_score}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground italic">TBD</span>
        )}
      </div>

      {/* Away Team */}
      <div className={`flex items-center gap-2 p-2 ${
        isFinished && match?.winner_team_id === awayTeam?.id ? "bg-primary/10" : ""
      }`}>
        {awayTeam ? (
          <>
            <Avatar className="h-6 w-6 rounded">
              <AvatarFallback className="text-xs rounded bg-muted">
                {awayTeam.tag?.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm truncate font-medium">{awayTeam.name}</span>
            {isFinished && (
              <span className={`text-sm font-bold ${match?.winner_team_id === awayTeam.id ? "text-primary" : ""}`}>
                {match?.away_score}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground italic">TBD</span>
        )}
      </div>

      {/* Match Link */}
      {match && (
        <Link
          to={`/matches/${match.id}`}
          className="block text-center py-1 text-xs text-primary hover:underline border-t border-border"
        >
          Ver partida
        </Link>
      )}
    </div>
  );
}
