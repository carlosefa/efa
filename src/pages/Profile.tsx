import { useState } from "react";
import {
  User,
  Mail,
  Globe,
  Clock,
  Camera,
  Save,
  Trophy,
  Swords,
  Medal,
  Shield,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useProfile,
  useUpdateProfile,
  useNotifications,
  useRankings,
} from "@/hooks/useProfile";
import { useMyTeams } from "@/hooks/useTeams";
import { Link } from "react-router-dom";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50),
  bio: z.string().max(200, "Bio must be at most 200 characters").optional(),
  country_code: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const timezones = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "Europe/Lisbon", label: "Lisbon (GMT+0)" },
  { value: "UTC", label: "UTC" },
];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");

  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: myTeams } = useMyTeams();
  const { data: rankings } = useRankings();
  const { data: notifications } = useNotifications();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      username: profile?.username || "",
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      country_code: profile?.country_code || "",
      timezone: profile?.timezone || "America/Sao_Paulo",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    if (!user) return;

    try {
      await updateProfile.mutateAsync(data);

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.read_at).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your information and settings
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/20 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {profile?.display_name?.charAt(0) ||
                    profile?.username?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">
                {profile?.display_name || profile?.username}
              </h2>
              <p className="text-muted-foreground">@{profile?.username}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <Badge variant="secondary">
                  <Trophy className="h-3 w-3 mr-1" />
                  {rankings?.length || 0} rankings
                </Badge>
                <Badge variant="outline">
                  <Shield className="h-3 w-3 mr-1" />
                  {myTeams?.length || 0} teams
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="teams">My Teams</TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-xs rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="your_username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a bit about yourself..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="country_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BR">🇧🇷 Brazil</SelectItem>
                              <SelectItem value="PT">🇵🇹 Portugal</SelectItem>
                              <SelectItem value="US">🇺🇸 United States</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Zone</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateProfile.isPending}>
                      {updateProfile.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{user?.email}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since:</span>
                <span>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US")
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Stats and Rankings</CardTitle>
              <CardDescription>Your performance in games</CardDescription>
            </CardHeader>
            <CardContent>
              {rankings && rankings.length > 0 ? (
                <div className="space-y-4">
                  {rankings.map((rank) => (
                    <div
                      key={rank.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">
                          {(rank as any).game_modes?.name || "Game"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rank.matches_played} matches
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {Math.round(Number(rank.rating))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rank.wins}W / {rank.losses}L (
                          {rank.matches_played > 0
                            ? Math.round((rank.wins / rank.matches_played) * 100)
                            : 0}
                          %)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Medal className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    You don’t have any rankings yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Join tournaments to climb the leaderboard!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>My Teams</CardTitle>
              <CardDescription>Teams you are part of</CardDescription>
            </CardHeader>
            <CardContent>
              {myTeams && myTeams.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myTeams.map((team) => (
                    <Link
                      key={team.id}
                      to={`/teams/${team.id}`}
                      className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                          {team.tag?.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-muted-foreground">[{team.tag}]</p>
                      </div>
                      {team.owner_id === user?.id && (
                        <Badge variant="secondary" className="ml-auto">
                          Owner
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    You are not part of any team
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/teams">View Teams</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Your recent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border ${
                        notif.read_at
                          ? "border-border bg-muted/20"
                          : "border-primary/30 bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notif.title}</p>
                          {notif.body && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {notif.body}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleDateString("en-US")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
