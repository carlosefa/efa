import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Plus, Search, Filter, Calendar, Users, Gamepad2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournaments } from "@/hooks/useTournaments";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
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
  tournament_registrations?: { count: number }[] | null;
}

function TournamentCard({ tournament }: { tournament: TournamentWithRelations }) {
  const status = statusConfig[tournament.status] || { label: tournament.status, variant: "outline" as const };
  const registrationCount = tournament.tournament_registrations?.[0]?.count || 0;
  const gameName = tournament.game_modes?.games?.name || tournament.game_modes?.name || "Jogo";

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              <Link to={`/tournaments/${tournament.id}`}>{tournament.name}</Link>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gamepad2 className="h-4 w-4" />
              <span>{gameName}</span>
              <span>•</span>
              <span>{formatLabels[tournament.format] || tournament.format}</span>
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
              <span>{registrationCount}/{tournament.max_teams}</span>
            </div>
            {tournament.starts_at && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(tournament.starts_at).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </div>
          {tournament.prize_description && (
            <Badge variant="secondary" className="bg-secondary/20 text-secondary">
              {tournament.prize_description}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Tournaments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: tournaments, isLoading } = useTournaments();

  const filteredTournaments = tournaments?.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && t.status === "in_progress";
    if (activeTab === "upcoming") return matchesSearch && ["published", "registrations_open", "registrations_closed"].includes(t.status);
    if (activeTab === "finished") return matchesSearch && t.status === "finished";
    return matchesSearch;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Torneios
          </h1>
          <p className="text-muted-foreground">Gerencie e participe de competições</p>
        </div>
        <Button asChild>
          <Link to="/tournaments/create">
            <Plus className="h-4 w-4 mr-2" />
            Novo Torneio
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar torneios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Em Andamento</TabsTrigger>
          <TabsTrigger value="upcoming">Em Breve</TabsTrigger>
          <TabsTrigger value="finished">Finalizados</TabsTrigger>
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
                  Nenhum torneio encontrado
                </p>
                <Button asChild className="mt-4">
                  <Link to="/tournaments/create">Criar Torneio</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
