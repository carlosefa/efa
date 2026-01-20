import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Gamepad2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournaments } from "@/hooks/useTournaments";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
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

interface TournamentWithRelations {
  id: string;
  name: string;
  slug: string;
  status: string;
  format: string;
  max_teams: number;
  starts_at: string | null;
  prize_description: string | null;

  game_modes?: { name: string; games?: { name: string } | null } | null;

  tournament_registrations?: { count?: number }[] | null;
}

type TabKey = "all" | "live" | "open" | "upcoming" | "finished";

function isTabKey(v: string): v is TabKey {
  return ["all", "live", "open", "upcoming", "finished"].includes(v);
}

function safeDateLabel(isoLike: string) {
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US");
}

function getRegistrationCount(t: TournamentWithRelations) {
  const first = t.tournament_registrations?.[0];
  if (typeof first?.count === "number") return first.count;
  return Array.isArray(t.tournament_registrations)
    ? t.tournament_registrations.length
    : 0;
}

function getGameName(t: TournamentWithRelations) {
  return t.game_modes?.games?.name || t.game_modes?.name || "Game";
}

function statusPriority(status: string) {
  switch (status) {
    case "in_progress":
      return 1;
    case "registrations_open":
      return 2;
    case "published":
      return 3;
    case "registrations_closed":
      return 4;
    case "draft":
      return 5;
    case "finished":
      return 6;
    case "cancelled":
      return 7;
    default:
      return 99;
  }
}

function safeTime(starts_at: string | null) {
  if (!starts_at) return Number.POSITIVE_INFINITY;
  const d = new Date(starts_at);
  const t = d.getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function TournamentCard({ tournament }: { tournament: TournamentWithRelations }) {
  const status =
    statusConfig[tournament.status] || {
      label: tournament.status,
      variant: "outline" as const,
    };

  const registrationCount = getRegistrationCount(tournament);
  const gameName = getGameName(tournament);
  const formatLabel = formatLabels[tournament.format] || tournament.format;

  // ✅ Keep ID route (safe). If you later prefer slug, switch here:
  const to = tournament.slug ? `/tournaments/${tournament.slug}` : `/tournaments/${tournament.id}`;

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              <Link to={to}>{tournament.name}</Link>
            </CardTitle>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gamepad2 className="h-4 w-4" />
              <span>{gameName}</span>
              <span>•</span>
              <span>{formatLabel}</span>
            </div>
          </div>

          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {registrationCount}/{tournament.max_teams}
              </span>
            </div>

            {tournament.starts_at && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{safeDateLabel(tournament.starts_at)}</span>
              </div>
            )}
          </div>

          {tournament.prize_description && (
            <Badge variant="secondary">{tournament.prize_description}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Tournaments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const { data: tournaments, isLoading } = useTournaments();

  const filteredTournaments = useMemo(() => {
    const list = (tournaments ?? []) as TournamentWithRelations[];

    const q = searchQuery.trim().toLowerCase();

    const matchesSearch = (t: TournamentWithRelations) =>
      q.length === 0 ? true : t.name.toLowerCase().includes(q);

    const matchesTab = (t: TournamentWithRelations) => {
      if (activeTab === "all") return true;

      if (activeTab === "live") return t.status === "in_progress";

      if (activeTab === "open") return t.status === "registrations_open";

      if (activeTab === "upcoming")
        return ["published", "registrations_closed"].includes(t.status);

      if (activeTab === "finished") return t.status === "finished";

      return true;
    };

    return list
      .filter((t) => matchesSearch(t) && matchesTab(t))
      .sort((a, b) => {
        const pa = statusPriority(a.status);
        const pb = statusPriority(b.status);
        if (pa !== pb) return pa - pb;

        const ta = safeTime(a.starts_at);
        const tb = safeTime(b.starts_at);
        if (ta !== tb) return ta - tb;

        return a.name.localeCompare(b.name);
      });
  }, [tournaments, searchQuery, activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Tournaments
          </h1>
          <p className="text-muted-foreground">
            Manage your tournaments and competitions
          </p>
        </div>

        <Button asChild>
          <Link to="/tournaments/create">
            <Plus className="h-4 w-4 mr-2" />
            New Tournament
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter (UI only for Sprint 1) */}
        <Button
          variant="outline"
          size="icon"
          aria-label="Filter"
          disabled
          title="Filters coming soon"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(isTabKey(v) ? v : "all")}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="finished">Finished</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">
                  No tournaments found
                </p>
                <Button asChild className="mt-4">
                  <Link to="/tournaments/create">Create Tournament</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
