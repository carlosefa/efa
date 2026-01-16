import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, Lock } from "lucide-react";
import { useCoinPackages } from "@/hooks/useCoinBatches";

interface CoinPackagesGridProps {
  onPurchase?: (packageId: string) => void;
  disabled?: boolean;
}

export function CoinPackagesGrid({ onPurchase, disabled = false }: CoinPackagesGridProps) {
  const { data: packages = [], isLoading } = useCoinPackages();

  const formatPrice = (priceCents: number | null) => {
    if (!priceCents) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(priceCents / 100);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {packages.map((pkg, index) => {
        const isPopular = index === 1;
        const isBest = index === packages.length - 1;
        
        return (
          <Card
            key={pkg.id}
            className={`relative overflow-hidden transition-all hover:scale-105 ${
              isPopular
                ? "border-primary ring-2 ring-primary/20"
                : isBest
                ? "border-yellow-500 ring-2 ring-yellow-500/20"
                : ""
            }`}
          >
            {isPopular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                Popular
              </div>
            )}
            {isBest && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-yellow-950 text-xs px-3 py-1 rounded-bl-lg font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Melhor Valor
              </div>
            )}
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-8 w-8 text-yellow-500" />
                  <span className="text-3xl font-bold">{pkg.coins}</span>
                </div>
                {pkg.bonus_coins > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    +{pkg.bonus_coins} bônus
                  </Badge>
                )}
              </div>
              
              {pkg.description && (
                <p className="text-sm text-muted-foreground text-center">
                  {pkg.description}
                </p>
              )}
              
              <Button
                className="w-full"
                variant={isPopular ? "default" : "outline"}
                disabled={disabled || !pkg.price_cents}
                onClick={() => onPurchase?.(pkg.id)}
              >
                {disabled ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Em breve
                  </>
                ) : pkg.price_cents ? (
                  formatPrice(pkg.price_cents)
                ) : (
                  "Indisponível"
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
