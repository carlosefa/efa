// src/contexts/LanguageContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";

export type Language =
  | "pt-BR"
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "ja"
  | "ko"
  | "zh"
  | "ar"
  | "ru"
  | "tr"
  | "pl"
  | "nl"
  | "sv";

export interface LanguageInfo {
  code: Language;
  name: string;
  flag: string;
}

/**
 * English (US) first in the dropdown (UX)
 * - keeps your Language union and codes exactly the same
 * - only reorders the list (no breaking change)
 */
export const languages: LanguageInfo[] = [
  { code: "en", name: "English (US)", flag: "🇺🇸" },
  { code: "pt-BR", name: "Português (BR)", flag: "🇧🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
];

// Translations for all supported languages
const translations: Record<Language, Record<string, string>> = {
  "pt-BR": {
    // Navigation
    "nav.rankings": "Rankings",
    "nav.tournaments": "Torneios",
    "nav.teams": "Times",
    "nav.discord": "Discord",
    "nav.login": "Entrar",
    "nav.signup": "Criar Conta",
    "nav.dashboard": "Dashboard",

    // Hero
    "hero.badge": "Temporada 2026.1 Ativa",
    "hero.title1": "Domine a",
    "hero.title2": "Arena Competitiva",
    "hero.description":
      "Organize torneios profissionais, gerencie times, acompanhe rankings e construa sua comunidade de esports.",
    "hero.description2": "Tudo em uma só plataforma.",
    "hero.cta1": "Começar Grátis",
    "hero.cta2": "Ver Rankings",
    "hero.players": "+10k jogadores",
    "hero.antifarm": "Anti-farm",
    "hero.countries": "50+ países",

    // Live Panel
    "panel.live": "Arena Live",
    "panel.online": "ONLINE",
    "panel.playersOnline": "Jogadores Online",
    "panel.matchesToday": "Partidas Hoje",
    "panel.activeTournaments": "Torneios Ativos",
    "panel.currentSeason": "Temporada Atual",
    "panel.topRanking": "Top 3 Ranking",
    "panel.viewAll": "Ver todos",
    "panel.teams": "times",
    "panel.doubleElim": "Eliminação dupla",

    // Features
    "features.badge": "Recursos",
    "features.title": "Tudo que você precisa para",
    "features.title2": "competir",
    "features.description":
      "Ferramentas profissionais para organizadores, times e jogadores",
    "features.learnMore": "Saiba mais",

    "feature.tournaments.title": "Torneios",
    "feature.tournaments.subtitle": "Liga • Mata-mata • Grupos",
    "feature.tournaments.desc":
      "Organize competições profissionais com múltiplos formatos.",

    "feature.matchroom.title": "Match Room",
    "feature.matchroom.subtitle": "Reportar • Confirmar • Disputar",
    "feature.matchroom.desc": "Sistema completo de gerenciamento de partidas.",

    "feature.rankings.title": "Rankings",
    "feature.rankings.subtitle": "Rating • ELO • Seasons",
    "feature.rankings.desc": "Sistema de rating anti-farm com incerteza.",

    "feature.teams.title": "Times",
    "feature.teams.subtitle": "Roster • Staff • Histórico",
    "feature.teams.desc": "Gerencie jogadores, técnicos e substitutos.",

    "feature.anticheat.title": "Anti-fraude",
    "feature.anticheat.subtitle": "Logs • Auditoria • Moderação",
    "feature.anticheat.desc": "Proteção completa com logs imutáveis.",

    "feature.global.title": "Multi-país",
    "feature.global.subtitle": "50+ Países • Timezones",
    "feature.global.desc": "Suporte global com idiomas locais.",

    // How it works
    "how.badge": "Como Funciona",
    "how.title": "Três passos para a",
    "how.title2": "vitória",
    "how.step1.title": "Crie seu Perfil",
    "how.step1.desc": "Monte seu time ou entre como jogador solo.",
    "how.step2.title": "Entre na Competição",
    "how.step2.desc": "Participe de torneios ou desafie adversários.",
    "how.step3.title": "Reporte & Suba",
    "how.step3.desc": "Confirme resultados e escale no ranking.",

    // Rankings Preview
    "rankings.badge": "Leaderboard",
    "rankings.title": "Top",
    "rankings.title2": "Global",
    "rankings.description": "Os melhores jogadores competindo em tempo real",
    "rankings.position": "#",
    "rankings.player": "Jogador / Time",
    "rankings.rating": "Rating",
    "rankings.matches": "Partidas",
    "rankings.winrate": "Winrate",
    "rankings.viewFull": "Ver Ranking Completo",

    // CTA Section
    "cta.title": "Pronto para",
    "cta.title2": "competir",
    "cta.description":
      "Junte-se a milhares de jogadores e organizadores que já estão usando a plataforma EFA.",
    "cta.button": "Começar Agora",

    // Footer
    "footer.description": "A plataforma definitiva para esports competitivo.",
    "footer.platform": "Plataforma",
    "footer.friendlies": "Amistosos",
    "footer.organizers": "Organizadores",
    "footer.plans": "Planos",
    "footer.docs": "Documentação",
    "footer.support": "Suporte",
    "footer.legal": "Legal",
    "footer.terms": "Termos de Uso",
    "footer.privacy": "Privacidade",
    "footer.cookies": "Cookies",
    "footer.community": "Comunidade",
    "footer.rights": "© 2026 EFA Esports. Todos os direitos reservados.",
    "footer.serversOnline": "Servidores Online",

    // Characters Section
    "characters.badge": "Universo Multi-Game",
    "characters.title": "Todos os seus jogos",
    "characters.title2": "em um só lugar",
    "characters.description":
      "De FPS a esportes, de RPG a luta. Uma plataforma única para todos os gêneros de jogos competitivos.",
    "characters.gamesSupported": "gêneros de jogos suportados",
    "characters.crossPlatform": "Cross-platform",
    "characters.fairPlay": "Fair Play",

    // Index (Under Construction page)
    "index.badge": "Em Construção",
    "index.title1": "Estamos Preparando",
    "index.title2": "Algo Épico!",
    "index.description":
      "A plataforma definitiva de esports está chegando. Prepare-se para competir, evoluir e conquistar.",
    "index.pill.tournaments": "Torneios",
    "index.pill.teams": "Times",
    "index.pill.matches": "Partidas",
    "index.comingSoon": "Em breve",
    "index.footer": "© 2026 EFA Esports. Todos os direitos reservados.",
  },

  en: {
    "nav.rankings": "Rankings",
    "nav.tournaments": "Tournaments",
    "nav.teams": "Teams",
    "nav.discord": "Discord",
    "nav.login": "Login",
    "nav.signup": "Sign Up",
    "nav.dashboard": "Dashboard",

    "hero.badge": "Season 2026.1 Active",
    "hero.title1": "Dominate the",
    "hero.title2": "Competitive Arena",
    "hero.description":
      "Organize professional tournaments, manage teams, track rankings and build your esports community.",
    "hero.description2": "All in one platform.",
    "hero.cta1": "Start Free",
    "hero.cta2": "View Rankings",
    "hero.players": "+10k players",
    "hero.antifarm": "Anti-farm",
    "hero.countries": "50+ countries",

    "panel.live": "Arena Live",
    "panel.online": "ONLINE",
    "panel.playersOnline": "Players Online",
    "panel.matchesToday": "Matches Today",
    "panel.activeTournaments": "Active Tournaments",
    "panel.currentSeason": "Current Season",
    "panel.topRanking": "Top 3 Ranking",
    "panel.viewAll": "View all",
    "panel.teams": "teams",
    "panel.doubleElim": "Double elimination",

    "features.badge": "Features",
    "features.title": "Everything you need to",
    "features.title2": "compete",
    "features.description":
      "Professional tools for organizers, teams and players",
    "features.learnMore": "Learn more",

    "feature.tournaments.title": "Tournaments",
    "feature.tournaments.subtitle": "League • Knockout • Groups",
    "feature.tournaments.desc":
      "Organize professional competitions with multiple formats.",

    "feature.matchroom.title": "Match Room",
    "feature.matchroom.subtitle": "Report • Confirm • Dispute",
    "feature.matchroom.desc": "Complete match management system.",

    "feature.rankings.title": "Rankings",
    "feature.rankings.subtitle": "Rating • ELO • Seasons",
    "feature.rankings.desc": "Anti-farm rating system with uncertainty.",

    "feature.teams.title": "Teams",
    "feature.teams.subtitle": "Roster • Staff • History",
    "feature.teams.desc": "Manage players, coaches and substitutes.",

    "feature.anticheat.title": "Anti-cheat",
    "feature.anticheat.subtitle": "Logs • Audit • Moderation",
    "feature.anticheat.desc": "Complete protection with immutable logs.",

    "feature.global.title": "Multi-country",
    "feature.global.subtitle": "50+ Countries • Timezones",
    "feature.global.desc": "Global support with local languages.",

    "how.badge": "How It Works",
    "how.title": "Three steps to",
    "how.title2": "victory",
    "how.step1.title": "Create Your Profile",
    "how.step1.desc": "Build your team or join as a solo player.",
    "how.step2.title": "Join the Competition",
    "how.step2.desc": "Participate in tournaments or challenge opponents.",
    "how.step3.title": "Report & Climb",
    "how.step3.desc": "Confirm results and climb the ranking.",

    "rankings.badge": "Leaderboard",
    "rankings.title": "Top",
    "rankings.title2": "Global",
    "rankings.description": "The best players competing in real time",
    "rankings.position": "#",
    "rankings.player": "Player / Team",
    "rankings.rating": "Rating",
    "rankings.matches": "Matches",
    "rankings.winrate": "Winrate",
    "rankings.viewFull": "View Full Ranking",

    "cta.title": "Ready to",
    "cta.title2": "compete",
    "cta.description":
      "Join thousands of players and organizers already using the EFA platform.",
    "cta.button": "Start Now",

    "footer.description": "The ultimate platform for competitive esports.",
    "footer.platform": "Platform",
    "footer.friendlies": "Friendlies",
    "footer.organizers": "Organizers",
    "footer.plans": "Plans",
    "footer.docs": "Documentation",
    "footer.support": "Support",
    "footer.legal": "Legal",
    "footer.terms": "Terms of Use",
    "footer.privacy": "Privacy",
    "footer.cookies": "Cookies",
    "footer.community": "Community",
    "footer.rights": "© 2026 EFA Esports. All rights reserved.",
    "footer.serversOnline": "Servers Online",

    "characters.badge": "Multi-Game Universe",
    "characters.title": "All your games",
    "characters.title2": "in one place",
    "characters.description":
      "From FPS to sports, from RPG to fighting. One platform for all competitive gaming genres.",
    "characters.gamesSupported": "game genres supported",
    "characters.crossPlatform": "Cross-platform",
    "characters.fairPlay": "Fair Play",

    // Index (Under Construction page)
    "index.badge": "Under Construction",
    "index.title1": "We’re Building",
    "index.title2": "Something Epic.",
    "index.description":
      "The definitive esports platform is on the way. Get ready to compete, improve, and conquer.",
    "index.pill.tournaments": "Tournaments",
    "index.pill.teams": "Teams",
    "index.pill.matches": "Matches",
    "index.comingSoon": "Coming soon",
    "index.footer": "© 2026 EFA Esports. All rights reserved.",
  },

  // Other languages kept (explicit empty dicts = safe fallback to DEFAULT_LANG)
  es: {},
  fr: {},
  de: {},
  it: {},
  ja: {},
  ko: {},
  zh: {},
  ar: {},
  ru: {},
  tr: {},
  pl: {},
  nl: {},
  sv: {},
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "efa-language";
const DEFAULT_LANG: Language = "pt-BR"; // keep as-is for now

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && value in translations;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLanguage(saved) ? saved : DEFAULT_LANG;
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (!isLanguage(lang)) return;
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  const t = useMemo(() => {
    return (key: string): string =>
      translations[language]?.[key] ||
      translations[DEFAULT_LANG]?.[key] ||
      key;
  }, [language]);

  const value = useMemo<LanguageContextType>(
    () => ({ language, setLanguage, t, languages }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

