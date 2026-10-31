import { Sprout } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <Sprout className="h-12 w-12 text-brand-600" />
      <h1 className="mt-4 text-2xl font-extrabold">Page introuvable</h1>
      <p className="mt-2 text-muted">Cette page n&apos;existe pas ou a été déplacée.</p>
      <div className="mt-6 flex gap-2"><LinkButton href="/">Accueil</LinkButton><LinkButton href="/opportunites" variant="outline">Opportunités</LinkButton></div>
    </div>
  );
}
