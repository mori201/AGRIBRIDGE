import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Compte suspendu" };

export default function Page() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <ShieldAlert className="h-12 w-12 text-red-600" />
      <h1 className="mt-4 text-2xl font-extrabold">Compte suspendu</h1>
      <p className="mt-2 text-muted">Votre compte a été suspendu par la modération. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez-nous.</p>
      <Link href="/contact" className="mt-6 rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white">Nous contacter</Link>
    </div>
  );
}
