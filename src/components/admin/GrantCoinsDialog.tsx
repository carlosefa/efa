import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Coins, Loader2, Search, User } from "lucide-react";
import { useGrantCoins, useSearchUsers } from "@/hooks/useAdminEconomy";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect } from "react";

interface GrantCoinsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserOption {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function GrantCoinsDialog({ open, onOpenChange }: GrantCoinsDialogProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(60);

  const debouncedSearch = useDebounce(search, 300);
  const searchUsers = useSearchUsers();
  const grantCoins = useGrantCoins();

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchUsers.mutate(debouncedSearch);
    }
  }, [debouncedSearch]);

  const handleGrant = async () => {
    if (!selectedUser || amount <= 0 || !reason.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await grantCoins.mutateAsync({
        userId: selectedUser.id,
        amount,
        reason: reason.trim(),
        expiresInDays,
      });

      toast({
        title: "Coins concedidos!",
        description: `${amount} EFA Coins foram concedidos para ${selectedUser.username || selectedUser.display_name}.`,
      });

      // Reset form
      setSearch("");
      setSelectedUser(null);
      setAmount(100);
      setReason("");
      setExpiresInDays(60);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao conceder coins",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Conceder EFA Coins
          </DialogTitle>
          <DialogDescription>
            Adicione coins manualmente à carteira de um usuário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Usuário</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {(selectedUser.username || selectedUser.display_name || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.display_name || selectedUser.username}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {searchUsers.isPending && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {searchUsers.data && searchUsers.data.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {searchUsers.data.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="font-medium text-sm">{user.display_name || user.username}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {searchUsers.data?.length === 0 && debouncedSearch.length >= 2 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Nenhum usuário encontrado.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Quantidade de Coins</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={1}
                max={100000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-32"
              />
              <div className="flex-1 flex gap-2">
                {[100, 500, 1000, 5000].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={amount === val ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(val)}
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea
              placeholder="Descreva o motivo da concessão..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Expiração</Label>
              <span className="text-sm text-muted-foreground">{expiresInDays} dias</span>
            </div>
            <Slider
              value={[expiresInDays]}
              onValueChange={([val]) => setExpiresInDays(val)}
              min={7}
              max={365}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>7 dias</span>
              <span>1 ano</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGrant}
            disabled={!selectedUser || amount <= 0 || !reason.trim() || grantCoins.isPending}
          >
            {grantCoins.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Conceder {amount} Coins
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
