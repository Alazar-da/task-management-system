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
      .select("id, username, email, avatar_url, created_at")
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
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
    
    // Upload directly to the bucket root
    const { error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from("profiles")
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error("Error in uploadAvatar:", error);
    throw error;
  }
},

async deleteAvatar(userId: string, avatarUrl?: string): Promise<void> {
  try {
    // If there's no avatar URL, nothing to delete
    if (!avatarUrl) {
      // Just update the profile to remove avatar_url
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;
      return;
    }

    // Extract the file name from the URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/profiles/avatar-userId-timestamp.ext
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Delete from storage using just the filename (since it's at the root of the bucket)
    const { error: storageError } = await supabase.storage
      .from("profiles")
      .remove([fileName]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue even if storage delete fails
    }

    // Update profile to remove avatar_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error("Error in deleteAvatar:", error);
    throw error;
  }
},

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    // First verify current password
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      throw new Error("Unable to verify current password");
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Current password is incorrect");
    }

    // If current password is correct, update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.message.includes("same as the old password")) {
        throw new Error("New password must be different from current password");
      }
      throw error;
    }
  },
};

// Query Hooks
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.detail(userId || ''),
    queryFn: () => userService.getProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
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
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      userService.updatePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update password");
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, avatarUrl }: { userId: string; avatarUrl?: string }) =>
      userService.deleteAvatar(userId, avatarUrl),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      toast.success("Avatar removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove avatar");
    },
  });
}