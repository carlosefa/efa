import { Link } from "react-router-dom";
import { Trophy, Users, Swords, TrendingUp, Calendar, Bell, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useNotifications, useRankings } from "@/hooks/useProfile";
import { useMyTeams } from "@/hooks/useTeams";
import { useMyTournaments } from "@/hooks/useTournaments";
import { useMatches } from "@/hooks/useMatches";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: myTeams, isLoading: loadingTeams } = useMyTeams();
  const { data: myTournaments, isLoading: loadingTournaments } = useMyTournaments();
  const { data: matches, isLoading: loadingMatches } = useMatches();
  const { data: notifications } = useNotifications();
  const { data: rankings } = useRankings({ limit: 10 });

  const unreadNotifications = notifications?.filter(n => !n.read_at) || [];
  const upcomingMatches = matches?.filter(m => 
    ["scheduled", "pending_report", "pending_confirm"].includes(m.status)
  ).slice(0, 5) || [];
  
  const myRanking = rankings?.findIndex(r => r.profile?.id === user?.id);
  const rankPosition = myRanking !== undefined && myRanking >= 0 ? myRanking + 1 : null;

  const stats = [
    { 
      label: "Meus Torneios", 
      value: myTournaments?.length || 0, 
      icon: Trophy, 
      href: "/tournaments",
      loading: loadingTournaments 
    },
    { 
      label: "Meus Times", 
      value: myTeams?.length || 0, 
      icon: Users, 
      href: "/teams",
      loading: loadingTeams 
    },
    { 
      label: "Partidas Pendentes", 
      value: upcomingMatches.length, 
      icon: Swords, 
      href: "/matches",
      loading: loadingMatches 
    },
    { 
      label: "Ranking Global", 
      value: rankPosition ? `#${rankPosition}` : "-", 
      icon: TrendingUp, 
      href: "/rankings",
      loading: false 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {profile?.display_name || profile?.username || "jogador"}!
          </p>
        </div>
        <Button asChild>
          <Link to="/tournaments/create">
            <Plus className="h-4 w-4 mr-2" />
            Criar Torneio
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.href}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {stat.loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Matches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Próximas Partidas
                </CardTitle>
                <CardDescription>Suas partidas pendentes</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/matches">Ver todas</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingMatches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {(match as any).home_team?.tag?.slice(0, 2) || "T1"}
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="text-xs bg-secondary/10">
                            {(match as any).away_team?.tag?.slice(0, 2) || "T2"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {(match as any).home_team?.name || "Time 1"} vs {(match as any).away_team?.name || "Time 2"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(match as any).fixture?.stage?.tournament?.name || "Torneio"}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={match.status === "pending_confirm" ? "default" : "secondary"}
                    >
                      {match.status === "pending_confirm" ? "Confirmar" : 
                       match.status === "pending_report" ? "Reportar" : "Agendada"}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Swords className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma partida pendente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Atualizações recentes</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">Ver todas</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      notif.read_at ? "bg-muted/30" : "bg-primary/5 border border-primary/20"
                    }`}
                  >
                    {!notif.read_at && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(notif.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Teams */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Meus Times
                </CardTitle>
                <CardDescription>Times que você gerencia</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/teams">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTeams ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myTeams && myTeams.length > 0 ? (
              <div className="space-y-3">
                {myTeams.slice(0, 4).map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <Avatar className="h-10 w-10 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                        {team.tag?.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">[{team.tag}]</p>
                    </div>
                    <Badge variant="outline">
                      {(team as any).team_memberships?.[0]?.count || 0} membros
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Você não possui times</p>
                <Button asChild className="mt-2" size="sm">
                  <Link to="/teams">Criar Time</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tournaments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Meus Torneios
                </CardTitle>
                <CardDescription>Torneios que você criou</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/tournaments">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTournaments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myTournaments && myTournaments.length > 0 ? (
              <div className="space-y-3">
                {myTournaments.slice(0, 4).map((tournament) => (
                  <Link
                    key={tournament.id}
                    to={`/tournaments/${tournament.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{tournament.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(tournament as any).game_modes?.name || "Jogo"}
                      </p>
                    </div>
                    <Badge variant={tournament.status === "in_progress" ? "default" : "secondary"}>
                      {tournament.status === "draft" ? "Rascunho" :
                       tournament.status === "in_progress" ? "Ativo" :
                       tournament.status === "registrations_open" ? "Inscrições" : tournament.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Trophy className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Você não criou torneios</p>
                <Button asChild className="mt-2" size="sm">
                  <Link to="/tournaments/create">Criar Torneio</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
