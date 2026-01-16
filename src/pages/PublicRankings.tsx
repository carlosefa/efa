import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Medal, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Trophy, 
  Gamepad2, 
  Users, 
  Crown, 
  Star, 
  Globe,
  Zap,
  ArrowRight,
  Flame,
  Award,
  ChevronRight,
  Sparkles,
  Target,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Particles } from "@/components/ui/Particles";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/animations/AnimatedSection";
import { FloatingElement } from "@/components/animations/ParallaxLayer";

// Soft background imports
import nebulaSoft from "@/assets/bg/nebula-soft-1.png";

// Mock data for demonstration
const mockPlayers = [
  { id: "1", position: 1, name: "TechMaster", org: "FaZe", country: "🇧🇷", countryName: "Brasil", game: "FC 25", rating: 2847, matches: 156, wins: 122, winrate: 78, rank: "master", change: 2, avatar: null, streak: 8 },
  { id: "2", position: 2, name: "NightHawk", org: "G2", country: "🇺🇸", countryName: "EUA", game: "FC 25", rating: 2756, matches: 142, wins: 107, winrate: 75, rank: "diamond", change: -1, avatar: null, streak: 5 },
  { id: "3", position: 3, name: "BrazilKing", org: "LOUD", country: "🇧🇷", countryName: "Brasil", game: "FC 25", rating: 2698, matches: 138, wins: 99, winrate: 72, rank: "diamond", change: 0, avatar: null, streak: 3 },
  { id: "4", position: 4, name: "CyberWolf", org: "NaVi", country: "🇺🇦", countryName: "Ucrânia", game: "eFootball", rating: 2634, matches: 125, wins: 88, winrate: 70, rank: "gold", change: 3, avatar: null, streak: 4 },
  { id: "5", position: 5, name: "ShadowBlade", org: "T1", country: "🇰🇷", countryName: "Coreia", game: "FC 25", rating: 2589, matches: 118, wins: 80, winrate: 68, rank: "gold", change: -2, avatar: null, streak: 2 },
  { id: "6", position: 6, name: "ProGamer", org: "100T", country: "🇺🇸", countryName: "EUA", game: "eFootball", rating: 2534, matches: 112, wins: 75, winrate: 67, rank: "gold", change: 1, avatar: null, streak: 0 },
  { id: "7", position: 7, name: "EliteOne", org: "Fnatic", country: "🇬🇧", countryName: "UK", game: "FC 25", rating: 2498, matches: 105, wins: 70, winrate: 67, rank: "silver", change: 0, avatar: null, streak: 1 },
  { id: "8", position: 8, name: "VictoryKid", org: "C9", country: "🇨🇦", countryName: "Canadá", game: "FC 25", rating: 2456, matches: 98, wins: 65, winrate: 66, rank: "silver", change: 4, avatar: null, streak: 6 },
  { id: "9", position: 9, name: "GameChanger", org: "TSM", country: "🇩🇪", countryName: "Alemanha", game: "eFootball", rating: 2412, matches: 95, wins: 62, winrate: 65, rank: "silver", change: -1, avatar: null, streak: 0 },
  { id: "10", position: 10, name: "ChampionX", org: "OG", country: "🇫🇷", countryName: "França", game: "FC 25", rating: 2378, matches: 90, wins: 58, winrate: 64, rank: "silver", change: 0, avatar: null, streak: 2 },
];

const mockTeams = [
  { id: "1", position: 1, name: "FaZe Clan", tag: "FaZe", country: "🇺🇸", rating: 3245, members: 5, titles: 12, winrate: 82, rank: "master", logo: null },
  { id: "2", position: 2, name: "G2 Esports", tag: "G2", country: "🇪🇸", rating: 3156, members: 5, titles: 8, winrate: 79, rank: "diamond", logo: null },
  { id: "3", position: 3, name: "LOUD Gaming", tag: "LOUD", country: "🇧🇷", rating: 3089, members: 5, titles: 6, winrate: 77, rank: "diamond", logo: null },
  { id: "4", position: 4, name: "Natus Vincere", tag: "NaVi", country: "🇺🇦", rating: 2967, members: 5, titles: 5, winrate: 74, rank: "gold", logo: null },
  { id: "5", position: 5, name: "T1 Esports", tag: "T1", country: "🇰🇷", rating: 2845, members: 5, titles: 4, winrate: 71, rank: "gold", logo: null },
];

const games = [
  { id: "1", name: "FC 25", slug: "fc25", icon: "⚽" },
  { id: "2", name: "eFootball", slug: "efootball", icon: "🎮" },
  { id: "3", name: "NBA 2K25", slug: "nba2k25", icon: "🏀" },
];

const countries = [
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "DE", name: "Alemanha", flag: "🇩🇪" },
  { code: "KR", name: "Coreia do Sul", flag: "🇰🇷" },
];

const getRankStyles = (rank: string) => {
  switch (rank) {
    case "master": 
      return {
        text: "text-fuchsia-400",
        bg: "from-fuchsia-500/20 via-purple-500/15 to-fuchsia-600/20",
        border: "border-fuchsia-500/30",
        glow: "shadow-fuchsia-500/30",
        ring: "ring-fuchsia-500/40"
      };
    case "diamond": 
      return {
        text: "text-cyan-400",
        bg: "from-cyan-500/20 via-blue-500/15 to-cyan-600/20",
        border: "border-cyan-500/30",
        glow: "shadow-cyan-500/30",
        ring: "ring-cyan-500/40"
      };
    case "gold": 
      return {
        text: "text-yellow-400",
        bg: "from-yellow-500/20 via-orange-500/15 to-yellow-600/20",
        border: "border-yellow-500/30",
        glow: "shadow-yellow-500/30",
        ring: "ring-yellow-500/40"
      };
    default: 
      return {
        text: "text-slate-400",
        bg: "from-slate-500/20 via-gray-500/15 to-slate-600/20",
        border: "border-slate-500/30",
        glow: "shadow-slate-500/20",
        ring: "ring-slate-500/40"
      };
  }
};

function PositionChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <motion.span 
        className="flex items-center gap-0.5 text-emerald-400 text-xs font-bold"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TrendingUp className="h-3 w-3" />
        +{change}
      </motion.span>
    );
  }
  if (change < 0) {
    return (
      <motion.span 
        className="flex items-center gap-0.5 text-red-400 text-xs font-bold"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TrendingDown className="h-3 w-3" />
        {change}
      </motion.span>
    );
  }
  return <Minus className="h-3 w-3 text-muted-foreground/50" />;
}

function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <motion.div 
        className="relative"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Crown className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.7)]" />
      </motion.div>
    );
  }
  if (position === 2) {
    return <Medal className="h-7 w-7 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.5)]" />;
  }
  if (position === 3) {
    return <Medal className="h-7 w-7 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />;
  }
  return (
    <span className="text-xl font-bold text-muted-foreground/70">#{position}</span>
  );
}

// Top 3 Podium Card Component
function PodiumCard({ player, index }: { player: typeof mockPlayers[0]; index: number }) {
  const styles = getRankStyles(player.rank);
  const isFirst = index === 0;
  
  return (
    <motion.div
      className={`relative group ${isFirst ? 'md:scale-110 md:-translate-y-6 z-10' : ''}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: isFirst ? -10 : -8, scale: isFirst ? 1.12 : 1.03 }}
    >
      {/* Animated glow background */}
      <motion.div 
        className={`absolute -inset-2 bg-gradient-to-br ${styles.bg} blur-2xl opacity-60 group-hover:opacity-100 rounded-3xl`}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* Card */}
      <div className={`relative bg-surface-1/80 backdrop-blur-xl rounded-2xl overflow-hidden border ${styles.border} transition-all duration-500 hover:shadow-2xl ${styles.glow}`}>
        {/* Animated top border */}
        <motion.div 
          className={`h-1 bg-gradient-to-r ${styles.bg}`}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ backgroundSize: "200% 200%" }}
        />
        
        <div className={`${isFirst ? 'p-8' : 'p-6'} text-center relative`}>
          {/* Position badge */}
          <div className="absolute top-4 right-4">
            <PositionBadge position={player.position} />
          </div>
          
          {/* Streak badge */}
          {player.streak >= 3 && (
            <motion.div 
              className="absolute top-4 left-4 flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="h-3 w-3 text-orange-400" />
              <span className="text-xs font-bold text-orange-400">{player.streak}</span>
            </motion.div>
          )}
          
          {/* Avatar */}
          <motion.div 
            className="relative mx-auto mb-4"
            whileHover={{ scale: 1.1 }}
          >
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${styles.bg} blur-md`} />
            <Avatar className={`${isFirst ? 'h-24 w-24' : 'h-20 w-20'} relative ring-4 ${styles.ring} ring-offset-2 ring-offset-background`}>
              <AvatarFallback className={`text-2xl font-bold bg-surface-2 ${styles.text}`}>
                {player.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          {/* Organization */}
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-xs text-muted-foreground font-medium">{player.org}</span>
            <span className="text-muted-foreground/50">|</span>
          </div>
          
          {/* Name */}
          <h3 className={`${isFirst ? 'text-xl' : 'text-lg'} font-bold ${styles.text} mb-1`}>
            {player.name}
          </h3>
          
          {/* Country & Game */}
          <p className="text-sm text-muted-foreground mb-4">
            {player.country} {player.game}
          </p>
          
          {/* Rating with glow */}
          <motion.div 
            className={`${isFirst ? 'text-5xl' : 'text-4xl'} font-bold text-primary`}
            style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}
            animate={{ textShadow: ["0 0 20px hsl(var(--primary) / 0.3)", "0 0 40px hsl(var(--primary) / 0.6)", "0 0 20px hsl(var(--primary) / 0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {player.rating.toLocaleString()}
          </motion.div>
          
          {/* Stats row */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-secondary" />
              <span className="font-semibold text-foreground">{player.wins}</span>
              <span className="text-muted-foreground text-xs">vitórias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-emerald-400">{player.winrate}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Ranking Row Component
function RankingRow({ player, index }: { player: typeof mockPlayers[0]; index: number }) {
  const styles = getRankStyles(player.rank);
  const isTop3 = player.position <= 3;
  
  return (
    <motion.div
      className={`group relative`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      {/* Hover glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${styles.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-sm`} />
      
      <div className={`relative grid grid-cols-12 gap-4 px-5 py-4 items-center rounded-xl transition-all duration-300 ${isTop3 ? 'bg-surface-2/40' : 'hover:bg-surface-2/30'} group-hover:border-l-2 ${styles.border}`}>
        {/* Position */}
        <div className="col-span-1 flex flex-col items-center gap-1">
          {isTop3 ? (
            <PositionBadge position={player.position} />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">{player.position}</span>
          )}
          <PositionChange change={player.change} />
        </div>
        
        {/* Player Info */}
        <div className="col-span-5 md:col-span-4 flex items-center gap-3">
          <motion.div className="relative" whileHover={{ scale: 1.1 }}>
            <Avatar className={`h-12 w-12 rounded-xl ring-2 ${isTop3 ? styles.ring : 'ring-transparent'} group-hover:${styles.ring} transition-all`}>
              <AvatarFallback className={`rounded-xl font-bold bg-surface-2 ${styles.text}`}>
                {player.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {player.streak >= 5 && (
              <motion.div 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Flame className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </motion.div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{player.org}</span>
              <span className="text-muted-foreground/30">|</span>
              <span className={`font-semibold truncate ${styles.text} group-hover:text-primary transition-colors`}>
                {player.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{player.country}</span>
              <span className="text-muted-foreground/30">•</span>
              <span>{player.game}</span>
            </p>
          </div>
        </div>
        
        {/* Matches */}
        <div className="col-span-2 text-center hidden md:block">
          <p className="font-semibold text-foreground">{player.matches}</p>
          <p className="text-xs text-muted-foreground">partidas</p>
        </div>
        
        {/* Winrate */}
        <div className="col-span-2 text-center hidden md:block">
          <p className="font-semibold text-emerald-400">{player.winrate}%</p>
          <p className="text-xs text-muted-foreground">winrate</p>
        </div>
        
        {/* Rating */}
        <div className="col-span-6 md:col-span-3 text-right">
          <motion.span 
            className="text-2xl md:text-3xl font-bold text-primary"
            whileHover={{ scale: 1.05 }}
          >
            {player.rating.toLocaleString()}
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

// Team Card Component
function TeamCard({ team, index }: { team: typeof mockTeams[0]; index: number }) {
  const styles = getRankStyles(team.rank);
  
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      {/* Glow background */}
      <motion.div 
        className={`absolute -inset-1 bg-gradient-to-br ${styles.bg} blur-xl opacity-40 group-hover:opacity-80 rounded-2xl`}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      <div className={`relative bg-surface-1/70 backdrop-blur-xl rounded-2xl overflow-hidden border ${styles.border} transition-all duration-500 hover:shadow-2xl ${styles.glow}`}>
        {/* Top gradient */}
        <div className={`h-1 bg-gradient-to-r ${styles.bg}`} />
        
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative">
              <Avatar className={`h-16 w-16 rounded-xl ring-2 ${styles.ring}`}>
                <AvatarFallback className={`rounded-xl text-xl font-bold bg-surface-2 ${styles.text}`}>
                  {team.tag}
                </AvatarFallback>
              </Avatar>
              <motion.div 
                className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.2 }}
              >
                {team.position}
              </motion.div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold truncate ${styles.text}`}>{team.name}</h3>
                {team.position === 1 && (
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Crown className="h-5 w-5 text-yellow-400" />
                  </motion.div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{team.country} [{team.tag}]</p>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: team.rating.toLocaleString(), label: "Rating", color: "text-primary" },
              { value: team.titles, label: "Títulos", color: "text-secondary" },
              { value: `${team.winrate}%`, label: "Winrate", color: "text-emerald-400" },
              { value: team.members, label: "Players", color: "text-accent" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                className="text-center p-2 rounded-lg bg-surface-2/40 border border-border/20"
                whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--surface-2) / 0.6)" }}
              >
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PublicRankings() {
  const [activeTab, setActiveTab] = useState("players");
  const [selectedGame, setSelectedGame] = useState("all");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const heroRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Soft nebula background with parallax */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        style={{ y: bgY }}
      >
        <img 
          src={nebulaSoft} 
          alt="" 
          className="w-full h-[120%] object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </motion.div>
      
      {/* Grid overlay */}
      <div className="fixed inset-0 bg-cyber-grid opacity-[0.04] pointer-events-none" />
      
      {/* Animated particles */}
      <Particles count={25} />
      
      {/* Floating accent orbs */}
      <motion.div
        className="fixed top-1/4 left-1/6 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="fixed bottom-1/4 right-1/5 w-48 h-48 rounded-full bg-secondary/10 blur-3xl pointer-events-none"
        animate={{ x: [0, -20, 0], y: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, delay: 3 }}
      />

      <div className="container relative z-10 py-12 space-y-12">
        {/* Hero Header */}
        <motion.div 
          ref={heroRef}
          className="text-center space-y-6"
          style={{ opacity }}
        >
          <AnimatedSection>
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-md"
              whileHover={{ scale: 1.05, borderColor: "hsl(var(--primary) / 0.5)" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Medal className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="text-sm font-bold text-primary tracking-wider uppercase">
                Leaderboard Global
              </span>
              <motion.div 
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-bold">
              Rankings{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                Globais
              </span>
            </h1>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Acompanhe os melhores jogadores e times do mundo competindo em tempo real. 
              Atualizado a cada partida.
            </p>
          </AnimatedSection>
        </motion.div>

        {/* Filters */}
        <AnimatedSection delay={0.3}>
          <div className="flex flex-wrap justify-center gap-4">
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="w-52 bg-surface-1/60 backdrop-blur border-border/30 hover:border-primary/40 transition-all">
                <Gamepad2 className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Todos os Jogos" />
              </SelectTrigger>
              <SelectContent className="bg-surface-1/95 backdrop-blur-xl border-border/50">
                <SelectItem value="all">Todos os Jogos</SelectItem>
                {games.map(game => (
                  <SelectItem key={game.id} value={game.slug}>
                    {game.icon} {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-52 bg-surface-1/60 backdrop-blur border-border/30 hover:border-primary/40 transition-all">
                <Globe className="h-4 w-4 mr-2 text-primary" />
                <SelectValue placeholder="Todos os Países" />
              </SelectTrigger>
              <SelectContent className="bg-surface-1/95 backdrop-blur-xl border-border/50">
                <SelectItem value="all">🌍 Todos os Países</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AnimatedSection>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <AnimatedSection delay={0.4}>
            <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 bg-surface-1/60 backdrop-blur border border-border/30 p-1 rounded-xl">
              <TabsTrigger 
                value="players" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all"
              >
                <Users className="h-4 w-4" />
                Jogadores
              </TabsTrigger>
              <TabsTrigger 
                value="teams" 
                className="gap-2 rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all"
              >
                <Shield className="h-4 w-4" />
                Times
              </TabsTrigger>
            </TabsList>
          </AnimatedSection>

          {/* Players Tab */}
          <TabsContent value="players" className="mt-12">
            {/* Top 3 Podium */}
            <div className="grid md:grid-cols-3 gap-6 mb-16 px-4">
              {[mockPlayers[1], mockPlayers[0], mockPlayers[2]].map((player, i) => (
                <div key={player.id} className={i === 1 ? "md:order-2" : i === 0 ? "md:order-1" : "md:order-3"}>
                  <PodiumCard player={player} index={i} />
                </div>
              ))}
            </div>

            {/* Rankings Table */}
            <motion.div 
              className="bg-surface-1/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-border/30"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Table Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-surface-2/40 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Ranking de Jogadores</span>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium">
                  <motion.span 
                    className="h-2 w-2 rounded-full bg-emerald-400 mr-2"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  Ao vivo
                </Badge>
              </div>
              
              {/* Table Column Headers */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-surface-2/20 text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border/20">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5 md:col-span-4">Jogador</div>
                <div className="col-span-2 text-center hidden md:block">Partidas</div>
                <div className="col-span-2 text-center hidden md:block">Winrate</div>
                <div className="col-span-6 md:col-span-3 text-right">Rating</div>
              </div>
              
              {/* Table Rows */}
              <div className="divide-y divide-border/10">
                {mockPlayers.map((player, i) => (
                  <RankingRow key={player.id} player={player} index={i} />
                ))}
              </div>
              
              {/* Load More */}
              <div className="p-6 text-center border-t border-border/20">
                <Button variant="outline" className="border-primary/30 hover:border-primary/50 hover:bg-primary/5">
                  Carregar mais jogadores
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTeams.map((team, i) => (
                <TeamCard key={team.id} team={team} index={i} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <AnimatedSection delay={0.6}>
          <motion.div 
            className="text-center py-16 relative"
            whileHover={{ scale: 1.01 }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-3xl" />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent rounded-3xl blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <div className="relative space-y-6">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Quer aparecer no ranking?</span>
              </motion.div>
              
              <h3 className="text-3xl md:text-4xl font-bold">
                Comece a competir{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  agora mesmo
                </span>
              </h3>
              
              <p className="text-muted-foreground max-w-md mx-auto">
                Crie sua conta gratuita e entre na arena. Seus resultados aparecem automaticamente no ranking global.
              </p>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all"
                >
                  <Link to="/auth">
                    Criar conta grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatedSection>
      </div>
    </div>
  );
}
