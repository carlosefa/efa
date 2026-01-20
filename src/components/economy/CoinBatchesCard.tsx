import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Coins, AlertTriangle } from "lucide-react";
import { useCoinBatches } from "@/hooks/useCoinBatches";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { enUS } from "date-fns/locale";

export function CoinBatchesCard() {
  const { data: batches = [], isLoading } = useCoinBatches();

  const getExpirationStatus = (expiresAt: string) => {
    const days = differenceInDays(new Date(expiresAt), new Date());
    if (days <= 7) return "critical";
    if (days <= 14) return "warning";
    return "normal";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Coin Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Coin Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            You don't have any active coin batches.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Coin Batches ({batches.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {batches.map((batch) => {
          const status = getExpirationStatus(batch.expires_at);
          const percentUsed =
            ((batch.original_amount - batch.remaining_amount) /
              batch.original_amount) *
            100;

          return (
            <div
              key={batch.id}
              className={`p-4 rounded-lg border ${
                status === "critical"
                  ? "border-destructive/50 bg-destructive/5"
                  : status === "warning"
                    ? "border-warning/50 bg-warning/5"
                    : "border-border bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">{batch.remaining_amount}</span>
                  <span className="text-muted-foreground text-sm">
                    / {batch.original_amount} coins
                  </span>
                </div>
                <Badge
                  variant={
                    status === "critical"
                      ? "destructive"
                      : status === "warning"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs"
                >
                  {status === "critical" && (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {formatDistanceToNow(new Date(batch.expires_at), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </Badge>
              </div>

              <Progress value={100 - percentUsed} className="h-2" />

              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span className="capitalize">{batch.source_type}</span>
                <span>
                  Expires on{" "}
                  {new Date(batch.expires_at).toLocaleDateString("en-US")}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
