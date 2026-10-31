import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

const PROTECTED = ["/tableau-de-bord", "/partenaire", "/admin", "/onboarding"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Rafraîchit la session si nécessaire (écrit les nouveaux cookies sur la réponse).
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user ?? null;
  const hasSessionCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  // Une erreur réseau transitoire ne doit pas déconnecter l'utilisateur : on ne redirige que si
  // aucune session n'existe (pas de cookie) ou si Supabase confirme qu'elle est invalide.
  const definitelyAnonymous = !hasSessionCookie || (!user && error?.status !== undefined && error.status >= 400 && error.status < 500);

  const path = request.nextUrl.pathname;
  if (definitelyAnonymous && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}
