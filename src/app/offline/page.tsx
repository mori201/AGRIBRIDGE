import { WifiOff } from "lucide-react";

export const metadata = { title: "Hors connexion" };
export const dynamic = "force-static";

export default function Offline() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <WifiOff className="h-12 w-12 text-brand-600" />
      <h1 className="mt-4 text-2xl font-extrabold">Vous êtes hors connexion</h1>
      <p className="mt-2 text-muted">Cette page n&apos;est pas encore disponible hors ligne. Les pages publiques déjà consultées restent accessibles. Réessayez dès que le réseau revient.</p>
    </div>
  );
}
