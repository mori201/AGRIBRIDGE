import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "./form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function Page() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Recevez un lien de réinitialisation par e-mail." footer={<Link href="/connexion" className="font-semibold text-brand-700 underline">Retour à la connexion</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
