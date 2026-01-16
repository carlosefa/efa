import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Trophy,
  Medal,
  MapPin,
  Calendar,
  Settings,
  UserPlus,
  Shield,
  Loader2,
} from "lucide-react";
import { useTeam, useTeamMembers } from "@/hooks/useTeams";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitePlayerDialog } from "@/components/teams/InvitePlayerDialog";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";

const roleLabels: Record<string, string> = {
  owner: "Dono",
  coach: "Técnico",
  player: "Jogador",
  substitute: "Reserva",
};

const roleColors: Record<string, string> = {
  owner: "bg-primary text-primary-foreground",
  coach: "bg-secondary text-secondary-foreground",
  player: "bg-muted text-muted-foreground",
  substitute: "bg-muted/50 text-muted-foreground",
};

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: team, isLoading: teamLoading } = useTeam(id);
  const { data: members, isLoading: membersLoading } = useTeamMembers(id);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isOwner = team?.owner_id === user?.id;

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Time não encontrado</h2>
        <Button asChild className="mt-4">
          <Link to="/teams">Voltar para Times</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="h-24 w-24 rounded-xl">
          <AvatarImage src={team.logo_url || ""} alt={team.name} />
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl font-bold">
            {team.tag}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {team.name}
                <Badge variant="outline" className="font-mono">
                  [{team.tag}]
                </Badge>
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {team.countries && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {team.countries.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {members?.length || 0} membros
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Criado em {new Date(team.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convidar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="h-5 w-5 mx-auto text-secondary mb-1" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Títulos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Medal className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Ranking</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Torneios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Partidas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Elenco</TabsTrigger>
          <TabsTrigger value="matches">Partidas</TabsTrigger>
          <TabsTrigger value="tournaments">Torneios</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Elenco</CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : members && members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profile?.avatar_url || ""} />
                          <AvatarFallback>
                            {member.profile?.display_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.profile?.display_name || member.profile?.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{member.profile?.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.jersey_number && (
                          <span className="text-sm font-mono text-muted-foreground">
                            #{member.jersey_number}
                          </span>
                        )}
                        <Badge className={roleColors[member.role] || ""}>
                          {roleLabels[member.role] || member.role}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum membro no elenco
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma partida encontrada</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum torneio encontrado</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Medal className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Estatísticas em breve</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {team && (
        <>
          <InvitePlayerDialog
            open={showInviteDialog}
            onOpenChange={setShowInviteDialog}
            teamId={team.id}
            teamName={team.name}
          />
          <EditTeamDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            team={team}
          />
        </>
      )}
    </div>
  );
}
