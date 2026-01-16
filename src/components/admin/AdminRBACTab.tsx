import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Crown,
  Globe,
  Building,
  Shield,
  Users,
  UserCog,
  Plus,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useAdminRBAC } from "@/hooks/useAdminRBAC";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const roleConfig: Record<string, { label: string; color: string; icon: typeof Crown; level: number }> = {
  master: { label: "Master", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500", icon: Crown, level: 0 },
  global_admin: { label: "Global Admin", color: "bg-purple-500/10 text-purple-500 border-purple-500", icon: Globe, level: 1 },
  country_admin: { label: "Country Admin", color: "bg-blue-500/10 text-blue-500 border-blue-500", icon: Building, level: 2 },
  country_staff: { label: "Country Staff", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500", icon: Shield, level: 3 },
  org_admin: { label: "Org Admin", color: "bg-green-500/10 text-green-500 border-green-500", icon: Building, level: 4 },
  team_owner: { label: "Team Owner", color: "bg-orange-500/10 text-orange-500 border-orange-500", icon: Users, level: 5 },
  coach: { label: "Coach", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500", icon: UserCog, level: 6 },
  player: { label: "Player", color: "bg-muted text-muted-foreground", icon: Users, level: 7 },
};

const scopeLabels: Record<string, string> = {
  global: "Global",
  country: "País",
  organization: "Organização",
  team: "Time",
};

export function AdminRBACTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRoleEmail, setNewRoleEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("");
  const [newScopeType, setNewScopeType] = useState<string>("");
  const [newScopeId, setNewScopeId] = useState<string>("");

  const {
    userRoles,
    countries,
    organizations,
    isLoading,
    assignRole,
    revokeRole,
    isAssigning,
  } = useAdminRBAC();

  const filteredRoles = userRoles.filter((ur: any) => {
    if (roleFilter !== "all" && ur.role !== roleFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ur.user?.username?.toLowerCase().includes(search) ||
        ur.user?.display_name?.toLowerCase().includes(search) ||
        ur.user?.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleAssignRole = async () => {
    if (!newRoleEmail || !newRole) {
      toast.error("Preencha email e role");
      return;
    }

    try {
      await assignRole.mutateAsync({
        email: newRoleEmail,
        role: newRole,
        scopeType: newScopeType || undefined,
        scopeId: newScopeId || undefined,
      });
      setAddDialogOpen(false);
      setNewRoleEmail("");
      setNewRole("");
      setNewScopeType("");
      setNewScopeId("");
    } catch (error) {
      console.error("Failed to assign role:", error);
    }
  };

  const handleRevokeRole = async (roleId: string) => {
    if (!confirm("Tem certeza que deseja remover esta role?")) return;
    await revokeRole.mutateAsync(roleId);
  };

  const stats = {
    masters: userRoles.filter((ur: any) => ur.role === "master").length,
    globalAdmins: userRoles.filter((ur: any) => ur.role === "global_admin").length,
    countryAdmins: userRoles.filter((ur: any) => ur.role === "country_admin").length,
    staff: userRoles.filter((ur: any) => ur.role === "country_staff").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.masters}</p>
                <p className="text-sm text-muted-foreground">Masters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.globalAdmins}</p>
                <p className="text-sm text-muted-foreground">Global Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.countryAdmins}</p>
                <p className="text-sm text-muted-foreground">Country Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-cyan-500" />
              <div>
                <p className="text-2xl font-bold">{stats.staff}</p>
                <p className="text-sm text-muted-foreground">Staff</p>
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
                  placeholder="Buscar por nome ou email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Roles</SelectItem>
                {Object.entries(roleConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            Roles Atribuídas
          </CardTitle>
          <CardDescription>
            {filteredRoles.length} role(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCog className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma role encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Atribuído por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((ur: any) => {
                  const role = roleConfig[ur.role] || roleConfig.player;
                  const RoleIcon = role.icon;

                  return (
                    <TableRow key={ur.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {(ur.user?.username || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {ur.user?.display_name || ur.user?.username || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{ur.user?.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={role.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {role.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ur.scope_type ? (
                          <div className="text-sm">
                            <p className="font-medium">{scopeLabels[ur.scope_type] || ur.scope_type}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-32">
                              {ur.scope_name || ur.scope_id?.slice(0, 8)}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="outline">Global</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ur.granted_by_user?.username || "Sistema"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(ur.granted_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {ur.role !== "master" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRevokeRole(ur.id)}
                            disabled={revokeRole.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Atribuir Role
            </DialogTitle>
            <DialogDescription>
              Adicione uma nova role a um usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email do Usuário *</Label>
              <Input
                type="email"
                placeholder="usuario@email.com"
                value={newRoleEmail}
                onChange={(e) => setNewRoleEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global_admin">Global Admin</SelectItem>
                  <SelectItem value="country_admin">Country Admin</SelectItem>
                  <SelectItem value="country_staff">Country Staff</SelectItem>
                  <SelectItem value="org_admin">Org Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newRole === "country_admin" || newRole === "country_staff") && (
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={newScopeId} onValueChange={(v) => {
                  setNewScopeId(v);
                  setNewScopeType("country");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country: any) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newRole === "org_admin" && (
              <div className="space-y-2">
                <Label>Organização</Label>
                <Select value={newScopeId} onValueChange={(v) => {
                  setNewScopeId(v);
                  setNewScopeType("organization");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a organização" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={isAssigning || !newRoleEmail || !newRole}
            >
              {isAssigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Atribuir Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
