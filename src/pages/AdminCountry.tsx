import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModerationCases } from "@/hooks/useModeration";
import { useTournaments } from "@/hooks/useTournaments";
import { Shield, Trophy, Users, AlertTriangle, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminCountry() {
  const { data: cases = [] } = useModerationCases({ status: "open" });
  const { data: tournaments = [] } = useTournaments();

  const openCases = cases.filter((c) => c.status === "open");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><Shield className="h-8 w-8" />Admin do País</h1>
        <p className="text-muted-foreground">Painel de administração regional</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-4"><Trophy className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{tournaments.length}</p><p className="text-sm text-muted-foreground">Torneios</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-yellow-500" /><div><p className="text-2xl font-bold">{openCases.length}</p><p className="text-sm text-muted-foreground">Casos Abertos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><Users className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">-</p><p className="text-sm text-muted-foreground">Jogadores Ativos</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-4"><Flag className="h-8 w-8 text-red-500" /><div><p className="text-2xl font-bold">-</p><p className="text-sm text-muted-foreground">Denúncias Hoje</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="moderation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="moderation">Moderação</TabsTrigger>
          <TabsTrigger value="tournaments">Torneios</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Casos de Moderação</CardTitle></CardHeader>
            <CardContent>
              {openCases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum caso aberto</p>
              ) : (
                <div className="space-y-4">
                  {openCases.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={c.priority === "critical" ? "destructive" : c.priority === "high" ? "default" : "secondary"}>{c.priority}</Badge>
                          <Badge variant="outline">{c.reason}</Badge>
                        </div>
                        <p className="mt-2 font-medium">Reportado: {c.reported_user?.display_name || c.reported_user?.username}</p>
                        <p className="text-sm text-muted-foreground">{c.description || "Sem descrição"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}</p>
                      </div>
                      <Button>Revisar</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments">
          <Card>
            <CardHeader><CardTitle>Gerenciar Torneios</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Lista de torneios do país...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>Gerenciar Usuários</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Lista de usuários do país...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
