import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { 
  Trophy, 
  Search, 
  Calendar, 
  Users, 
  Gamepad2, 
  MapPin, 
  Clock, 
  Award, 
  Flame, 
  Star,
  ArrowRight,
  Zap,
  ChevronRight,
  Sparkles,
  Target,
  Swords,
  Crown,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import nebulaSoft from "@/assets/bg/nebula-soft-1.png";

// Mock tournaments data
const mockTournaments = [
  {
    id: "1",
    name: "Copa EFA Brasil 2026",
    slug: "copa-efa-brasil-2026",
    status: "in_progress",
    format: "groups_playoffs",
    game: "FC 25",
    teams: 32,
    maxTeams: 32,
    prize: "R$ 50.000",
    startsAt: "2026-01-15",
    endsAt: "2026-02-28",
    country: "Brasil",
    countryFlag: "🇧🇷",
    featured: true,
    gradient: "from-green-500 via-yellow-500 to-blue-500",
  },
  {
    id: "2",
    name: "Liga Master Europa",
    slug: "liga-master-europa",
    status: "registrations_open",
    format: "league",
    game: "FC 25",
    teams: 12,
    maxTeams: 16,
    prize: "€ 25.000",
    startsAt: "2026-02-01",
    endsAt: "2026-04-30",
    country: "Europa",
    countryFlag: "🇪🇺",
    featured: true,
    gradient: "from-blue-500 via-purple-500 to-pink-500",
  },
  {
    id: "3",
    name: "Torneio Relâmpago #47",
    slug: "torneio-relampago-47",
    status: "registrations_open",
    format: "knockout",
    game: "eFootball",
    teams: 6,
    maxTeams: 8,
    prize: "500 EFA Coins",
    startsAt: "2026-01-12",
    endsAt: "2026-01-12",
    country: "Global",
    countryFlag: "🌍",
    featured: false,
    gradient: "from-orange-500 via-red-500 to-pink-500",
  },
  {
    id: "4",
    name: "Champions League Virtual",
    slug: "champions-league-virtual",
    status: "in_progress",
    format: "groups_playoffs",
    game: "FC 25",
    teams: 24,
    maxTeams: 24,
    prize: "€ 100.000",
    startsAt: "2026-01-01",
    endsAt: "2026-03-15",
    country: "Europa",
    countryFlag: "🇪🇺",
    featured: true,
    gradient: "from-indigo-500 via-blue-500 to-cyan-500",
  },
  {
    id: "5",
    name: "Copa América Virtual",
    slug: "copa-america-virtual",
    status: "upcoming",
    format: "groups_playoffs",
    game: "FC 25",
    teams: 0,
    maxTeams: 16,
    prize: "$ 30.000",
    startsAt: "2026-03-01",
    endsAt: "2026-04-15",
    country: "América",
    countryFlag: "🌎",
    featured: false,
    gradient: "from-amber-500 via-orange-500 to-red-500",
  },
  {
    id: "6",
    name: "NBA 2K League Brazil",
    slug: "nba-2k-league-brazil",
    status: "registrations_open",
    format: "league",
    game: "NBA 2K25",
    teams: 8,
    maxTeams: 12,
    prize: "R$ 20.000",
    startsAt: "2026-02-10",
    endsAt: "2026-05-20",
    country: "Brasil",
    countryFlag: "🇧🇷",
    featured: false,
    gradient: "from-purple-500 via-violet-500 to-fuchsia-500",
  },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Flame; glowColor: string }> = {
  draft: { label: "Rascunho", color: "text-muted-foreground", bgColor: "bg-muted/50", icon: Clock, glowColor: "shadow-muted/20" },
  published: { label: "Publicado", color: "text-blue-400", bgColor: "bg-blue-500/20", icon: Star, glowColor: "shadow-blue-500/30" },
  registrations_open: { label: "Inscrições Abertas", color: "text-emerald-400", bgColor: "bg-emerald-500/20", icon: Sparkles, glowColor: "shadow-emerald-500/30" },
  registrations_closed: { label: "Inscrições Encerradas", color: "text-yellow-400", bgColor: "bg-yellow-500/20", icon: Clock, glowColor: "shadow-yellow-500/30" },
  upcoming: { label: "Em Breve", color: "text-purple-400", bgColor: "bg-purple-500/20", icon: Timer, glowColor: "shadow-purple-500/30" },
  in_progress: { label: "Ao Vivo", color: "text-red-400", bgColor: "bg-red-500/20", icon: Flame, glowColor: "shadow-red-500/30" },
  finished: { label: "Finalizado", color: "text-muted-foreground", bgColor: "bg-muted/30", icon: Trophy, glowColor: "shadow-muted/20" },
  cancelled: { label: "Cancelado", color: "text-red-400", bgColor: "bg-red-500/20", icon: Clock, glowColor: "shadow-red-500/30" },
};

const formatLabels: Record<string, string> = {
  league: "Liga",
  knockout: "Mata-mata",
  groups: "Grupos",
  swiss: "Suíço",
  groups_playoffs: "Grupos + Playoffs",
};

// Floating Orb Component
function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
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

// Hero Stats Component
function HeroStats() {
  const stats = [
    { value: "50+", label: "Torneios Ativos", icon: Trophy },
    { value: "10K+", label: "Jogadores", icon: Users },
    { value: "R$500K", label: "Em Prêmios", icon: Award },
  ];

  return (
    <motion.div 
      className="flex flex-wrap justify-center gap-6 md:gap-12"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={i}
            className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-1/50 border border-border/30 backdrop-blur-sm"
            whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary)/0.5)" }}
          >
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Featured Tournament Card
function FeaturedTournamentCard({ tournament, index }: { tournament: typeof mockTournaments[0]; index: number }) {
  const status = statusConfig[tournament.status];
  const StatusIcon = status.icon;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div 
      ref={ref}
      className="group relative"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      {/* Animated Glow */}
      <motion.div 
        className={`absolute -inset-1 bg-gradient-to-r ${tournament.gradient} rounded-3xl blur-xl opacity-30`}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden bg-surface-1/80 backdrop-blur-xl border border-white/10 hover:border-primary/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/20">
        {/* Top Gradient Bar */}
        <div className={`h-1 bg-gradient-to-r ${tournament.gradient}`} />
        
        {/* Featured & Status Banner */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Crown className="h-5 w-5 text-yellow-400" />
            </motion.div>
            <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">Destaque</span>
          </div>
          <Badge className={`${status.bgColor} ${status.color} border-0 gap-1.5 shadow-lg ${status.glowColor}`}>
            {tournament.status === "in_progress" && (
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            )}
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Header */}
          <div>
            <motion.h3 
              className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2"
              whileHover={{ x: 5 }}
            >
              {tournament.name}
            </motion.h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Gamepad2 className="h-4 w-4 text-primary" />
                {tournament.game}
              </span>
              <span className="flex items-center gap-1">
                <Swords className="h-3 w-3" />
                {formatLabels[tournament.format]}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {tournament.countryFlag} {tournament.country}
              </span>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Users, value: `${tournament.teams}/${tournament.maxTeams}`, label: "Times", color: "primary" },
              { icon: Award, value: tournament.prize, label: "Prêmio", color: "secondary" },
              { icon: Calendar, value: new Date(tournament.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), label: "Início", color: "accent" },
              { icon: Clock, value: new Date(tournament.endsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), label: "Fim", color: "warning" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={i}
                  className="text-center p-4 rounded-xl bg-surface-2/50 border border-border/30 hover:border-primary/30 transition-all"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <Icon className={`h-5 w-5 mx-auto mb-2 text-${stat.color}`} />
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Vagas preenchidas</span>
              <span className="font-semibold text-foreground">{Math.round((tournament.teams / tournament.maxTeams) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <motion.div 
                className={`h-full bg-gradient-to-r ${tournament.gradient}`}
                initial={{ width: 0 }}
                animate={isInView ? { width: `${(tournament.teams / tournament.maxTeams) * 100}%` } : {}}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
          
          {/* CTA */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg shadow-primary/30" asChild>
              <Link to="/auth">
                {tournament.status === "registrations_open" ? "Inscrever-se Agora" : "Ver Detalhes"}
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Regular Tournament Card
function TournamentCard({ tournament, index }: { tournament: typeof mockTournaments[0]; index: number }) {
  const status = statusConfig[tournament.status];
  const StatusIcon = status.icon;
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
        <div className={`h-0.5 bg-gradient-to-r ${tournament.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
        
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {tournament.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10">
                  <Gamepad2 className="h-3 w-3 text-primary" />
                  {tournament.game}
                </span>
                <span className="text-xs">{formatLabels[tournament.format]}</span>
              </div>
            </div>
            <Badge className={`${status.bgColor} ${status.color} border-0 gap-1 shrink-0`}>
              {tournament.status === "in_progress" && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              )}
              <StatusIcon className="h-3 w-3" />
              <span className="hidden sm:inline">{status.label}</span>
            </Badge>
          </div>
          
          {/* Info Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">{tournament.teams}/{tournament.maxTeams}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4 text-accent" />
                <span>{new Date(tournament.startsAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              </div>
              <div className="flex items-center gap-1">
                {tournament.countryFlag}
              </div>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-secondary/20 to-primary/20 text-secondary font-semibold border-0">
              {tournament.prize}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PublicTournaments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const filteredTournaments = mockTournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && tournament.status === "in_progress";
    if (activeTab === "upcoming") return matchesSearch && ["published", "registrations_open", "upcoming"].includes(tournament.status);
    if (activeTab === "finished") return matchesSearch && tournament.status === "finished";
    return matchesSearch;
  });

  const featuredTournaments = mockTournaments.filter(t => t.featured && t.status !== "finished");

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--secondary)/0.1)_0%,_transparent_50%)]" />
        
        {/* Floating Orbs */}
        <FloatingOrb className="w-96 h-96 bg-primary/20 top-20 -left-48" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-secondary/20 top-1/3 -right-40" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-accent/20 bottom-1/4 left-1/4" delay={4} />
      </div>

      <div className="container relative z-10 py-12 space-y-16">
        {/* Hero Section */}
        <motion.div 
          ref={heroRef}
          style={{ y: heroY, opacity: heroOpacity }}
          className="text-center space-y-8 py-8"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-secondary/40 bg-secondary/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Trophy className="h-5 w-5 text-secondary" />
            <span className="text-sm font-bold text-secondary tracking-wider uppercase">
              Arena de Competições
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
            Torneios{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Épicos
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Participe das maiores competições de esports e conquiste sua glória
          </motion.p>

          <HeroStats />
        </motion.div>

        {/* Featured Tournaments */}
        {featuredTournaments.length > 0 && (
          <section className="space-y-8">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="h-10 w-1 rounded-full bg-gradient-to-b from-primary to-secondary" />
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-2">
                  <Star className="h-7 w-7 text-yellow-400" />
                  Torneios em Destaque
                </h2>
                <p className="text-muted-foreground">As competições mais aguardadas</p>
              </div>
            </motion.div>
            <div className="grid lg:grid-cols-2 gap-8">
              {featuredTournaments.slice(0, 2).map((tournament, i) => (
                <FeaturedTournamentCard key={tournament.id} tournament={tournament} index={i} />
              ))}
            </div>
          </section>
        )}

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
              placeholder="Buscar torneios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-surface-1/50 backdrop-blur-sm border-white/10 focus:border-primary/50 rounded-xl"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface-1/50 backdrop-blur-sm border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
              Todos
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
              <Flame className="h-4 w-4 mr-1" />
              Ao Vivo
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
              Em Breve
            </TabsTrigger>
            <TabsTrigger value="finished" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">
              Finalizados
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-8">
            {filteredTournaments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTournaments.map((tournament, i) => (
                  <TournamentCard key={tournament.id} tournament={tournament} index={i} />
                ))}
              </div>
            ) : (
              <motion.div 
                className="rounded-2xl bg-surface-1/50 backdrop-blur-sm border border-white/10 p-16 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Trophy className="h-20 w-20 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-xl text-muted-foreground">Nenhum torneio encontrado</p>
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
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 rounded-3xl" />
          <div className="absolute inset-0 backdrop-blur-sm" />
          
          <div className="relative text-center space-y-6">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10"
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold text-secondary">Quer organizar seu próprio torneio?</span>
            </motion.div>
            <h3 className="text-3xl md:text-4xl font-bold">
              Crie competições{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                profissionais
              </span>
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ferramentas completas para organizar torneios de qualquer tamanho
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white shadow-xl shadow-secondary/30">
                <Link to="/auth">
                  <span className="font-semibold">Criar conta grátis</span>
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
