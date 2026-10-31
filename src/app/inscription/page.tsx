import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "./form";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function Page({ searchParams }: { searchParams: Promise<{ profil?: string }> }) {
  if (await getUser()) redirect("/tableau-de-bord");
  const sp = await searchParams;
  return (
    <AuthShell title="Rejoindre AgriBridge" subtitle="Gratuit, en moins de 2 minutes." footer={<>Déjà inscrit ? <Link className="font-semibold text-brand-700 underline" href="/connexion">Se connecter</Link></>}>
      <RegisterForm defaultRole={sp.profil ?? "agripreneur"} />
    </AuthShell>
  );
}
