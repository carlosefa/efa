import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Filter,
  Trophy,
  Medal,
  MapPin,
  Loader2,
} from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { TeamInvitesSection } from "@/components/teams/TeamInvitesSection";

export default function Teams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: teams, isLoading } = useTeams();

  const filteredTeams = teams?.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Teams
          </h1>
          <p className="text-muted-foreground">Manage your teams and players</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Pending Invites */}
      <TeamInvitesSection />

      {/* Teams Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTeams && filteredTeams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTeams.map((team) => (
            <Card
              key={team.id}
              className="group hover:border-primary/50 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 rounded-lg">
                    <AvatarImage src={team.logo_url || ""} alt={team.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-bold">
                      {team.tag}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      <Link to={`/teams/${team.id}`}>{team.name}</Link>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="font-mono">
                        [{team.tag}]
                      </Badge>
                      {team.countries && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {team.countries.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Medal className="h-4 w-4 text-primary" />
                      <span>-</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Trophy className="h-4 w-4 text-secondary" />
                      <span>0 titles</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{team.team_memberships?.[0]?.count || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? "No teams found"
                : "No teams registered yet"}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first team
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
