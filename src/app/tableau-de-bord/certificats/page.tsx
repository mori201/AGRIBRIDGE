import type { Metadata } from "next";
import Link from "next/link";
import { Award } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Mes certificats" };

export default async function Page() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase.from("certificates").select("code,issued_at,score,courses(title,slug)").eq("user_id", profile.id).order("issued_at", { ascending: false });
  const rows = (data ?? []) as unknown as { code: string; issued_at: string; score: number | null; courses: { title: string; slug: string } }[];
  return (
    <div>
      <PageHeader title="Mes certificats" description="Chaque certificat possède un code unique vérifiable publiquement." />
      {rows.length === 0 ? (
        <EmptyState icon={Award} title="Aucun certificat pour l'instant" description="Terminez toutes les leçons d'une formation et réussissez son quiz pour obtenir votre certificat." action={<LinkButton href="/academy" variant="secondary">Voir les formations</LinkButton>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((c) => (
            <Link key={c.code} href={`/certificats/${c.code}`} className="surface flex gap-4 rounded-2xl border border-gold-300 p-4 hover:shadow-md">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700"><Award className="h-6 w-6" /></div>
              <div>
                <p className="font-bold">{c.courses.title}</p>
                <p className="text-sm text-muted">Délivré le {formatDate(c.issued_at)}{c.score ? ` · ${c.score}%` : ""}</p>
                <p className="mt-1 font-mono text-xs">Code : {c.code}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
