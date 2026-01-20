import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Users,
  Search,
  Trophy,
  Medal,
  MapPin,
  Gamepad2,
  Shield,
  Star,
  Crown,
  ArrowRight,
  Zap,
  Building2,
  TrendingUp,
  CheckCircle2,
  Swords,
  Target,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import nebulaSoft from "@/assets/bg/nebula-soft-1.png";

// Mock teams data
const mockTeams = [
  {
    id: "1",
    name: "FaZe Clan",
    tag: "FaZe",
    country: "🇺🇸",
    countryName: "United States",
    members: 5,
    rating: 3245,
    titles: 12,
    wins: 156,
    losses: 34,
    games: ["FC 25", "eFootball"],
    verified: true,
    rank: "master",
  },
  {
    id: "2",
    name: "G2 Esports",
    tag: "G2",
    country: "🇪🇸",
    countryName: "Spain",
    members: 5,
    rating: 3156,
    titles: 8,
    wins: 142,
    losses: 38,
    games: ["FC 25"],
    verified: true,
    rank: "diamond",
  },
  {
    id: "3",
    name: "LOUD Gaming",
    tag: "LOUD",
    country: "🇧🇷",
    countryName: "Brazil",
    members: 5,
    rating: 3089,
    titles: 6,
    wins: 138,
    losses: 42,
    games: ["FC 25", "NBA 2K25"],
    verified: true,
    rank: "diamond",
  },
  {
    id: "4",
    name: "Natus Vincere",
    tag: "NaVi",
    country: "🇺🇦",
    countryName: "Ukraine",
    members: 5,
    rating: 2967,
    titles: 5,
    wins: 125,
    losses: 45,
    games: ["eFootball"],
    verified: true,
    rank: "gold",
  },
  {
    id: "5",
    name: "T1 Esports",
    tag: "T1",
    country: "🇰🇷",
    countryName: "South Korea",
    members: 5,
    rating: 2845,
    titles: 4,
    wins: 118,
    losses: 48,
    games: ["FC 25"],
    verified: true,
    rank: "gold",
  },
  {
    id: "6",
    name: "100 Thieves",
    tag: "100T",
    country: "🇺🇸",
    countryName: "United States",
    members: 4,
    rating: 2756,
    titles: 3,
    wins: 105,
    losses: 52,
    games: ["FC 25", "eFootball"],
    verified: false,
    rank: "gold",
  },
  {
    id: "7",
    name: "Fnatic",
    tag: "FNC",
    country: "🇬🇧",
    countryName: "United Kingdom",
    members: 5,
    rating: 2698,
    titles: 2,
    wins: 98,
    losses: 55,
    games: ["FC 25"],
    verified: true,
    rank: "silver",
  },
  {
    id: "8",
    name: "Cloud9",
    tag: "C9",
    country: "🇺🇸",
    countryName: "United States",
    members: 5,
    rating: 2634,
    titles: 2,
    wins: 92,
    losses: 58,
    games: ["eFootball", "NBA 2K25"],
    verified: true,
    rank: "silver",
  },
];

const rankConfig: Record<
  string,
  { color: string; bg: string; glow: string; gradient: string }
> = {
  master: {
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    glow: "shadow-purple-500/40",
    gradient: "from-purple-500 via-pink-500 to-purple-600",
  },
  diamond: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
    glow: "shadow-cyan-500/40",
    gradient: "from-cyan-500 via-blue-500 to-cyan-600",
  },
  gold: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    glow: "shadow-yellow-500/40",
    gradient: "from-yellow-500 via-orange-500 to-yellow-600",
  },
  silver: {
    color: "text-gray-300",
    bg: "bg-gray-500/20",
    glow: "shadow-gray-400/40",
    gradient: "from-gray-400 via-gray-500 to-gray-600",
  },
  bronze: {
    color: "text-amber-600",
    bg: "bg-amber-700/20",
    glow: "shadow-amber-700/40",
    gradient: "from-amber-700 via-orange-700 to-amber-800",
  },
};

// Floating Orb Component
function FloatingOrb({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

// Podium Component for Top 3
function TopTeamsPodium({ teams }: { teams: typeof mockTeams }) {
  const podiumOrder = [1, 0, 2]; // Show 2nd, 1st, 3rd
  const heights = ["h-32", "h-40", "h-24"];
  const delays = [0.3, 0.1, 0.5];

  return (
    <div className="flex items-end justify-center gap-4 md:gap-8 py-8">
      {podiumOrder.map((orderIndex, displayIndex) => {
        const team = teams[orderIndex];
        if (!team) return null;
        const position = orderIndex + 1;
        const rank = rankConfig[team.rank] || rankConfig.bronze;
        const winRate = Math.round(
          (team.wins / (team.wins + team.losses)) * 100
        );

        return (
          <motion.div
            key={team.id}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: delays[displayIndex] }}
          >
            {/* Team Card */}
            <motion.div
              className={`relative mb-4 ${position === 1 ? "scale-110" : ""}`}
              whileHover={{ scale: position === 1 ? 1.15 : 1.05, y: -5 }}
            >
              {/* Glow Effect */}
              <motion.div
                className={`absolute -inset-2 bg-gradient-to-r ${rank.gradient} rounded-2xl blur-xl opacity-40`}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Card */}
              <div
                className={`relative p-5 rounded-2xl bg-surface-1/80 backdrop-blur-xl border border-white/10 hover:border-primary/50 transition-all ${rank.glow} shadow-2xl`}
              >
                {/* Position Badge */}
                <div
                  className={`absolute -top-3 -left-3 h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                    position === 1
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black"
                      : position === 2
                        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-black"
                        : "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                  }`}
                >
                  {position}
                </div>

                {/* Crown for 1st */}
                {position === 1 && (
                  <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2"
                    animate={{ y: [-2, 2, -2], rotate: [-5, 5, -5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                  </motion.div>
                )}

                {/* Avatar */}
                <div className="relative mb-3">
                  <Avatar
                    className={`h-20 w-20 rounded-xl ring-2 ${rank.color} ring-opacity-50`}
                  >
                    <AvatarFallback
                      className={`rounded-xl text-2xl font-bold bg-gradient-to-br ${rank.gradient} text-white`}
                    >
                      {team.tag}
                    </AvatarFallback>
                  </Avatar>
                  {team.verified && (
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="text-center">
                  <h3 className={`font-bold ${rank.color} text-lg`}>
                    {team.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {team.country} {team.countryName}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-2 text-sm">
                    <span className={`font-bold ${rank.color}`}>
                      {team.rating}
                    </span>
                    <span className="text-emerald-400">{winRate}% WR</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Podium Base */}
            <motion.div
              className={`${heights[displayIndex]} w-24 md:w-32 rounded-t-xl bg-gradient-to-t ${rank.gradient} relative overflow-hidden`}
              initial={{ height: 0 }}
              animate={{ height: heights[displayIndex] }}
              transition={{
                duration: 0.8,
                delay: delays[displayIndex] + 0.3,
              }}
            >
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl font-bold text-white/80">
                {position}
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Stats Bar Component
function StatsBar() {
  const totalPlayers = mockTeams.reduce((acc, t) => acc + t.members, 0);
  const verifiedTeams = mockTeams.filter((t) => t.verified).length;
  const uniqueCountries = new Set(mockTeams.map((t) => t.country)).size;
  const totalTitles = mockTeams.reduce((acc, t) => acc + t.titles, 0);

  const stats = [
    {
      value: mockTeams.length,
      label: "Registered Teams",
      icon: Users,
      color: "from-primary to-blue-500",
    },
    {
      value: verifiedTeams,
      label: "Verified",
      icon: Shield,
      color: "from-emerald-500 to-green-500",
    },
    {
      value: totalPlayers,
      label: "Players",
      icon: Gamepad2,
      color: "from-secondary to-purple-500",
    },
    {
      value: totalTitles,
      label: "Titles Won",
      icon: Trophy,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="relative group"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity`}
            />
            <div className="relative p-5 rounded-xl bg-surface-1/60 backdrop-blur-sm border border-white/10 hover:border-primary/40 transition-all text-center">
              <Icon className="h-7 w-7 mx-auto mb-2 text-primary" />
              <motion.p
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                {stat.value}
              </motion.p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Team Card Component
function TeamCard({ team, index }: { team: typeof mockTeams[0]; index: number }) {
  const rank = rankConfig[team.rank] || rankConfig.bronze;
  const winRate = Math.round((team.wins / (team.wins + team.losses)) * 100);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <div className="relative rounded-xl overflow-hidden bg-surface-1/60 backdrop-blur-sm border border-white/5 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
        {/* Gradient Top Line */}
        <div
          className={`h-0.5 bg-gradient-to-r ${rank.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}
        />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }}>
                <Avatar
                  className={`h-14 w-14 rounded-xl ring-2 ${rank.color} ring-opacity-30 group-hover:ring-opacity-60 transition-all`}
                >
                  <AvatarFallback
                    className={`rounded-xl text-lg font-bold bg-gradient-to-br ${rank.gradient} text-white`}
                  >
                    {team.tag}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              {team.verified && (
                <motion.div
                  className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50"
                  whileHover={{ scale: 1.2 }}
                >
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </motion.div>
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div
                className={`text-lg font-bold group-hover:text-primary transition-colors ${rank.color}`}
              >
                {team.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge
                  variant="outline"
                  className="font-mono text-xs border-primary/30"
                >
                  [{team.tag}]
                </Badge>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {team.country} {team.countryName}
                </span>
              </div>
            </div>
          </div>

          {/* Games */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {team.games.map((game) => (
              <Badge
                key={game}
                variant="secondary"
                className="text-xs bg-surface-2/80 border border-border/50"
              >
                <Gamepad2 className="h-3 w-3 mr-1" />
                {game}
              </Badge>
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Medal className={`h-4 w-4 ${rank.color}`} />
                <span className="font-semibold text-foreground">
                  {team.rating}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>{team.titles}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{team.members}</span>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 font-semibold border-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              {winRate}%
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PublicTeams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const filteredTeams = mockTeams.filter((team) => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.tag.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "verified") return matchesSearch && team.verified;
    if (activeTab === "brazil") return matchesSearch && team.country === "🇧🇷";
    return matchesSearch;
  });

  const topTeams = mockTeams.slice(0, 3);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <img
          src={nebulaSoft}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--accent)/0.1)_0%,_transparent_50%)]" />

        {/* Floating Orbs */}
        <FloatingOrb className="w-96 h-96 bg-accent/20 top-20 -left-48" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-primary/20 top-1/3 -right-40" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-secondary/20 bottom-1/4 left-1/4" delay={4} />
      </div>

      <div className="container relative z-10 py-12 space-y-16">
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
          className="text-center space-y-8 py-8"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-accent/40 bg-accent/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Building2 className="h-5 w-5 text-accent" />
            <span className="text-sm font-bold text-accent tracking-wider uppercase">
              Hall of Fame
            </span>
            <motion.div
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Legendary{" "}
            <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
              Teams
            </span>
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Discover the organizations that dominate the competitive arena
          </motion.p>
        </motion.div>

        {/* Top 3 Podium */}
        <section className="space-y-8">
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h2 className="text-3xl font-bold">Top 3 Teams</h2>
            <Trophy className="h-8 w-8 text-yellow-400" />
          </motion.div>
          <TopTeamsPodium teams={topTeams} />
        </section>

        {/* Stats Bar */}
        <StatsBar />

        {/* Search & Filter */}
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-surface-1/50 backdrop-blur-sm border-white/10 focus:border-primary/50 rounded-xl"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface-1/50 backdrop-blur-sm border border-white/10 p-1 rounded-xl">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="verified"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              <Shield className="h-4 w-4 mr-1" />
              Verified
            </TabsTrigger>
            <TabsTrigger
              value="brazil"
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg"
            >
              🇧🇷 Brazil
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-8">
            {filteredTeams.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTeams.map((team, i) => (
                  <TeamCard key={team.id} team={team} index={i} />
                ))}
              </div>
            ) : (
              <motion.div
                className="rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-white/10 p-16 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Users className="h-20 w-20 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-xl text-muted-foreground">No teams found</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <motion.div
          className="relative py-16 rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 rounded-3xl" />
          <div className="absolute inset-0 backdrop-blur-sm" />

          <div className="relative text-center space-y-6">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10"
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent">
                Want to create your own team?
              </span>
            </motion.div>
            <h3 className="text-3xl md:text-4xl font-bold">
              Build your{" "}
              <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                organization
              </span>
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Recruit players, join tournaments, and win titles
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white shadow-xl shadow-accent/30"
              >
                <Link to="/auth">
                  <span className="font-semibold">Create a free account</span>
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}