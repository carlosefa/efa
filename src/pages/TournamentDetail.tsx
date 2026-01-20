import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  Users,
  Shield,
  ChevronRight,
  Medal,
  Gamepad2,
  FileText,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTournament,
  useTournamentRegistrations,
  useTournamentStages,
} from "@/hooks/useTournaments";
import { useAuth } from "@/contexts/AuthContext";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { TournamentStandings } from "@/components/tournaments/TournamentStandings";
import { RegisterTeamDialog } from "@/components/tournaments/RegisterTeamDialog";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const statusLabels: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "outline" },
  published: { label: "Published", variant: "secondary" },
  registrations_open: { label: "Registrations Open", variant: "default" },
  registrations_closed: { label: "Registrations Closed", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  finished: { label: "Finished", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const formatLabels: Record<string, string> = {
  league: "League",
  knockout: "Knockout",
  groups: "Groups",
  swiss: "Swiss",
  groups_playoffs: "Groups + Playoffs",
};

// Avoid `any` by typing the small nested bits we read
type TournamentGameInfo = { game_modes?: { games?: { name?: string | null } | null } | null };
type RegistrationWithTeam = { teams?: { name?: string | null; tag?: string | null } | null };

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
        <h2 className="text-xl font-semibold mb-2">Tournament not found</h2>
        <Button asChild variant="outline">
          <Link to="/tournaments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Link>
        </Button>
      </div>
    );
  }

  const status =
    statusLabels[tournament.status] || ({
      label: tournament.status,
      variant: "outline",
    } as const);

  const confirmedRegistrations =
    registrations?.filter((r) => r.status === "confirmed") || [];

  const isRegistrationOpen = tournament.status === "registrations_open";
  const hasSpots = confirmedRegistrations.length < tournament.max_teams;

  const tournamentGameName =
    ((tournament as unknown as TournamentGameInfo).game_modes?.games?.name as
      | string
      | null
      | undefined) || "Game";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link to="/tournaments">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">
                  {formatLabels[tournament.format] || tournament.format}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold">{tournament.name}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gamepad2 className="h-4 w-4" />
                  {tournamentGameName}
                </span>

                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {confirmedRegistrations.length}/{tournament.max_teams} teams
                </span>

                {tournament.starts_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(tournament.starts_at).toLocaleDateString("en-US")}
                  </span>
                )}
              </div>
            </div>

            {isRegistrationOpen && hasSpots && user && (
              <Button onClick={() => setShowRegisterDialog(true)} size="lg">
                <Shield className="h-4 w-4 mr-2" />
                Register Team
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bracket">Bracket</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tournament.description && (
                  <p className="text-muted-foreground">{tournament.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Format</p>
                    <p className="font-medium">
                      {formatLabels[tournament.format] || tournament.format}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Teams</p>
                    <p className="font-medium">
                      {tournament.min_teams} - {tournament.max_teams}
                    </p>
                  </div>

                  {tournament.starts_at && (
                    <div>
                      <p className="text-muted-foreground">Start</p>
                      <p className="font-medium">
                        {new Date(tournament.starts_at).toLocaleDateString("en-US")}
                      </p>
                    </div>
                  )}

                  {tournament.ends_at && (
                    <div>
                      <p className="text-muted-foreground">End</p>
                      <p className="font-medium">
                        {new Date(tournament.ends_at).toLocaleDateString("en-US")}
                      </p>
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
                    Prizes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-secondary">
                    {tournament.prize_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Rules Card */}
            {tournament.rules_text && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {tournament.rules_text}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Bracket Tab */}
        <TabsContent value="bracket">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Bracket</CardTitle>
              <CardDescription>Match visualization</CardDescription>
            </CardHeader>
            <CardContent>
              {stages && stages.length > 0 ? (
                <TournamentBracket stages={stages} tournamentId={tournament.id} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Bracket not generated yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Standings Tab */}
        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <CardTitle>Standings</CardTitle>
              <CardDescription>Points table and results</CardDescription>
            </CardHeader>
            <CardContent>
              {stages && stages.length > 0 ? (
                <TournamentStandings stages={stages} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Medal className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Standings not available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Registered Teams</CardTitle>
              <CardDescription>
                {confirmedRegistrations.length} of {tournament.max_teams} spots filled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedRegistrations.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {confirmedRegistrations.map((reg) => {
                    const teamInfo = reg as unknown as RegistrationWithTeam;
                    const tag = teamInfo.teams?.tag || "TM";
                    const name = teamInfo.teams?.name || "Team";

                    return (
                      <Link
                        key={reg.id}
                        to={`/teams/${reg.team_id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                            {tag.slice(0, 3)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">[{tag}]</p>
                        </div>

                        {reg.seed && <Badge variant="outline">#{reg.seed}</Badge>}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No teams registered yet</p>
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

