"use client";

import { useState } from "react";
import { cn } from "@/utils/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {Eye, EyeClosed} from "lucide-react"; 

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";

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
  const supabase = createClient();

  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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

          // Store username inside Supabase Auth metadata.
          options: {
            data: {
              username: signUpData.username,
            },
          },
        });

        if (error) {
          throw error;
        }

        setSuccessMessage(
          "Account created successfully. Please check your email to verify your account."
        );

        reset();
      } else {
        const signInData = data as SignInFormData;

        const { error } = await supabase.auth.signInWithPassword({
          email: signInData.email,
          password: signInData.password,
        });

        if (error) {
          throw error;
        }

        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Something went wrong. Please try again."
      );
    }
  };

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

    reset({
      username: "",
      email: "",
      password: "",
    });
  };

  return (
    <main
      className={cn(
        "flex min-h-screen items-center justify-center px-4 py-24"
      )}
    >
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
              <FieldLabel htmlFor="username">
                Username
              </FieldLabel>

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
            <FieldLabel htmlFor="email">
              Email
            </FieldLabel>

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
              <FieldLabel htmlFor="password">
                Password
              </FieldLabel>

              {!isSignUp && (
                <a
                  href="/forgot-password"
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