import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "./form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function Page() {
  await requireUser("/reinitialiser");
  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisissez un mot de passe robuste.">
      <ResetForm />
    </AuthShell>
  );
}
