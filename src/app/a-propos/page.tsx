import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";
import { LinkButton } from "@/components/ui/button";
import { SLOGAN } from "@/lib/constants";

export const metadata: Metadata = { title: "À propos d'AgriBridge" };

export default function Page() {
  return (
    <StaticPage title="À propos d'AgriBridge" intro={SLOGAN}>
      <p>AgriBridge est une plateforme numérique sénégalaise qui connecte les jeunes agripreneurs, producteurs, coopératives, GIE, PME agricoles et startups AgriTech avec les organismes qui les financent et les accompagnent : ONG, banques, institutions de microfinance, programmes publics, fondations et experts.</p>
      <h2>Notre constat</h2>
      <p>Les opportunités de financement agricole existent, mais l&apos;information est dispersée, difficile à comprendre et souvent découverte trop tard. De leur côté, les financeurs peinent à identifier des porteurs de projets qualifiés et à gérer leurs candidatures.</p>
      <h2>Notre réponse : cinq piliers</h2>
      <ul>
        <li><strong>AgriFunding</strong> — centraliser et vérifier les opportunités, recommander celles qui correspondent à chaque profil.</li>
        <li><strong>AgriAcademy</strong> — former à l&apos;entrepreneuriat, à la gestion, à la rentabilité et à la préparation des dossiers.</li>
        <li><strong>AgriExpert</strong> — un assistant IA multilingue et un réseau d&apos;experts humains.</li>
        <li><strong>AgriMarket</strong> — mettre en relation producteurs et acheteurs.</li>
        <li><strong>AgriCommunity</strong> — un réseau professionnel pour partager et apprendre ensemble.</li>
      </ul>
      <h2>Nos engagements</h2>
      <ul>
        <li>Chaque opportunité réelle affiche sa source officielle et sa date de vérification.</li>
        <li>Aucune promesse de financement : nous aidons à préparer, l&apos;organisme décide.</li>
        <li>Les données personnelles ne sont jamais vendues ; les statistiques partagées sont agrégées et anonymisées.</li>
        <li>Une plateforme pensée pour les smartphones d&apos;entrée de gamme et les connexions lentes.</li>
      </ul>
      <h2>Marché</h2>
      <p>Lancée au Sénégal, AgriBridge est conçue pour s&apos;étendre progressivement à l&apos;Afrique de l&apos;Ouest francophone.</p>
      <div className="not-prose mt-6 flex flex-wrap gap-3"><LinkButton href="/inscription">Rejoindre AgriBridge</LinkButton><LinkButton href="/contact" variant="outline">Nous contacter</LinkButton></div>
    </StaticPage>
  );
}
