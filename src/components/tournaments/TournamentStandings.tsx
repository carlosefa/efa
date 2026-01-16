import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useStageStandings } from "@/hooks/useTournaments";
import { Tables } from "@/integrations/supabase/types";

interface TournamentStandingsProps {
  stages: Tables<"stages">[];
}

interface StandingWithTeam extends Tables<"standings"> {
  teams?: Tables<"teams"> | null;
}

export function TournamentStandings({ stages }: TournamentStandingsProps) {
  const leagueStage = stages.find(s => s.format === "league" || s.format === "groups");
  const { data: standings } = useStageStandings(leagueStage?.id || "");

  if (!leagueStage) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Este torneio não possui classificação de pontos
      </div>
    );
  }

  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Classificação ainda não disponível
      </div>
    );
  }

  // Group by group_number if it's a groups format
  const groups = standings.reduce((acc: Record<number, StandingWithTeam[]>, s: StandingWithTeam) => {
    const group = s.group_number || 1;
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupNum, groupStandings]) => (
        <div key={groupNum}>
          {Object.keys(groups).length > 1 && (
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">
              Grupo {groupNum}
            </h4>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2 w-8">#</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-center py-2 px-2">J</th>
                  <th className="text-center py-2 px-2">V</th>
                  <th className="text-center py-2 px-2">E</th>
                  <th className="text-center py-2 px-2">D</th>
                  <th className="text-center py-2 px-2">GP</th>
                  <th className="text-center py-2 px-2">GC</th>
                  <th className="text-center py-2 px-2">SG</th>
                  <th className="text-center py-2 px-2 font-semibold">PTS</th>
                </tr>
              </thead>
              <tbody>
                {(groupStandings as StandingWithTeam[])
                  .sort((a, b) => a.position - b.position)
                  .map((standing, index) => {
                    const isTop = index < 2;
                    const team = standing.teams;

                    return (
                      <tr
                        key={standing.id}
                        className={`border-b border-border/50 hover:bg-muted/30 ${
                          isTop ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="py-3 px-2">
                          <span className={`font-bold ${isTop ? "text-primary" : ""}`}>
                            {standing.position}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            to={`/teams/${standing.team_id}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <Avatar className="h-6 w-6 rounded">
                              <AvatarFallback className="text-xs rounded bg-muted">
                                {team?.tag?.slice(0, 2) || "TM"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{team?.name || "Time"}</span>
                          </Link>
                        </td>
                        <td className="text-center py-3 px-2">{standing.played}</td>
                        <td className="text-center py-3 px-2 text-green-500">{standing.won}</td>
                        <td className="text-center py-3 px-2">{standing.drawn}</td>
                        <td className="text-center py-3 px-2 text-destructive">{standing.lost}</td>
                        <td className="text-center py-3 px-2">{standing.goals_for}</td>
                        <td className="text-center py-3 px-2">{standing.goals_against}</td>
                        <td className="text-center py-3 px-2">
                          <span className={standing.goal_difference > 0 ? "text-green-500" : standing.goal_difference < 0 ? "text-destructive" : ""}>
                            {standing.goal_difference > 0 ? "+" : ""}{standing.goal_difference}
                          </span>
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className="font-bold text-lg">{standing.points}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
