import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function Page() {
  return (
    <StaticPage title="Conditions générales d'utilisation" updated="31 octobre 2026">
      <p>Les présentes conditions régissent l&apos;utilisation de la plateforme AgriBridge. En créant un compte, vous les acceptez.</p>
      <h2>1. Objet</h2>
      <p>AgriBridge met en relation des porteurs de projets agricoles, des producteurs, des organisations et des financeurs, et propose des contenus de formation, un assistant IA, une marketplace et un espace communautaire.</p>
      <h2>2. Absence de garantie de financement</h2>
      <p>AgriBridge n&apos;accorde aucun financement et ne garantit pas l&apos;obtention d&apos;une subvention, d&apos;un crédit ou d&apos;un prix. Les scores de compatibilité sont indicatifs. Les décisions appartiennent exclusivement aux organismes.</p>
      <h2>3. Compte</h2>
      <ul><li>Vous fournissez des informations exactes et maintenez la confidentialité de votre mot de passe.</li><li>Un compte est personnel. Les comptes institutionnels sont validés par AgriBridge.</li></ul>
      <h2>4. Contenus publiés</h2>
      <ul><li>Vous êtes responsable des annonces, publications, commentaires et documents que vous publiez.</li><li>Sont interdits : arnaques, demandes d&apos;argent ou de codes de paiement, spam, contenus haineux, fausses informations, usurpation d&apos;identité.</li><li>AgriBridge peut masquer ou retirer un contenu et suspendre un compte en cas de manquement.</li></ul>
      <h2>5. Marketplace</h2>
      <p>Les transactions sont conclues directement entre membres. Aucun paiement n&apos;est traité par AgriBridge à ce jour. AgriBridge n&apos;est pas partie aux ventes.</p>
      <h2>6. Assistant IA et conseils</h2>
      <p>Les réponses de l&apos;assistant IA sont générées automatiquement et peuvent comporter des erreurs. Elles ne remplacent pas l&apos;avis d&apos;un professionnel, notamment pour les traitements phytosanitaires, la santé animale ou la réglementation.</p>
      <h2>7. Partenaires</h2>
      <p>Les partenaires s&apos;engagent à publier des informations exactes et à n&apos;utiliser les données des candidats qu&apos;aux fins d&apos;instruction de leurs dossiers.</p>
      <h2>8. Responsabilité</h2>
      <p>AgriBridge met en œuvre les moyens raisonnables pour assurer la disponibilité et l&apos;exactitude du service, sans garantie d&apos;absence d&apos;interruption ou d&apos;erreur.</p>
      <h2>9. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit sénégalais.</p>
    </StaticPage>
  );
}
