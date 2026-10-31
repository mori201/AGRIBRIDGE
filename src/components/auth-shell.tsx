import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { SLOGAN } from "@/lib/constants";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <div className="hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-10 text-white lg:block">
        <LogoMark className="h-12 w-12" />
        <p className="mt-8 text-3xl font-extrabold leading-tight">{SLOGAN}</p>
        <ul className="mt-8 space-y-3 text-brand-100">
          <li>✓ Opportunités de financement adaptées à votre profil</li>
          <li>✓ Formations certifiantes en gestion et techniques agricoles</li>
          <li>✓ Experts, assistant IA, marketplace et communauté</li>
        </ul>
        <p className="mt-10 text-sm text-brand-200">Inscription gratuite. Vos données ne sont jamais vendues.</p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        <p className="mt-8 text-center text-xs text-muted">
          <Link href="/confidentialite" className="underline">Confidentialité</Link> · <Link href="/conditions" className="underline">Conditions</Link>
        </p>
      </div>
    </div>
  );
}
