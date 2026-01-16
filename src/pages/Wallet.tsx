import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet, useTransactions, useShopItems, useUserInventory } from "@/hooks/useEconomy";
import { 
  Coins, 
  ShoppingBag, 
  History, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CoinBatchesCard } from "@/components/economy/CoinBatchesCard";
import { CoinPackagesGrid } from "@/components/economy/CoinPackagesGrid";
import { TransactionFilters, type TransactionFilters as TFilters } from "@/components/economy/TransactionFilters";
import { useToast } from "@/hooks/use-toast";

export default function Wallet() {
  const { data: wallet } = useWallet();
  const { data: transactions = [] } = useTransactions();
  const { data: shopItems = [] } = useShopItems();
  const { data: inventory = [] } = useUserInventory();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<TFilters>({
    type: "all",
    dateFrom: undefined,
    dateTo: undefined,
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx: any) => {
      // Type filter
      if (filters.type !== "all" && tx.type !== filters.type) return false;
      
      // Date filters
      const txDate = parseISO(tx.created_at);
      if (filters.dateFrom && isBefore(txDate, filters.dateFrom)) return false;
      if (filters.dateTo && isAfter(txDate, filters.dateTo)) return false;
      
      return true;
    });
  }, [transactions, filters]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <ArrowDownRight className="h-5 w-5 text-green-500" />;
      case "debit":
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      case "expired":
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Coins className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "credit":
        return "text-green-500";
      case "debit":
        return "text-red-500";
      case "expired":
        return "text-orange-500";
      default:
        return "text-muted-foreground";
    }
  };

  const handlePurchase = (packageId: string) => {
    toast({
      title: "Em breve!",
      description: "A compra de coins estará disponível em breve.",
    });
  };

  const handleExport = () => {
    const csv = [
      ["Data", "Tipo", "Descrição", "Valor"].join(","),
      ...filteredTransactions.map((tx: any) => [
        new Date(tx.created_at).toLocaleDateString("pt-BR"),
        tx.type,
        `"${tx.description}"`,
        tx.amount,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Carteira</h1>
        <p className="text-muted-foreground">Gerencie seus EFA Coins</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
              <p className="text-4xl font-bold flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Coins className="h-7 w-7 text-yellow-500" />
                </div>
                {wallet?.balance?.toLocaleString("pt-BR") || "0"}
                <span className="text-lg font-normal text-muted-foreground">EFA Coins</span>
              </p>
            </div>
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Comprar Coins
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
            <div>
              <p className="text-sm text-muted-foreground">Total Ganho</p>
              <p className="text-xl font-semibold text-green-500">
                +{wallet?.lifetime_earned?.toLocaleString("pt-BR") || "0"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-xl font-semibold text-red-500">
                -{wallet?.lifetime_spent?.toLocaleString("pt-BR") || "0"}
              </p>
            </div>
            <div className="col-span-2 md:col-span-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                Próxima Expiração
              </p>
              <p className="text-xl font-semibold text-orange-500">
                Ver lotes abaixo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="packages" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="packages" className="gap-2">
                <Coins className="h-4 w-4" />
                Pacotes
              </TabsTrigger>
              <TabsTrigger value="shop" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Loja
              </TabsTrigger>
              <TabsTrigger value="inventory" className="gap-2">
                <Package className="h-4 w-4" />
                Inventário
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="packages">
              <Card>
                <CardHeader>
                  <CardTitle>Pacotes de EFA Coins</CardTitle>
                </CardHeader>
                <CardContent>
                  <CoinPackagesGrid onPurchase={handlePurchase} disabled />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shop">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopItems.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Loja vazia no momento</p>
                      <p className="text-sm">Novos itens em breve!</p>
                    </CardContent>
                  </Card>
                ) : (
                  shopItems.map((item: any) => (
                    <Card key={item.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge>{item.category}</Badge>
                          <Button size="sm" className="gap-1">
                            <Coins className="h-3 w-3" />
                            {item.price}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="inventory">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Seu inventário está vazio</p>
                      <p className="text-sm">Compre itens na loja!</p>
                    </CardContent>
                  </Card>
                ) : (
                  inventory.map((inv: any) => (
                    <Card key={inv.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{inv.item?.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant={inv.is_equipped ? "default" : "outline"}>
                          {inv.is_equipped ? "Equipado" : "Não equipado"}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <TransactionFilters 
                onFilterChange={setFilters} 
                onExport={handleExport}
              />
              
              <Card>
                <CardContent className="p-0">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma transação encontrada</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredTransactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            {getTransactionIcon(tx.type)}
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <p className={`font-bold ${getTransactionColor(tx.type)}`}>
                            {tx.type === "credit" ? "+" : tx.type === "debit" ? "-" : ""}
                            {tx.amount.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <CoinBatchesCard />
        </div>
      </div>
    </div>
  );
}
