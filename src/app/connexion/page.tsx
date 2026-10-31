import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./form";
import { getUser } from "@/lib/auth";
import { Notice } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Connexion" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; erreur?: string }> }) {
  const sp = await searchParams;
  if (await getUser()) redirect(sp.next?.startsWith("/") ? sp.next : "/tableau-de-bord");
  return (
    <AuthShell title="Connexion" subtitle="Heureux de vous revoir sur AgriBridge." footer={<>Pas encore de compte ? <Link className="font-semibold text-brand-700 underline" href="/inscription">Créer un compte</Link></>}>
      {sp.erreur === "lien" && <Notice tone="error" className="mb-4">Le lien est invalide ou a expiré.</Notice>}
      <LoginForm next={sp.next ?? ""} />
    </AuthShell>
  );
}
