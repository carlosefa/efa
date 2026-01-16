import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMyTeams } from "@/hooks/useTeams";
import { useRegisterTeam } from "@/hooks/useTournaments";
import { useAuth } from "@/contexts/AuthContext";

interface RegisterTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
}

export function RegisterTeamDialog({ open, onOpenChange, tournamentId }: RegisterTeamDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: myTeams, isLoading: loadingTeams } = useMyTeams();
  const registerTeam = useRegisterTeam();

  const handleRegister = async () => {
    if (!selectedTeamId || !user) return;

    try {
      await registerTeam.mutateAsync({
        tournamentId: tournamentId,
        teamId: selectedTeamId,
      });

      toast({
        title: "Inscrição realizada!",
        description: "Sua inscrição está pendente de aprovação.",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao inscrever",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Inscrever Time
          </DialogTitle>
          <DialogDescription>
            Selecione um dos seus times para inscrever neste torneio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {loadingTeams ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myTeams && myTeams.length > 0 ? (
            myTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  selectedTeamId === team.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-muted font-bold">
                    {team.tag?.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium">{team.name}</p>
                  <p className="text-xs text-muted-foreground">[{team.tag}]</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Você não possui nenhum time. Crie um time primeiro.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleRegister}
            disabled={!selectedTeamId || registerTeam.isPending}
          >
            {registerTeam.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Inscrever
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
