import type { Metadata } from "next";
import { ShieldCheck, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "@/components/layout/logo";
import { formatDate } from "@/lib/format";
import { PrintButton } from "./print";

export const metadata: Metadata = { title: "Certificat AgriAcademy", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data } = /^[A-Za-z0-9]{6,12}$/.test(code) ? await supabase.rpc("verify_certificate", { p_code: code }) : { data: null };
  const cert = data?.[0];
  if (!cert) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-3 text-2xl font-extrabold">Certificat introuvable</h1>
        <p className="mt-1 text-muted">Aucun certificat ne correspond au code « {code} ».</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-700"><ShieldCheck className="h-5 w-5" /> Certificat authentique délivré par AgriBridge</p>
        <PrintButton />
      </div>
      <div className="relative overflow-hidden rounded-3xl border-4 border-double border-gold-500 bg-white p-8 text-center text-[#13261a] sm:p-12">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-brand-700 via-gold-500 to-brand-700" />
        <LogoMark className="mx-auto h-14 w-14" />
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">AgriAcademy</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Certificat de réussite</h1>
        <p className="mt-6 text-gray-600">Ce certificat atteste que</p>
        <p className="mt-2 text-2xl font-bold sm:text-3xl">{cert.full_name}</p>
        <p className="mt-4 text-gray-600">a suivi avec succès l&apos;ensemble des leçons et réussi l&apos;évaluation de la formation</p>
        <p className="mt-2 text-xl font-bold text-brand-800">« {cert.course_title} »</p>
        {cert.score ? <p className="mt-2 text-sm text-gray-600">Score obtenu : {cert.score}%</p> : null}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">
          <p>Délivré le {formatDate(cert.issued_at)}</p>
          <p>Code de vérification : <strong className="font-mono text-[#13261a]">{cert.code}</strong></p>
        </div>
      </div>
    </div>
  );
}
