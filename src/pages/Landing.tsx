import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Swords, 
  Medal, 
  Globe, 
  ArrowRight,
  Zap,
  Building2,
  ChevronRight,
  Crown,
  Star,
  BarChart3,
  ChevronLeft,
  Gamepad2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/Particles";
import { AnimatedSection, StaggerContainer, StaggerItem } from "@/components/animations/AnimatedSection";
import { ParallaxLayer, FloatingElement, GlowingOrb } from "@/components/animations/ParallaxLayer";
import { Footer } from "@/components/layout/Footer";

// Image imports
import esportsSetup from "@/assets/esports-setup.png";
import orgDashboardMockup from "@/assets/org-dashboard-mockup.png";

// Soft background images
import nebulaSoft from "@/assets/bg/nebula-soft-1.png";
import auroraSoft from "@/assets/bg/aurora-soft.png";
import hexGlowSoft from "@/assets/bg/hex-glow-soft.png";

// Character imports
import scifiSoldier from "@/assets/characters/scifi-soldier.png";
import fantasyKnight from "@/assets/characters/fantasy-knight.png";
import soccerPlayer from "@/assets/characters/soccer-player.png";
import racingDriver from "@/assets/characters/racing-driver.png";
import fighter from "@/assets/characters/fighter.png";
import basketballPlayer from "@/assets/characters/basketball-player.png";
import battleRoyale from "@/assets/characters/battle-royale.png";
import mobaMage from "@/assets/characters/moba-mage.png";
import cardWizard from "@/assets/characters/card-wizard.png";

// Character data with neon glow colors
const gameCharacters = [
  { image: scifiSoldier, genre: "FPS", glowColor: "#00d4ff" },
  { image: fantasyKnight, genre: "RPG", glowColor: "#ff6b00" },
  { image: soccerPlayer, genre: "FUTEBOL", glowColor: "#00ff6b" },
  { image: battleRoyale, genre: "BR", glowColor: "#ffff00" },
  { image: mobaMage, genre: "MOBA", glowColor: "#bf00ff" },
  { image: racingDriver, genre: "CORRIDA", glowColor: "#ff00bf" },
  { image: fighter, genre: "LUTA", glowColor: "#ff4444" },
  { image: cardWizard, genre: "CARDS", glowColor: "#00ffbf" },
  { image: basketballPlayer, genre: "BASQUETE", glowColor: "#ff6600" },
];

// Mock ranking data
const topRanking = [
  { position: 1, org: "FaZe", name: "TechMaster", rating: 3847, rank: "master" },
  { position: 2, org: "G2", name: "NightHawk", rating: 3756, rank: "diamond" },
  { position: 3, org: "LOUD", name: "BrasilKing", rating: 2750, rank: "diamond" },
];

// Platform stats
const platformStats = [
  { value: "50K+", label: "Jogadores Ativos", icon: Users },
  { value: "2,500+", label: "Torneios Realizados", icon: Trophy },
  { value: "500+", label: "Organizações", icon: Building2 },
  { value: "50+", label: "Países", icon: Globe },
];

// Organization benefits
const orgBenefits = [
  { icon: Building2, title: "Crie sua Organização", desc: "Utilize as ferramentas de esports em minutos com todas as plataformas" },
  { icon: Users, title: "Gerencie seu Elenco", desc: "Adicione jogadores, colabore e controle a comissão de competidores" },
  { icon: Trophy, title: "Organize Torneios", desc: "Crie campeonatos exclusivos com geração automática de brackets" },
  { icon: BarChart3, title: "Acompanhe Métricas", desc: "Dashboard exclusivo com estatísticas de performance e engagement" },
];

const getRankColor = (rank: string) => {
  switch (rank) {
    case "master": return "text-fuchsia-400";
    case "diamond": return "text-cyan-400";
    case "gold": return "text-yellow-400";
    default: return "text-gray-400";
  }
};

const getRankIcon = (position: number) => {
  if (position === 1) return <Crown className="h-4 w-4 text-yellow-400" />;
  if (position <= 3) return <Star className="h-4 w-4 text-cyan-400" />;
  return <span className="text-muted-foreground">#{position}</span>;
};

// Animated gradient orb component
const GradientOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.15, 0.25, 0.15],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

// Soft floating light component
const FloatingLight = ({ className, color, size = 150, delay = 0 }: { 
  className?: string; 
  color: string; 
  size?: number;
  delay?: number;
}) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none blur-3xl ${className}`}
    style={{
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    }}
    animate={{
      x: [0, 30, 0, -30, 0],
      y: [0, -20, 0, 20, 0],
      opacity: [0.3, 0.5, 0.3],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

export default function Landing() {
  const heroRef = useRef(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.98]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const checkScrollability = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScrollability);
      checkScrollability();
      return () => carousel.removeEventListener('scroll', checkScrollability);
    }
  }, []);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 280;
    const newScrollLeft = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    carouselRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col bg-background min-h-screen overflow-x-hidden">
      {/* ==================== HERO SECTION ==================== */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Soft Nebula Background with Parallax */}
        <motion.div 
          className="absolute inset-0"
          style={{ y: bgY }}
        >
          <motion.img 
            src={nebulaSoft} 
            alt="" 
            className="w-full h-[120%] object-cover"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          {/* Gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </motion.div>
        
        {/* Animated soft floating lights */}
        <FloatingLight className="top-1/4 left-1/6" color="hsl(185 100% 50% / 0.15)" size={400} />
        <FloatingLight className="bottom-1/3 right-1/5" color="hsl(300 100% 60% / 0.12)" size={350} delay={4} />
        <FloatingLight className="top-1/2 right-1/3" color="hsl(270 100% 65% / 0.1)" size={300} delay={2} />
        
        {/* Subtle particles */}
        <Particles count={40} interactive />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.08]" />
        
        {/* Elegant scan line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm"
            animate={{ y: ["-100vh", "100vh"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        {/* Decorative corner frames with subtle glow */}
        <FloatingElement className="absolute top-6 left-6" amplitude={3} duration={8}>
          <motion.div 
            className="w-24 h-24 border-l-2 border-t-2 border-primary/30 rounded-tl-xl"
            animate={{ borderColor: ["hsl(185 100% 50% / 0.3)", "hsl(185 100% 50% / 0.5)", "hsl(185 100% 50% / 0.3)"] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </FloatingElement>
        <FloatingElement className="absolute bottom-6 right-6" amplitude={3} duration={8} delay={4}>
          <motion.div 
            className="w-24 h-24 border-r-2 border-b-2 border-secondary/30 rounded-br-xl"
            animate={{ borderColor: ["hsl(300 100% 60% / 0.3)", "hsl(300 100% 60% / 0.5)", "hsl(300 100% 60% / 0.3)"] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </FloatingElement>

        <motion.div 
          className="container relative z-10 py-12 lg:py-20"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              {/* Season Badge */}
              <AnimatedSection delay={0} direction="left">
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/5 backdrop-blur-md"
                  whileHover={{ scale: 1.05, backgroundColor: "hsl(185 100% 50% / 0.1)" }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-4 w-4 text-primary" />
                  </motion.div>
                  <span className="text-sm font-bold text-primary tracking-wider uppercase">
                    Temporada 2031 A Ativa
                  </span>
                </motion.div>
              </AnimatedSection>

              {/* Gaming Setup Image */}
              <AnimatedSection delay={0.1} direction="up">
                <ParallaxLayer speed={0.08}>
                  <div className="relative max-w-md group">
                    <motion.div 
                      className="relative rounded-xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/10"
                      whileHover={{ 
                        boxShadow: "0 25px 60px -15px hsl(185 100% 50% / 0.25)",
                        borderColor: "hsl(185 100% 50% / 0.4)"
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <img 
                        src={esportsSetup} 
                        alt="Gaming Setup" 
                        className="w-full h-40 object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                      {/* Shimmer effect on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                        whileHover={{ translateX: "200%" }}
                        transition={{ duration: 0.8 }}
                      />
                    </motion.div>
                    {/* Animated corner brackets */}
                    <motion.div 
                      className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 border-primary/60"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 border-primary/60"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                    />
                  </div>
                </ParallaxLayer>
              </AnimatedSection>

              {/* Main Title */}
              <AnimatedSection delay={0.2} direction="up">
                <div className="space-y-3">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
                    <motion.span 
                      className="text-foreground inline-block"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
                    >
                      Domine a
                    </motion.span>
                    <br />
                    <motion.span 
                      className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent inline-block"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                      style={{ 
                        textShadow: "0 0 60px hsl(185 100% 50% / 0.3)",
                      }}
                    >
                      Arena Competitiva
                    </motion.span>
                  </h1>
                </div>
              </AnimatedSection>

              {/* Description */}
              <AnimatedSection delay={0.4} direction="up">
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Organize torneios profissionais, gerencie atletas, acompanhe estatísticas e 
                  construa uma carreira competitiva. <span className="text-foreground font-medium">Tudo em uma só plataforma.</span>
                </p>
              </AnimatedSection>

              {/* Micro stats */}
              <AnimatedSection delay={0.5} direction="up">
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  {[
                    { color: "bg-success", text: "1965 jogadores", pulse: true },
                    { color: "bg-primary", text: "Alta ação" },
                    { color: "bg-warning", text: "Ver Prévias" },
                  ].map((item, i) => (
                    <motion.span 
                      key={i}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <motion.span 
                        className={`h-2 w-2 rounded-full ${item.color}`}
                        animate={item.pulse ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      />
                      {item.text}
                    </motion.span>
                  ))}
                </div>
              </AnimatedSection>

              {/* CTAs */}
              <AnimatedSection delay={0.6} direction="up">
                <div className="flex flex-wrap gap-4 pt-2">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      size="lg" 
                      asChild 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300"
                    >
                      <Link to="/auth">
                        COMEÇAR GRÁTIS
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      asChild 
                      className="border-border/50 hover:border-primary/40 hover:bg-primary/5 backdrop-blur-sm"
                    >
                      <Link to="/rankings">
                        <Medal className="mr-2 h-4 w-4 text-primary" />
                        Ver Rankings
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </AnimatedSection>
            </div>

            {/* Right Column - Arena Live Panel */}
            <AnimatedSection delay={0.3} direction="right">
              <div className="relative">
                {/* Soft glow behind panel */}
                <motion.div 
                  className="absolute -inset-8 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 blur-3xl rounded-3xl"
                  animate={{ opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 6, repeat: Infinity }}
                />
                
                {/* Main Panel */}
                <motion.div 
                  className="relative bg-surface-1/60 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/20"
                  whileHover={{ borderColor: "hsl(185 100% 50% / 0.4)" }}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                >
                  {/* Panel Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-surface-2/30">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-primary" />
                      <span className="text-sm font-bold tracking-wider text-primary uppercase">Arena Live</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.span 
                        className="h-2 w-2 rounded-full bg-success"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-xs text-success font-medium uppercase">Online</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Live Stats Grid */}
                    <StaggerContainer staggerDelay={0.1}>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "2,847", label: "Jogadores Online" },
                          { value: "156", label: "Partidas Hoje" },
                          { value: "23", label: "Torneios Ativos" },
                        ].map((stat, i) => (
                          <StaggerItem key={i}>
                            <motion.div 
                              className="bg-surface-2/40 border border-border/30 rounded-lg p-3 text-center transition-all duration-300"
                              whileHover={{ 
                                borderColor: "hsl(185 100% 50% / 0.4)",
                                backgroundColor: "hsl(var(--surface-2) / 0.6)"
                              }}
                            >
                              <motion.div 
                                className="text-2xl font-bold text-foreground"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 + i * 0.1 }}
                              >
                                {stat.value}
                              </motion.div>
                              <div className="text-xs text-muted-foreground">{stat.label}</div>
                            </motion.div>
                          </StaggerItem>
                        ))}
                      </div>
                    </StaggerContainer>

                    {/* Current Season Card */}
                    <motion.div 
                      className="bg-surface-2/20 border border-border/20 rounded-lg p-4"
                      whileHover={{ borderColor: "hsl(185 100% 50% / 0.3)" }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Temporada Atual</span>
                        <span className="text-xs text-primary font-semibold">S1 26SM</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/20"
                          animate={{ rotate: [0, 3, -3, 0] }}
                          transition={{ duration: 6, repeat: Infinity }}
                        >
                          <Trophy className="h-6 w-6 text-primary" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-foreground">Copa EFA Brasil</div>
                          <div className="text-sm text-muted-foreground">33 Prêtes • 12 Torneios Online</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Top Rankings */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Top Rankings</span>
                        <Link to="/rankings" className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors">
                          Ver Todos <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                      {topRanking.map((player, i) => (
                        <motion.div 
                          key={i} 
                          className="flex items-center gap-3 p-3 rounded-lg bg-surface-2/20 border border-transparent transition-all duration-300"
                          whileHover={{ 
                            backgroundColor: "hsl(var(--surface-2) / 0.5)",
                            borderColor: "hsl(185 100% 50% / 0.2)"
                          }}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + i * 0.1 }}
                        >
                          <div className="w-6 flex justify-center">{getRankIcon(player.position)}</div>
                          <div className="flex-1 min-w-0">
                            <span className={`font-medium ${getRankColor(player.rank)}`}>
                              {player.org} / {player.name}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-primary">{player.rating}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Panel glow line */}
                  <motion.div 
                    className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>

                {/* Floating decorative elements */}
                <FloatingElement className="absolute -top-4 -right-4 hidden lg:block" amplitude={6} duration={6}>
                  <div className="w-16 h-16 border border-primary/20 rounded-xl rotate-12 bg-primary/5 backdrop-blur" />
                </FloatingElement>
                <FloatingElement className="absolute -bottom-6 -left-6 hidden lg:block" amplitude={5} duration={7} delay={3}>
                  <div className="w-14 h-14 border border-secondary/20 rounded-lg -rotate-12 bg-secondary/5 backdrop-blur" />
                </FloatingElement>
              </div>
            </AnimatedSection>
          </div>
        </motion.div>
      </section>

      {/* ==================== STATS SECTION ==================== */}
      <section className="py-20 relative border-y border-border/20 overflow-hidden">
        {/* Soft background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-surface-1/30 to-background" />
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(ellipse at center, hsl(185 100% 50% / 0.05) 0%, transparent 70%)"
            }}
          />
        </div>
        
        <div className="container relative">
          <StaggerContainer staggerDelay={0.15}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {platformStats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <StaggerItem key={i}>
                    <motion.div 
                      className="text-center group cursor-default"
                      whileHover={{ y: -8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <motion.div 
                        className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/5 border border-primary/15 mb-4 transition-all duration-400"
                        whileHover={{ 
                          backgroundColor: "hsl(185 100% 50% / 0.12)",
                          borderColor: "hsl(185 100% 50% / 0.4)",
                          boxShadow: "0 0 40px hsl(185 100% 50% / 0.2)"
                        }}
                      >
                        <Icon className="h-7 w-7 text-primary" />
                      </motion.div>
                      <motion.div 
                        className="text-3xl md:text-4xl font-bold text-foreground mb-2"
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ==================== ORGANIZATIONS SECTION ==================== */}
      <section className="py-28 relative overflow-hidden">
        {/* Aurora soft background */}
        <div className="absolute inset-0">
          <motion.img 
            src={auroraSoft} 
            alt="" 
            className="w-full h-full object-cover opacity-40"
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
        </div>
        
        {/* Floating accent lights */}
        <FloatingLight className="top-1/4 right-1/4" color="hsl(300 100% 60% / 0.1)" size={400} delay={2} />
        <FloatingLight className="bottom-1/3 left-1/5" color="hsl(185 100% 50% / 0.08)" size={350} />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-cyber-grid opacity-[0.05]" />
        
        {/* Elegant top line */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <AnimatedSection direction="left">
                <div className="space-y-4">
                  <motion.div 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/5 backdrop-blur-md"
                    whileHover={{ scale: 1.05, backgroundColor: "hsl(300 100% 60% / 0.1)" }}
                  >
                    <Sparkles className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-bold text-secondary tracking-wider uppercase">
                      Para Organizações
                    </span>
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                    Crie sua{" "}
                    <span className="bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                      Organização de Esports
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Na EFA você pode criar sua própria organização de esports, gerenciar 
                    times em múltiplos jogos, organizar torneios exclusivos e construir uma 
                    comunidade competitiva profissional.
                  </p>
                </div>
              </AnimatedSection>

              {/* Benefits Grid */}
              <StaggerContainer staggerDelay={0.1}>
                <div className="grid sm:grid-cols-2 gap-4">
                  {orgBenefits.map((benefit, i) => {
                    const Icon = benefit.icon;
                    return (
                      <StaggerItem key={i}>
                        <motion.div 
                          className="group bg-surface-1/40 backdrop-blur-sm border border-border/30 rounded-xl p-4 transition-all duration-400"
                          whileHover={{ 
                            borderColor: "hsl(300 100% 60% / 0.3)",
                            boxShadow: "0 0 35px hsl(300 100% 60% / 0.1)"
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <motion.div 
                              className="h-10 w-10 rounded-lg bg-secondary/10 border border-secondary/15 flex items-center justify-center shrink-0"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <Icon className="h-5 w-5 text-secondary" />
                            </motion.div>
                            <div>
                              <h4 className="font-semibold text-foreground mb-1">{benefit.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
                            </div>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </div>
              </StaggerContainer>
            </div>

            {/* Right Visual - Dashboard Mockup */}
            <AnimatedSection direction="right" delay={0.2}>
              <ParallaxLayer speed={0.1}>
                <div className="relative">
                  <motion.div 
                    className="absolute -inset-6 bg-gradient-to-br from-secondary/15 via-primary/5 to-accent/10 blur-3xl rounded-3xl"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity }}
                  />
                  <motion.div 
                    className="relative rounded-2xl overflow-hidden border border-secondary/20 shadow-2xl shadow-secondary/10"
                    whileHover={{ 
                      boxShadow: "0 30px 70px -20px hsl(300 100% 60% / 0.25)",
                      borderColor: "hsl(300 100% 60% / 0.4)"
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <img 
                      src={orgDashboardMockup} 
                      alt="Organization Dashboard" 
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                  </motion.div>
                  {/* Corner decorations */}
                  <motion.div 
                    className="absolute -top-3 -left-3 w-6 h-6 border-l-2 border-t-2 border-secondary/50"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div 
                    className="absolute -bottom-3 -right-3 w-6 h-6 border-r-2 border-b-2 border-primary/50"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  />
                </div>
              </ParallaxLayer>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ==================== MULTI-GAME CHARACTERS SECTION ==================== */}
      <section className="py-28 relative overflow-hidden">
        {/* Hex pattern soft background */}
        <div className="absolute inset-0">
          <motion.img 
            src={hexGlowSoft} 
            alt="" 
            className="w-full h-full object-cover opacity-50"
            initial={{ scale: 1.05 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80" />
        </div>
        
        {/* Accent floating lights */}
        <FloatingLight className="top-1/3 left-1/6" color="hsl(270 100% 65% / 0.08)" size={300} delay={1} />
        <FloatingLight className="bottom-1/4 right-1/5" color="hsl(185 100% 50% / 0.08)" size={280} delay={3} />
        
        {/* Animated side accent lines */}
        <motion.div 
          className="absolute top-1/2 left-0 h-px bg-gradient-to-r from-accent/50 to-transparent"
          animate={{ width: ["0%", "12%", "0%"] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 right-0 h-px bg-gradient-to-l from-primary/50 to-transparent"
          animate={{ width: ["0%", "12%", "0%"] }}
          transition={{ duration: 5, repeat: Infinity, delay: 2.5 }}
        />

        <div className="container relative">
          {/* Section Header */}
          <AnimatedSection>
            <div className="text-center mb-16 space-y-4">
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/5 backdrop-blur-md"
                whileHover={{ scale: 1.05, backgroundColor: "hsl(270 100% 65% / 0.1)" }}
              >
                <Gamepad2 className="h-4 w-4 text-accent" />
                <span className="text-sm font-bold text-accent tracking-wider uppercase">
                  Universo Multi-Game
                </span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold">
                Todos os seus jogos{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  em um só lugar
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                De FPS e esportes, de RPG e luta. Uma plataforma única para todos os gêneros de jogos competitivos.
              </p>
            </div>
          </AnimatedSection>

          {/* Characters Carousel */}
          <div className="relative">
            {/* Navigation Arrows */}
            <motion.button 
              onClick={() => scrollCarousel('left')}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-surface-2/60 backdrop-blur border border-border/30 flex items-center justify-center transition-all duration-300 ${!canScrollLeft ? 'opacity-30 cursor-not-allowed' : ''}`}
              whileHover={canScrollLeft ? { scale: 1.1, borderColor: "hsl(270 100% 65% / 0.5)" } : {}}
              whileTap={canScrollLeft ? { scale: 0.95 } : {}}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </motion.button>
            <motion.button 
              onClick={() => scrollCarousel('right')}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-surface-2/60 backdrop-blur border border-border/30 flex items-center justify-center transition-all duration-300 ${!canScrollRight ? 'opacity-30 cursor-not-allowed' : ''}`}
              whileHover={canScrollRight ? { scale: 1.1, borderColor: "hsl(270 100% 65% / 0.5)" } : {}}
              whileTap={canScrollRight ? { scale: 0.95 } : {}}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-6 w-6 text-foreground" />
            </motion.button>

            {/* Carousel Container */}
            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide px-16 py-10"
            >
              {gameCharacters.map((char, i) => (
                <motion.div 
                  key={i}
                  className="flex-shrink-0 group cursor-pointer"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                >
                  {/* Character Card */}
                  <motion.div 
                    className="relative w-36 md:w-44"
                    whileHover={{ y: -15, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {/* Neon platform glow */}
                    <motion.div 
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 rounded-full blur-xl"
                      style={{ backgroundColor: char.glowColor }}
                      initial={{ opacity: 0.3 }}
                      whileHover={{ opacity: 0.8, scale: 1.3 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div 
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full"
                      style={{ 
                        backgroundColor: char.glowColor, 
                        boxShadow: `0 0 20px ${char.glowColor}` 
                      }}
                    />
                    
                    {/* Character Image */}
                    <div className="relative aspect-[3/4] flex items-end justify-center">
                      <motion.img 
                        src={char.image} 
                        alt={char.genre}
                        className="w-full h-full object-contain drop-shadow-xl"
                        style={{ filter: `drop-shadow(0 0 20px ${char.glowColor}40)` }}
                        whileHover={{ 
                          filter: `drop-shadow(0 0 35px ${char.glowColor}70)`,
                          scale: 1.08
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    
                    {/* Genre Label */}
                    <motion.div className="mt-4 text-center">
                      <span 
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: char.glowColor, textShadow: `0 0 15px ${char.glowColor}` }}
                      >
                        {char.genre}
                      </span>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Stats */}
          <StaggerContainer staggerDelay={0.2}>
            <div className="mt-14 flex flex-wrap justify-center gap-12 md:gap-20">
              {[
                { value: "+20", label: "gêneros de jogos suportados", color: "text-primary" },
                { value: "9", label: "personagens", color: "text-secondary" },
                { value: "∞", label: "Fair Play", color: "text-accent" },
              ].map((stat, i) => (
                <StaggerItem key={i}>
                  <motion.div 
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div 
                      className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}
                      style={{ textShadow: "0 0 30px currentColor" }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* ==================== FINAL CTA SECTION ==================== */}
      <section className="py-28 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-surface-1/20 to-background" />
        <FloatingLight className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color="hsl(185 100% 50% / 0.08)" size={600} />
        
        <div className="container relative">
          <AnimatedSection>
            <div className="text-center max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">
                Pronto para{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  dominar a arena?
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Junte-se a milhares de jogadores e organizações que já estão competindo na EFA. 
                Comece sua jornada competitiva hoje mesmo.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg" 
                    asChild 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 text-lg px-8"
                  >
                    <Link to="/auth">
                      CRIAR CONTA GRÁTIS
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    asChild 
                    className="border-border/50 hover:border-primary/40 hover:bg-primary/5 text-lg px-8"
                  >
                    <Link to="/tournaments">
                      <Trophy className="mr-2 h-5 w-5 text-primary" />
                      Ver Torneios
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
