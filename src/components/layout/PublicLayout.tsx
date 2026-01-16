import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { 
  Menu, 
  X, 
  Trophy, 
  Users, 
  Crown,
  MessageCircle,
  ChevronRight
} from "lucide-react";
import efaLogo from "@/assets/efa-esports-logo.png";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/rankings", labelKey: "nav.rankings", icon: Crown },
  { to: "/tournaments", labelKey: "nav.tournaments", icon: Trophy },
  { to: "/teams", labelKey: "nav.teams", icon: Users },
];

export function PublicLayout() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-hex-grid" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--secondary)/0.05)_0%,_transparent_40%)]" />
      </div>

      {/* HUD Topbar */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled 
            ? "bg-surface-0/90 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5" 
            : "bg-transparent"
        )}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container">
          <div className="flex h-16 lg:h-18 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={efaLogo}
                alt="EFA Esports"
                className="h-10 lg:h-12 w-auto object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_15px_hsl(var(--primary)/0.6)]"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg group flex items-center gap-2",
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )} />
                    <span>{t(link.labelKey)}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <LanguageSelector />


              {user ? (
                <Button asChild className="cyber-btn bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to="/dashboard">
                    <span className="text-xs font-semibold tracking-wider">{t("nav.dashboard")}</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hidden sm:flex text-muted-foreground hover:text-foreground">
                    <Link to="/auth">{t("nav.login")}</Link>
                  </Button>
                  <Button asChild className="cyber-btn bg-primary hover:bg-primary/90 text-primary-foreground relative overflow-hidden group">
                    <Link to="/auth">
                      <span className="text-xs font-semibold tracking-wider relative z-10">{t("nav.signup")}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  </Button>
                </>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom accent line on scroll */}
        {scrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        )}
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative z-50 pt-20 px-6 space-y-2">
            {navLinks.map((link, index) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all animate-fade-in",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/30" 
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-lg font-medium">{t(link.labelKey)}</span>
                </Link>
              );
            })}
            {!user && (
              <div className="pt-4 space-y-2 animate-fade-in" style={{ animationDelay: `${(navLinks.length + 1) * 50}ms` }}>
                <Button asChild className="w-full cyber-btn bg-primary text-primary-foreground">
                  <Link to="/auth">
                    <span className="text-xs font-semibold tracking-wider">Criar Conta</span>
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Content with padding for fixed header */}
      <main className="flex-1 relative z-10 pt-16 lg:pt-18">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-surface-0/80 backdrop-blur-xl">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center mb-4">
                <img src={efaLogo} alt="EFA Esports" className="h-10 w-auto" />
              </Link>
              <p className="text-sm text-muted-foreground">
                {t("footer.description")}
              </p>
            </div>

            {/* Plataforma */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">{t("footer.platform")}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/rankings" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.rankings")}</Link></li>
                <li><Link to="/tournaments" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.tournaments")}</Link></li>
                <li><Link to="/teams" className="text-muted-foreground hover:text-foreground transition-colors">{t("nav.teams")}</Link></li>
                <li><Link to="/friendlies" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.friendlies")}</Link></li>
              </ul>
            </div>

            {/* Organizadores */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">{t("footer.organizers")}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.plans")}</Link></li>
                <li><Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.docs")}</Link></li>
                <li><Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.support")}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">{t("footer.legal")}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.terms")}</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacy")}</Link></li>
                <li><Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">{t("footer.cookies")}</Link></li>
              </ul>
            </div>

            {/* Comunidade */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">{t("footer.community")}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://discord.gg/efaesports" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" /> Discord
                </a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("footer.rights")}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                {t("footer.serversOnline")}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}