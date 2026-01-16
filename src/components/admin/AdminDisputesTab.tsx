import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Scale,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Swords,
  Trophy,
  Loader2,
  Search,
  Gavel,
  Flag,
} from "lucide-react";
import { useAdminDisputes } from "@/hooks/useAdminDisputes";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Aberta", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: Clock },
  under_review: { label: "Em Análise", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: Eye },
  resolved: { label: "Resolvida", color: "bg-success/10 text-success border-success/30", icon: CheckCircle },
  escalated: { label: "Escalada", color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
};

export function AdminDisputesTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolution, setResolution] = useState<"home_win" | "away_win" | "draw" | "rematch" | "cancel">("home_win");
  const [resolutionReason, setResolutionReason] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  const { disputes, isLoading, resolveDispute, applyWO, isResolving } = useAdminDisputes(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const filteredDisputes = disputes.filter((d: any) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        d.reason?.toLowerCase().includes(search) ||
        d.match?.home_team?.name?.toLowerCase().includes(search) ||
        d.match?.away_team?.name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    open: disputes.filter((d: any) => d.status === "open").length,
    underReview: disputes.filter((d: any) => d.status === "under_review").length,
    escalated: disputes.filter((d: any) => d.status === "escalated").length,
    slaBreaching: disputes.filter((d: any) => {
      if (!d.sla_deadline) return false;
      return new Date(d.sla_deadline) < new Date() && d.status !== "resolved";
    }).length,
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;

    try {
      await resolveDispute.mutateAsync({
        disputeId: selectedDispute.id,
        matchId: selectedDispute.match_id,
        resolution,
        reason: resolutionReason,
        homeScore: homeScore ? parseInt(homeScore) : undefined,
        awayScore: awayScore ? parseInt(awayScore) : undefined,
      });
      setResolveDialogOpen(false);
      setSelectedDispute(null);
      setResolutionReason("");
      setHomeScore("");
      setAwayScore("");
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
    }
  };

  const handleWO = async (disputeId: string, matchId: string, winnerId: string) => {
    await applyWO.mutateAsync({ disputeId, matchId, winnerId, reason: "W.O. aplicado pela administração" });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">Abertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.underReview}</p>
                <p className="text-sm text-muted-foreground">Em Análise</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.escalated}</p>
                <p className="text-sm text-muted-foreground">Escaladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flag className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.slaBreaching}</p>
                <p className="text-sm text-muted-foreground">SLA Excedido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por time ou motivo..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="under_review">Em Análise</SelectItem>
                <SelectItem value="escalated">Escalada</SelectItem>
                <SelectItem value="resolved">Resolvida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Disputas
          </CardTitle>
          <CardDescription>
            {filteredDisputes.length} disputa(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma disputa encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Partida</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Aberto por</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisputes.map((dispute: any) => {
                  const status = statusConfig[dispute.status] || statusConfig.open;
                  const StatusIcon = status.icon;
                  const slaBreached = dispute.sla_deadline && new Date(dispute.sla_deadline) < new Date() && dispute.status !== "resolved";

                  return (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {(dispute.match?.home_team?.name || "H")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {dispute.match?.home_team?.tag || "TBD"}
                            </span>
                          </div>
                          <Swords className="h-3 w-3 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {(dispute.match?.away_team?.name || "A")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {dispute.match?.away_team?.tag || "TBD"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm">{dispute.reason}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dispute.opened_by_user?.username || "N/A"}
                      </TableCell>
                      <TableCell>
                        {dispute.sla_deadline ? (
                          <Badge variant={slaBreached ? "destructive" : "outline"}>
                            {slaBreached ? "Excedido" : format(new Date(dispute.sla_deadline), "dd/MM HH:mm")}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(dispute.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedDispute(dispute)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {dispute.status !== "resolved" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-primary"
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setResolveDialogOpen(true);
                              }}
                              title="Resolver"
                            >
                              <Gavel className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dispute Detail Dialog */}
      <Dialog open={!!selectedDispute && !resolveDialogOpen} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Detalhes da Disputa
            </DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <Avatar className="h-12 w-12 mx-auto">
                        <AvatarFallback>
                          {(selectedDispute.match?.home_team?.name || "H")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium mt-1">
                        {selectedDispute.match?.home_team?.name || "Time A"}
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-2xl font-bold">
                        {selectedDispute.match?.home_score ?? "-"} : {selectedDispute.match?.away_score ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Placar Reportado</p>
                    </div>
                    <div className="text-center">
                      <Avatar className="h-12 w-12 mx-auto">
                        <AvatarFallback>
                          {(selectedDispute.match?.away_team?.name || "A")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium mt-1">
                        {selectedDispute.match?.away_team?.name || "Time B"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Motivo da Disputa</Label>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p>{selectedDispute.reason}</p>
                </div>
              </div>

              {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Evidências</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDispute.evidence_urls.map((url: string, i: number) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Eye className="h-6 w-6 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedDispute.status !== "resolved" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => setResolveDialogOpen(true)}
                  >
                    <Gavel className="h-4 w-4 mr-2" />
                    Resolver Disputa
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleWO(
                      selectedDispute.id,
                      selectedDispute.match_id,
                      selectedDispute.match?.home_team_id
                    )}
                    disabled={applyWO.isPending}
                  >
                    W.O. Casa
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleWO(
                      selectedDispute.id,
                      selectedDispute.match_id,
                      selectedDispute.match?.away_team_id
                    )}
                    disabled={applyWO.isPending}
                  >
                    W.O. Visitante
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Resolver Disputa
            </DialogTitle>
            <DialogDescription>
              Defina o resultado oficial da partida
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resolução</Label>
              <Select value={resolution} onValueChange={(v: any) => setResolution(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_win">Vitória do Mandante</SelectItem>
                  <SelectItem value="away_win">Vitória do Visitante</SelectItem>
                  <SelectItem value="draw">Empate</SelectItem>
                  <SelectItem value="rematch">Revanche</SelectItem>
                  <SelectItem value="cancel">Cancelar Partida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(resolution === "home_win" || resolution === "away_win" || resolution === "draw") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placar Mandante</Label>
                  <Input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Placar Visitante</Label>
                  <Input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo da Decisão *</Label>
              <Textarea
                placeholder="Explique o motivo da decisão..."
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isResolving || !resolutionReason}
            >
              {isResolving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Decisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
