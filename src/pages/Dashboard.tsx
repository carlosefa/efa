import { Link } from "react-router-dom";
import {
  Trophy,
  Users,
  Swords,
  TrendingUp,
  Calendar,
  Bell,
  Loader2,
  ArrowRight,
  Target,
  Home,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useNotifications, useRankings } from "@/hooks/useProfile";
import { useMyTeams } from "@/hooks/useTeams";
import { useMyTournaments } from "@/hooks/useTournaments";
import { useMatches } from "@/hooks/useMatches";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * ✅ Correção: NÃO renderizar Sidebar aqui.
 * Você já tem um layout global com menu (Sidebar) envolvendo as páginas.
 * Então este arquivo deve conter SOMENTE o conteúdo do Dashboard.
 * Assim não duplica menu.
 */

export default function Dashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: profile } = useProfile(user?.id);
  const { data: myTeams, isLoading: loadingTeams } = useMyTeams();
  const { data: myTournaments, isLoading: loadingTournaments } =
    useMyTournaments();
  const { data: matches, isLoading: loadingMatches } = useMatches();
  const { data: notifications } = useNotifications();
  const { data: rankings } = useRankings({ limit: 10 });

  const unreadNotifications = notifications?.filter((n) => !n.read_at) || [];

  const upcomingMatches =
    matches
      ?.filter((m) =>
        ["scheduled", "pending_report", "pending_confirm"].includes(m.status)
      )
      .slice(0, 5) || [];

  // ⚠️ Preview de Top 10 (limit:10). Não é rank global real.
  const myTop10Index = rankings?.findIndex((r) => r.profile?.id === user?.id);
  const top10Position =
    myTop10Index !== undefined && myTop10Index >= 0 ? myTop10Index + 1 : null;

  const hasTeam = (myTeams?.length || 0) > 0;
  const hasTournament = (myTournaments?.length || 0) > 0;
  const hasPendingMatch = upcomingMatches.length > 0;

  const role =
    (profile as any)?.role || (user as any)?.role || (profile as any)?.type;

  const canCreateTournament =
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "MODERATOR" ||
    role === "ORGANIZER";

  const locale =
    language === "pt-BR" ? "pt-BR" : language === "en" ? "en-US" : language;

  const formatNotifDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return new Date(iso).toLocaleString("en-US", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  // ✅ Header CTA: remove redundância do Create Team.
  const primaryCta = {
    label: "Back to Home",
    href: "/",
    icon: Home,
  };

  const stats = [
    {
      label: "My Tournaments",
      value: myTournaments?.length || 0,
      icon: Trophy,
      href: "/tournaments",
      loading: loadingTournaments,
    },
    {
      label: "My Teams",
      value: myTeams?.length || 0,
      icon: Users,
      href: "/teams",
      loading: loadingTeams,
    },
    {
      label: "Pending Matches",
      value: upcomingMatches.length,
      icon: Swords,
      href: "/matches",
      loading: loadingMatches,
    },
    {
      label: "Top 10 Preview",
      value: top10Position ? `#${top10Position}` : "Unranked",
      icon: TrendingUp,
      href: "/rankings",
      loading: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.display_name || profile?.username || "player"}
            !
          </p>
        </div>

        <Button asChild>
          <Link to={primaryCta.href}>
            <primaryCta.icon className="h-4 w-4 mr-2" />
            {primaryCta.label}
          </Link>
        </Button>
      </div>

      {/* Quick Progress */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Next steps
          </CardTitle>
          <CardDescription>
            Small goals that unlock your competitive journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Profile ✅</Badge>
            <Badge variant={hasTeam ? "secondary" : "default"}>
              Team {hasTeam ? "✅" : "⏳"}
            </Badge>
            <Badge variant={hasTournament ? "secondary" : "outline"}>
              First Tournament {hasTournament ? "✅" : "⏳"}
            </Badge>
            <Badge variant={hasPendingMatch ? "default" : "outline"}>
              Match Room {hasPendingMatch ? "⏳" : "—"}
            </Badge>
          </div>

          <Button asChild variant="outline" size="sm" className="mt-2 sm:mt-0">
            <Link to={primaryCta.href} className="inline-flex items-center gap-2">
              Continue <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

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
                  {stat.label === "Top 10 Preview" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your global rank will appear once rating is available.
                    </p>
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
                  Upcoming Matches
                </CardTitle>
                <CardDescription>Your pending fixtures</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/matches">View all</Link>
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
                          {(match as any).home_team?.name || "Team 1"} vs{" "}
                          {(match as any).away_team?.name || "Team 2"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(match as any).fixture?.stage?.tournament?.name ||
                            "Tournament"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        match.status === "pending_confirm"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {match.status === "pending_confirm"
                        ? "Confirm"
                        : match.status === "pending_report"
                        ? "Report"
                        : "Scheduled"}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Swords className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No pending matches</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Join a tournament to get scheduled fixtures.
                </p>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link to="/tournaments">Browse tournaments</Link>
                </Button>
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
                  Notifications
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Recent updates</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/notifications">View all</Link>
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
                      notif.read_at
                        ? "bg-muted/30"
                        : "bg-primary/5 border border-primary/20"
                    }`}
                  >
                    {!notif.read_at && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatNotifDate(notif.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Bell className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  We’ll notify you about matches, tournaments and disputes here.
                </p>
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
                  My Teams
                </CardTitle>
                <CardDescription>Teams you manage</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/teams">View all</Link>
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
                        {team.tag?.slice(0, 2) || "TM"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        [{team.tag || "TAG"}]
                      </p>
                    </div>
                    <Badge variant="outline">
                      {(team as any).membersCount ??
                        (team as any).team_memberships?.length ??
                        0}{" "}
                      members
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">You don’t have a team yet</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Create a team to start joining competitions.
                </p>
                <Button asChild className="mt-3" size="sm">
                  <Link to="/teams">Create Team</Link>
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
                  My Tournaments
                </CardTitle>
                <CardDescription>Tournaments you created</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/tournaments">View all</Link>
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
                        {(tournament as any).game_modes?.name || "Game"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        tournament.status === "in_progress"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {tournament.status === "draft"
                        ? "Draft"
                        : tournament.status === "in_progress"
                        ? "Live"
                        : tournament.status === "registrations_open"
                        ? "Registrations"
                        : tournament.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Trophy className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No tournaments created</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  If you want to host, go to the organizer/admin area.
                </p>
                <Button asChild className="mt-3" size="sm" variant="outline">
                  <Link to={canCreateTournament ? "/admin" : "/tournaments"}>
                    {canCreateTournament ? "Go to Admin" : "Browse tournaments"}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


