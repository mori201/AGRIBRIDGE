import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = { title: "Questions fréquentes" };

const FAQ: [string, React.ReactNode][] = [
  ["AgriBridge est-il gratuit ?", "Oui. L'inscription, la recherche d'opportunités, les formations gratuites et la communauté sont gratuites. Certaines formations et services d'accompagnement sont premium ; les partenaires institutionnels peuvent souscrire à des formules avancées."],
  ["AgriBridge accorde-t-il des financements ?", "Non. AgriBridge centralise et vérifie les opportunités publiées par des organismes financeurs et vous aide à préparer vos candidatures. La décision d'attribution appartient toujours à l'organisme. Nous ne garantissons l'obtention d'aucun financement."],
  ["Comment est calculé le score de compatibilité ?", "Il compare votre profil (région, secteurs, type de structure, stade du projet, montant recherché) aux critères de l'opportunité. Il est indicatif : certains critères (âge, genre, conditions spécifiques) doivent être vérifiés par vous-même."],
  ["Que signifie le badge « Démo » ?", "Les contenus marqués « Démo » sont fictifs et servent uniquement à présenter la plateforme. Ils ne correspondent à aucune offre réelle."],
  ["Comment savoir si une opportunité est fiable ?", "Chaque opportunité est vérifiée par l'équipe avant publication. Les opportunités réelles affichent leur source officielle et leur date de vérification. En cas de doute, utilisez le bouton « Signaler »."],
  ["Mes documents sont-ils en sécurité ?", "Vos documents sont stockés dans un espace privé. Ils ne sont visibles par un organisme que si vous soumettez votre candidature via AgriBridge pour une de ses opportunités."],
  ["Puis-je payer sur AgriMarket ?", "Pas encore. Les échanges se font directement entre membres (messagerie ou WhatsApp). L'intégration de Wave et Orange Money est prévue. Ne versez jamais d'argent avant d'avoir vérifié le produit et le vendeur."],
  ["L'assistant IA parle-t-il wolof ?", "Oui, l'assistant peut répondre en français, en wolof ou en anglais. Il peut se tromper : vérifiez toujours les informations importantes, en particulier pour les traitements phytosanitaires."],
  ["Comment installer l'application sur mon téléphone ?", "Ouvrez AgriBridge dans Chrome sur Android puis touchez « Installer » ou « Ajouter à l'écran d'accueil ». L'application fonctionne aussi avec une connexion lente."],
  ["Comment supprimer mon compte ou exporter mes données ?", <>Rendez-vous dans <Link href="/tableau-de-bord/parametres">Paramètres du compte</Link> : vous pouvez exporter toutes vos données et supprimer définitivement votre compte.</>],
];

export default function Page() {
  return (
    <StaticPage title="Questions fréquentes">
      <div className="not-prose space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="surface group rounded-2xl border border-base p-4 open:shadow-sm">
            <summary className="cursor-pointer list-none font-bold">{q}<span className="float-right text-brand-600 transition group-open:rotate-45">+</span></summary>
            <div className="mt-2 text-sm leading-relaxed text-muted">{a}</div>
          </details>
        ))}
      </div>
    </StaticPage>
  );
}
