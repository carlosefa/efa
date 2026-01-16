import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Flag,
  Globe,
  Building,
  Coins,
  Trophy,
  MessageSquare,
  Shield,
  Loader2,
  Save,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAdminFeatureFlags } from "@/hooks/useAdminFeatureFlags";
import { toast } from "sonner";

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  category: "economy" | "social" | "tournament" | "moderation";
  icon: typeof Coins;
  global: boolean;
}

const featureFlags: FeatureFlag[] = [
  {
    key: "economy_enabled",
    name: "Economia (EFA Coins)",
    description: "Habilitar sistema de moedas virtuais",
    category: "economy",
    icon: Coins,
    global: true,
  },
  {
    key: "payment_mode",
    name: "Modo de Pagamento",
    description: "OFF = Sem pagamento, EXTERNAL = Externo, COINS = EFA Coins",
    category: "economy",
    icon: Coins,
    global: false,
  },
  {
    key: "prize_mode",
    name: "Modo de Premiação",
    description: "OFF = Sem prêmio, EXTERNAL = Externo, COINS = EFA Coins",
    category: "economy",
    icon: Trophy,
    global: false,
  },
  {
    key: "chat_enabled",
    name: "Chat",
    description: "Habilitar sistema de chat entre jogadores e times",
    category: "social",
    icon: MessageSquare,
    global: true,
  },
  {
    key: "friendly_matches",
    name: "Partidas Amistosas",
    description: "Permitir partidas amistosas fora de torneios",
    category: "tournament",
    icon: Trophy,
    global: true,
  },
  {
    key: "auto_moderation",
    name: "Moderação Automática",
    description: "Filtro automático de conteúdo impróprio",
    category: "moderation",
    icon: Shield,
    global: true,
  },
  {
    key: "disputes_enabled",
    name: "Sistema de Disputas",
    description: "Permitir abertura de disputas em partidas",
    category: "tournament",
    icon: Flag,
    global: true,
  },
];

const categoryConfig = {
  economy: { label: "Economia", color: "bg-yellow-500/10 text-yellow-500" },
  social: { label: "Social", color: "bg-blue-500/10 text-blue-500" },
  tournament: { label: "Torneios", color: "bg-purple-500/10 text-purple-500" },
  moderation: { label: "Moderação", color: "bg-red-500/10 text-red-500" },
};

export function AdminFeatureFlagsTab() {
  const [selectedScope, setSelectedScope] = useState<"global" | "country">("global");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);

  const {
    globalFlags,
    countryFlags,
    countries,
    isLoading,
    updateGlobalFlag,
    updateCountryFlag,
    isSaving,
  } = useAdminFeatureFlags();

  const handleToggleGlobal = async (key: string, value: boolean) => {
    await updateGlobalFlag.mutateAsync({ key, value });
  };

  const handleToggleCountry = async (countryId: string, key: string, value: boolean) => {
    await updateCountryFlag.mutateAsync({ countryId, key, value });
  };

  const getGlobalValue = (key: string): boolean => {
    return globalFlags[key] ?? false;
  };

  const getCountryValue = (countryId: string, key: string): boolean | undefined => {
    const countryConfig = countryFlags[countryId];
    if (!countryConfig) return undefined;
    return countryConfig[key];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Feature Flags
          </h2>
          <p className="text-sm text-muted-foreground">
            Controle quais funcionalidades estão disponíveis globalmente ou por país
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedScope} onValueChange={(v: "global" | "country") => setSelectedScope(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Global
                </div>
              </SelectItem>
              <SelectItem value="country">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Por País
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {selectedScope === "country" && (
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country: any) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-info/5 border-info/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-info mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm">Como funciona:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Global:</strong> Define o comportamento padrão para toda a plataforma</li>
                <li>• <strong>Por País:</strong> Sobrescreve a configuração global para um país específico</li>
                <li>• Se um país não tiver configuração específica, usa a configuração global</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Flags */}
      {selectedScope === "global" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Configurações Globais
            </CardTitle>
            <CardDescription>
              Estas configurações se aplicam a toda a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  featureFlags.reduce((acc, flag) => {
                    if (!acc[flag.category]) acc[flag.category] = [];
                    acc[flag.category].push(flag);
                    return acc;
                  }, {} as Record<string, FeatureFlag[]>)
                ).map(([category, flags]) => {
                  const cat = categoryConfig[category as keyof typeof categoryConfig];
                  return (
                    <div key={category} className="space-y-3">
                      <Badge className={cat.color}>{cat.label}</Badge>
                      <div className="grid gap-4">
                        {flags.map((flag) => {
                          const Icon = flag.icon;
                          const value = getGlobalValue(flag.key);
                          return (
                            <div
                              key={flag.key}
                              className="flex items-center justify-between p-4 rounded-lg border bg-card"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{flag.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {flag.description}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={value}
                                onCheckedChange={(v) => handleToggleGlobal(flag.key, v)}
                                disabled={isSaving}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Country Flags */}
      {selectedScope === "country" && selectedCountry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Configurações do País
            </CardTitle>
            <CardDescription>
              Sobrescrever configurações globais para este país
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Global</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Efetivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureFlags.map((flag) => {
                    const globalValue = getGlobalValue(flag.key);
                    const countryValue = getCountryValue(selectedCountry, flag.key);
                    const effectiveValue = countryValue !== undefined ? countryValue : globalValue;
                    const Icon = flag.icon;

                    return (
                      <TableRow key={flag.key}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{flag.name}</p>
                              <p className="text-xs text-muted-foreground">{flag.key}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={globalValue ? "default" : "secondary"}>
                            {globalValue ? "ON" : "OFF"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={countryValue ?? false}
                              onCheckedChange={(v) =>
                                handleToggleCountry(selectedCountry, flag.key, v)
                              }
                              disabled={isSaving}
                            />
                            {countryValue === undefined && (
                              <span className="text-xs text-muted-foreground">(herdado)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={effectiveValue ? "default" : "outline"}
                            className={effectiveValue ? "bg-success text-success-foreground" : ""}
                          >
                            {effectiveValue ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {selectedScope === "country" && !selectedCountry && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Selecione um país para gerenciar suas configurações</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
