import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMyAchievementsProgress, tierColors, tierBorderColors } from "@/hooks/useAchievements";
import { 
  Trophy, Medal, Award, Crown, Flame, Users, Shield, 
  Gamepad2, Handshake, Lock, CheckCircle2, Coins
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  medal: Medal,
  award: Award,
  crown: Crown,
  flame: Flame,
  users: Users,
  shield: Shield,
  "gamepad-2": Gamepad2,
  handshake: Handshake,
};

const categoryLabels: Record<string, string> = {
  wins: "Vitórias",
  tournaments: "Torneios",
  matches: "Partidas",
  streaks: "Sequências",
  social: "Social",
  general: "Geral",
};

const tierLabels: Record<string, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  platinum: "Platina",
  diamond: "Diamante",
};

export default function Achievements() {
  const { all, unlocked, inProgress, locked } = useMyAchievementsProgress();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...new Set(all.map((a) => a.category))];

  const filteredAchievements = selectedCategory === "all" 
    ? all 
    : all.filter((a) => a.category === selectedCategory);

  const totalCoinsEarned = unlocked.reduce((sum, a) => sum + a.efa_coins_reward, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Conquistas</h1>
        <p className="text-muted-foreground">
          Complete desafios e ganhe EFA Coins
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{unlocked.length}</p>
            <p className="text-sm text-muted-foreground">Desbloqueadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{inProgress.length}</p>
            <p className="text-sm text-muted-foreground">Em Progresso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{locked.length}</p>
            <p className="text-sm text-muted-foreground">Bloqueadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Coins className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{totalCoinsEarned}</p>
            <p className="text-sm text-muted-foreground">Coins Ganhos</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">Todas</TabsTrigger>
          {categories.filter(c => c !== "all").map((category) => (
            <TabsTrigger key={category} value={category}>
              {categoryLabels[category] || category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const Icon = iconMap[achievement.icon] || Trophy;
              const progressPercent = Math.min(
                (achievement.progress / achievement.requirement_value) * 100,
                100
              );

              return (
                <Card 
                  key={achievement.id}
                  className={cn(
                    "relative overflow-hidden transition-all",
                    achievement.isUnlocked 
                      ? `border-2 ${tierBorderColors[achievement.tier]}` 
                      : "opacity-75"
                  )}
                >
                  {achievement.isUnlocked && (
                    <div className={cn(
                      "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20 bg-gradient-to-br",
                      tierColors[achievement.tier]
                    )} />
                  )}
                  
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0",
                        achievement.isUnlocked 
                          ? `bg-gradient-to-br ${tierColors[achievement.tier]}` 
                          : "bg-muted"
                      )}>
                        {achievement.isUnlocked ? (
                          <Icon className="h-7 w-7 text-white" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold truncate">{achievement.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {achievement.description}
                            </p>
                          </div>
                          {achievement.isUnlocked && (
                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {achievement.progress} / {achievement.requirement_value}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {tierLabels[achievement.tier]}
                            </Badge>
                          </div>
                          <Progress value={progressPercent} className="h-1.5" />
                        </div>

                        {/* Reward */}
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Coins className="h-3 w-3" />
                          <span>+{achievement.efa_coins_reward} EFA Coins</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma conquista nesta categoria</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
