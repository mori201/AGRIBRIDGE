"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <AlertTriangle className="h-12 w-12 text-gold-600" />
      <h1 className="mt-4 text-2xl font-extrabold">Une erreur est survenue</h1>
      <p className="mt-2 text-muted">Vérifiez votre connexion puis réessayez.</p>
      <Button className="mt-6" onClick={reset}>Réessayer</Button>
    </div>
  );
}
