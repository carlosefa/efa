import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useReportResult, useConfirmResult } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";

const scoreSchema = z.object({
  homeScore: z.coerce.number().min(0, "Placar inválido"),
  awayScore: z.coerce.number().min(0, "Placar inválido"),
});

type ScoreForm = z.infer<typeof scoreSchema>;

interface ReportScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Tables<"matches">;
  homeTeam: Tables<"teams"> | null;
  awayTeam: Tables<"teams"> | null;
}

export function ReportScoreDialog({ open, onOpenChange, match, homeTeam, awayTeam }: ReportScoreDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const reportScore = useReportResult();
  const confirmScore = useConfirmResult();

  const isConfirming = match.status === "pending_confirm";

  const form = useForm<ScoreForm>({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      homeScore: match.home_score ?? 0,
      awayScore: match.away_score ?? 0,
    },
  });

  const onSubmit = async (data: ScoreForm) => {
    if (!user) return;

    try {
      if (isConfirming) {
        await confirmScore.mutateAsync({
          matchId: match.id,
        });
        toast({
          title: "Resultado confirmado!",
          description: "A partida foi finalizada.",
        });
      } else {
        await reportScore.mutateAsync({
          matchId: match.id,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
        });
        toast({
          title: "Resultado reportado!",
          description: "Aguardando confirmação do adversário.",
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const isPending = reportScore.isPending || confirmScore.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {isConfirming ? "Confirmar Resultado" : "Reportar Resultado"}
          </DialogTitle>
          <DialogDescription>
            {isConfirming
              ? "Confirme se o placar reportado está correto."
              : "Informe o placar final da partida."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <Avatar className="h-12 w-12 mx-auto rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                    {homeTeam?.tag?.slice(0, 2) || "TM"}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-2 text-sm font-medium">{homeTeam?.name}</p>
                <FormField
                  control={form.control}
                  name="homeScore"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="text-center text-2xl font-bold h-14"
                          disabled={isConfirming}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <span className="text-2xl font-bold text-muted-foreground">:</span>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <Avatar className="h-12 w-12 mx-auto rounded-lg">
                  <AvatarFallback className="rounded-lg bg-secondary/10 text-secondary font-bold">
                    {awayTeam?.tag?.slice(0, 2) || "TM"}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-2 text-sm font-medium">{awayTeam?.name}</p>
                <FormField
                  control={form.control}
                  name="awayScore"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="text-center text-2xl font-bold h-14"
                          disabled={isConfirming}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isConfirming ? "Confirmar" : "Reportar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
