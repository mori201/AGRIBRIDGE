import Link from "@/components/ui/link";
import { Logo } from "./logo";
import { SLOGAN } from "@/lib/constants";

const COLS = [
  { title: "Plateforme", links: [["/opportunites", "AgriFunding"], ["/academy", "AgriAcademy"], ["/expert", "AgriExpert"], ["/market", "AgriMarket"], ["/communaute", "AgriCommunity"]] },
  { title: "AgriBridge", links: [["/a-propos", "À propos"], ["/partenaires", "Partenaires"], ["/blog", "Actualités"], ["/contact", "Contact"], ["/faq", "FAQ"]] },
  { title: "Partenaires", links: [["/inscription?profil=institution", "Devenir partenaire"], ["/partenaire/opportunites/nouvelle", "Publier une opportunité"], ["/certificats", "Vérifier un certificat"]] },
  { title: "Légal", links: [["/conditions", "Conditions d'utilisation"], ["/confidentialite", "Politique de confidentialité"]] },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-base surface pb-24 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{SLOGAN}</p>
          <p className="mt-3 text-xs text-muted">Sénégal · Afrique de l&apos;Ouest francophone</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="mb-3 text-sm font-bold">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted hover:text-[var(--text)]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-base">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} AgriBridge. Tous droits réservés.</p>
          <p>AgriBridge ne garantit l&apos;obtention d&apos;aucun financement. Vérifiez toujours les informations auprès des organismes officiels.</p>
        </div>
      </div>
    </footer>
  );
}
