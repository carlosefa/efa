import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTournament, useUpdateTournament } from "@/hooks/useTournaments";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

type Plan = "free" | "silver" | "gold" | "diamond" | "admin";
const PLAN_LABEL: Record<Plan, string> = {
  free: "Free",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
  admin: "Admin",
};
const PLAN_PUBLISH_FEE_PCT: Record<Plan, number> = {
  free: 80,
  silver: 65,
  gold: 50,
  diamond: 35,
  admin: 20,
};

type LegsMode = "single" | "two_legs";
type PlayoffsMode = "single" | "two_legs" | "bo3" | "bo5" | "bo7" | "bo9";

const LEGS_MODES: Array<{ value: LegsMode; label: string }> = [
  { value: "single", label: "Single match" },
  { value: "two_legs", label: "Two legs" },
];

const PLAYOFFS_MODES: Array<{ value: PlayoffsMode; label: string }> = [
  { value: "single", label: "Single match" },
  { value: "two_legs", label: "Two legs" },
  { value: "bo3", label: "Best of 3" },
  { value: "bo5", label: "Best of 5" },
  { value: "bo7", label: "Best of 7" },
  { value: "bo9", label: "Best of 9" },
];

type RulesText = {
  ux_format?: "league" | "knockout" | "groups_playoffs" | "fast";
  fees?: { team_entry_fee?: number; player_entry_fee?: number };

  // NEW MODEL (correct):
  league?: { match_mode?: LegsMode };
  knockout?: { match_mode?: PlayoffsMode; seeding?: "random" | "manual" };
  groups?: {
    desired_group_size?: number; // groups_playoffs
    group_size?: number; // fast
    base_advance?: 1 | 2;
    group_match_mode?: LegsMode; // groups stage
    playoffs_mode?: PlayoffsMode; // playoffs stage
    preview_power_of_two?: { bracket?: number; wildcards?: number };
  };

  draft?: { matchdays?: Weekday[]; matches_per_day?: number };
  fast?: { round_duration_minutes?: 15 | 20 | 25 | 30 | 35 };
  billing?: { plan?: Plan; publish_fee_base_efa?: number };

  info?: { text?: string };
};

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

function nextPowerOfTwo(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function computeGroups(totalTeams: number, desiredGroupSize: number) {
  const teams = Math.max(4, totalTeams);

  let groupCount = Math.max(1, Math.round(teams / desiredGroupSize));

  const maxGroups = Math.floor(teams / 4);
  groupCount = Math.max(1, Math.min(groupCount, Math.max(1, maxGroups)));

  const base = Math.floor(teams / groupCount);
  const remainder = teams % groupCount;

  const minGroupSize = base;
  const maxGroupSize = remainder > 0 ? base + 1 : base;

  return { groupCount, minGroupSize, maxGroupSize };
}

function computeBracket(groupCount: number, baseAdvance: 1 | 2) {
  const baseQualified = groupCount * baseAdvance;
  const target = Math.max(4, nextPowerOfTwo(baseQualified));
  const wildcards = target - baseQualified;
  return { baseQualified, target, wildcards };
}

export default function TournamentSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: tournament, isLoading, error } = useTournament(id);
  const updateTournament = useUpdateTournament();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [registrationStartsAt, setRegistrationStartsAt] = useState<string>("");
  const [registrationEndsAt, setRegistrationEndsAt] = useState<string>("");
  const [startsAt, setStartsAt] = useState<string>("");
  const [timezone, setTimezone] = useState<string>("America/Sao_Paulo");

  // Max teams editable (optional)
  const [maxTeams, setMaxTeams] = useState<number>(16);

  // rules_text parsed + editable parts
  const [rules, setRules] = useState<RulesText>({});

  // Post-draft operational settings
  const [matchdays, setMatchdays] = useState<Weekday[]>(["sat", "sun"]);
  const [matchesPerDay, setMatchesPerDay] = useState<number>(6);

  // Modes (editable)
  const [leagueMatchMode, setLeagueMatchMode] = useState<LegsMode>("single");

  const [knockoutMatchMode, setKnockoutMatchMode] = useState<PlayoffsMode>("single");
  const [seeding, setSeeding] = useState<"random" | "manual">("random");

  const [desiredGroupSize, setDesiredGroupSize] = useState<number>(4);
  const [baseAdvance, setBaseAdvance] = useState<1 | 2>(2);
  const [groupMatchMode, setGroupMatchMode] = useState<LegsMode>("single");
  const [playoffsMode, setPlayoffsMode] = useState<PlayoffsMode>("single");

  // Fast-specific
  const [fastGroupSize, setFastGroupSize] = useState<4 | 6 | 8>(4);
  const [roundDuration, setRoundDuration] = useState<15 | 20 | 25 | 30 | 35>(25);

  // Billing
  const [plan, setPlan] = useState<Plan>("free");
  const [publishFeeBase, setPublishFeeBase] = useState<number>(100);

  const uxFormat = useMemo(() => rules.ux_format ?? undefined, [rules]);

  // Hydrate state when tournament loads
  useEffect(() => {
    if (!tournament) return;

    setName(tournament.name ?? "");
    setDescription(tournament.description ?? "");

    setMaxTeams(tournament.max_teams ?? 16);

    // datetime-local expects "YYYY-MM-DDTHH:mm"
    const toLocalInput = (v: unknown) => {
      if (!v) return "";
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return "";
      const pad = (x: number) => String(x).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setRegistrationStartsAt(toLocalInput(tournament.registration_starts_at));
    setRegistrationEndsAt(toLocalInput(tournament.registration_ends_at));
    setStartsAt(toLocalInput(tournament.starts_at));
    setTimezone(tournament.timezone ?? "America/Sao_Paulo");

    const parsed = safeJsonParse<RulesText>(tournament.rules_text, {});
    setRules(parsed);

    // Draft schedule in rules_text
    setMatchdays(parsed.draft?.matchdays ?? ["sat", "sun"]);
    setMatchesPerDay(parsed.draft?.matches_per_day ?? 6);

    // Billing in rules_text
    setPlan(parsed.billing?.plan ?? "free");
    setPublishFeeBase(parsed.billing?.publish_fee_base_efa ?? 100);

    // League mode
    setLeagueMatchMode(parsed.league?.match_mode ?? "single");

    // Knockout mode
    setKnockoutMatchMode(parsed.knockout?.match_mode ?? "single");
    setSeeding(parsed.knockout?.seeding ?? "random");

    // Groups
    setDesiredGroupSize(parsed.groups?.desired_group_size ?? 4);
    setBaseAdvance((parsed.groups?.base_advance ?? 2) as 1 | 2);
    setGroupMatchMode(parsed.groups?.group_match_mode ?? "single");
    setPlayoffsMode((parsed.groups?.playoffs_mode ?? "single") as PlayoffsMode);

    // Fast
    setFastGroupSize((parsed.groups?.group_size ?? 4) as 4 | 6 | 8);
    setRoundDuration((parsed.fast?.round_duration_minutes ?? 25) as 15 | 20 | 25 | 30 | 35);
  }, [tournament]);

  const publishFee = useMemo(() => {
    const pct = PLAN_PUBLISH_FEE_PCT[plan];
    const base = clampInt(publishFeeBase, 0, 999999);
    const fee = Math.ceil((base * pct) / 100);
    return { pct, base, fee };
  }, [plan, publishFeeBase]);

  const bracketPreview = useMemo(() => {
    if (!tournament) return null;
    if (!uxFormat) return null;

    // only show for groups / fast
    if (uxFormat !== "groups_playoffs" && uxFormat !== "fast") return null;

    const teams = clampInt(maxTeams, 4, uxFormat === "fast" ? 256 : 128);
    const base = baseAdvance;

    if (uxFormat === "groups_playoffs") {
      const desired = clampInt(desiredGroupSize, 4, 32);
      const g = computeGroups(teams, desired);
      const b = computeBracket(g.groupCount, base);

      return {
        label: "Groups + Playoffs",
        teams,
        groupCount: g.groupCount,
        min: g.minGroupSize,
        max: g.maxGroupSize,
        baseAdvance: base,
        wildcards: b.wildcards,
        bracket: b.target,
        groupMode: groupMatchMode,
        playoffsMode,
      };
    }

    // fast
    const g = computeGroups(teams, fastGroupSize);
    const b = computeBracket(g.groupCount, base);

    return {
      label: "Fast Tournament",
      teams,
      groupCount: g.groupCount,
      min: g.minGroupSize,
      max: g.maxGroupSize,
      baseAdvance: base,
      wildcards: b.wildcards,
      bracket: b.target,
      groupSize: fastGroupSize,
      roundDuration,
    };
  }, [tournament, uxFormat, maxTeams, baseAdvance, desiredGroupSize, groupMatchMode, playoffsMode, fastGroupSize, roundDuration]);

  if (!id) return <div className="p-6">Missing tournament id.</div>;
  if (isLoading) return <div className="p-6">Loading settings...</div>;
  if (error) return <div className="p-6">Failed to load tournament.</div>;
  if (!tournament) return <div className="p-6">Tournament not found.</div>;

  const toggleDay = (d: Weekday) => {
    setMatchdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toIsoOrUndefined = (v: string) => {
    if (!v) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  };

  const saveAll = async () => {
    try {
      const merged: RulesText = {
        ...rules,

        league: {
          ...(rules.league ?? {}),
          match_mode: leagueMatchMode, // ✅ only single/two_legs
        },

        knockout: {
          ...(rules.knockout ?? {}),
          match_mode: knockoutMatchMode, // ✅ playoffs modes
          seeding,
        },

        groups: {
          ...(rules.groups ?? {}),
          desired_group_size: uxFormat === "groups_playoffs" ? clampInt(desiredGroupSize, 4, 32) : rules.groups?.desired_group_size,
          group_size: uxFormat === "fast" ? fastGroupSize : rules.groups?.group_size,
          base_advance: baseAdvance,
          group_match_mode: uxFormat === "groups_playoffs" ? groupMatchMode : rules.groups?.group_match_mode,
          playoffs_mode: uxFormat === "groups_playoffs" ? playoffsMode : "single", // fast fixed
          preview_power_of_two: bracketPreview
            ? { bracket: bracketPreview.bracket, wildcards: bracketPreview.wildcards }
            : rules.groups?.preview_power_of_two,
        },

        fast: {
          ...(rules.fast ?? {}),
          round_duration_minutes: roundDuration,
        },

        draft: {
          ...(rules.draft ?? {}),
          matchdays,
          matches_per_day: clampInt(matchesPerDay, 1, 50),
        },

        billing: {
          ...(rules.billing ?? {}),
          plan,
          publish_fee_base_efa: clampInt(publishFeeBase, 0, 999999),
        },
      };

      await updateTournament.mutateAsync({
        id: tournament.id,
        name,
        description,
        max_teams: maxTeams,
        timezone,
        registration_starts_at: toIsoOrUndefined(registrationStartsAt),
        registration_ends_at: toIsoOrUndefined(registrationEndsAt),
        starts_at: toIsoOrUndefined(startsAt),
        rules_text: JSON.stringify(merged),
      });

      toast({ title: "Saved", description: "Tournament settings updated." });
    } catch (e: unknown) {
      console.error("save settings error:", e);
      toast({
        title: "Failed to save",
        description: "Check console for details.",
        variant: "destructive",
      });
    }
  };

  const publish = async () => {
    try {
      const ok = window.confirm(
        `Publish this tournament?\n\nPlan: ${PLAN_LABEL[plan]}\nPublish fee: ${publishFee.fee} EFA (${publishFee.pct}% of base ${publishFee.base})\n\n(Wallet debit will be enforced once wallet is implemented.)`
      );
      if (!ok) return;

      await saveAll();

      await updateTournament.mutateAsync({
        id: tournament.id,
        status: "published",
      });

      toast({ title: "Published", description: "Tournament is now published." });
      navigate(`/app/tournaments/${tournament.id}`);
    } catch (e: unknown) {
      console.error("publish error:", e);
      toast({
        title: "Failed to publish",
        description: "Check console for details.",
        variant: "destructive",
      });
    }
  };

  const showLeague = uxFormat === "league";
  const showKnockout = uxFormat === "knockout";
  const showGroups = uxFormat === "groups_playoffs";
  const showFast = uxFormat === "fast";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tournament Settings</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="secondary">{tournament.status}</Badge>
            <Badge variant="outline">{tournament.format}</Badge>
            {uxFormat && <Badge variant="outline">ux: {uxFormat}</Badge>}
            <Badge variant="outline">{maxTeams} teams</Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Edit rules safely. League/Group stage are legs-only. BO formats are playoffs-only.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/app/tournaments/${tournament.id}`}>Back</Link>
          </Button>
          <Button onClick={saveAll} disabled={updateTournament.isPending}>
            {updateTournament.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Max teams</div>
              <Input
                type="number"
                min={4}
                max={uxFormat === "fast" ? 256 : 128}
                step={uxFormat === "league" ? 1 : 2}
                value={maxTeams}
                onChange={(e) => setMaxTeams(clampInt(Number(e.target.value), 4, uxFormat === "fast" ? 256 : 128))}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {uxFormat === "league" ? "League can be any valid size you allow." : "Even only is recommended for brackets."}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Description</div>
            <Input value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Format Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {showLeague && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">League match mode</div>
                <Select value={leagueMatchMode} onValueChange={(v) => setLeagueMatchMode(v as LegsMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEGS_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-2">
                  League supports only single match or two legs.
                </div>
              </div>
            </div>
          )}

          {showKnockout && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Playoffs mode</div>
                <Select value={knockoutMatchMode} onValueChange={(v) => setKnockoutMatchMode(v as PlayoffsMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLAYOFFS_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Seeding</div>
                <Select value={seeding} onValueChange={(v) => setSeeding(v as "random" | "manual")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="manual">Manual (admin only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {showGroups && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Desired group size</div>
                  <Input
                    type="number"
                    min={4}
                    max={32}
                    step={1}
                    value={desiredGroupSize}
                    onChange={(e) => setDesiredGroupSize(clampInt(Number(e.target.value), 4, 32))}
                  />
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Base advancing</div>
                  <Select value={String(baseAdvance)} onValueChange={(v) => setBaseAdvance(v === "1" ? 1 : 2)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Top 1</SelectItem>
                      <SelectItem value="2">Top 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Group stage</div>
                  <Select value={groupMatchMode} onValueChange={(v) => setGroupMatchMode(v as LegsMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEGS_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-2">
                    Group stage supports only single/two legs.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Playoffs mode</div>
                  <Select value={playoffsMode} onValueChange={(v) => setPlayoffsMode(v as PlayoffsMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLAYOFFS_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {showFast && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Group size</div>
                  <Select value={String(fastGroupSize)} onValueChange={(v) => setFastGroupSize(Number(v) as 4 | 6 | 8)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Base advancing</div>
                  <Select value={String(baseAdvance)} onValueChange={(v) => setBaseAdvance(v === "1" ? 1 : 2)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Top 1</SelectItem>
                      <SelectItem value="2">Top 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">Round duration</div>
                  <Select value={String(roundDuration)} onValueChange={(v) => setRoundDuration(Number(v) as 15 | 20 | 25 | 30 | 35)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="35">35</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Fast tournament is fixed to single-match playoffs.
              </div>
            </>
          )}

          {bracketPreview && (
            <div className="rounded-md border p-4 text-sm space-y-1">
              <div className="font-medium">Power-of-two preview</div>
              <div className="text-muted-foreground">
                {bracketPreview.label} • {bracketPreview.teams} teams • {bracketPreview.groupCount} groups (min {bracketPreview.min}, max {bracketPreview.max})
              </div>
              <div className="text-muted-foreground">
                Top {bracketPreview.baseAdvance} + <strong>{bracketPreview.wildcards}</strong> wildcards → <strong>{bracketPreview.bracket}-team</strong> playoffs
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operational schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Operational Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Days of the week</div>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const selected = matchdays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm border transition-colors",
                      selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"
                    )}
                  >
                    {WEEKDAY_LABEL[d]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Matches per day</div>
              <Input
                type="number"
                min={1}
                max={50}
                step={1}
                value={matchesPerDay}
                onChange={(e) => setMatchesPerDay(clampInt(Number(e.target.value), 1, 50))}
              />
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Time zone</div>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                  <SelectItem value="Europe/Lisbon">Lisbon (GMT+0)</SelectItem>
                  <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Registration starts (optional)</div>
              <Input type="datetime-local" value={registrationStartsAt} onChange={(e) => setRegistrationStartsAt(e.target.value)} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Registration ends (optional)</div>
              <Input type="datetime-local" value={registrationEndsAt} onChange={(e) => setRegistrationEndsAt(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Tournament starts (optional)</div>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Billing + Publish */}
      <Card>
        <CardHeader>
          <CardTitle>Publish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Plan</div>
              <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">Publish fee base (EFA)</div>
              <Input
                type="number"
                min={0}
                step={1}
                value={publishFeeBase}
                onChange={(e) => setPublishFeeBase(clampInt(Number(e.target.value), 0, 999999))}
              />
            </div>

            <div className="rounded-md bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Computed fee</div>
              <div className="text-lg font-semibold">{publishFee.fee} EFA</div>
              <div className="text-xs text-muted-foreground">{publishFee.pct}% of {publishFee.base}</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => navigate(`/app/tournaments/${tournament.id}`)}>
              Back
            </Button>
            <Button onClick={saveAll} disabled={updateTournament.isPending}>
              {updateTournament.isPending ? "Saving..." : "Save"}
            </Button>
            <Button onClick={publish} disabled={updateTournament.isPending}>
              Publish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
