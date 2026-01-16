import { Flag, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useOpenDispute } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/AuthContext";

const disputeSchema = z.object({
  reason: z.string().min(20, "Descreva o motivo com pelo menos 20 caracteres"),
});

type DisputeForm = z.infer<typeof disputeSchema>;

interface OpenDisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
}

export function OpenDisputeDialog({ open, onOpenChange, matchId }: OpenDisputeDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const openDispute = useOpenDispute();

  const form = useForm<DisputeForm>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: "",
    },
  });

  const onSubmit = async (data: DisputeForm) => {
    if (!user) return;

    try {
      await openDispute.mutateAsync({
        matchId: matchId,
        reason: data.reason,
      });

      toast({
        title: "Disputa aberta",
        description: "Um administrador irá analisar o caso.",
      });

      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erro ao abrir disputa",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Flag className="h-5 w-5" />
            Abrir Disputa
          </DialogTitle>
          <DialogDescription>
            Descreva detalhadamente o motivo da contestação. Inclua evidências se possível.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Disputa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explique o que aconteceu e por que você está contestando..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-muted-foreground">
              ⚠️ Disputas infundadas podem resultar em penalizações. Certifique-se de que sua reclamação é válida.
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={openDispute.isPending}>
                {openDispute.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Abrir Disputa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
