import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Trophy, Calendar, Users, MapPin, Clock, Shield, 
  ChevronRight, Medal, Gamepad2, FileText, ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTournament, useTournamentRegistrations, useTournamentStages } from "@/hooks/useTournaments";
import { useAuth } from "@/contexts/AuthContext";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { TournamentStandings } from "@/components/tournaments/TournamentStandings";
import { RegisterTeamDialog } from "@/components/tournaments/RegisterTeamDialog";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  published: { label: "Publicado", variant: "secondary" },
  registrations_open: { label: "Inscrições Abertas", variant: "default" },
  registrations_closed: { label: "Inscrições Encerradas", variant: "secondary" },
  in_progress: { label: "Em Andamento", variant: "default" },
  finished: { label: "Finalizado", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const formatLabels: Record<string, string> = {
  league: "Liga",
  knockout: "Mata-mata",
  groups: "Grupos",
  swiss: "Suíço",
  groups_playoffs: "Grupos + Playoffs",
};

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  const { data: tournament, isLoading } = useTournament(id!);
  const { data: registrations } = useTournamentRegistrations(id!);
  const { data: stages } = useTournamentStages(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Trophy className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Torneio não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/tournaments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Torneios
          </Link>
        </Button>
      </div>
    );
  }

  const status = statusLabels[tournament.status] || { label: tournament.status, variant: "outline" as const };
  const confirmedRegistrations = registrations?.filter(r => r.status === "confirmed") || [];
  const isRegistrationOpen = tournament.status === "registrations_open";
  const hasSpots = confirmedRegistrations.length < tournament.max_teams;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link to="/tournaments">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </Button>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">{formatLabels[tournament.format] || tournament.format}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{tournament.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gamepad2 className="h-4 w-4" />
                  {(tournament as any).game_modes?.games?.name || "Jogo"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {confirmedRegistrations.length}/{tournament.max_teams} times
                </span>
                {tournament.starts_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(tournament.starts_at).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>

            {isRegistrationOpen && hasSpots && user && (
              <Button onClick={() => setShowRegisterDialog(true)} size="lg">
                <Shield className="h-4 w-4 mr-2" />
                Inscrever Time
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="standings">Classificação</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tournament.description && (
                  <p className="text-muted-foreground">{tournament.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Formato</p>
                    <p className="font-medium">{formatLabels[tournament.format]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Times</p>
                    <p className="font-medium">{tournament.min_teams} - {tournament.max_teams}</p>
                  </div>
                  {tournament.starts_at && (
                    <div>
                      <p className="text-muted-foreground">Início</p>
                      <p className="font-medium">{new Date(tournament.starts_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  )}
                  {tournament.ends_at && (
                    <div>
                      <p className="text-muted-foreground">Término</p>
                      <p className="font-medium">{new Date(tournament.ends_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prize Card */}
            {tournament.prize_description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-secondary" />
                    Premiação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-secondary">{tournament.prize_description}</p>
                </CardContent>
              </Card>
            )}

            {/* Rules Card */}
            {tournament.rules_text && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Regras</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules_text}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Bracket Tab */}
        <TabsContent value="bracket">
          <Card>
            <CardHeader>
              <CardTitle>Bracket do Torneio</CardTitle>
              <CardDescription>Visualização das partidas</CardDescription>
            </CardHeader>
            <CardContent>
              {stages && stages.length > 0 ? (
                <TournamentBracket stages={stages} tournamentId={tournament.id} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Bracket ainda não gerado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Standings Tab */}
        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
              <CardDescription>Tabela de pontos e resultados</CardDescription>
            </CardHeader>
            <CardContent>
              {stages && stages.length > 0 ? (
                <TournamentStandings stages={stages} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Medal className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Classificação ainda não disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Times Inscritos</CardTitle>
              <CardDescription>{confirmedRegistrations.length} de {tournament.max_teams} vagas preenchidas</CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedRegistrations.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {confirmedRegistrations.map((reg) => (
                    <Link
                      key={reg.id}
                      to={`/teams/${reg.team_id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                          {(reg as any).teams?.tag?.slice(0, 3) || "TM"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{(reg as any).teams?.name || "Time"}</p>
                        <p className="text-xs text-muted-foreground">[{(reg as any).teams?.tag}]</p>
                      </div>
                      {reg.seed && (
                        <Badge variant="outline">#{reg.seed}</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum time inscrito ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Register Dialog */}
      <RegisterTeamDialog
        open={showRegisterDialog}
        onOpenChange={setShowRegisterDialog}
        tournamentId={tournament.id}
      />
    </div>
  );
}
