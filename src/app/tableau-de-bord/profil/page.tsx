import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { PageHeader, Progress } from "@/components/ui/misc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { profileCompletion } from "@/lib/queries";
import { AvatarForm, ProfileForm } from "./client";

export const metadata: Metadata = { title: "Mon profil" };

export default async function Page() {
  const { profile, user } = await requireUser();
  const c = profileCompletion(profile);
  return (
    <div className="space-y-5">
      <PageHeader title="Mon profil" description="Un profil complet améliore la pertinence de vos recommandations." />
      <Card className="p-5">
        <div className="flex justify-between text-sm font-semibold"><span>Complétude du profil</span><span>{c.percent}%</span></div>
        <Progress value={c.percent} className="mt-2" />
        {c.missing.length > 0 && <p className="mt-2 text-xs text-muted">À compléter : {c.missing.join(", ")}</p>}
      </Card>
      <Card>
        <CardHeader><CardTitle>Photo de profil</CardTitle></CardHeader>
        <CardContent><AvatarForm name={profile.full_name} avatar={profile.avatar_url} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted">E-mail du compte : <strong>{user.email}</strong></p>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
