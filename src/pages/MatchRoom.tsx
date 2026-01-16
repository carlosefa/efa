import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Swords, Calendar, Clock, ArrowLeft, AlertCircle, CheckCircle2, 
  Upload, MessageCircle, Flag, Trophy, Timer, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useMatch, useMatchEvents, useMatchDisputes } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";
import { ReportScoreDialog } from "@/components/matches/ReportScoreDialog";
import { OpenDisputeDialog } from "@/components/matches/OpenDisputeDialog";
import { MatchTimeline } from "@/components/matches/MatchTimeline";

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Agendada", icon: Calendar, variant: "secondary" },
  pending_report: { label: "Aguardando Reporte", icon: Clock, variant: "outline" },
  pending_confirm: { label: "Aguardando Confirmação", icon: Clock, variant: "default" },
  disputed: { label: "Em Disputa", icon: AlertCircle, variant: "destructive" },
  finished: { label: "Finalizada", icon: CheckCircle2, variant: "outline" },
  walkover: { label: "W.O.", icon: AlertCircle, variant: "destructive" },
  cancelled: { label: "Cancelada", icon: AlertCircle, variant: "destructive" },
};

export default function MatchRoom() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);

  const { data: match, isLoading } = useMatch(id!);
  const { data: events } = useMatchEvents(id!);
  const { data: disputes } = useMatchDisputes(id!);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Swords className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Partida não encontrada</h2>
        <Button asChild variant="outline">
          <Link to="/matches">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Partidas
          </Link>
        </Button>
      </div>
    );
  }

  const homeTeam = (match as any).home_team;
  const awayTeam = (match as any).away_team;
  const status = statusConfig[match.status] || { label: match.status, variant: "outline" as const, icon: Clock };
  const StatusIcon = status.icon;

  const isParticipant = user && (homeTeam?.owner_id === user.id || awayTeam?.owner_id === user.id);
  const canReport = isParticipant && ["scheduled", "pending_report"].includes(match.status);
  const canConfirm = isParticipant && match.status === "pending_confirm" && match.reported_by !== user?.id;
  const canDispute = isParticipant && ["pending_confirm", "finished"].includes(match.status);
  const hasActiveDispute = disputes && disputes.some(d => d.status !== "resolved");

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link to="/matches">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Link>
      </Button>

      {/* Match Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 p-6">
          {/* Status and Tournament */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              {/* Tournament name would come from fixture -> stage -> tournament */}
              <span>Rodada</span>
            </div>
            <Badge variant={status.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-between">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <Avatar className="h-20 w-20 rounded-xl border-2 border-primary/30">
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl font-bold">
                  {homeTeam?.tag?.slice(0, 3) || "TM1"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-lg">{homeTeam?.name || "Time Casa"}</p>
                <p className="text-sm text-muted-foreground">[{homeTeam?.tag}]</p>
              </div>
            </div>

            {/* Score */}
            <div className="px-8">
              {match.status === "finished" || match.status === "pending_confirm" ? (
                <div className="flex items-center gap-4 text-4xl font-bold">
                  <span className={match.winner_team_id === homeTeam?.id ? "text-primary" : ""}>
                    {match.home_score ?? 0}
                  </span>
                  <span className="text-muted-foreground text-2xl">:</span>
                  <span className={match.winner_team_id === awayTeam?.id ? "text-primary" : ""}>
                    {match.away_score ?? 0}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-3xl font-bold text-muted-foreground">VS</p>
                  {match.played_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      <Timer className="h-4 w-4 inline mr-1" />
                      {new Date(match.played_at).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-3 flex-1">
              <Avatar className="h-20 w-20 rounded-xl border-2 border-secondary/30">
                <AvatarFallback className="rounded-xl bg-secondary/10 text-secondary text-2xl font-bold">
                  {awayTeam?.tag?.slice(0, 3) || "TM2"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-lg">{awayTeam?.name || "Time Fora"}</p>
                <p className="text-sm text-muted-foreground">[{awayTeam?.tag}]</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isParticipant && (
            <div className="flex justify-center gap-3 mt-6 pt-6 border-t border-border/50">
              {canReport && (
                <Button onClick={() => setShowReportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Reportar Resultado
                </Button>
              )}
              {canConfirm && (
                <Button onClick={() => setShowReportDialog(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Resultado
                </Button>
              )}
              {canDispute && !hasActiveDispute && (
                <Button variant="destructive" onClick={() => setShowDisputeDialog(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Abrir Disputa
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="disputes" disabled={!disputes || disputes.length === 0}>
            Disputas {disputes && disputes.length > 0 && `(${disputes.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Match Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Partida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <Separator />
                {match.played_at && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data/Hora</span>
                      <span>{new Date(match.played_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {match.reported_by && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reportado por</span>
                      <span>Capitão do time</span>
                    </div>
                    <Separator />
                  </>
                )}
                {match.winner_team_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencedor</span>
                    <span className="text-primary font-medium">
                      {match.winner_team_id === homeTeam?.id ? homeTeam?.name : awayTeam?.name}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Últimos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {events && events.length > 0 ? (
                  <div className="space-y-2">
                    {events.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString("pt-BR")}
                        </span>
                        <span>{event.event_type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum evento registrado</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline da Partida</CardTitle>
              <CardDescription>Histórico completo de eventos</CardDescription>
            </CardHeader>
            <CardContent>
              <MatchTimeline events={events || []} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes">
          <Card>
            <CardHeader>
              <CardTitle>Disputas</CardTitle>
              <CardDescription>Histórico de contestações</CardDescription>
            </CardHeader>
            <CardContent>
              {disputes && disputes.length > 0 ? (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <div key={dispute.id} className="p-4 rounded-lg border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={dispute.status === "resolved" ? "outline" : "destructive"}>
                          {dispute.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-sm">{dispute.reason}</p>
                      {dispute.resolution_reason && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground">
                            <strong>Resolução:</strong> {dispute.resolution_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhuma disputa registrada</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ReportScoreDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        match={match}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
      <OpenDisputeDialog
        open={showDisputeDialog}
        onOpenChange={setShowDisputeDialog}
        matchId={match.id}
      />
    </div>
  );
}
