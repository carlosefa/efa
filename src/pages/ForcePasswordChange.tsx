import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import efaLogo from "@/assets/efa-esports-logo.png";

const passwordChangeSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export default function ForcePasswordChange() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const handlePasswordChange = async (data: PasswordChangeFormData) => {
    setIsLoading(true);

    try {
      // Update password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (passwordError) throw passwordError;

      // Update user metadata to remove must_change_password flag
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { must_change_password: false },
      });

      if (metadataError) throw metadataError;

      toast({
        title: "Password updated!",
        description: "Your password was updated successfully.",
      });
      navigate("/dashboard");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update password";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-warning/10 via-background to-primary/10" />

      <Card className="w-full max-w-md relative z-10 border-warning/50">
        <CardHeader className="text-center">
          <img
            src={efaLogo}
            alt="EFA Esports"
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-warning" />
            <CardTitle className="text-2xl">Change Password</CardTitle>
          </div>
          <CardDescription>
            For security reasons, you must set a new password before continuing.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-sm text-warning-foreground">
              <strong>Password requirements:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Minimum 8 characters</li>
              <li>• Maximum 128 characters</li>
              <li>• At least one uppercase letter</li>
              <li>• At least one lowercase letter</li>
              <li>• At least one number</li>
              <li>• At least one special character</li>
            </ul>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handlePasswordChange)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password and Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
