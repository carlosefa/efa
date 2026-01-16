import { Check, X, Clock, Mail, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMyTeamInvites, useRespondToTeamInvite } from "@/hooks/useTeamInvites";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TeamInvitesSection() {
  const { data: invites, isLoading } = useMyTeamInvites();
  const respondToInvite = useRespondToTeamInvite();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!invites || invites.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Convites Pendentes
          <Badge variant="destructive" className="ml-2">
            {invites.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Você foi convidado para se juntar aos seguintes times
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-4 rounded-lg bg-background border"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 rounded-lg">
                <AvatarImage src={invite.team?.logo_url || ""} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                  {invite.team?.tag?.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{invite.team?.name}</p>
                <p className="text-sm text-muted-foreground">
                  [{invite.team?.tag}] • Função: {invite.role === "player" ? "Jogador" : invite.role === "coach" ? "Técnico" : "Reserva"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Convidado por {invite.inviter?.display_name || invite.inviter?.username} •{" "}
                  {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true, locale: ptBR })}
                </p>
                {invite.message && (
                  <p className="text-sm mt-2 italic text-muted-foreground">
                    "{invite.message}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => respondToInvite.mutate({ inviteId: invite.id, accept: false })}
                disabled={respondToInvite.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => respondToInvite.mutate({ inviteId: invite.id, accept: true })}
                disabled={respondToInvite.isPending}
              >
                {respondToInvite.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Aceitar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
