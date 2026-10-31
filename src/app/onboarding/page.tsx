import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Bienvenue — complétez votre profil" };

export default async function Page() {
  const { profile, user } = await requireUser("/onboarding");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <OnboardingWizard
        initial={{
          full_name: profile.full_name || (user.user_metadata?.full_name as string) || "",
          role: profile.role === "admin" ? "agripreneur" : profile.role,
          region: profile.region,
          sectors: profile.sectors ?? [],
          experience_level: profile.experience_level,
          project_type: profile.project_type,
          funding_need: profile.funding_need,
          funding_amount: profile.funding_amount,
          project_stage: profile.project_stage,
          preferred_language: profile.preferred_language,
          phone: profile.phone,
          bio: profile.bio,
        }}
        isAdmin={profile.role === "admin"}
      />
    </div>
  );
}
