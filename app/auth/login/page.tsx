// app/auth/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Eye, EyeClosed, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createUserProfile } from "@/services/profileService";

// -----------------------------
// Validation schemas
// -----------------------------

const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
});

const signInSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

type FormData = SignUpFormData | SignInFormData;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const isSignUp = mode === "signup";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(
      isSignUp ? signUpSchema : signInSchema
    ),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // -----------------------------
  // Handle email confirmation
  // -----------------------------

/*   useEffect(() => {
    const handleEmailConfirmation = async () => {
    
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        setIsConfirming(true);
        try {
         
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session) {
            setConfirmationStatus({
              type: 'success',
              message: 'Email confirmed successfully! Redirecting to dashboard...'
            });
            toast.success('Email confirmed successfully!');
            
           
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } else {
            
            const errorParam = new URLSearchParams(window.location.search).get('error');
            if (errorParam) {
              throw new Error('Invalid or expired confirmation link');
            }
          }
        } catch (error: any) {
          setConfirmationStatus({
            type: 'error',
            message: error.message || 'Failed to confirm email. Please try again.'
          });
          toast.error('Failed to confirm email');
        } finally {
          setIsConfirming(false);
        }
      }
    };

    handleEmailConfirmation();
  }, [router, supabase.auth]); */

  // -----------------------------
  // Email authentication
  // -----------------------------

const onSubmit = async (data: FormData) => {
  setErrorMessage("");
  setSuccessMessage("");

  try {
    if (isSignUp) {
      const signUpData = data as SignUpFormData;

      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            username: signUpData.username,
          },
          emailRedirectTo:
            `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "Account created successfully! Please check your email to verify your account."
      );

      reset();

      return;
    }

    const signInData = data as SignInFormData;

    const { error } =
      await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

    if (error) {
      if (
        error.message
          .toLowerCase()
          .includes("email not confirmed")
      ) {
        throw new Error(
          "Please verify your email before signing in. Check your inbox for the confirmation link."
        );
      }

      throw error;
    }

    router.push("/dashboard");

  } catch (error: any) {
    setErrorMessage(
      error?.message ||
        "Something went wrong. Please try again."
    );
  }
};

  // -----------------------------
  // Resend confirmation email
  // -----------------------------

/*   const handleResendConfirmation = async () => {
    const email = (document.getElementById('email') as HTMLInputElement)?.value;
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success('Confirmation email resent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend confirmation email');
    }
  }; */

  // -----------------------------
  // Google authentication
  // -----------------------------

  const handleGoogleLogin = async () => {
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  };

  // -----------------------------
  // Switch Login / Signup
  // -----------------------------

  const switchMode = () => {
    setMode(isSignUp ? "signin" : "signup");
    setErrorMessage("");
    setSuccessMessage("");
    setConfirmationStatus({ type: null, message: '' });
    reset({
      username: "",
      email: "",
      password: "",
    });
  };

  // -----------------------------
  // Show confirmation status
  // -----------------------------

  if (isConfirming) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirming your email...</p>
        </div>
      </main>
    );
  }

  if (confirmationStatus.type) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <Alert className={cn(
            confirmationStatus.type === 'success' 
              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
          )}>
            {confirmationStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={cn(
              confirmationStatus.type === 'success' 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            )}>
              {confirmationStatus.message}
            </AlertDescription>
          </Alert>
          
          {confirmationStatus.type === 'success' && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">You will be redirected automatically...</p>
            </div>
          )}
          
          {confirmationStatus.type === 'error' && (
            <Button 
              className="mt-4 w-full" 
              onClick={() => router.push('/auth/login')}
            >
              Back to Login
            </Button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <form
        className="w-full max-w-md space-y-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignUp
              ? "Create an account"
              : "Login to your account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? "Enter your information below to create your account."
              : "Enter your email and password to login."}
          </p>
        </div>

        <FieldGroup>
          {/* Username - Signup only */}
          {isSignUp && (
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="john_doe"
                {...register("username")}
              />
              {isSignUp && "username" in errors && errors.username && (
                <p className="text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </Field>
          )}

          {/* Email */}
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </Field>

          {/* Password */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              {!isSignUp && (
                <a
                  href="/auth/forgot-password"
                  className="text-sm underline underline-offset-4"
                >
                  Forgot your password?
                </a>
              )}
            </div>
            <div className="mt-1 relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={
                  isSignUp ? "new-password" : "current-password"
                }
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute right-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeClosed /> : <Eye />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </Field>

          {/* Error */}
          {errorMessage && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {errorMessage}
              {/* {errorMessage.includes("verify your email") && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="ml-2 underline font-medium hover:text-red-600"
                >
                  Resend confirmation email
                </button>
              )} */}
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className="rounded-md border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isSignUp
                ? "Creating account..."
                : "Signing in..."
              : isSignUp
                ? "Sign up"
                : "Sign in"}
          </Button>

          <FieldSeparator>Or continue with</FieldSeparator>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            {isSignUp
              ? "Sign up with Google"
              : "Login with Google"}
          </Button>

          {/* Switch mode */}
          <FieldDescription className="text-center">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-medium underline underline-offset-4"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={switchMode}
                  className="font-medium underline underline-offset-4"
                >
                  Sign up
                </button>
              </>
            )}
          </FieldDescription>
        </FieldGroup>
      </form>
    </main>
  );
}

// -----------------------------
// Google SVG Icon
// -----------------------------

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="mr-2"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.78-.07-1.54-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.5Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.59A5.86 5.86 0 0 1 6.23 12c0-.55.11-1.09.31-1.59V7.88H3.3A9.5 9.5 0 0 0 2.25 12c0 1.49.36 2.9 1.05 4.12l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 3.49 14.63 2.5 12 2.5a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53C7.31 8.1 9.46 6.38 12 6.38Z"
      />
    </svg>
  );
}