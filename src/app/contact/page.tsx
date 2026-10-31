import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "./form";

export const metadata: Metadata = { title: "Contact" };

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from("platform_settings").select("value").eq("key", "general").maybeSingle();
  const email = (data?.value as { contact_email?: string } | undefined)?.contact_email;
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-[1fr_1.3fr]">
      <div>
        <h1 className="text-3xl font-extrabold">Contactez-nous</h1>
        <p className="mt-3 text-muted">Une question, un partenariat, un signalement ou une demande d&apos;accès premium ? Écrivez-nous, nous répondons par e-mail.</p>
        <ul className="mt-6 space-y-3 text-sm">
          {email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-600" /> <a href={`mailto:${email}`} className="underline">{email}</a></li>}
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-600" /> Dakar, Sénégal</li>
        </ul>
      </div>
      <div className="surface rounded-2xl border border-base p-5"><ContactForm /></div>
    </div>
  );
}
