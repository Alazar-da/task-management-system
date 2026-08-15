// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useProfile, useUpdateProfile, useUploadAvatar, useUpdatePassword } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
  FieldSeparator,
} from "@/components/ui/field";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import {
  User,
  Mail,
  Camera,
  Bell,
  Lock,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
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
  const { user: currentUser, loading, userRefetch } = useUser();
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    projectUpdates: false,
  });

  // TanStack Query hooks
  const { data: user, isLoading, refetch } = useProfile(currentUser?.id);
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const updatePasswordMutation = useUpdatePassword();

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
    if (!loading && !currentUser) {
      router.push("/auth/login");
    }
  }, [currentUser, loading, router]);

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
      refetch();
      await userRefetch();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      await updatePasswordMutation.mutateAsync(values.newPassword);
      passwordForm.reset();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;

    try {
      const supabase = createClient();
      
      // Delete avatar from storage
      if (user?.avatar_url) {
        const filePath = user.avatar_url.split('/').slice(-2).join('/');
        await supabase.storage.from("profiles").remove([filePath]);
      }

      // Delete profile
      const { error: deleteProfileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user!.id);

      if (deleteProfileError) throw deleteProfileError;

      // Sign out
      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} ${!notificationSettings[key] ? 'enabled' : 'disabled'}`);
  };

  const isUpdating = updateProfileMutation.isPending || uploadAvatarMutation.isPending;
  const isUpdatingPassword = updatePasswordMutation.isPending;

  if (loading || isLoading) {
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
                  <label
                    htmlFor="avatar-upload"
                    className={cn(
                      "absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer transition-colors shadow-lg",
                      isUpdating ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/90"
                    )}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
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
                </div>
                <h3 className="mt-4 text-lg font-semibold">{user.username || "User"}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                <Badge variant="secondary" className="mt-2 capitalize">
                  {user.role || "User"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <nav className="space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <a href="#profile">
                    <User className="h-4 w-4" />
                    Profile
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <a href="#notifications">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <a href="#password">
                    <Lock className="h-4 w-4" />
                    Password
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40">
                  <a href="#danger">
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

          {/* Notifications Section */}
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel className="font-medium">Email Notifications</FieldLabel>
                  <FieldDescription>
                    Receive notifications via email
                  </FieldDescription>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationToggle("emailNotifications")}
                />
              </div>
              <FieldSeparator />
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel className="font-medium">Push Notifications</FieldLabel>
                  <FieldDescription>
                    Receive push notifications in browser
                  </FieldDescription>
                </div>
                <Switch
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={() => handleNotificationToggle("pushNotifications")}
                />
              </div>
              <FieldSeparator />
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel className="font-medium">Task Reminders</FieldLabel>
                  <FieldDescription>
                    Get reminders for upcoming tasks
                  </FieldDescription>
                </div>
                <Switch
                  checked={notificationSettings.taskReminders}
                  onCheckedChange={() => handleNotificationToggle("taskReminders")}
                />
              </div>
              <FieldSeparator />
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel className="font-medium">Project Updates</FieldLabel>
                  <FieldDescription>
                    Receive updates about project changes
                  </FieldDescription>
                </div>
                <Switch
                  checked={notificationSettings.projectUpdates}
                  onCheckedChange={() => handleNotificationToggle("projectUpdates")}
                />
              </div>
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
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      {...passwordForm.register("currentPassword")}
                      className={cn(
                        passwordForm.formState.errors.currentPassword && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      {...passwordForm.register("newPassword")}
                      className={cn(
                        passwordForm.formState.errors.newPassword && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
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
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      {...passwordForm.register("confirmPassword")}
                      className={cn(
                        passwordForm.formState.errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
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
                            disabled={deleteConfirmText !== "DELETE"}
                            onClick={handleDeleteAccount}
                          >
                            Delete Account
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
    </div>
  );
}