import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Trophy,
  Gamepad2,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  Zap,
  CalendarDays,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { useGames, useGameModes, useRulesets } from "@/hooks/useGames";
import { useCreateTournament } from "@/hooks/useTournaments";
import type { Database } from "@/integrations/supabase/types";

type TournamentFormat = Database["public"]["Enums"]["tournament_format"];

const steps = [
  { id: 1, title: "Game", icon: Gamepad2 },
  { id: 2, title: "Format", icon: Settings2 },
  { id: 3, title: "Details", icon: Trophy },
] as const;

type FormatUx = "league" | "knockout" | "groups_playoffs" | "fast";
type LegsMode = "single" | "two_legs";
type PlayoffsMode = "single" | "two_legs" | "bo3" | "bo5" | "bo7" | "bo9";

const formatsUx: Array<{
  value: FormatUx;
  label: string;
  description: string;
  badge?: "one-night";
}> = [
  { value: "league", label: "League", description: "Points based competition" },
  { value: "knockout", label: "Playoffs", description: "Single elimination bracket" },
  { value: "groups_playoffs", label: "Groups + Playoffs", description: "Group stage then playoffs" },
  { value: "fast", label: "Fast Tournament", description: "One-night (groups + single match playoffs)", badge: "one-night" },
];

const timezoneDefault = "America/Sao_Paulo";

const leagueTeams = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40] as const;
const knockoutTeams = [8, 16, 32, 64, 128] as const;

const LEGS_MODES: Array<{ value: LegsMode; label: string; hint: string }> = [
  { value: "single", label: "Single match", hint: "One game" },
  { value: "two_legs", label: "Two legs", hint: "Home & away" },
];

const PLAYOFFS_MODES: Array<{ value: PlayoffsMode; label: string; hint: string }> = [
  { value: "single", label: "Single match", hint: "One game decides" },
  { value: "two_legs", label: "Two legs", hint: "Home & away" },
  { value: "bo3", label: "Best of 3", hint: "First to 2 wins" },
  { value: "bo5", label: "Best of 5", hint: "First to 3 wins" },
  { value: "bo7", label: "Best of 7", hint: "First to 4 wins" },
  { value: "bo9", label: "Best of 9", hint: "First to 5 wins" },
];

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Please try again.";
}

/**
 * UX OK logic:
 * - For Groups+Playoffs "Max group size" means: no group will exceed this size.
 *   So user can set it up to max_teams (even 128 => single group).
 */
function computeGroupsMaxSize(totalTeams: number, maxGroupSize: number) {
  const teams = Math.max(4, totalTeams);
  const maxSize = Math.max(4, Math.trunc(maxGroupSize) || 4);

  const groupCount = Math.max(1, Math.ceil(teams / maxSize));

  const base = Math.floor(teams / groupCount);
  const remainder = teams % groupCount;

  const minGroupSize = base;
  const maxGroupSizeActual = remainder > 0 ? base + 1 : base;

  return { groupCount, minGroupSize, maxGroupSize: maxGroupSizeActual };
}

function nextPowerOfTwo(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function computeBracket(groupCount: number, baseAdvance: 1 | 2) {
  const baseQualified = groupCount * baseAdvance;
  const target = Math.max(4, nextPowerOfTwo(baseQualified));
  const wildcards = target - baseQualified;
  return { target, wildcards };
}

const tournamentSchema = z
  .object({
    // Step 1 (DB IDs)
    game_id: z.string().min(1, "Select a game"),
    game_mode_id: z.string().min(1, "Select a mode"),
    ruleset_id: z.string().optional(),

    // Step 2
    formatUx: z.enum(["league", "knockout", "groups_playoffs", "fast"]),

    // Step 3 identity
    name: z.string().min(3, "Name must be at least 3 characters").max(100),
    slug: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Use only lowercase letters, numbers, and hyphens"),
    description: z.string().max(500).optional(),

    // Fees (stored in rules_text)
    team_entry_fee: z
      .number({ invalid_type_error: "Enter a valid number" })
      .int("Must be an integer")
      .min(100, "Minimum is 100")
      .max(9999, "Maximum is 9999"),

    // League
    league_teams: z.number().optional(),
    league_legs_mode: z.enum(["single", "two_legs"]).optional(),

    // Knockout
    knockout_teams: z.number().optional(),
    knockout_playoffs_mode: z.enum(["single", "two_legs", "bo3", "bo5", "bo7", "bo9"]).optional(),
    seeding: z.enum(["random", "manual"]).optional(),

    // Groups + Playoffs (max group size)
    gp_teams: z.number().optional(),
    max_group_size: z.number().optional(),
    gp_base_advance: z.enum(["1", "2"]).optional(),
    group_legs_mode: z.enum(["single", "two_legs"]).optional(),
    playoffs_mode: z.enum(["single", "two_legs", "bo3", "bo5", "bo7", "bo9"]).optional(),

    // Fast
    fast_teams: z.number().optional(),
    group_size: z.enum(["4", "6", "8"]).optional(),
    fast_base_advance: z.enum(["1", "2"]).optional(),

    // Optional schedule in step 3
    registration_starts_at: z.string().optional(),
    registration_ends_at: z.string().optional(),
    starts_at: z.string().optional(),
    timezone: z.string().default(timezoneDefault),
  })
  .superRefine((data, ctx) => {
    // date coherence if filled
    const rs = data.registration_starts_at ? new Date(data.registration_starts_at) : null;
    const re = data.registration_ends_at ? new Date(data.registration_ends_at) : null;
    const st = data.starts_at ? new Date(data.starts_at) : null;

    if (rs && re && re < rs) ctx.addIssue({ code: "custom", path: ["registration_ends_at"], message: "Must be after registration start" });
    if (re && st && st < re) ctx.addIssue({ code: "custom", path: ["starts_at"], message: "Must be after registration ends" });

    if (data.formatUx === "league") {
      if (!data.league_teams || !leagueTeams.includes(data.league_teams as (typeof leagueTeams)[number])) {
        ctx.addIssue({ code: "custom", path: ["league_teams"], message: "Select a valid team count" });
      }
      if (!data.league_legs_mode) ctx.addIssue({ code: "custom", path: ["league_legs_mode"], message: "Select single or two legs" });
    }

    if (data.formatUx === "knockout") {
      if (!data.knockout_teams || !knockoutTeams.includes(data.knockout_teams as (typeof knockoutTeams)[number])) {
        ctx.addIssue({ code: "custom", path: ["knockout_teams"], message: "Select a valid team count" });
      }
      if (!data.knockout_playoffs_mode) ctx.addIssue({ code: "custom", path: ["knockout_playoffs_mode"], message: "Select playoffs mode" });
      if (!data.seeding) ctx.addIssue({ code: "custom", path: ["seeding"], message: "Select seeding" });
    }

    if (data.formatUx === "groups_playoffs") {
      const teams = data.gp_teams;

      if (!teams || !Number.isInteger(teams)) ctx.addIssue({ code: "custom", path: ["gp_teams"], message: "Enter teams" });
      if (teams && (teams < 4 || teams > 128)) ctx.addIssue({ code: "custom", path: ["gp_teams"], message: "Teams must be 4..128" });
      if (teams && teams % 2 !== 0) ctx.addIssue({ code: "custom", path: ["gp_teams"], message: "Teams must be even" });

      if (data.max_group_size === undefined || !Number.isInteger(data.max_group_size)) {
        ctx.addIssue({ code: "custom", path: ["max_group_size"], message: "Enter max group size" });
      } else {
        if (data.max_group_size < 4) ctx.addIssue({ code: "custom", path: ["max_group_size"], message: "Minimum is 4" });
        if (data.max_group_size > 128) ctx.addIssue({ code: "custom", path: ["max_group_size"], message: "Maximum is 128" });
      }

      if (!data.gp_base_advance) ctx.addIssue({ code: "custom", path: ["gp_base_advance"], message: "Select base advancing" });
      if (!data.group_legs_mode) ctx.addIssue({ code: "custom", path: ["group_legs_mode"], message: "Select single/two legs for group stage" });
      if (!data.playoffs_mode) ctx.addIssue({ code: "custom", path: ["playoffs_mode"], message: "Select playoffs mode" });

      if (teams && data.max_group_size) {
        const g = computeGroupsMaxSize(teams, data.max_group_size);
        if (g.minGroupSize < 4) ctx.addIssue({ code: "custom", path: ["max_group_size"], message: "Invalid grouping (< 4 in a group)" });
      }
    }

    if (data.formatUx === "fast") {
      const teams = data.fast_teams;

      if (!teams || !Number.isInteger(teams)) ctx.addIssue({ code: "custom", path: ["fast_teams"], message: "Enter teams" });
      if (teams && (teams < 4 || teams > 256)) ctx.addIssue({ code: "custom", path: ["fast_teams"], message: "Teams must be 4..256" });
      if (teams && teams % 2 !== 0) ctx.addIssue({ code: "custom", path: ["fast_teams"], message: "Teams must be even" });

      if (!data.group_size) ctx.addIssue({ code: "custom", path: ["group_size"], message: "Select group size" });
      if (!data.fast_base_advance) ctx.addIssue({ code: "custom", path: ["fast_base_advance"], message: "Select base advancing" });
    }
  });

type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function CreateTournament() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createTournament = useCreateTournament();
  type CreateTournamentInput = Parameters<typeof createTournament.mutateAsync>[0];

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      game_id: "",
      game_mode_id: "",
      ruleset_id: "",

      formatUx: "league",

      name: "",
      slug: "",
      description: "",

      team_entry_fee: 100,

      league_teams: 16,
      league_legs_mode: "single",

      knockout_teams: 16,
      knockout_playoffs_mode: "single",
      seeding: "random",

      gp_teams: 16,
      max_group_size: 16,
      gp_base_advance: "2",
      group_legs_mode: "single",
      playoffs_mode: "single",

      fast_teams: 16,
      group_size: "4",
      fast_base_advance: "2",

      timezone: timezoneDefault,
    },
  });

  // Watch for reactivity
  const selectedGameId = form.watch("game_id");
  const selectedModeId = form.watch("game_mode_id");
  const formatUx = form.watch("formatUx");

  const teamEntryFee = form.watch("team_entry_fee");
  const playerFee = useMemo(
    () => Math.floor((Number.isFinite(teamEntryFee) ? teamEntryFee : 100) / 2),
    [teamEntryFee]
  );

  const gpTeams = form.watch("gp_teams");
  const maxGroupSize = form.watch("max_group_size");
  const gpBase = form.watch("gp_base_advance");

  const fastTeams = form.watch("fast_teams");
  const groupSize = form.watch("group_size");
  const fastBase = form.watch("fast_base_advance");

  const { data: gamesDb } = useGames();
  const { data: modesDb } = useGameModes(selectedGameId || undefined);
  const { data: rulesetsDb } = useRulesets(selectedModeId || undefined);

  const preview = useMemo(() => {
    if (formatUx === "groups_playoffs") {
      const teams = typeof gpTeams === "number" ? gpTeams : 16;
      const maxSize = typeof maxGroupSize === "number" ? maxGroupSize : 16;
      const base: 1 | 2 = gpBase === "1" ? 1 : 2;

      const g = computeGroupsMaxSize(teams, maxSize);
      const b = computeBracket(g.groupCount, base);

      const note = g.groupCount === 1 ? " (single group)" : "";
      return `Groups + Playoffs • ${teams} teams • ${g.groupCount} groups${note} (min ${g.minGroupSize}, max ${g.maxGroupSize}) • Top ${base} + ${b.wildcards} wildcards • ${b.target}-team playoffs`;
    }

    if (formatUx === "fast") {
      const teams = typeof fastTeams === "number" ? fastTeams : 16;
      const gs = groupSize ? Number(groupSize) : 4;
      const base: 1 | 2 = fastBase === "1" ? 1 : 2;

      const g = computeGroupsMaxSize(teams, gs); // max group size for fast = fixed size
      const b = computeBracket(g.groupCount, base);

      return `Fast Tournament • ${teams} teams • ${g.groupCount} groups (min ${g.minGroupSize}, max ${g.maxGroupSize}) • Top ${base} + ${b.wildcards} wildcards • ${b.target}-team playoffs`;
    }

    return null;
  }, [formatUx, gpTeams, maxGroupSize, gpBase, fastTeams, groupSize, fastBase]);

  const nextStep = async () => {
    const fields: (keyof TournamentFormData)[] = [];
    if (currentStep === 1) fields.push("game_id", "game_mode_id");
    if (currentStep === 2) fields.push("formatUx");

    const ok = await form.trigger(fields, { shouldFocus: true });
    if (ok && currentStep < 3) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const onSubmit = async (data: TournamentFormData) => {
    try {
      const dbFormat: TournamentFormat =
        data.formatUx === "fast" ? "groups_playoffs" : data.formatUx;

      const maxTeams =
        data.formatUx === "league" ? (data.league_teams ?? 16) :
        data.formatUx === "knockout" ? (data.knockout_teams ?? 16) :
        data.formatUx === "groups_playoffs" ? (data.gp_teams ?? 16) :
        (data.fast_teams ?? 16);

      const extraConfig = {
        ux_format: data.formatUx,
        fees: {
          team_entry_fee: data.team_entry_fee,
          player_entry_fee: Math.floor(data.team_entry_fee / 2),
        },

        league: data.formatUx === "league"
          ? { match_mode: data.league_legs_mode }
          : undefined,

        knockout: data.formatUx === "knockout"
          ? { match_mode: data.knockout_playoffs_mode, seeding: data.seeding }
          : undefined,

        groups: data.formatUx === "groups_playoffs"
          ? {
              max_group_size: data.max_group_size,
              base_advance: data.gp_base_advance === "1" ? 1 : 2,
              group_match_mode: data.group_legs_mode,
              playoffs_mode: data.playoffs_mode,
            }
          : data.formatUx === "fast"
            ? {
                group_size: Number(data.group_size ?? "4"),
                base_advance: data.fast_base_advance === "1" ? 1 : 2,
                group_match_mode: "single",
                playoffs_mode: "single",
              }
            : undefined,

        // placeholders (edited later in Settings)
        billing: { plan: "admin", publish_fee_base_efa: 100 },
        draft: { matchdays: ["mon", "tue", "thu"], matches_per_day: 1 },
        fast: { round_duration_minutes: 25 },
      };

      const payload: CreateTournamentInput = {
        name: data.name,
        slug: data.slug,
        description: data.description,

        game_mode_id: data.game_mode_id,
        ruleset_id: data.ruleset_id ? data.ruleset_id : undefined,

        format: dbFormat,
        max_teams: maxTeams,
        min_teams: 4,

        rules_text: JSON.stringify(extraConfig),

        starts_at: data.starts_at,
        registration_starts_at: data.registration_starts_at,
        registration_ends_at: data.registration_ends_at,
        timezone: data.timezone,

        is_international: false,
      };

      const tournament = await createTournament.mutateAsync(payload);

      toast({ title: "Draft created!", description: `${data.name} was created successfully.` });
      navigate(`/app/tournaments/${tournament.id}`);
    } catch (error: unknown) {
      console.error("create draft error:", error);
      toast({ title: "Failed to create draft", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  const headerTitle =
    currentStep === 1 ? "Choose a Game" :
    currentStep === 2 ? "Tournament Format" :
    "Tournament Details";

  const headerDesc =
    currentStep === 1 ? "Select the game and game mode" :
    currentStep === 2 ? "Choose one of the predefined formats" :
    "Set structure, fees, and optional schedule";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Create Tournament
        </h1>
        <p className="text-muted-foreground">Set up your tournament step by step</p>
      </div>

      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-primary/20 text-primary",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                <span className="hidden sm:inline font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-2", isCompleted ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{headerTitle}</CardTitle>
              <CardDescription>{headerDesc}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="game_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue("game_mode_id", "");
                            form.setValue("ruleset_id", "");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a game" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(gamesDb ?? []).map((g: { id: string; name: string }) => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedGameId && (
                    <FormField
                      control={form.control}
                      name="game_mode_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Game Mode</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(v) => {
                              field.onChange(v);
                              form.setValue("ruleset_id", "");
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(modesDb ?? []).map((m: { id: string; name: string; team_size: number }) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name} ({m.team_size}v{m.team_size})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedModeId && (rulesetsDb ?? []).length > 0 && (
                    <FormField
                      control={form.control}
                      name="ruleset_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ruleset (optional)</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ruleset (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(rulesetsDb ?? []).map((r: { id: string; name: string }) => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              {currentStep === 2 && (
                <FormField
                  control={form.control}
                  name="formatUx"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(v) => field.onChange(v as FormatUx)}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          {formatsUx.map((f) => (
                            <Label
                              key={f.value}
                              className={cn(
                                "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                                field.value === f.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <RadioGroupItem value={f.value} />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{f.label}</p>
                                  {f.badge === "one-night" && (
                                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                                      <Zap className="h-3 w-3" />
                                      One-night
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{f.description}</p>
                              </div>
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {currentStep === 3 && (
                <>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tournament Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Corujão #01"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                if (!form.getValues("slug")) form.setValue("slug", generateSlug(e.target.value));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Friendly URL</FormLabel>
                          <FormControl>
                            <Input placeholder="corujao-01" {...field} />
                          </FormControl>
                          <FormDescription>Public URL: /tournaments/{field.value || "slug"}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the tournament..." className="resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Entry Fees</p>
                        <p className="text-xs text-muted-foreground">Player entry is half (rounded down)</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Player fee</p>
                        <p className="font-semibold">{playerFee} EFA</p>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="team_entry_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Entry Fee (EFA)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={100}
                              max={9999}
                              step={1}
                              value={field.value}
                              onChange={(e) => {
                                const n = Number.parseInt(e.target.value, 10);
                                field.onChange(Number.isFinite(n) ? n : 100);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <p className="font-medium">Tournament Structure</p>

                    {formatUx === "league" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="league_teams"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teams</FormLabel>
                              <Select
                                value={field.value ? String(field.value) : "16"}
                                onValueChange={(v) => field.onChange(Number.parseInt(v, 10))}
                              >
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {leagueTeams.map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n} teams</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="league_legs_mode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>League legs</FormLabel>
                              <Select value={field.value ?? "single"} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LEGS_MODES.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {formatUx === "knockout" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="knockout_teams"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Teams</FormLabel>
                              <Select
                                value={field.value ? String(field.value) : "16"}
                                onValueChange={(v) => field.onChange(Number.parseInt(v, 10))}
                              >
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {knockoutTeams.map((n) => (
                                    <SelectItem key={n} value={String(n)}>{n} teams</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="knockout_playoffs_mode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Playoffs mode</FormLabel>
                              <Select value={field.value ?? "single"} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {PLAYOFFS_MODES.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="seeding"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel>Seeding</FormLabel>
                              <Select value={field.value ?? "random"} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="random">Random</SelectItem>
                                  <SelectItem value="manual">Manual (admin only)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {formatUx === "groups_playoffs" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="gp_teams"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teams (even)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={4}
                                    max={128}
                                    step={2}
                                    value={field.value ?? 16}
                                    onChange={(e) => {
                                      const n = Number.parseInt(e.target.value, 10);
                                      field.onChange(Number.isFinite(n) ? n : 16);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="max_group_size"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max group size</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={4}
                                    max={128}
                                    step={1}
                                    value={field.value ?? 16}
                                    onChange={(e) => {
                                      const n = Number.parseInt(e.target.value, 10);
                                      field.onChange(Number.isFinite(n) ? n : 16);
                                    }}
                                  />
                                </FormControl>
                                <FormDescription>No group will exceed this size.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="gp_base_advance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base advancing</FormLabel>
                                <Select value={field.value ?? "2"} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="1">Top 1</SelectItem>
                                    <SelectItem value="2">Top 2</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="group_legs_mode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Group stage</FormLabel>
                                <Select value={field.value ?? "single"} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {LEGS_MODES.map((m) => (
                                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="playoffs_mode"
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>Playoffs mode</FormLabel>
                                <Select value={field.value ?? "single"} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {PLAYOFFS_MODES.map((m) => (
                                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {preview && (
                          <div className="rounded-md bg-muted/40 p-3 text-sm">
                            <p className="font-medium">Power-of-two preview</p>
                            <p className="text-muted-foreground">{preview}</p>
                          </div>
                        )}
                      </>
                    )}

                    {formatUx === "fast" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fast_teams"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teams (even)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={4}
                                    max={256}
                                    step={2}
                                    value={field.value ?? 16}
                                    onChange={(e) => {
                                      const n = Number.parseInt(e.target.value, 10);
                                      field.onChange(Number.isFinite(n) ? n : 16);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="group_size"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Group size</FormLabel>
                                <Select value={field.value ?? "4"} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="8">8</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="fast_base_advance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Base advancing</FormLabel>
                              <Select value={field.value ?? "2"} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">Top 1</SelectItem>
                                  <SelectItem value="2">Top 2</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {preview && (
                          <div className="rounded-md bg-muted/40 p-3 text-sm">
                            <p className="font-medium">Power-of-two preview</p>
                            <p className="text-muted-foreground">{preview}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 opacity-70" />
                      <p className="font-medium">Schedule (optional)</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="registration_starts_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration starts</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="registration_ends_at"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registration ends</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="starts_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tournament starts</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time zone</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                              <SelectItem value="Europe/Lisbon">Lisbon (GMT+0)</SelectItem>
                              <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createTournament.isPending}>
                {createTournament.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Draft
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
