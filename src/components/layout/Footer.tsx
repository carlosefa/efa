import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Gamepad2, 
  Mail, 
  MapPin,
  Phone,
  Twitter,
  Instagram,
  Youtube,
  Twitch,
  MessageCircle,
  ChevronRight,
  Zap,
  Shield,
  Heart
} from "lucide-react";
import efaLogo from "@/assets/efa-esports-logo.png";

const footerLinks = {
  platform: {
    title: "Plataforma",
    links: [
      { label: "Torneios", href: "/tournaments", icon: Trophy },
      { label: "Rankings", href: "/rankings", icon: Gamepad2 },
      { label: "Times", href: "/teams", icon: Users },
      { label: "Partidas", href: "/matches", icon: Zap },
    ]
  },
  resources: {
    title: "Recursos",
    links: [
      { label: "Central de Ajuda", href: "#", icon: MessageCircle },
      { label: "Regras & Fair Play", href: "#", icon: Shield },
      { label: "Blog", href: "#", icon: ChevronRight },
      { label: "API para Desenvolvedores", href: "#", icon: ChevronRight },
    ]
  },
  company: {
    title: "Empresa",
    links: [
      { label: "Sobre Nós", href: "#", icon: ChevronRight },
      { label: "Carreiras", href: "#", icon: ChevronRight },
      { label: "Contato", href: "#", icon: ChevronRight },
      { label: "Imprensa", href: "#", icon: ChevronRight },
    ]
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Termos de Uso", href: "#", icon: ChevronRight },
      { label: "Política de Privacidade", href: "#", icon: ChevronRight },
      { label: "Cookies", href: "#", icon: ChevronRight },
      { label: "LGPD", href: "#", icon: ChevronRight },
    ]
  }
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter", color: "#1DA1F2" },
  { icon: Instagram, href: "#", label: "Instagram", color: "#E4405F" },
  { icon: Youtube, href: "#", label: "YouTube", color: "#FF0000" },
  { icon: Twitch, href: "#", label: "Twitch", color: "#9146FF" },
  { icon: MessageCircle, href: "#", label: "Discord", color: "#5865F2" },
];

const contactInfo = [
  { icon: Mail, text: "contato@efa.gg", href: "mailto:contato@efa.gg" },
  { icon: Phone, text: "+55 (11) 9999-9999", href: "tel:+5511999999999" },
  { icon: MapPin, text: "São Paulo, Brasil", href: "#" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-surface-0 border-t border-border/30 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-1/50 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.03]" />
      
      {/* Top accent line */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="container relative py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <motion.img 
                src={efaLogo} 
                alt="EFA Esports" 
                className="h-12 w-auto"
                whileHover={{ scale: 1.05 }}
              />
              <div>
                <span className="text-xl font-bold text-foreground">EFA</span>
                <span className="text-xl font-bold text-primary ml-1">Esports</span>
              </div>
            </Link>
            
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              A plataforma definitiva para competições de esports. Organize torneios, 
              gerencie times e construa sua carreira no cenário competitivo.
            </p>

            {/* Social Links */}
            <div className="space-y-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Siga-nos
              </span>
              <div className="flex gap-3">
                {socialLinks.map((social, i) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={i}
                      href={social.href}
                      aria-label={social.label}
                      className="h-10 w-10 rounded-lg bg-surface-2/50 border border-border/30 flex items-center justify-center text-muted-foreground transition-all duration-300"
                      whileHover={{ 
                        scale: 1.1, 
                        borderColor: social.color,
                        color: social.color,
                        boxShadow: `0 0 20px ${social.color}30`
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 pt-2">
              {contactInfo.map((item, i) => {
                const Icon = item.icon;
                return (
                  <a 
                    key={i}
                    href={item.href}
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <Icon className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                    <span>{item.text}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, section], sectionIndex) => (
            <div key={key} className="space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <li key={i}>
                      <Link 
                        to={link.href}
                        className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                      >
                        <Icon className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-primary" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <motion.div 
          className="mt-16 p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border border-primary/20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-bold text-foreground mb-1">
                Fique por dentro das novidades
              </h4>
              <p className="text-sm text-muted-foreground">
                Receba atualizações sobre torneios, eventos e novos recursos.
              </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input 
                type="email" 
                placeholder="Seu e-mail"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-lg bg-surface-2/50 border border-border/50 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <motion.button 
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Inscrever
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {currentYear} EFA Esports.</span>
              <span>Todos os direitos reservados.</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Feito com</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Heart className="h-4 w-4 text-destructive fill-destructive" />
              </motion.span>
              <span>para a comunidade gamer</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Todos os sistemas operacionais
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating corner decorations */}
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l border-b border-primary/20 rounded-bl-xl pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r border-b border-secondary/20 rounded-br-xl pointer-events-none" />
    </footer>
  );
}
