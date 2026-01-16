import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UploadOptions {
  bucket: "avatars" | "team-logos";
  path: string;
  onSuccess?: (url: string) => void;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadImage = async (file: File, options: UploadOptions): Promise<string | null> => {
    const { bucket, path, onSuccess } = options;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB",
        variant: "destructive",
      });
      return null;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Use apenas JPG, PNG, WebP ou GIF",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      setProgress(100);
      
      toast({
        title: "Upload concluído!",
        description: "Imagem enviada com sucesso.",
      });

      onSuccess?.(publicUrl);
      return publicUrl;

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const updateAvatar = async (file: File, userId: string) => {
    const url = await uploadImage(file, {
      bucket: "avatars",
      path: userId,
      onSuccess: async (url) => {
        // Update profile with new avatar URL
        await supabase
          .from("profiles")
          .update({ avatar_url: url })
          .eq("id", userId);

        queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      },
    });
    return url;
  };

  const updateTeamLogo = async (file: File, teamId: string) => {
    const url = await uploadImage(file, {
      bucket: "team-logos",
      path: teamId,
      onSuccess: async (url) => {
        // Update team with new logo URL
        await supabase
          .from("teams")
          .update({ logo_url: url })
          .eq("id", teamId);

        queryClient.invalidateQueries({ queryKey: ["team", teamId] });
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        queryClient.invalidateQueries({ queryKey: ["my_teams"] });
      },
    });
    return url;
  };

  return {
    uploadImage,
    updateAvatar,
    updateTeamLogo,
    isUploading,
    progress,
  };
}
