import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tournaments from "./pages/Tournaments";
import CreateTournament from "./pages/CreateTournament";
import TournamentDetail from "./pages/TournamentDetail";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import Matches from "./pages/Matches";
import MatchRoom from "./pages/MatchRoom";
import Rankings from "./pages/Rankings";
import Profile from "./pages/Profile";
import Friendlies from "./pages/Friendlies";
import Chat from "./pages/Chat";
import Wallet from "./pages/Wallet";
import AdminCountry from "./pages/AdminCountry";
import AdminGlobal from "./pages/AdminGlobal";
import Install from "./pages/Install";
import Achievements from "./pages/Achievements";
import ForcePasswordChange from "./pages/ForcePasswordChange";
import NotFound from "./pages/NotFound";

// Public pages
import PublicRankings from "./pages/PublicRankings";
import PublicTournaments from "./pages/PublicTournaments";
import PublicTeams from "./pages/PublicTeams";

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

            {/* Auth routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            <Route path="/change-password" element={<ForcePasswordChange />} />

            {/* Protected app routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/app/tournaments" element={<Tournaments />} />
              <Route path="/app/tournaments/create" element={<CreateTournament />} />
              <Route path="/app/tournaments/:id" element={<TournamentDetail />} />
              <Route path="/app/teams" element={<Teams />} />
              <Route path="/app/teams/:id" element={<TeamDetail />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/matches/:id" element={<MatchRoom />} />
              <Route path="/app/rankings" element={<Rankings />} />
              <Route path="/friendlies" element={<Friendlies />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:threadId" element={<Chat />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/admin/country" element={<AdminCountry />} />
              <Route path="/admin/global" element={<AdminGlobal />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
