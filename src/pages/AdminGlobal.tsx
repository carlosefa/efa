import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Crown,
  Globe,
  Users,
  Trophy,
  Swords,
  Shield,
  Gamepad2,
  TrendingUp,
  AlertTriangle,
  Settings,
  UserCog,
  Flag,
  DollarSign,
  Activity,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Coins,
  Scale,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { AdminEconomyTab } from "@/components/admin/AdminEconomyTab";
import { AdminModerationTab } from "@/components/admin/AdminModerationTab";
import { AdminDisputesTab } from "@/components/admin/AdminDisputesTab";
import { AdminFeatureFlagsTab } from "@/components/admin/AdminFeatureFlagsTab";
import { AdminRBACTab } from "@/components/admin/AdminRBACTab";

// Mock data for demonstration
const mockStats = {
  totalUsers: 12847,
  activeToday: 2341,
  totalTeams: 1256,
  totalTournaments: 89,
  totalMatches: 15678,
  totalTransactions: 45230,
  efaCoinsCirculating: 2847500,
  countriesActive: 15,
};

const mockCountries = [
  { code: "BR", name: "Brazil", users: 8234, teams: 876, tournaments: 45, status: "active" },
  { code: "PT", name: "Portugal", users: 1234, teams: 156, tournaments: 12, status: "active" },
  { code: "US", name: "United States", users: 987, teams: 98, tournaments: 8, status: "active" },
  { code: "ES", name: "Spain", users: 756, teams: 67, tournaments: 6, status: "active" },
  { code: "AR", name: "Argentina", users: 654, teams: 54, tournaments: 5, status: "pending" },
  { code: "MX", name: "Mexico", users: 543, teams: 45, tournaments: 4, status: "pending" },
];

const mockGames = [
  { id: "1", name: "EA FC 25", slug: "eafc25", modes: 3, teams: 456, tournaments: 34, status: "active" },
  { id: "2", name: "League of Legends", slug: "lol", modes: 2, teams: 234, tournaments: 18, status: "active" },
  { id: "3", name: "Valorant", slug: "valorant", modes: 2, teams: 189, tournaments: 12, status: "active" },
  { id: "4", name: "Counter-Strike 2", slug: "cs2", modes: 1, teams: 167, tournaments: 10, status: "active" },
  { id: "5", name: "Free Fire", slug: "freefire", modes: 2, teams: 210, tournaments: 15, status: "pending" },
];

const mockAuditLogs = [
  { id: "1", action: "user_banned", actor: "Hudson", target: "SuspiciousUser", details: "Match fraud", timestamp: new Date(Date.now() - 3600000) },
  { id: "2", action: "tournament_approved", actor: "Carlos", target: "Brazil Cup 2025", details: "Approved for publishing", timestamp: new Date(Date.now() - 7200000) },
  { id: "3", action: "country_activated", actor: "Hudson", target: "Argentina", details: "Country activated on platform", timestamp: new Date(Date.now() - 86400000) },
  { id: "4", action: "game_added", actor: "Carlos", target: "Free Fire", details: "New game added", timestamp: new Date(Date.now() - 86400000 * 2) },
  { id: "5", action: "role_granted", actor: "Hudson", target: "Carlos", details: "Promoted to global_admin", timestamp: new Date(Date.now() - 86400000 * 7) },
];

const getActionColor = (action: string) => {
  if (action.includes("banned") || action.includes("suspended")) return "destructive";
  if (action.includes("approved") || action.includes("activated") || action.includes("granted")) return "default";
  return "secondary";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-success/20 text-success border-success/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case "suspended":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Suspended
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminGlobal() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCreateTournament = () => {
    // Adjust to your real route
    navigate("/tournaments/new");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary-foreground" />
            </div>
            Global Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Master control panel for the EFA platform
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Tournament button */}
          <Button onClick={handleCreateTournament} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Tournament
          </Button>

          <Badge variant="outline" className="text-primary border-primary">
            <Shield className="h-3 w-3 mr-1" />
            Master Access
          </Badge>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: "Total Users", value: mockStats.totalUsers.toLocaleString(), icon: Users, color: "text-blue-500" },
          { label: "Active Today", value: mockStats.activeToday.toLocaleString(), icon: Activity, color: "text-green-500" },
          { label: "Teams", value: mockStats.totalTeams.toLocaleString(), icon: Shield, color: "text-purple-500" },
          { label: "Tournaments", value: mockStats.totalTournaments, icon: Trophy, color: "text-yellow-500" },
          { label: "Matches", value: mockStats.totalMatches.toLocaleString(), icon: Swords, color: "text-red-500" },
          { label: "Transactions", value: mockStats.totalTransactions.toLocaleString(), icon: DollarSign, color: "text-emerald-500" },
          { label: "EFA Coins", value: (mockStats.efaCoinsCirculating / 1000000).toFixed(1) + "M", icon: TrendingUp, color: "text-orange-500" },
          { label: "Countries", value: mockStats.countriesActive, icon: Globe, color: "text-cyan-500" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-card/50">
              <CardContent className="p-4">
                <Icon className={`h-5 w-5 ${stat.color} mb-2`} />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2">
            <Globe className="h-4 w-4 hidden sm:block" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-2">
            <MessageSquare className="h-4 w-4 hidden sm:block" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="disputes" className="gap-2">
            <Scale className="h-4 w-4 hidden sm:block" />
            Disputes
          </TabsTrigger>
          <TabsTrigger value="countries" className="gap-2">
            <Flag className="h-4 w-4 hidden sm:block" />
            Countries
          </TabsTrigger>
          <TabsTrigger value="games" className="gap-2">
            <Gamepad2 className="h-4 w-4 hidden sm:block" />
            Games
          </TabsTrigger>
          <TabsTrigger value="economy" className="gap-2">
            <Coins className="h-4 w-4 hidden sm:block" />
            Economy
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-2">
            <Flag className="h-4 w-4 hidden sm:block" />
            Features
          </TabsTrigger>
          <TabsTrigger value="rbac" className="gap-2">
            <UserCog className="h-4 w-4 hidden sm:block" />
            RBAC
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:block" />
            Audit
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Active Countries
                </CardTitle>
              </CardHeader>
              <CardContent>{/* ... */}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>{/* ... */}</CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>{/* ... */}</CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation">
          <AdminModerationTab />
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes">
          <AdminDisputesTab />
        </TabsContent>

        {/* Countries Tab */}
        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Manage Countries</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Country
                </Button>
              </div>
            </CardHeader>
            <CardContent>{/* ... */}</CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Manage Games</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Game
                </Button>
              </div>
            </CardHeader>
            <CardContent>{/* ... */}</CardContent>
          </Card>
        </TabsContent>

        {/* Economy Tab */}
        <TabsContent value="economy">
          <AdminEconomyTab />
        </TabsContent>

        {/* Feature Flags Tab */}
        <TabsContent value="flags">
          <AdminFeatureFlagsTab />
        </TabsContent>

        {/* RBAC Tab */}
        <TabsContent value="rbac">
          <AdminRBACTab />
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>{/* ... */}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

