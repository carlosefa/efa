import { useState } from "react";
import { Link } from "react-router-dom";
import { Medal, TrendingUp, TrendingDown, Minus, Trophy, Gamepad2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRankings } from "@/hooks/useProfile";
import { useGames, useCountries } from "@/hooks/useGames";

interface RankingEntry {
  id: string;
  rating: number;
  uncertainty: number;
  matches_played: number;
  wins: number;
  losses: number;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    country_code: string | null;
  } | null;
  game_mode?: {
    name: string;
    slug: string;
    games?: { name: string; slug: string } | null;
  } | null;
}

function PositionChange({ position }: { position: number }) {
  // Simulated change for demo - in real app would track historical positions
  const change = position % 3 === 0 ? 1 : position % 3 === 1 ? -1 : 0;
  
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-green-500 text-xs">
        <TrendingUp className="h-3 w-3" />
        +{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-500 text-xs">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    );
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function RankingRow({ entry, position }: { entry: RankingEntry; position: number }) {
  const isTop3 = position <= 3;
  const winRate = entry.matches_played > 0 
    ? Math.round((entry.wins / entry.matches_played) * 100) 
    : 0;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg ${isTop3 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}>
      {/* Position */}
      <div className="w-12 text-center">
        <span className={`text-xl font-bold ${isTop3 ? "text-primary" : ""}`}>
          {position}
        </span>
        <div className="mt-0.5">
          <PositionChange position={position} />
        </div>
      </div>

      {/* Player */}
      <Link to={`/profile/${entry.profile?.id}`} className="flex items-center gap-3 flex-1 hover:text-primary transition-colors">
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarFallback className={`rounded-lg font-bold ${isTop3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {entry.profile?.display_name?.charAt(0) || entry.profile?.username?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{entry.profile?.display_name || entry.profile?.username || "Jogador"}</p>
          <p className="text-xs text-muted-foreground">
            {entry.profile?.country_code && `${entry.profile.country_code} • `}
            {entry.game_mode?.name}
          </p>
        </div>
      </Link>

      {/* Stats */}
      <div className="hidden md:block text-center w-20">
        <p className="text-lg font-bold">{Math.round(Number(entry.rating))}</p>
        <p className="text-xs text-muted-foreground">±{Math.round(Number(entry.uncertainty))}</p>
      </div>
      <div className="hidden md:block text-center w-16">
        <p className="font-medium">{entry.matches_played}</p>
        <p className="text-xs text-muted-foreground">jogos</p>
      </div>
      <div className="hidden md:block text-center w-16">
        <p className="font-medium">{winRate}%</p>
        <p className="text-xs text-muted-foreground">vitórias</p>
      </div>

      {/* Wins */}
      <div className="flex items-center gap-1">
        <Trophy className="h-4 w-4 text-secondary" />
        <span className="font-medium">{entry.wins}</span>
      </div>
    </div>
  );
}

export default function Rankings() {
  const [activeTab, setActiveTab] = useState("players");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");

  const { data: rankings, isLoading } = useRankings({ limit: 50 });
  const { data: games } = useGames();
  const { data: countries } = useCountries();

  const filteredRankings = rankings?.filter(r => {
    if (selectedGame !== "all" && r.game_mode?.games?.slug !== selectedGame) return false;
    if (selectedCountry !== "all" && r.profile?.country_code !== selectedCountry) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Medal className="h-6 w-6 text-primary" />
            Rankings
          </h1>
          <p className="text-muted-foreground">Classificações e estatísticas globais</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="w-40">
            <Gamepad2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Jogo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {games?.map(game => (
              <SelectItem key={game.id} value={game.slug}>{game.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌍 Todos</SelectItem>
            {countries?.map(country => (
              <SelectItem key={country.id} value={country.code}>
                {country.code === "BR" ? "🇧🇷" : country.code === "PT" ? "🇵🇹" : "🏳️"} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="teams">Times</TabsTrigger>
          <TabsTrigger value="organizations">Organizações</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ranking de Jogadores</CardTitle>
                  <CardDescription>Classificação baseada em rating com mínimo de 10 jogos</CardDescription>
                </div>
                <Badge variant="outline">Atualizado agora</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRankings.length > 0 ? (
                <div className="space-y-2">
                  {filteredRankings.map((entry, index) => (
                    <RankingRow key={entry.id} entry={entry} position={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Medal className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum jogador no ranking ainda</p>
                  <p className="text-sm text-muted-foreground">Jogadores precisam de no mínimo 10 partidas</p>
                </div>
              )}
              {filteredRankings.length >= 50 && (
                <div className="mt-6 text-center">
                  <Button variant="outline">Carregar mais</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Medal className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                Ranking de times em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Medal className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                Ranking de organizações em breve
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
