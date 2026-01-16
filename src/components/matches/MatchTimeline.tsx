import { 
  Calendar, Upload, CheckCircle2, Flag, XCircle, 
  MessageCircle, AlertCircle, Trophy, Clock
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface MatchTimelineProps {
  events: Tables<"match_events">[];
}

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  match_scheduled: Calendar,
  score_reported: Upload,
  score_confirmed: CheckCircle2,
  dispute_opened: Flag,
  dispute_resolved: AlertCircle,
  match_cancelled: XCircle,
  chat_message: MessageCircle,
  match_finished: Trophy,
};

const eventLabels: Record<string, string> = {
  match_scheduled: "Partida agendada",
  score_reported: "Resultado reportado",
  score_confirmed: "Resultado confirmado",
  dispute_opened: "Disputa aberta",
  dispute_resolved: "Disputa resolvida",
  match_cancelled: "Partida cancelada",
  chat_message: "Mensagem enviada",
  match_finished: "Partida finalizada",
};

export function MatchTimeline({ events }: MatchTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Nenhum evento registrado ainda</p>
      </div>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {sortedEvents.map((event, index) => {
          const Icon = eventIcons[event.event_type] || Clock;
          const label = eventLabels[event.event_type] || event.event_type;
          const payload = event.payload as Record<string, any> | null;

          return (
            <div key={event.id} className="relative pl-10">
              {/* Icon */}
              <div className="absolute left-0 p-2 rounded-full bg-card border border-border">
                <Icon className="h-4 w-4 text-primary" />
              </div>

              {/* Content */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>

                {/* Payload details */}
                {payload && (
                  <div className="text-sm text-muted-foreground">
                    {payload.score && (
                      <p>Placar: {payload.score.home} x {payload.score.away}</p>
                    )}
                    {payload.message && (
                      <p>{payload.message}</p>
                    )}
                    {payload.reason && (
                      <p>Motivo: {payload.reason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
