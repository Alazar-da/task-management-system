import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if the user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // User is not logged in
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/login", request.url)
    );
  }
  

  // User is logged in
  return response;
}

export const config = {
  matcher: [
    /*
     * Protect application pages.
     * Auth pages, API routes, static files, etc. are excluded.
     */
    "/((?!auth|api|_next/static|_next/image|favicon.ico).*)",
  ],
};

