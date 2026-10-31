# AgriBridge

> **L'information pour tous, les opportunités pour chacun.**

Plateforme AgriTech sénégalaise (MVP) qui connecte agripreneurs, producteurs, coopératives/GIE, PME agricoles, financeurs et experts autour de cinq piliers : **AgriFunding**, **AgriAcademy**, **AgriExpert**, **AgriMarket**, **AgriCommunity**.

---

## 1. Stack

| Couche | Choix |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript strict |
| UI | Tailwind CSS v4, composants maison façon shadcn/ui, Lucide, Recharts |
| Formulaires | React Hook Form + Zod (client) · Zod (serveur, systématique) |
| Backend | Supabase : PostgreSQL, Auth, Storage, RLS, fonctions SQL `security definer` |
| API | Server Actions + Route Handlers (`/api/assistant`, `/api/partenaire/export`) |
| IA | Anthropic ou toute API compatible OpenAI, configurable par variables d'environnement |
| Déploiement | Vercel (région `cdg1`, proche de la base Supabase `eu-west-3` Paris) |
| Mobile | PWA installable (manifest, service worker, icônes) · prête pour Capacitor |

## 2. Architecture

```
src/
  app/                      Routes (App Router)
    (pages publiques)       /, /opportunites, /academy, /expert, /market, /communaute, /blog, /partenaires,
                            /a-propos, /contact, /faq, /conditions, /confidentialite, /certificats, /membres/[id]
    connexion, inscription, mot-de-passe-oublie, reinitialiser, onboarding, auth/callback, auth/signout
    tableau-de-bord/        Espace utilisateur (profil, opportunités, candidatures, formations, certificats,
                            annonces, messages, accompagnement, notifications, paramètres)
    partenaire/             Espace institutionnel (appels à projets, candidatures, stats, organisation, export CSV)
    admin/                  Administration (opportunités, utilisateurs, partenaires, formations, annonces,
                            modération, experts, contenus, signalements, statistiques, paramètres)
    api/                    assistant IA, export CSV partenaire
  actions/                  Server Actions (validation Zod + appels Supabase sous RLS)
  components/               UI, layout, cartes métier, assistant, graphiques
  lib/                      supabase (client/serveur/middleware), auth, matching, IA, markdown, constantes
supabase/
  migrations/               Schéma, logique métier, RLS, données de référence, durcissement
  seed/                     Comptes et contenus de démonstration
tests/                      Tests unitaires (moteur de correspondance) et e2e (Playwright)
```

Principes :
- **Aucune clé secrète côté client.** L'application n'utilise que la clé publique Supabase ; toute la sécurité repose sur RLS et des fonctions SQL contrôlées. La clé `service_role` n'est jamais nécessaire.
- **Validation serveur systématique** (Zod dans chaque Server Action) en plus des contraintes SQL (`check`, FK, enums).
- **Pas de faux fonctionnement** : IA, paiements et e-mails non configurés affichent un état explicite.

## 3. Base de données

34+ tables : `profiles`, `organizations`, `organization_members`, `opportunities`, `opportunity_categories`, `opportunity_eligibility`, `saved_opportunities`, `opportunity_alerts`, `applications`, `application_history`, `application_documents`, `courses`, `course_modules`, `lessons`, `quizzes`, `quiz_questions`, `quiz_attempts`, `course_enrollments`, `course_progress`, `certificates`, `webinars`, `experts`, `expert_requests`, `ai_conversations`, `ai_messages`, `products`, `product_categories`, `product_favorites`, `posts`, `comments`, `likes`, `follows`, `groups`, `group_members`, `conversations`, `messages`, `notifications`, `reports`, `subscriptions`, `blog_posts`, `contact_messages`, `platform_settings`, `audit_logs`.

Migrations (à appliquer dans l'ordre) : `supabase/migrations/0001` → `0006`.

### Sécurité (RLS et triggers)
- RLS activée sur **toutes** les tables publiques.
- `profiles` : seules les colonnes publiques sont lisibles ; les colonnes privées (téléphone, financement) passent par `my_profile()` / `candidate_profile()`.
- Impossible de s'auto-attribuer le rôle admin, de se dé-suspendre, de publier une opportunité sans validation, de modifier un drapeau de modération ou de démo (triggers `protect_*` / `guard_*`).
- Un partenaire ne voit **que** les candidatures de ses propres programmes, et seulement si le candidat les a soumises (`shared_with_partner`).
- Les bonnes réponses des quiz ne sont jamais exposées (`get_quiz()` / `submit_quiz()` corrigent côté serveur) ; un certificat n'est délivré qu'après 100 % des leçons et tous les quiz réussis (`claim_certificate()`).
- Stockage : bucket `documents` **privé** (`<user_id>/...`, URL signées 5 min) ; bucket `media` public en lecture, écriture limitée au dossier du propriétaire.
- Limitations : publications, commentaires, annonces, messages, signalements, contact, tentatives de quiz, messages IA/heure (paramétrable).
- Journal d'audit automatique (statuts d'opportunités, validations d'organisations, rôles/suspensions, modération, signalements, suppression de compte).
- RGPD : export JSON des données et suppression de compte (fichiers inclus).

## 4. Installation locale

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev
```

Scripts : `npm run build`, `npm run typecheck`, `npm test` (unitaires), `node tests/e2e.mjs` (e2e, voir §8).

## 5. Configuration Supabase

1. Créer un projet (région recommandée : `eu-west-3` Paris).
2. Appliquer les migrations `supabase/migrations/*.sql` dans l'ordre (SQL Editor ou `supabase db push`).
3. (Optionnel) Données de démonstration : `supabase/seed/demo_users.sql` (passer les mots de passe en variables psql) puis `supabase/seed/demo_content.sql`.
4. **Authentication → URL Configuration** : définir *Site URL* = URL de production, et ajouter `https://<domaine>/auth/callback` aux *Redirect URLs* (sinon les liens de confirmation et de réinitialisation pointent vers `localhost`).
5. **Authentication → SMTP** : configurer un SMTP (Resend, Brevo…) ; le SMTP par défaut de Supabase est limité à quelques e-mails par heure.
6. **Authentication → Passwords** : activer la protection contre les mots de passe compromis (HaveIBeenPwned).
7. Créer le premier administrateur : `update profiles set role='admin' where id='<uuid>';` (SQL Editor).

## 6. Déploiement Vercel

1. Importer le dépôt GitHub dans Vercel (framework Next.js détecté).
2. Variables d'environnement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, et optionnellement `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`.
3. `vercel.json` fixe la région des fonctions à `cdg1` (Paris).
4. Mettre à jour *Site URL* / *Redirect URLs* dans Supabase avec le domaine Vercel.

## 7. Intégrations externes à configurer

| Intégration | État | Action |
| --- | --- | --- |
| Assistant IA | Prêt, inactif sans clé | Définir `AI_API_KEY` (+ `AI_PROVIDER`, `AI_MODEL`) |
| E-mails transactionnels | SMTP Supabase par défaut (très limité) | Configurer un SMTP personnalisé |
| Paiements Wave / Orange Money | Non intégrés (aucun paiement simulé) | Architecture prête : `subscriptions`, statut premium |
| Notifications push | Notifications in-app uniquement | Ajouter Web Push / FCM |
| Application Android | `capacitor.config.json` fourni | `npx cap add android` (mettre à jour `server.url`) |

## 8. Comptes et données de démonstration

Toutes les données de démo sont marquées `is_demo` et affichées avec un badge **« Démo »** ; aucune opportunité fictive n'est présentée comme réelle.

| Rôle | E-mail |
| --- | --- |
| Administrateur | `admin@demo.agribridge.sn` |
| Partenaire (Fondation Teranga Agri — démo) | `partenaire@demo.agribridge.sn` |
| Agripreneure (Awa Diop — démo) | `agripreneur@demo.agribridge.sn` |
| Expert (Dr Moussa Sarr — démo) | `expert@demo.agribridge.sn` |

Les mots de passe ne sont **pas** versionnés (transmis séparément). Changez-les ou supprimez ces comptes avant une ouverture publique.

## 9. Fonctionnalités (résumé)

- **AgriFunding** : catalogue filtrable (région, secteur, type, montant, bénéficiaire, échéance, maturité), recherche plein texte instantanée, favoris, alertes (notifications automatiques à la publication), score de compatibilité (critères remplis / manquants / à vérifier, documents, prochaines étapes — jamais de garantie), candidatures (brouillon → préparation → soumis → examen → accepté/refusé), documents privés, checklist, notes, rappels, historique ; candidature interne ou redirection vers le site officiel avec mise à jour manuelle.
- **AgriAcademy** : catalogue, niveaux, gratuit/premium, modules, leçons (texte, vidéo YouTube/Vimeo, PDF), progression, quiz corrigés côté serveur, certificats vérifiables publiquement (`/certificats/<code>`), webinaires, favoris.
- **AgriExpert** : assistant IA FR/WO/EN (contexte = profil + données réelles de la plateforme, garde-fous anti-invention, historique, quota) ; répertoire d'experts, demandes d'accompagnement, fiche expert soumise à validation.
- **AgriMarket** : annonces en FCFA avec photos, recherche/filtres, WhatsApp, messagerie, favoris, signalement, modération.
- **AgriCommunity** : fil, publications texte/photo/vidéo, questions, actualités, likes, commentaires, partages, abonnements, groupes, filtre anti-arnaque, masquage automatique après 3 signalements.
- **Partenaires** : organisation (validée par l'admin), publication soumise à validation, candidatures filtrables, décision + message au candidat, export CSV (protégé contre l'injection de formules), statistiques.
- **Administration** : validation des opportunités (avec date de vérification), saisie d'opportunités réelles sourcées, utilisateurs (rôles, suspension), partenaires (validation, membres, formules), formations (CRUD complet), annonces, modération, experts, contenus (blog, webinaires), signalements, statistiques, paramètres, journal d'audit, messages de contact.
- **Transverse** : tableau de bord personnalisé avec graphiques, notifications, mode sombre, PWA, navigation mobile inférieure, skeletons, états vides, accessibilité clavier, SEO (sitemap, robots, métadonnées).

## 10. Rapport de tests

- `npm test` : 7 tests unitaires du moteur de correspondance — **7/7 OK**.
- `npm run build` : compilation et vérification TypeScript stricte — **OK**.
- Sécurité RLS vérifiée en SQL (rôle `authenticated` simulé) : auto-promotion admin, lecture de colonnes privées, publication sans validation, lecture des réponses de quiz, accès au contenu premium, certificat anticipé — **tous bloqués**.
- `tests/e2e.mjs` (Playwright, viewport smartphone) : 26 parcours (accueil, recherche, favoris, candidature + document, formation complète → certificat, annonce, messagerie, communauté, anti-arnaque, export RGPD, contrôle d'accès, partenaire, export CSV, validation admin, notifications). Voir le rapport de livraison pour les résultats.

## 11. Limites connues du MVP

- Assistant IA inactif tant qu'`AI_API_KEY` n'est pas défini.
- Pas de paiement en ligne (Wave/Orange Money) : formations premium et formules partenaires activées manuellement par l'admin.
- E-mails limités au SMTP Supabase par défaut ; pas d'envoi d'e-mail pour les notifications in-app.
- Messagerie rafraîchie par polling léger (8 s) plutôt qu'en temps réel.
- Interface en français ; seules les réponses de l'assistant sont multilingues (architecture `LANGUAGES` extensible).
- Ajout de collaborateurs à une organisation réalisé par l'admin.
- Aucune opportunité réelle n'est préchargée : l'équipe doit en saisir via l'administration avec leur source officielle.
