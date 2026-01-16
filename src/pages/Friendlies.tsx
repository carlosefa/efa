import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriendlyInvites, useFriendlyMatches, useRespondToInvite } from "@/hooks/useFriendlies";
import { useAuth } from "@/contexts/AuthContext";
import { Gamepad2, UserPlus, Clock, CheckCircle, XCircle, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Friendlies() {
  const { user } = useAuth();
  const { data: invites = [], isLoading: loadingInvites } = useFriendlyInvites();
  const { data: matches = [], isLoading: loadingMatches } = useFriendlyMatches();
  const respondToInvite = useRespondToInvite();

  const pendingInvites = invites.filter((i) => i.status === "pending" && i.to_user_id === user?.id);
  const sentInvites = invites.filter((i) => i.from_user_id === user?.id);

  const handleRespond = (inviteId: string, accept: boolean) => {
    respondToInvite.mutate({ inviteId, accept });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Amistosos</h1>
          <p className="text-muted-foreground">Partidas casuais fora de torneios</p>
        </div>
        <Button className="gap-2"><UserPlus className="h-4 w-4" />Convidar Jogador</Button>
      </div>

      <Tabs defaultValue="invites" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invites">Convites {pendingInvites.length > 0 && <Badge className="ml-2" variant="destructive">{pendingInvites.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="matches">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="invites" className="space-y-4">
          {pendingInvites.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum convite pendente</CardContent></Card>
          ) : (
            pendingInvites.map((invite) => (
              <Card key={invite.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Avatar><AvatarImage src={invite.from_user?.avatar_url || ""} /><AvatarFallback>{invite.from_user?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-medium">{invite.from_user?.display_name || invite.from_user?.username}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Gamepad2 className="h-3 w-3" />{invite.game?.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRespond(invite.id, false)}><XCircle className="h-4 w-4" /></Button>
                    <Button size="sm" onClick={() => handleRespond(invite.id, true)}><CheckCircle className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          {matches.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma partida ainda</CardContent></Card>
          ) : (
            matches.map((match) => (
              <Card key={match.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8"><AvatarFallback>{match.player1?.username?.[0]}</AvatarFallback></Avatar>
                      <span className="font-medium">{match.player1?.display_name}</span>
                    </div>
                    <span className="text-xl font-bold">{match.score1 ?? "-"} x {match.score2 ?? "-"}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.player2?.display_name}</span>
                      <Avatar className="h-8 w-8"><AvatarFallback>{match.player2?.username?.[0]}</AvatarFallback></Avatar>
                    </div>
                  </div>
                  <Badge variant={match.status === "completed" ? "default" : "secondary"}>{match.status}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
