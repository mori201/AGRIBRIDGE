import type { Metadata } from "next";
import Link from "@/components/ui/link";
import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Page() {
  return (
    <StaticPage title="Politique de confidentialité" updated="31 octobre 2026" intro="Vos données vous appartiennent. Nous ne les vendons jamais.">
      <h2>Données collectées</h2>
      <ul>
        <li><strong>Compte</strong> : nom, e-mail, mot de passe (chiffré), type de profil.</li>
        <li><strong>Profil</strong> (facultatif) : région, secteurs, expérience, projet, besoin et montant de financement, langue, téléphone, photo.</li>
        <li><strong>Activité</strong> : opportunités enregistrées, candidatures et documents, progression des formations, annonces, publications, messages, conversations avec l&apos;assistant IA.</li>
      </ul>
      <h2>Finalités</h2>
      <ul><li>Vous recommander des opportunités et formations adaptées.</li><li>Gérer vos candidatures et les transmettre aux organismes lorsque vous le décidez.</li><li>Assurer la sécurité, la modération et la prévention des abus.</li><li>Produire des statistiques agrégées et anonymisées.</li></ul>
      <h2>Partage</h2>
      <ul>
        <li>Les organismes partenaires n&apos;accèdent à votre profil et à vos documents <strong>que</strong> si vous soumettez une candidature via AgriBridge à l&apos;une de leurs opportunités.</li>
        <li>Votre nom, photo, région, secteurs et présentation sont visibles des autres membres ; votre téléphone et vos informations de financement ne le sont pas.</li>
        <li>Les questions posées à l&apos;assistant IA sont transmises au fournisseur d&apos;IA configuré, uniquement pour générer la réponse.</li>
        <li>Aucune donnée personnelle n&apos;est vendue ni louée.</li>
      </ul>
      <h2>Sécurité</h2>
      <p>Les données sont hébergées chez Supabase (PostgreSQL) avec des règles d&apos;accès par ligne (Row Level Security), un stockage privé des documents, des connexions chiffrées et un journal d&apos;audit des actions sensibles.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez à tout moment consulter et modifier votre profil, <Link href="/tableau-de-bord/parametres">exporter vos données</Link> et <Link href="/tableau-de-bord/parametres">supprimer votre compte</Link> (suppression définitive de vos données et fichiers). Pour toute question : <Link href="/contact">contact</Link>.</p>
      <h2>Conservation</h2>
      <p>Les données sont conservées tant que le compte est actif. Les journaux d&apos;audit sont conservés à des fins de sécurité.</p>
    </StaticPage>
  );
}
