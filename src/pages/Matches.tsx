import { useState } from "react";
import { Link } from "react-router-dom";
import { Swords, Filter, Calendar, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMatches } from "@/hooks/useMatches";

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Agendada", icon: Calendar, variant: "secondary" },
  pending_report: { label: "Aguardando Reporte", icon: Clock, variant: "outline" },
  pending_confirm: { label: "Aguardando Confirmação", icon: Clock, variant: "default" },
  disputed: { label: "Em Disputa", icon: AlertCircle, variant: "destructive" },
  finished: { label: "Finalizada", icon: CheckCircle2, variant: "outline" },
  walkover: { label: "W.O.", icon: AlertCircle, variant: "destructive" },
  cancelled: { label: "Cancelada", icon: AlertCircle, variant: "destructive" },
};

interface MatchWithTeams {
  id: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  played_at: string | null;
  home_team?: { id: string; name: string; tag: string } | null;
  away_team?: { id: string; name: string; tag: string } | null;
  fixture?: { round: number; stage?: { tournament?: { name: string } | null } | null } | null;
}

function MatchCard({ match }: { match: MatchWithTeams }) {
  const status = statusConfig[match.status] || { label: match.status, icon: Clock, variant: "outline" as const };
  const StatusIcon = status.icon;
  const isFinished = match.status === "finished" || match.status === "pending_confirm";
  const tournamentName = match.fixture?.stage?.tournament?.name || "Torneio";
  const round = match.fixture?.round || 1;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{tournamentName}</span>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between py-4">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                {match.home_team?.tag?.slice(0, 3) || "TM1"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{match.home_team?.name || "Time Casa"}</p>
              <p className="text-xs text-muted-foreground">[{match.home_team?.tag}]</p>
            </div>
          </div>

          {/* Score */}
          <div className="px-6">
            {isFinished ? (
              <div className="flex items-center gap-2 text-2xl font-bold">
                <span className={match.home_score! > match.away_score! ? "text-primary" : ""}>
                  {match.home_score}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className={match.away_score! > match.home_score! ? "text-primary" : ""}>
                  {match.away_score}
                </span>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium">VS</p>
                {match.played_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(match.played_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 justify-end text-right">
            <div>
              <p className="font-medium">{match.away_team?.name || "Time Fora"}</p>
              <p className="text-xs text-muted-foreground">[{match.away_team?.tag}]</p>
            </div>
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarFallback className="rounded-lg bg-secondary/10 text-secondary font-bold">
                {match.away_team?.tag?.slice(0, 3) || "TM2"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">Rodada {round}</span>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/matches/${match.id}`}>Ver detalhes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Matches() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: matches, isLoading } = useMatches();

  const filteredMatches = matches?.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["pending_report", "pending_confirm"].includes(m.status);
    if (activeTab === "disputed") return m.status === "disputed";
    if (activeTab === "finished") return m.status === "finished";
    return m.status === activeTab;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            Partidas
          </h1>
          <p className="text-muted-foreground">Acompanhe e gerencie suas partidas</p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="disputed">Em Disputa</TabsTrigger>
          <TabsTrigger value="finished">Finalizadas</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Swords className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  Nenhuma partida encontrada
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
