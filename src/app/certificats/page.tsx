import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Vérifier un certificat" };

export default async function Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (code && /^[A-Za-z0-9]{6,12}$/.test(code.trim())) redirect(`/certificats/${code.trim().toUpperCase()}`);
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <Award className="mx-auto h-12 w-12 text-gold-600" />
      <h1 className="mt-3 text-2xl font-extrabold">Vérifier un certificat AgriAcademy</h1>
      <p className="mt-1 text-muted">Saisissez le code inscrit sur le certificat.</p>
      <form className="mt-6 flex gap-2" action="/certificats">
        <Input name="code" placeholder="Ex. 3F9A1C2B7D" aria-label="Code du certificat" required pattern="[A-Za-z0-9]{6,12}" />
        <Button type="submit">Vérifier</Button>
      </form>
    </div>
  );
}
