import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTournament, useUpdateTournament } from "@/hooks/useTournaments";
import { supabase } from "@/integrations/supabase/client";

import {
  Trophy,
  Gamepad2,
  Coins,
  CalendarDays,
  Users,
  ShieldCheck,
  Clock,
  Flag,
  FileText,
  Save,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type RulesText = {
  ux_format?: "league" | "knockout" | "groups_playoffs" | "fast";
  fees?: { team_entry_fee?: number; player_entry_fee?: number };
  league?: { legs?: number };
  knockout?: { match_mode?: string; seeding?: string };
  groups?: {
    desired_group_size?: number;
    group_size?: number;
    base_advance?: 1 | 2;
    playoffs_mode?: string;
    preview_power_of_two?: { bracket?: number; wildcards?: number };
  };
  draft?: { matchdays?: string[]; matches_per_day?: number };
  fast?: { round_duration_minutes?: number };
  billing?: { plan?: string; publish_fee_base_efa?: number };

  // NEW: human-readable tournament info/rules (inline editor on detail page)
  info?: { text?: string };
};

function safeParseRules(raw: string | null | undefined): RulesText {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as RulesText;
  } catch {
    return {};
  }
}

function prettyDate(v: unknown): string {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function fmtEfa(n: unknown): string {
  if (typeof n === "number" && Number.isFinite(n)) return `${n} EFA`;
  return "—";
}

function num(n: unknown): string {
  if (typeof n === "number" && Number.isFinite(n)) return String(n);
  return "—";
}

function pickUxFormatLabel(ux?: RulesText["ux_format"]) {
  switch (ux) {
    case "league":
      return "League";
    case "knockout":
      return "Playoffs";
    case "groups_playoffs":
      return "Groups + Playoffs";
    case "fast":
      return "Fast Tournament";
    default:
      return "—";
  }
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tournament, isLoading, error } = useTournament(id);
  const updateTournament = useUpdateTournament();

  const rules = useMemo(
    () => safeParseRules(tournament?.rules_text),
    [tournament?.rules_text]
  );

  const uxFormatLabel = pickUxFormatLabel(rules.ux_format);

  const teamFee = rules.fees?.team_entry_fee ?? 0;
  const playerFee =
    rules.fees?.player_entry_fee ??
    Math.floor((rules.fees?.team_entry_fee ?? 0) / 2);

  const matchdays = (rules.draft?.matchdays ?? []).join(", ");
  const matchesPerDay = rules.draft?.matches_per_day;

  const isFast = rules.ux_format === "fast";
  const isGroups =
    rules.ux_format === "groups_playoffs" || rules.ux_format === "fast";
  const isLeague = rules.ux_format === "league";
  const isKnockout = rules.ux_format === "knockout";

  // Cancel modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Inline Tournament Information editor
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoText, setInfoText] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  useEffect(() => {
    // hydrate textarea from rules_text when tournament loads/changes
    setInfoText(rules.info?.text ?? "");
  }, [tournament?.id]); // only reset when switching tournament

  if (!id) return <div className="p-6">Missing tournament id.</div>;
  if (isLoading) return <div className="p-6">Loading tournament...</div>;
  if (error) return <div className="p-6">Failed to load tournament.</div>;
  if (!tournament) return <div className="p-6">Tournament not found.</div>;

  const gameName = tournament.game_modes?.games?.name ?? "—";
  const modeName = tournament.game_modes?.name ?? "—";
  const teamSize = tournament.game_modes?.team_size;
  const teamSizeLabel = teamSize ? `${teamSize}v${teamSize}` : "—";

  const plan = rules.billing?.plan ?? "—";
  const publishBase = rules.billing?.publish_fee_base_efa;

  async function confirmCancel() {
    await supabase.from("tournaments").delete().eq("id", tournament.id);
    navigate("/app/tournaments");
  }

  async function saveTournamentInfo() {
    try {
      setSavingInfo(true);

      const merged: RulesText = {
        ...rules,
        info: {
          ...(rules.info ?? {}),
          text: infoText,
        },
      };

      await updateTournament.mutateAsync({
        id: tournament.id,
        rules_text: JSON.stringify(merged),
      });

      setInfoOpen(false);
    } finally {
      setSavingInfo(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{tournament.name}</h1>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{tournament.status}</Badge>
            <Badge variant="outline">{tournament.format}</Badge>
            {rules.ux_format && <Badge variant="outline">UX: {uxFormatLabel}</Badge>}
            <Badge variant="outline">{tournament.max_teams} teams</Badge>
            <Badge variant="outline">{tournament.timezone ?? "—"}</Badge>
          </div>

          {tournament.description && (
            <p className="text-muted-foreground max-w-4xl">
              {tournament.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to={`/app/tournaments/${tournament.id}/settings`}>Settings</Link>
          </Button>

          {tournament.status === "draft" && (
            <Button
              variant="destructive"
              onClick={() => {
                setCancelOpen(true);
                setConfirmChecked(false);
              }}
            >
              Cancel Tournament
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Game & Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold leading-tight">{gameName}</div>
            <div className="text-sm text-muted-foreground">
              {modeName} <span className="opacity-70">({teamSizeLabel})</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Entry Fees
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold leading-tight">{fmtEfa(teamFee)}</div>
            <div className="text-sm text-muted-foreground">
              Player: <span className="font-medium">{fmtEfa(playerFee)}</span>
              <span className="opacity-70"> (auto half)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold leading-tight">
              {prettyDate(tournament.starts_at)}
            </div>
            <div className="text-sm text-muted-foreground">
              Reg: {prettyDate(tournament.registration_starts_at)} → {prettyDate(tournament.registration_ends_at)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Publish Reminder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold leading-tight">{plan}</div>
            <div className="text-sm text-muted-foreground">
              Fee base: <span className="font-medium">{typeof publishBase === "number" ? `${publishBase} EFA` : "—"}</span>
            </div>
            <div className="text-xs text-muted-foreground opacity-80">
              Publish will debit wallet when wallet is enabled.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary + Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Slug</span>
                <span className="font-medium">{tournament.slug}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{tournament.status}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">DB format</span>
                <span className="font-medium">{tournament.format}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">UX format</span>
                <span className="font-medium">{uxFormatLabel}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Max teams</span>
                <span className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 opacity-70" />
                  {tournament.max_teams}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Timezone</span>
                <span className="font-medium">{tournament.timezone ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{prettyDate(tournament.created_at)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">International</span>
                <span className="font-medium flex items-center gap-2">
                  <Flag className="h-4 w-4 opacity-70" />
                  {tournament.is_international ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-md border p-3 space-y-1">
              <div className="text-xs text-muted-foreground">Draft schedule</div>
              <div>
                <span className="text-muted-foreground">Matchdays:</span>{" "}
                <span className="font-medium">{matchdays || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Matches/day:</span>{" "}
                <span className="font-medium">
                  {typeof matchesPerDay === "number" ? matchesPerDay : "—"}
                </span>
              </div>
            </div>

            {isFast && (
              <div className="rounded-md border p-3 space-y-1">
                <div className="text-xs text-muted-foreground">Fast pacing</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Round duration</span>
                  <span className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 opacity-70" />
                    {num(rules.fast?.round_duration_minutes ?? 25)} min
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rules + Tournament Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Format Rules</CardTitle>

          <Button
            variant="outline"
            onClick={() => setInfoOpen((v) => !v)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Tournament Information
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-md border p-4 space-y-2">
            <div className="font-medium">Rules</div>

            {isLeague && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Legs</span>
                <span className="font-medium">{num(rules.league?.legs)}</span>
              </div>
            )}

            {isKnockout && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Match mode</span>
                  <span className="font-medium">{rules.knockout?.match_mode ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Seeding</span>
                  <span className="font-medium">{rules.knockout?.seeding ?? "—"}</span>
                </div>
              </>
            )}

            {isGroups && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Base advance</span>
                  <span className="font-medium">{num(rules.groups?.base_advance)}</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Group size</span>
                  <span className="font-medium">
                    {isFast ? num(rules.groups?.group_size) : num(rules.groups?.desired_group_size)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Playoffs mode</span>
                  <span className="font-medium">
                    {rules.groups?.playoffs_mode ?? (isFast ? "single" : "—")}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Bracket</span>
                  <span className="font-medium">
                    {rules.groups?.preview_power_of_two?.bracket ?? "—"}
                    {typeof rules.groups?.preview_power_of_two?.wildcards === "number"
                      ? ` (wc: ${rules.groups.preview_power_of_two.wildcards})`
                      : ""}
                  </span>
                </div>
              </>
            )}

            {isFast && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Round duration</span>
                <span className="font-medium">{num(rules.fast?.round_duration_minutes ?? 25)} min</span>
              </div>
            )}

            {!rules.ux_format && (
              <div className="text-muted-foreground">
                No UX rules saved yet. Open Settings to configure post-draft options.
              </div>
            )}
          </div>

          {/* Inline info editor */}
          <div className="rounded-md border p-4 space-y-3">
            <div className="font-medium">Tournament Information</div>

            {!infoOpen ? (
              <div className="text-muted-foreground">
                {infoText?.trim()
                  ? infoText
                  : "No tournament information yet. Click the button above to add rules, links, and notes."}
              </div>
            ) : (
              <>
                <Textarea
                  value={infoText}
                  onChange={(e) => setInfoText(e.target.value)}
                  placeholder="Write tournament rules, Discord/WhatsApp links, schedule notes, admin notes, etc."
                  className="min-h-[160px] resize-none"
                />

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInfoOpen(false)}
                    disabled={savingInfo || updateTournament.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveTournamentInfo}
                    disabled={savingInfo || updateTournament.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingInfo || updateTournament.isPending ? "Saving..." : "Save information"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Do you really want to cancel this tournament?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p>
              This action is <strong>irreversible</strong>. If you confirm, the tournament will be{" "}
              <strong>permanently deleted</strong> and{" "}
              <strong>no wallet balance will be debited</strong>.
            </p>

            <div className="flex items-start gap-2">
              <Checkbox
                checked={confirmChecked}
                onCheckedChange={(v) => setConfirmChecked(!!v)}
                id="confirm-delete"
              />
              <label htmlFor="confirm-delete" className="leading-tight">
                I understand and I want to cancel this tournament
              </label>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              No, keep it
            </Button>

            <Button
              variant="destructive"
              disabled={!confirmChecked}
              onClick={confirmCancel}
            >
              Confirm cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
