// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useProfile, useUpdateProfile, useUploadAvatar, useUpdatePassword, useDeleteAvatar } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import {
  User,
  Mail,
  Camera,
  Lock,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Form schemas
const profileSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters").max(30, "Username must be less than 30 characters"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user: currentUser, loading: userLoading, refetch: userRefetch } = useUser();
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteAvatarDialogOpen, setIsDeleteAvatarDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // TanStack Query hooks
  const { data: user, isLoading: profileLoading, refetch } = useProfile(currentUser?.id);
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const updatePasswordMutation = useUpdatePassword();
  const deleteAvatarMutation = useDeleteAvatar();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when user loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        username: user.username || "",
      });
    }
  }, [user, profileForm]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push("/auth/login");
    }
  }, [currentUser, userLoading, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Avatar image must be less than 2MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatarFile = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleDeleteAvatar = async () => {
    if (!user) return;

    setIsDeletingAvatar(true);
    try {
      await deleteAvatarMutation.mutateAsync({
        userId: user.id,
        avatarUrl: user.avatar_url || undefined,
      });

      // Update local state
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsDeleteAvatarDialogOpen(false);
      
      await refetch();
      await userRefetch();
      toast.success("Avatar removed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove avatar");
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!user) return;

    try {
      let avatarUrl = user.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const result = await uploadAvatarMutation.mutateAsync({
          file: avatarFile,
          userId: user.id,
        });
        avatarUrl = result;
      }

      // Update profile
      await updateProfileMutation.mutateAsync({
        userId: user.id,
        updates: {
          username: values.username,
          avatar_url: avatarUrl,
        },
      });

      setAvatarFile(null);
      setAvatarPreview(null);
      await refetch();
      await userRefetch();
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) {
        toast.error("Unable to verify current password");
        setIsUpdatingPassword(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: values.currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        setIsUpdatingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        if (error.message.includes("same as the old password")) {
          toast.error("New password must be different from current password");
        } else {
          throw error;
        }
      } else {
        toast.success("Password updated successfully!");
        passwordForm.reset();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeletingAccount(true);
    try {
      const supabase = createClient();
      
      // Delete avatar from storage if exists
      if (user?.avatar_url) {
        const filePath = user.avatar_url.split('/').pop();
        if (filePath) {
          await supabase.storage.from("profiles").remove([`avatars/${filePath}`]);
        }
      }
      

      const { error: deleteProfileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user!.id);

      if (deleteProfileError) throw deleteProfileError;

      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const isUpdating = updateProfileMutation.isPending || uploadAvatarMutation.isPending;

  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container max-w-6xl py-8 px-4 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || user.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-primary/10">
                      {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Avatar actions overlay */}
                  <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
                    <label
                      htmlFor="avatar-upload"
                      className={cn(
                        "p-1.5 bg-primary text-white rounded-full cursor-pointer transition-colors shadow-lg",
                        isUpdating ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
                      )}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Camera className="h-3 w-3" />
                      )}
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={isUpdating}
                      />
                    </label>
                    
                    {user.avatar_url && !avatarFile && (
                      <button
                        onClick={() => setIsDeleteAvatarDialogOpen(true)}
                        className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        title="Remove avatar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                <h3 className="mt-4 text-lg font-semibold">{user.username || "User"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>

              {/* Avatar preview info */}
              {avatarFile && (
                <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    New avatar selected: {avatarFile.name}
                  </p>
                  <button
                    onClick={handleRemoveAvatarFile}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Remove selected
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <nav className="space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <a className="flex items-center gap-2" href="#profile">
                    <User className="h-4 w-4" />
                    Profile
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <a className="flex items-center gap-2" href="#password">
                    <Lock className="h-4 w-4" />
                    Password
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40">
                  <a className="flex items-center gap-2" href="#danger">
                    <Trash2 className="h-4 w-4" />
                    Danger Zone
                  </a>
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Profile Section */}
          <Card id="profile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your profile information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="username">Username</FieldLabel>
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      {...profileForm.register("username")}
                      className={cn(
                        profileForm.formState.errors.username && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-500 mt-1">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                    <FieldDescription>
                      This is your public display name
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{user.email}</span>
                      <Badge variant="outline" className="ml-auto">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </Field>

                  {avatarFile && (
                    <Alert>
                      <AlertDescription>
                        New avatar ready to upload. Click save to update.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isUpdating} className="gap-2">
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </form>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card id="password">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        {...passwordForm.register("currentPassword")}
                        className={cn(
                          "pr-10",
                          passwordForm.formState.errors.currentPassword && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        {...passwordForm.register("newPassword")}
                        className={cn(
                          "pr-10",
                          passwordForm.formState.errors.newPassword && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.newPassword ? (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    ) : (
                      <FieldDescription>
                        Password must be at least 6 characters
                      </FieldDescription>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        {...passwordForm.register("confirmPassword")}
                        className={cn(
                          "pr-10",
                          passwordForm.formState.errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </Field>

                  <Button type="submit" disabled={isUpdatingPassword} className="gap-2">
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card id="danger" className="border-red-200 dark:border-red-900">
            <CardHeader className="text-red-600 dark:text-red-400">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-600/70 dark:text-red-400/70">
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-900">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                      Delete Account
                    </h4>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70 mt-1">
                      This action cannot be undone. All your data, tasks, and projects will be permanently deleted.
                    </p>
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                      <DialogTrigger>
                        <Button variant="destructive" className="mt-4 gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Please type <strong>DELETE</strong> to confirm.
                            </AlertDescription>
                          </Alert>
                          <Input
                            placeholder="Type DELETE to confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="border-red-300 dark:border-red-700"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsDeleteDialogOpen(false);
                              setDeleteConfirmText("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={deleteConfirmText !== "DELETE" || isDeletingAccount}
                            onClick={handleDeleteAccount}
                          >
                            {isDeletingAccount ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Account"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Avatar Confirmation Dialog */}
      <Dialog open={isDeleteAvatarDialogOpen} onOpenChange={setIsDeleteAvatarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Avatar?</DialogTitle>
            <DialogDescription>
              This will remove your current profile picture. You can upload a new one later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAvatarDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAvatar}
              disabled={isDeletingAvatar}
            >
              {isDeletingAvatar ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Avatar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}