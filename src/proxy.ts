import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Keeps the Supabase session cookie fresh on every request, and does the
// coarse route gate: signed-out users bounce to /login, signed-in users
// bounce away from /login. Fine-grained role checks (docente vs directivo)
// happen in each route group's layout, backed by Row Level Security either
// way — this proxy (Next.js 16's renamed middleware) is convenience, not the
// security boundary.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");
  const isPublicAsset = path.startsWith("/_next") || path.startsWith("/favicon");
  // /auth/* handles invite & recovery links: Supabase redirects the browser
  // here with the session token in the URL *fragment*, which never reaches
  // this server-side check. Gating this route on `user` would bounce the
  // link to /login before the client JS gets a chance to read the fragment
  // and establish the session, so it's exempted like /login itself.
  const isAuthCallback = path.startsWith("/auth/");

  if (!user && !isAuthRoute && !isPublicAsset && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
