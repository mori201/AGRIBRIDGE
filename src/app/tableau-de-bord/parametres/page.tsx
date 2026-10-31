import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccount, ExportData, NotificationPrefs } from "./client";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata: Metadata = { title: "Paramètres du compte" };

export default async function Page() {
  const { profile, user } = await requireUser();
  return (
    <div className="space-y-5">
      <PageHeader title="Paramètres du compte" />
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent><NotificationPrefs email={profile.notify_email} deadlines={profile.notify_deadlines} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Affichage</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between text-sm"><span>Mode sombre</span><ThemeToggle /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Sécurité</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Connecté en tant que <strong>{user.email}</strong>. Dernière connexion : {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("fr-FR") : "—"}</p>
          <Link href="/mot-de-passe-oublie" className="font-semibold text-brand-700 underline">Changer mon mot de passe</Link>
          <form action="/auth/signout" method="post"><button className="font-semibold text-red-600 underline">Se déconnecter</button></form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Mes données personnelles</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted">Téléchargez une copie de toutes les données associées à votre compte (format JSON). Voir notre <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.</p>
          <ExportData />
        </CardContent>
      </Card>
      <Card className="border-red-200">
        <CardHeader><CardTitle className="text-red-700">Supprimer mon compte</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted">Action irréversible : votre profil, vos candidatures, documents, annonces, publications et messages seront définitivement supprimés.</p>
          {profile.role === "admin" ? <p className="text-muted">Un compte administrateur ne peut pas être supprimé depuis cette page.</p> : <DeleteAccount />}
        </CardContent>
      </Card>
    </div>
  );
}
