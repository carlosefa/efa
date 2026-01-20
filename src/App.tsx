import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PublicLayout } from "@/components/layout/PublicLayout";

/* Public / base pages */
import Landing from "./pages/landing";
import Pricing from "./pages/pricing";
import Auth from "./pages/auth";
import Install from "./pages/install";
import NotFound from "./pages/notfound";
import ForcePasswordChange from "./pages/forcepasswordchange";

/* App core */
import Dashboard from "./pages/dashboard";

/* Tournaments */
import Tournaments from "./pages/tournaments";
import CreateTournament from "./pages/tournaments/new";
import TournamentDetail from "./pages/tournaments/[id]";
import TournamentSettings from "./pages/tournaments/[id]/settings";

/* Teams */
import Teams from "./pages/teams";
import TeamDetail from "./pages/teams/[id]";

/* Matches */
import Matches from "./pages/matches";
import MatchRoom from "./pages/matches/[id]";

/* Other features */
import Rankings from "./pages/rankings";
import Profile from "./pages/profile";
import Friendlies from "./pages/friendlies";
import Chat from "./pages/chat";
import Wallet from "./pages/wallet";
import Achievements from "./pages/achievements";

/* Admin */
import AdminCountry from "./pages/admin";
import AdminGlobal from "./pages/adminglobal";

/* Public pages */
import PublicRankings from "./pages/publicrankings";
import PublicTournaments from "./pages/publictournaments";
import PublicTeams from "./pages/publicteams";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/rankings" element={<PublicRankings />} />
              <Route path="/tournaments" element={<PublicTournaments />} />
              <Route path="/teams" element={<PublicTeams />} />
            </Route>

            {/* Auth / system */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            <Route path="/change-password" element={<ForcePasswordChange />} />

            {/* Protected app */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />

              {/* App tournaments */}
              <Route path="/app/tournaments" element={<Tournaments />} />
              <Route path="/app/tournaments/new" element={<CreateTournament />} />
              <Route path="/app/tournaments/:id" element={<TournamentDetail />} />
              <Route path="/app/tournaments/:id/settings" element={<TournamentSettings />} />
          
              {/* App teams */}
              <Route path="/app/teams" element={<Teams />} />
              <Route path="/app/teams/:id" element={<TeamDetail />} />

              {/* Matches */}
              <Route path="/matches" element={<Matches />} />
              <Route path="/matches/:id" element={<MatchRoom />} />

              {/* Other app areas */}
              <Route path="/app/rankings" element={<Rankings />} />
              <Route path="/friendlies" element={<Friendlies />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:threadId" element={<Chat />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin */}
              <Route path="/admin/country" element={<AdminCountry />} />
              <Route path="/admin/global" element={<AdminGlobal />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
