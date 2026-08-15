// services/userService.ts
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types/user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "react-hot-toast";

const supabase = createClient();

// Fetch functions
export const userService = {
  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, email, avatar_url, role, created_at")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);
    return data.publicUrl;
  },

  async deleteAvatar(userId: string): Promise<void> {
    const fileName = `${userId}/avatar`;
    const { error } = await supabase.storage
      .from("profiles")
      .remove([`avatars/${fileName}`]);

    if (error) throw error;
  },

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};

// Query Hooks
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId || ''),
    queryFn: () => userService.getProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      userService.updateProfile(userId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, userId }: { file: File; userId: string }) =>
      userService.uploadAvatar(file, userId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(userId) });
      toast.success("Avatar updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload avatar");
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (newPassword: string) => userService.updatePassword(newPassword),
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update password");
    },
  });
}