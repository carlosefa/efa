import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Swords,
  Calendar,
  Clock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Upload,
  Flag,
  Trophy,
  Timer,
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
import { Separator } from "@/components/ui/separator";
import { useMatch, useMatchEvents, useMatchDisputes } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";
import { ReportScoreDialog } from "@/components/matches/ReportScoreDialog";
import { OpenDisputeDialog } from "@/components/matches/OpenDisputeDialog";
import { MatchTimeline } from "@/components/matches/MatchTimeline";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type StatusConfigEntry = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: BadgeVariant;
};

const statusConfig: Record<string, StatusConfigEntry> = {
  scheduled: { label: "Scheduled", icon: Calendar, variant: "secondary" },
  pending_report: { label: "Waiting for Report", icon: Clock, variant: "outline" },
  pending_confirm: { label: "Waiting for Confirmation", icon: Clock, variant: "default" },
  disputed: { label: "Disputed", icon: AlertCircle, variant: "destructive" },
  finished: { label: "Finished", icon: CheckCircle2, variant: "outline" },
  walkover: { label: "Walkover", icon: AlertCircle, variant: "destructive" },
  cancelled: { label: "Cancelled", icon: AlertCircle, variant: "destructive" },
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
        <h2 className="text-xl font-semibold mb-2">Match not found</h2>
        <Button asChild variant="outline">
          <Link to="/matches">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Matches
          </Link>
        </Button>
      </div>
    );
  }

  // Keep the hook's original type to satisfy other components (no custom "lite" types)
  const homeTeam = "home_team" in match ? match.home_team : null;
  const awayTeam = "away_team" in match ? match.away_team : null;

  const status =
    statusConfig[match.status] ||
    ({ label: match.status, variant: "outline", icon: Clock } as const);
  const StatusIcon = status.icon;

  const isParticipant =
    !!user &&
    (!!homeTeam && "owner_id" in homeTeam && homeTeam.owner_id === user.id ||
      !!awayTeam && "owner_id" in awayTeam && awayTeam.owner_id === user.id);

  const canReport = isParticipant && ["scheduled", "pending_report"].includes(match.status);
  const canConfirm =
    isParticipant &&
    match.status === "pending_confirm" &&
    match.reported_by !== user?.id;

  const canDispute = isParticipant && ["pending_confirm", "finished"].includes(match.status);
  const hasActiveDispute = !!disputes?.some((d) => d.status !== "resolved");

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link to="/matches">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
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
              <span>Round</span>
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
                <p className="font-semibold text-lg">{homeTeam?.name || "Home Team"}</p>
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
                      {new Date(match.played_at).toLocaleString("en-US")}
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
                <p className="font-semibold text-lg">{awayTeam?.name || "Away Team"}</p>
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
                  Report Result
                </Button>
              )}
              {canConfirm && (
                <Button onClick={() => setShowReportDialog(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Result
                </Button>
              )}
              {canDispute && !hasActiveDispute && (
                <Button variant="destructive" onClick={() => setShowDisputeDialog(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Open Dispute
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="disputes" disabled={!disputes || disputes.length === 0}>
            Disputes {disputes && disputes.length > 0 && `(${disputes.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Match Info */}
            <Card>
              <CardHeader>
                <CardTitle>Match Information</CardTitle>
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
                      <span className="text-muted-foreground">Date/Time</span>
                      <span>{new Date(match.played_at).toLocaleString("en-US")}</span>
                    </div>
                    <Separator />
                  </>
                )}

                {match.reported_by && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reported by</span>
                      <span>Team captain</span>
                    </div>
                    <Separator />
                  </>
                )}

                {match.winner_team_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Winner</span>
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
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                {events && events.length > 0 ? (
                  <div className="space-y-2">
                    {events.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString("en-US")}
                        </span>
                        <span>{event.event_type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No events recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Match Timeline</CardTitle>
              <CardDescription>Full event history</CardDescription>
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
              <CardTitle>Disputes</CardTitle>
              <CardDescription>Dispute history</CardDescription>
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
                          {new Date(dispute.created_at).toLocaleString("en-US")}
                        </span>
                      </div>
                      <p className="text-sm">{dispute.reason}</p>
                      {dispute.resolution_reason && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground">
                            <strong>Resolution:</strong> {dispute.resolution_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No disputes recorded</p>
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


