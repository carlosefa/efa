import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Coins,
  Gift,
  Package,
  History,
  Plus,
  Edit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useAdminCoinGrants, useAdminCoinPackages, useUpdateCoinPackage } from "@/hooks/useAdminEconomy";
import { GrantCoinsDialog } from "./GrantCoinsDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AdminEconomyTab() {
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const { data: grants = [], isLoading: loadingGrants } = useAdminCoinGrants();
  const { data: packages = [], isLoading: loadingPackages } = useAdminCoinPackages();
  const updatePackage = useUpdateCoinPackage();

  const formatPrice = (priceCents: number | null) => {
    if (!priceCents) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(priceCents / 100);
  };

  const togglePackageActive = async (id: string, currentStatus: boolean) => {
    await updatePackage.mutateAsync({ id, is_active: !currentStatus });
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2.8M</p>
                <p className="text-sm text-muted-foreground">Coins em circulação</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">+45.2K</p>
                <p className="text-sm text-muted-foreground">Emitidos (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">-12.8K</p>
                <p className="text-sm text-muted-foreground">Gastos (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">8.5K</p>
                <p className="text-sm text-muted-foreground">Expirando (7 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="grants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grants" className="gap-2">
            <Gift className="h-4 w-4" />
            Concessões
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-2">
            <Package className="h-4 w-4" />
            Pacotes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grants">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Concessões de Coins</CardTitle>
                  <CardDescription>Histórico de coins concedidos manualmente</CardDescription>
                </div>
                <Button onClick={() => setGrantDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Conceder Coins
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGrants ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : grants.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhuma concessão registrada.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Expiração</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grants.slice(0, 20).map((grant: any) => (
                      <TableRow key={grant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {(grant.wallet?.user?.username || "U")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {grant.wallet?.user?.display_name || grant.wallet?.user?.username || "Usuário"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <Coins className="h-3 w-3" />
                            +{grant.amount}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{grant.reason}</TableCell>
                        <TableCell>{grant.expires_in_days} dias</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(grant.created_at), { addSuffix: true, locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pacotes de Coins</CardTitle>
                  <CardDescription>Gerencie os pacotes disponíveis para compra</CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Pacote
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPackages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pacote</TableHead>
                      <TableHead>Coins</TableHead>
                      <TableHead>Bônus</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg: any) => (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{pkg.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            <Coins className="h-3 w-3" />
                            {pkg.coins}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {pkg.bonus_coins > 0 ? (
                            <Badge variant="outline" className="text-green-600">
                              +{pkg.bonus_coins}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{formatPrice(pkg.price_cents)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={pkg.is_active}
                            onCheckedChange={() => togglePackageActive(pkg.id, pkg.is_active)}
                            disabled={updatePackage.isPending}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <GrantCoinsDialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen} />
    </div>
  );
}
