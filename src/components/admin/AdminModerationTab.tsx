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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Shield,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Flag,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { useModerationCases } from "@/hooks/useModeration";
import { useAdminModeration } from "@/hooks/useAdminModeration";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const priorityConfig: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  low: { label: "Baixa", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: Flag },
  medium: { label: "Média", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: AlertTriangle },
  high: { label: "Alta", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: AlertTriangle },
  critical: { label: "Crítica", color: "bg-destructive/10 text-destructive border-destructive/30", icon: Ban },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: Clock },
  investigating: { label: "Em Análise", color: "bg-blue-500/10 text-blue-500", icon: Eye },
  resolved: { label: "Resolvido", color: "bg-success/10 text-success", icon: CheckCircle },
  dismissed: { label: "Descartado", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const contentTypeLabels: Record<string, string> = {
  user: "Usuário",
  team: "Time",
  chat: "Chat",
  profile: "Perfil",
  tournament: "Torneio",
  match: "Partida",
};

export function AdminModerationTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionReason, setActionReason] = useState("");
  const [actionDuration, setActionDuration] = useState("24");

  const { data: cases = [], isLoading } = useModerationCases(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { resolveCase, applyRestriction, isLoading: actionLoading } = useAdminModeration();

  const filteredCases = cases.filter((c: any) => {
    if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        c.reason?.toLowerCase().includes(search) ||
        c.reported_user?.username?.toLowerCase().includes(search) ||
        c.reporter?.username?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    pending: cases.filter((c: any) => c.status === "pending").length,
    investigating: cases.filter((c: any) => c.status === "investigating").length,
    critical: cases.filter((c: any) => c.priority === "critical" && c.status !== "resolved").length,
    resolved: cases.filter((c: any) => c.status === "resolved").length,
  };

  const handleAction = async () => {
    if (!selectedCase) return;

    try {
      if (actionType === "resolve" || actionType === "dismiss") {
        await resolveCase.mutateAsync({
          caseId: selectedCase.id,
          status: actionType === "resolve" ? "resolved" : "dismissed",
          reason: actionReason,
        });
      } else if (actionType === "ban" || actionType === "mute" || actionType === "warn") {
        await applyRestriction.mutateAsync({
          userId: selectedCase.reported_user_id,
          caseId: selectedCase.id,
          type: actionType,
          reason: actionReason,
          durationHours: parseInt(actionDuration),
        });
      }
      setActionDialogOpen(false);
      setSelectedCase(null);
      setActionReason("");
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  const openActionDialog = (caseData: any, type: string) => {
    setSelectedCase(caseData);
    setActionType(type);
    setActionDialogOpen(true);
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
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.investigating}</p>
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
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolvidos</p>
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
                  placeholder="Buscar por usuário ou motivo..."
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
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="investigating">Em Análise</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="dismissed">Descartado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Casos de Moderação
          </CardTitle>
          <CardDescription>
            {filteredCases.length} caso(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum caso encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Reportado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Denunciante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem: any) => {
                  const priority = priorityConfig[caseItem.priority] || priorityConfig.low;
                  const status = statusConfig[caseItem.status] || statusConfig.pending;
                  const PriorityIcon = priority.icon;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <Badge className={priority.color}>
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contentTypeLabels[caseItem.reported_content_type] || caseItem.reported_content_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {(caseItem.reported_user?.username || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {caseItem.reported_user?.display_name || caseItem.reported_user?.username || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm">{caseItem.reason}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {caseItem.reporter?.username || "Sistema"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(caseItem.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCase(caseItem)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {caseItem.status !== "resolved" && caseItem.status !== "dismissed" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success"
                                onClick={() => openActionDialog(caseItem, "resolve")}
                                title="Resolver"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => openActionDialog(caseItem, "ban")}
                                title="Banir usuário"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </>
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

      {/* Case Detail Dialog */}
      <Dialog open={!!selectedCase && !actionDialogOpen} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Detalhes do Caso
            </DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Usuário Reportado</Label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar>
                      <AvatarFallback>
                        {(selectedCase.reported_user?.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedCase.reported_user?.display_name || selectedCase.reported_user?.username}
                      </p>
                      <p className="text-sm text-muted-foreground">@{selectedCase.reported_user?.username}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Denunciante</Label>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar>
                      <AvatarFallback>
                        {(selectedCase.reporter?.username || "S")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedCase.reporter?.display_name || selectedCase.reporter?.username || "Sistema"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Motivo da Denúncia</Label>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p>{selectedCase.reason}</p>
                </div>
              </div>

              {selectedCase.description && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Descrição Detalhada</Label>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p>{selectedCase.description}</p>
                  </div>
                </div>
              )}

              {selectedCase.evidence_urls && selectedCase.evidence_urls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Evidências</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedCase.evidence_urls.map((url: string, i: number) => (
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

              <div className="flex gap-2 pt-4">
                {selectedCase.status !== "resolved" && selectedCase.status !== "dismissed" && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => openActionDialog(selectedCase, "resolve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => openActionDialog(selectedCase, "warn")}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Advertir
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => openActionDialog(selectedCase, "mute")}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Silenciar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => openActionDialog(selectedCase, "ban")}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Banir
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setSelectedCase(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "resolve" && "Resolver Caso"}
              {actionType === "dismiss" && "Descartar Caso"}
              {actionType === "warn" && "Aplicar Advertência"}
              {actionType === "mute" && "Silenciar Usuário"}
              {actionType === "ban" && "Banir Usuário"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "ban" && "Esta ação impedirá o usuário de acessar a plataforma."}
              {actionType === "mute" && "O usuário não poderá enviar mensagens."}
              {actionType === "warn" && "O usuário receberá uma advertência formal."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo / Observação</Label>
              <Textarea
                placeholder="Descreva o motivo da ação..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>

            {(actionType === "mute" || actionType === "ban") && (
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select value={actionDuration} onValueChange={setActionDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="6">6 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="72">3 dias</SelectItem>
                    <SelectItem value="168">7 dias</SelectItem>
                    <SelectItem value="720">30 dias</SelectItem>
                    <SelectItem value="8760">1 ano</SelectItem>
                    <SelectItem value="-1">Permanente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant={actionType === "ban" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actionLoading || !actionReason}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
