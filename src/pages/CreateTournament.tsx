import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Trophy,
  Gamepad2,
  Settings2,
  Calendar,
  Users,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
} from "lucide-react";
import { useGames, useGameModes, useRulesets, useCountries } from "@/hooks/useGames";
import { useCreateTournament } from "@/hooks/useTournaments";
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

const steps = [
  { id: 1, title: "Jogo", icon: Gamepad2 },
  { id: 2, title: "Formato", icon: Settings2 },
  { id: 3, title: "Detalhes", icon: Trophy },
  { id: 4, title: "Datas", icon: Calendar },
];

const formats = [
  { value: "league", label: "Liga", description: "Todos jogam contra todos" },
  { value: "knockout", label: "Mata-mata", description: "Eliminação direta" },
  { value: "groups", label: "Grupos", description: "Fase de grupos" },
  { value: "groups_playoffs", label: "Grupos + Playoffs", description: "Grupos com mata-mata final" },
  { value: "swiss", label: "Suíço", description: "Pareamento por pontuação" },
];

const tournamentSchema = z.object({
  // Step 1
  game_id: z.string().min(1, "Selecione um jogo"),
  game_mode_id: z.string().min(1, "Selecione um modo"),
  // Step 2
  format: z.enum(["league", "knockout", "groups", "groups_playoffs", "swiss"]),
  max_teams: z.number().min(2).max(128),
  ruleset_id: z.string().optional(),
  // Step 3
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  description: z.string().max(500).optional(),
  prize_description: z.string().max(200).optional(),
  country_id: z.string().optional(),
  // Step 4
  registration_starts_at: z.string().optional(),
  registration_ends_at: z.string().optional(),
  starts_at: z.string().optional(),
  timezone: z.string().default("America/Sao_Paulo"),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function CreateTournament() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const createTournament = useCreateTournament();

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      game_id: "",
      game_mode_id: "",
      format: "league",
      max_teams: 16,
      name: "",
      slug: "",
      description: "",
      prize_description: "",
      timezone: "America/Sao_Paulo",
    },
  });

  const selectedGameId = form.watch("game_id");
  const selectedGameModeId = form.watch("game_mode_id");

  const { data: games } = useGames();
  const { data: gameModes } = useGameModes(selectedGameId);
  const { data: rulesets } = useRulesets(selectedGameModeId);
  const { data: countries } = useCountries();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: TournamentFormData) => {
    try {
      const tournament = await createTournament.mutateAsync({
        name: data.name,
        slug: data.slug,
        description: data.description,
        game_mode_id: data.game_mode_id,
        ruleset_id: data.ruleset_id,
        format: data.format,
        max_teams: data.max_teams,
        prize_description: data.prize_description,
        starts_at: data.starts_at,
        registration_starts_at: data.registration_starts_at,
        registration_ends_at: data.registration_ends_at,
        timezone: data.timezone,
        country_id: data.country_id,
      });

      toast({
        title: "Torneio criado!",
        description: `${data.name} foi criado com sucesso.`,
      });

      navigate(`/tournaments/${tournament.id}`);
    } catch (error: any) {
      toast({
        title: "Erro ao criar torneio",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Criar Torneio
        </h1>
        <p className="text-muted-foreground">Configure seu torneio passo a passo</p>
      </div>

      {/* Progress */}
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
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
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
              <CardTitle>
                {currentStep === 1 && "Escolha o Jogo"}
                {currentStep === 2 && "Formato do Torneio"}
                {currentStep === 3 && "Detalhes do Torneio"}
                {currentStep === 4 && "Datas e Inscrições"}
              </CardTitle>
              <CardDescription>
                {currentStep === 1 && "Selecione o jogo e o modo de jogo"}
                {currentStep === 2 && "Configure o formato e número de times"}
                {currentStep === 3 && "Nome, descrição e premiação"}
                {currentStep === 4 && "Defina as datas do torneio"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Game */}
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="game_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jogo</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("game_mode_id", "");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o jogo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {games?.map((game) => (
                              <SelectItem key={game.id} value={game.id}>
                                {game.name}
                              </SelectItem>
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
                          <FormLabel>Modo de Jogo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o modo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {gameModes?.map((mode) => (
                                <SelectItem key={mode.id} value={mode.id}>
                                  {mode.name} ({mode.team_size}v{mode.team_size})
                                </SelectItem>
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

              {/* Step 2: Format */}
              {currentStep === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                          >
                            {formats.map((format) => (
                              <Label
                                key={format.value}
                                className={cn(
                                  "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                                  field.value === format.value
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                )}
                              >
                                <RadioGroupItem value={format.value} />
                                <div>
                                  <p className="font-medium">{format.label}</p>
                                  <p className="text-xs text-muted-foreground">{format.description}</p>
                                </div>
                              </Label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_teams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Times</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(parseInt(v))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[4, 8, 12, 16, 20, 24, 32, 48, 64, 128].map((n) => (
                              <SelectItem key={n} value={n.toString()}>
                                {n} times
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {rulesets && rulesets.length > 0 && (
                    <FormField
                      control={form.control}
                      name="ruleset_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Regras</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione as regras (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rulesets.map((ruleset) => (
                                <SelectItem key={ruleset.id} value={ruleset.id}>
                                  {ruleset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Regras pré-configuradas para o modo selecionado
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Torneio</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Liga EAFC Brasil - Série A"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (!form.getValues("slug")) {
                                form.setValue("slug", generateSlug(e.target.value));
                              }
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
                        <FormLabel>URL Amigável</FormLabel>
                        <FormControl>
                          <Input placeholder="liga-eafc-brasil" {...field} />
                        </FormControl>
                        <FormDescription>
                          Será usado na URL: /tournaments/{field.value || "slug"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o torneio..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prize_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premiação</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: R$ 1.000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries?.map((country) => (
                                <SelectItem key={country.id} value={country.id}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Step 4: Dates */}
              {currentStep === 4 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="registration_starts_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Início das Inscrições</FormLabel>
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
                          <FormLabel>Fim das Inscrições</FormLabel>
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
                        <FormLabel>Início do Torneio</FormLabel>
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
                        <FormLabel>Fuso Horário</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                            <SelectItem value="Europe/Lisbon">Lisboa (GMT+0)</SelectItem>
                            <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createTournament.isPending}>
                {createTournament.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Torneio
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
