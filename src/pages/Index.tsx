import { Construction, Gamepad2, Trophy, Users } from "lucide-react";
import efaLogo from "@/assets/efa-esports-logo.png";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--secondary)/0.1)_0%,_transparent_50%)]" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo */}
        <div className="mb-8 animate-float">
          <img 
            src={efaLogo} 
            alt="EFA Esports Logo" 
            className="h-32 w-auto animate-pulse-glow md:h-40"
          />
        </div>

        {/* Construction Icon */}
        <div className="mb-6 flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-6 py-2">
          <Construction className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium uppercase tracking-wider text-primary">
            Em Construção
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent animate-gradient">
            Estamos Preparando
          </span>
          <br />
          <span className="text-foreground">Algo Épico!</span>
        </h1>

        {/* Description */}
        <p className="mb-12 max-w-md text-center text-lg text-muted-foreground">
          A plataforma definitiva de esports está chegando. 
          Prepare-se para competir, evoluir e conquistar.
        </p>

        {/* Feature Pills */}
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-2 backdrop-blur-sm">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Torneios</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-2 backdrop-blur-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Times</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-2 backdrop-blur-sm">
            <Gamepad2 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Matchmaking</span>
          </div>
        </div>

        {/* Coming Soon Animation */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: '0.2s' }} />
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: '0.4s' }} />
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 EFA Esports. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
