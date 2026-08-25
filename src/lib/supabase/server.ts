import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

// Server-side Supabase client for Server Components, Route Handlers and
// Server Actions. Reads/writes the session through Next.js cookies, so RLS
// sees the signed-in user on every request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called from a Server Component during render, where
            // cookies can't be written. Safe to ignore — the middleware
            // below refreshes the session on every request instead.
          }
        },
      },
    },
  );
}
