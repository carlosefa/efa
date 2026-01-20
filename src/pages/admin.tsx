import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModerationCases } from "@/hooks/useModeration";
import { useTournaments } from "@/hooks/useTournaments";
import { Shield, Trophy, Users, AlertTriangle, Flag, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function AdminCountry() {
  const navigate = useNavigate();
  const { data: cases = [] } = useModerationCases({ status: "open" });
  const { data: tournaments = [] } = useTournaments();

  const openCases = cases.filter((c) => c.status === "open");

  const handleCreateTournament = () => {
    // Adjust this route to your real "create tournament" page
    navigate("app/tournaments/new");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Country Admin
          </h1>
          <p className="text-muted-foreground">Regional administration dashboard</p>
        </div>

        {/* Create Tournament button */}
        <Button onClick={handleCreateTournament} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{tournaments.length}</p>
              <p className="text-sm text-muted-foreground">Tournaments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{openCases.length}</p>
              <p className="text-sm text-muted-foreground">Open Cases</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Active Players</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Flag className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Reports Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="moderation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Cases</CardTitle>
            </CardHeader>
            <CardContent>
              {openCases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No open cases
                </p>
              ) : (
                <div className="space-y-4">
                  {openCases.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              c.priority === "critical"
                                ? "destructive"
                                : c.priority === "high"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {c.priority}
                          </Badge>
                          <Badge variant="outline">{c.reason}</Badge>
                        </div>
                        <p className="mt-2 font-medium">
                          Reported:{" "}
                          {c.reported_user?.display_name || c.reported_user?.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {c.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(c.created_at), {
                            addSuffix: true,
                            locale: enUS,
                          })}
                        </p>
                      </div>
                      <Button>Review</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manage Tournaments</CardTitle>

              {/* Secondary button inside the tab */}
              <Button variant="outline" className="gap-2" onClick={handleCreateTournament}>
                <Plus className="h-4 w-4" />
                Create Tournament
              </Button>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">List of country tournaments...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">List of country users...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

