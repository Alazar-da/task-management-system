// app/auth/callback/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/auth/login?error=missing_code",
        requestUrl.origin
      )
    );
  }

  const supabase = await createClient();

  try {
    const { data, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);

      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      );
    }

    const user = data.user;

    if (!user) {
      return NextResponse.redirect(
        new URL(
          "/auth/login?error=no_user",
          requestUrl.origin
        )
      );
    }

    // ----------------------------------------
    // Check whether profile already exists
    // ----------------------------------------

    const { data: existingProfile, error: profileCheckError } =
      await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (profileCheckError) {
      console.error(
        "Profile check error:",
        profileCheckError
      );
    }

    // ----------------------------------------
    // Create profile if it doesn't exist
    // ----------------------------------------

    if (!existingProfile) {
      const username =
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";

      const { error: profileInsertError } =
        await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            username,
            avatar_url: null,
          });

      if (profileInsertError) {
        console.error(
          "Profile creation error:",
          profileInsertError
        );
      }
    }

    // ----------------------------------------
    // Redirect
    // ----------------------------------------

    if (next === "/auth/reset-password") {
      return NextResponse.redirect(
        new URL(
          "/auth/reset-password",
          requestUrl.origin
        )
      );
    }

    return NextResponse.redirect(
      new URL("/dashboard", requestUrl.origin)
    );
  } catch (error: any) {
    console.error("Auth callback error:", error);

    return NextResponse.redirect(
      new URL(
        `/auth/login?error=${encodeURIComponent(
          error?.message || "unknown_error"
        )}`,
        requestUrl.origin
      )
    );
  }
}