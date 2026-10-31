-- =====================================================================
-- AgriBridge — Contenus de DÉMONSTRATION (fictifs, marqués is_demo = true)
-- À exécuter après demo_users.sql. Aucune de ces opportunités n'est réelle.
-- =====================================================================

-- Profils démo complétés
update public.profiles set region='thies', sectors='{maraichage,transformation}', experience_level='intermediaire',
  project_type='Production maraîchère et transformation de tomates', funding_need=true, funding_amount=5000000,
  project_stage='demarrage', onboarding_completed=true, bio='Jeune agripreneure basée à Thiès (profil de démonstration).'
where id='00000000-0000-4000-a000-000000000003';
update public.profiles set region='dakar', onboarding_completed=true where id in ('00000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000002');
update public.profiles set region='saint-louis', sectors='{cereales}', onboarding_completed=true, bio='Riziculteur dans la vallée du fleuve (démo).' where id='00000000-0000-4000-a000-000000000005';
update public.profiles set region='dakar', sectors='{maraichage}', onboarding_completed=true, bio='GIE de maraîchers des Niayes (démo).' where id='00000000-0000-4000-a000-000000000006';
update public.profiles set region='kaolack', sectors='{cereales,agroforesterie}', onboarding_completed=true, bio='Agronome, 15 ans d''expérience (démo).' where id='00000000-0000-4000-a000-000000000004';

-- Organisations démo
insert into public.organizations (id, name, slug, type, description, website, email, is_verified, is_demo, created_by) values
 ('10000000-0000-4000-a000-000000000001','Fondation Teranga Agri (démo)','fondation-teranga-agri-demo','fondation',
  'Organisation fictive de démonstration. Elle illustre le fonctionnement d''un partenaire institutionnel sur AgriBridge.',null,'contact@demo.agribridge.sn',true,true,'00000000-0000-4000-a000-000000000002'),
 ('10000000-0000-4000-a000-000000000002','Caisse Rurale Sahel Finance (démo)','caisse-rurale-sahel-demo','microfinance',
  'Institution de microfinance fictive utilisée pour la démonstration.',null,null,true,true,null),
 ('10000000-0000-4000-a000-000000000003','Incubateur Ndanaan Lab (démo)','incubateur-ndanaan-lab-demo','incubateur',
  'Incubateur AgriTech fictif utilisé pour la démonstration.',null,null,true,true,null)
on conflict (id) do nothing;
insert into public.organization_members (organization_id, user_id, member_role) values
 ('10000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000002','owner') on conflict do nothing;
insert into public.subscriptions (organization_id, plan, status, notes) values
 ('10000000-0000-4000-a000-000000000001','partenaire','active','Abonnement de démonstration — aucun paiement');

-- Opportunités démo
with c as (select id, slug from public.opportunity_categories)
insert into public.opportunities (id, title, summary, description, organization_id, funder_name, category_id, amount_min, amount_max,
  regions, sectors, beneficiary_types, project_stages, required_documents, deadline, application_url, application_mode,
  contact_email, is_demo, status, published_at, created_by)
values
 ('20000000-0000-4000-a000-000000000001','Programme Jeunes Maraîchers Résilients',
  'Subvention pour l''installation de systèmes d''irrigation goutte-à-goutte chez les jeunes maraîchers.',
  E'Ce programme de démonstration accompagne les jeunes maraîchers dans l''adoption de l''irrigation goutte-à-goutte.\n\nIl finance jusqu''à 70 % du coût du kit d''irrigation et propose 3 jours de formation technique.\n\nCette opportunité est fictive et sert uniquement à illustrer la plateforme.',
  '10000000-0000-4000-a000-000000000001','Fondation Teranga Agri (démo)',(select id from c where slug='subvention'),500000,3000000,
  '{thies,dakar,louga}','{maraichage,irrigation}','{agripreneur,producteur,jeunes}','{demarrage,croissance}',
  '{"Copie de la pièce d''identité","Plan simplifié du projet","Justificatif d''accès à la parcelle","Devis du kit d''irrigation"}',
  (current_date + 45),null,'platform','contact@demo.agribridge.sn',true,'published',now() - interval '3 days','00000000-0000-4000-a000-000000000002'),
 ('20000000-0000-4000-a000-000000000002','Appel à projets Transformation Agroalimentaire Locale',
  'Soutien aux unités de transformation de céréales locales, fruits et produits halieutiques.',
  E'Appel à projets fictif destiné aux PME et coopératives qui transforment des produits locaux.\n\nLes projets retenus bénéficient d''un cofinancement d''équipements et d''un accompagnement à la certification.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000001','Fondation Teranga Agri (démo)',(select id from c where slug='appel-a-projets'),2000000,15000000,
  '{national}','{transformation,cereales}','{pme,cooperative}','{croissance,maturite}',
  '{"Statuts de l''entreprise ou du GIE","NINEA","États financiers des 2 dernières années","Business plan"}',
  (current_date + 20),'https://example.org/demo-candidature','external','contact@demo.agribridge.sn',true,'published',now() - interval '10 days','00000000-0000-4000-a000-000000000002'),
 ('20000000-0000-4000-a000-000000000003','Microcrédit Campagne Arachidière',
  'Crédit de campagne à taux préférentiel pour l''achat d''intrants (démo).',
  E'Offre fictive de microcrédit de campagne pour les producteurs d''arachide et de mil.\n\nRemboursement après la récolte. Garantie solidaire possible via un groupement.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000002','Caisse Rurale Sahel Finance (démo)',(select id from c where slug='microcredit'),100000,1500000,
  '{kaolack,kaffrine,fatick,diourbel}','{cereales,intrants}','{producteur,cooperative}','{demarrage,croissance,maturite}',
  '{"Pièce d''identité","Attestation de résidence","Engagement de caution solidaire"}',
  (current_date + 6),'https://example.org/demo-microcredit','external',null,true,'published',now() - interval '20 days',null),
 ('20000000-0000-4000-a000-000000000004','Concours AgriTech Innovation Jeunes',
  'Prix pour les jeunes startups qui développent des solutions numériques pour l''agriculture.',
  E'Concours fictif récompensant trois startups AgriTech.\n\nLes lauréats reçoivent un prix en numéraire et 6 mois d''incubation.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000003','Incubateur Ndanaan Lab (démo)',(select id from c where slug='concours'),1000000,5000000,
  '{national}','{agritech}','{agripreneur,pme,jeunes}','{idee,demarrage}',
  '{"Pitch deck","Vidéo de présentation de 2 minutes","CV de l''équipe"}',
  (current_date + 60),'https://example.org/demo-concours','external',null,true,'published',now() - interval '1 day',null),
 ('20000000-0000-4000-a000-000000000005','Incubation Femmes & Agrobusiness',
  'Programme d''incubation de 9 mois réservé aux entrepreneures agricoles.',
  E'Programme fictif d''incubation : coaching, formation en gestion financière et mise en relation avec des financeurs.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000003','Incubateur Ndanaan Lab (démo)',(select id from c where slug='incubation'),null,null,
  '{dakar,thies,ziguinchor,kolda,sedhiou}','{transformation,maraichage,aviculture}','{agripreneur,pme,femmes}','{idee,demarrage}',
  '{"Formulaire de candidature","Pièce d''identité"}',
  (current_date + 30),'https://example.org/demo-incubation','external',null,true,'published',now() - interval '5 days',null),
 ('20000000-0000-4000-a000-000000000006','Financement Équipement Avicole',
  'Prêt bancaire pour la construction de poulaillers modernes et l''achat d''équipements (démo).',
  E'Offre bancaire fictive pour les aviculteurs souhaitant augmenter leur capacité.\n\nApport personnel de 20 % requis. Différé de 3 mois.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000002','Caisse Rurale Sahel Finance (démo)',(select id from c where slug='financement-bancaire'),3000000,25000000,
  '{dakar,thies}','{aviculture,elevage}','{producteur,pme}','{croissance,maturite}',
  '{"Business plan","Relevés bancaires (6 mois)","Titre de propriété ou bail"}',
  (current_date + 90),'https://example.org/demo-avicole','external',null,true,'published',now() - interval '15 days',null),
 ('20000000-0000-4000-a000-000000000007','Formation financée Agroécologie',
  'Cycle de formation gratuit en agroécologie et gestion durable des sols (démo).',
  E'Formation fictive de 10 jours avec prise en charge du transport et de l''hébergement.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000001','Fondation Teranga Agri (démo)',(select id from c where slug='formation-financee'),null,null,
  '{kedougou,tambacounda,matam,kolda}','{agroforesterie,maraichage,cereales}','{producteur,agripreneur,cooperative}','{idee,demarrage,croissance}',
  '{"Formulaire d''inscription"}',
  (current_date + 12),null,'platform',null,true,'published',now() - interval '2 days','00000000-0000-4000-a000-000000000002'),
 ('20000000-0000-4000-a000-000000000008','Programme d''accompagnement Coopératives Rizicoles',
  'Accompagnement technique et organisationnel des coopératives de la vallée du fleuve (démo).',
  E'Programme fictif d''appui à la structuration des coopératives rizicoles : gouvernance, comptabilité, accès au marché.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000001','Fondation Teranga Agri (démo)',(select id from c where slug='accompagnement'),null,null,
  '{saint-louis,matam}','{cereales}','{cooperative}','{croissance,maturite}',
  '{"Récépissé de reconnaissance","Liste des membres","PV de la dernière AG"}',
  (current_date - 5),null,'platform',null,true,'published',now() - interval '40 days','00000000-0000-4000-a000-000000000002'),
 ('20000000-0000-4000-a000-000000000009','Fonds d''investissement PME Agricoles',
  'Prise de participation minoritaire dans des PME agricoles à fort potentiel (démo).',
  E'Fonds fictif investissant entre 20 et 100 millions FCFA en fonds propres.\n\nDonnées de démonstration.',
  null,'Sahel Agri Capital (démo)',(select id from c where slug='investissement'),20000000,100000000,
  '{national}','{transformation,commerce-agricole,agritech}','{pme}','{croissance,maturite}',
  '{"États financiers certifiés","Business plan à 5 ans","Pacte d''associés"}',
  null,'https://example.org/demo-fonds','external',null,true,'published',now() - interval '30 days',null),
 ('20000000-0000-4000-a000-000000000010','Subvention Apiculture et Agroforesterie Casamance',
  'Appui aux projets apicoles et agroforestiers en Casamance (démo).',
  E'Subvention fictive pour l''achat de ruches modernes et de plants.\n\nDonnées de démonstration.',
  '10000000-0000-4000-a000-000000000001','Fondation Teranga Agri (démo)',(select id from c where slug='subvention'),250000,2000000,
  '{ziguinchor,sedhiou,kolda}','{apiculture,agroforesterie}','{producteur,agripreneur,cooperative}','{idee,demarrage}',
  '{"Pièce d''identité","Description du projet"}',
  (current_date + 25),null,'platform',null,true,'pending_review',null,'00000000-0000-4000-a000-000000000002')
on conflict (id) do nothing;

insert into public.opportunity_eligibility (opportunity_id, label, is_mandatory, position) values
 ('20000000-0000-4000-a000-000000000001','Avoir entre 18 et 35 ans',true,1),
 ('20000000-0000-4000-a000-000000000001','Disposer d''une parcelle d''au moins 0,25 ha',true,2),
 ('20000000-0000-4000-a000-000000000001','Apport personnel de 30 % du coût du kit',true,3),
 ('20000000-0000-4000-a000-000000000002','Entreprise ou GIE formellement enregistré',true,1),
 ('20000000-0000-4000-a000-000000000002','Au moins 1 an d''activité',true,2),
 ('20000000-0000-4000-a000-000000000003','Être membre d''un groupement de producteurs',false,1),
 ('20000000-0000-4000-a000-000000000004','Équipe d''au moins 2 personnes dont un profil technique',true,1),
 ('20000000-0000-4000-a000-000000000005','Être une femme porteuse de projet',true,1),
 ('20000000-0000-4000-a000-000000000006','Apport personnel de 20 %',true,1),
 ('20000000-0000-4000-a000-000000000009','Chiffre d''affaires supérieur à 50 millions FCFA',true,1);

-- AgriAcademy
insert into public.courses (id, slug, title, summary, description, category, level, duration_minutes, is_premium, is_published, instructor, pass_score, is_demo) values
 ('30000000-0000-4000-a000-000000000001','preparer-son-dossier-de-financement','Préparer son dossier de financement agricole',
  'Les étapes clés pour présenter un projet crédible à un financeur.',
  'Ce cours vous apprend à structurer votre projet, chiffrer vos besoins et rassembler les pièces généralement demandées par les financeurs.',
  'preparation-financements','debutant',60,false,true,'Équipe AgriBridge',70,true),
 ('30000000-0000-4000-a000-000000000002','calcul-rentabilite-exploitation','Calculer la rentabilité de son exploitation',
  'Coûts, marges et seuil de rentabilité expliqués simplement.',
  'Apprenez à calculer vos charges, votre marge brute et votre seuil de rentabilité à partir d''exemples concrets.',
  'gestion-financiere','intermediaire',75,false,true,'Équipe AgriBridge',70,true),
 ('30000000-0000-4000-a000-000000000003','agriculture-durable-sols','Agriculture durable : prendre soin de ses sols',
  'Compostage, rotation des cultures et gestion de l''eau.',
  'Les pratiques de base pour préserver la fertilité des sols et réduire la dépendance aux intrants.',
  'agriculture-durable','debutant',45,false,true,'Équipe AgriBridge',70,true),
 ('30000000-0000-4000-a000-000000000004','strategie-commercialisation','Stratégie de commercialisation avancée',
  'Trouver ses clients, fixer ses prix, négocier avec les acheteurs.',
  'Formation premium : segmentation des clients, contractualisation et vente aux marchés institutionnels.',
  'commercialisation','avance',120,true,true,'Équipe AgriBridge',75,true)
on conflict (id) do nothing;

insert into public.course_modules (id, course_id, title, position) values
 ('31000000-0000-4000-a000-000000000001','30000000-0000-4000-a000-000000000001','Structurer son projet',1),
 ('31000000-0000-4000-a000-000000000002','30000000-0000-4000-a000-000000000001','Constituer son dossier',2),
 ('31000000-0000-4000-a000-000000000003','30000000-0000-4000-a000-000000000002','Comprendre ses coûts',1),
 ('31000000-0000-4000-a000-000000000004','30000000-0000-4000-a000-000000000002','Marges et seuil de rentabilité',2),
 ('31000000-0000-4000-a000-000000000005','30000000-0000-4000-a000-000000000003','Les bases de la fertilité',1),
 ('31000000-0000-4000-a000-000000000006','30000000-0000-4000-a000-000000000004','Connaître son marché',1)
on conflict (id) do nothing;

insert into public.lessons (module_id, title, content, duration_minutes, position) values
 ('31000000-0000-4000-a000-000000000001','Définir clairement son projet',
  E'## Pourquoi c''est important\nUn financeur doit comprendre en quelques minutes **ce que vous faites**, **pour qui** et **pourquoi votre projet est viable**.\n\n## Les 5 questions à se poser\n- Quel problème mon projet résout-il ?\n- Qui sont mes clients ?\n- Quels sont mes produits ou services ?\n- De quelles ressources ai-je besoin ?\n- Comment vais-je gagner de l''argent ?\n\n## Exercice\nRédigez en 5 phrases la description de votre projet en répondant à ces questions.',15,1),
 ('31000000-0000-4000-a000-000000000001','Chiffrer ses besoins',
  E'## Investissements et fonctionnement\nDistinguez les **investissements** (matériel, aménagements) des **charges de fonctionnement** (semences, main-d''œuvre, carburant).\n\n## Le plan de financement\nIndiquez pour chaque besoin la source de financement : apport personnel, subvention, crédit.\n\n> Conseil : soyez réaliste. Un budget surévalué ou sous-évalué fragilise votre crédibilité.',15,2),
 ('31000000-0000-4000-a000-000000000002','Les pièces généralement demandées',
  E'## Pièces fréquentes\n- Pièce d''identité\n- Statuts (GIE, coopérative, entreprise) et NINEA le cas échéant\n- Business plan ou fiche projet\n- Devis des équipements\n- Justificatif d''accès à la terre\n\nChaque financeur a ses propres exigences : vérifiez toujours la liste officielle de l''appel.',15,1),
 ('31000000-0000-4000-a000-000000000002','Suivre sa candidature',
  E'## Organisez-vous\nNotez les dates limites, gardez une copie de chaque document envoyé et suivez l''avancement dans **Mes candidatures** sur AgriBridge.\n\n## Après un refus\nDemandez un retour au financeur : c''est une source précieuse d''amélioration.',10,2),
 ('31000000-0000-4000-a000-000000000003','Charges fixes et charges variables',
  E'## Définitions\n- **Charges variables** : elles augmentent avec la production (semences, engrais, emballages).\n- **Charges fixes** : elles existent même sans production (loyer, amortissement du matériel, salaires permanents).\n\n## Exemple\nUn maraîcher qui double sa surface double à peu près ses semences (variables), mais pas le loyer de son magasin (fixe).',20,1),
 ('31000000-0000-4000-a000-000000000004','Calculer sa marge brute',
  E'## Formule\n**Marge brute = Chiffre d''affaires − Charges variables**\n\n## Exemple chiffré\nVente de 4 tonnes d''oignons à 250 FCFA/kg = 1 000 000 FCFA.\nCharges variables = 550 000 FCFA.\nMarge brute = 450 000 FCFA.',20,1),
 ('31000000-0000-4000-a000-000000000004','Le seuil de rentabilité',
  E'## Formule\n**Seuil de rentabilité = Charges fixes ÷ Taux de marge**\n\nTaux de marge = Marge brute ÷ Chiffre d''affaires.\n\nDans l''exemple précédent, taux de marge = 45 %. Avec 270 000 FCFA de charges fixes, le seuil est de 600 000 FCFA de ventes.',20,2),
 ('31000000-0000-4000-a000-000000000005','Le compostage',
  E'## Intérêt\nLe compost améliore la structure du sol et sa capacité à retenir l''eau.\n\n## Étapes\n- Alterner matières vertes et matières sèches\n- Humidifier régulièrement\n- Retourner le tas toutes les 2 à 3 semaines\n\nLe compost est prêt lorsqu''il a une odeur de terre de forêt.',15,1),
 ('31000000-0000-4000-a000-000000000005','La rotation des cultures',
  E'## Principe\nNe pas cultiver la même famille de plantes au même endroit deux saisons de suite.\n\n## Bénéfices\n- Réduction des maladies et ravageurs\n- Meilleure utilisation des nutriments\n- Les légumineuses (niébé, arachide) enrichissent le sol en azote.',15,2),
 ('31000000-0000-4000-a000-000000000006','Segmenter ses clients',
  E'## Les types de clients\n- Consommateurs directs\n- Commerçants et bana-bana\n- Restaurants et hôtels\n- Marchés institutionnels\n\nChaque segment a ses exigences de prix, de qualité et de régularité.',30,1);

insert into public.quizzes (id, course_id, module_id, title) values
 ('32000000-0000-4000-a000-000000000001','30000000-0000-4000-a000-000000000001',null,'Quiz final — Dossier de financement'),
 ('32000000-0000-4000-a000-000000000002','30000000-0000-4000-a000-000000000002',null,'Quiz final — Rentabilité'),
 ('32000000-0000-4000-a000-000000000003','30000000-0000-4000-a000-000000000003',null,'Quiz final — Sols')
on conflict (id) do nothing;

insert into public.quiz_questions (quiz_id, question, options, correct_index, explanation, position) values
 ('32000000-0000-4000-a000-000000000001','Que doit comprendre un financeur en priorité ?','{"La couleur de votre logo","Ce que vous faites, pour qui et pourquoi c''est viable","Le nombre de vos amis"}',1,'La clarté du projet est essentielle.',1),
 ('32000000-0000-4000-a000-000000000001','Le matériel agricole est généralement classé en :','{"Charges de fonctionnement","Investissements","Revenus"}',1,null,2),
 ('32000000-0000-4000-a000-000000000001','Où trouver la liste exacte des pièces à fournir ?','{"Dans l''appel officiel du financeur","Sur un réseau social","Elle est identique pour tous les financeurs"}',0,null,3),
 ('32000000-0000-4000-a000-000000000002','Les semences sont des charges :','{"Fixes","Variables"}',1,null,1),
 ('32000000-0000-4000-a000-000000000002','Marge brute = ','{"CA + charges fixes","CA − charges variables","Charges fixes ÷ CA"}',1,null,2),
 ('32000000-0000-4000-a000-000000000002','Avec 300 000 FCFA de charges fixes et un taux de marge de 50 %, le seuil de rentabilité est :','{"150 000 FCFA","600 000 FCFA","300 000 FCFA"}',1,null,3),
 ('32000000-0000-4000-a000-000000000003','Le compost améliore :','{"La rétention d''eau du sol","Uniquement la couleur du sol"}',0,null,1),
 ('32000000-0000-4000-a000-000000000003','Quelle culture enrichit le sol en azote ?','{"Le niébé","L''oignon","La tomate"}',0,null,2);

insert into public.webinars (title, description, starts_at, speaker, is_demo) values
 ('Webinaire : bien préparer sa candidature (démo)','Session de questions-réponses en direct.', now() + interval '10 days','Équipe AgriBridge',true),
 ('Webinaire : irrigation goutte-à-goutte (démo)','Retours d''expérience de maraîchers.', now() + interval '24 days','Dr Moussa Sarr (démo)',true);

-- Experts
insert into public.experts (id, profile_id, full_name, title, specialties, bio, region, languages, availability, rate_fcfa, is_verified, is_demo) values
 ('40000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000004','Dr Moussa Sarr (démo)','Agronome','{agronomie,cereales,agroforesterie}',
  'Profil fictif de démonstration : agronome spécialisé dans les cultures céréalières.','kaolack','{fr,wo}','Lundi au vendredi, 9h–17h',15000,true,true),
 ('40000000-0000-4000-a000-000000000002',null,'Aminata Ba (démo)','Consultante en financement agricole','{financement,business-plan}',
  'Profil fictif de démonstration.','dakar','{fr,en}','Sur rendez-vous',25000,true,true),
 ('40000000-0000-4000-a000-000000000003',null,'Ousmane Diallo (démo)','Expert phytosanitaire','{phytosanitaire,maraichage}',
  'Profil fictif de démonstration.','thies','{fr,wo}','Mardi et jeudi',null,true,true),
 ('40000000-0000-4000-a000-000000000004',null,'Mariama Sow (démo)','Experte en gestion d''exploitation','{gestion,comptabilite}',
  'Profil fictif de démonstration.','saint-louis','{fr,wo,en}','Week-end',10000,true,true)
on conflict (id) do nothing;

-- AgriMarket
insert into public.products (seller_id, category_id, title, description, price_fcfa, unit, quantity, region, location, whatsapp, is_demo)
select s, (select id from public.product_categories where slug=c), t, d, p, u, q, r, l, w, true from (values
 ('00000000-0000-4000-a000-000000000005'::uuid,'cereales','Riz paddy de la vallée','Riz paddy récolte de la saison, sacs de 80 kg (annonce démo).',220,'kg',5000,'saint-louis','Ross Béthio',null),
 ('00000000-0000-4000-a000-000000000006'::uuid,'fruits-legumes','Oignons violets de Galmi','Oignons bien séchés, conservation longue (annonce démo).',300,'kg',2000,'dakar','Niayes — Sangalkam',null),
 ('00000000-0000-4000-a000-000000000006'::uuid,'fruits-legumes','Tomates fraîches','Tomates de saison, livraison possible à Dakar (annonce démo).',400,'kg',800,'dakar','Niayes',null),
 ('00000000-0000-4000-a000-000000000003'::uuid,'produits-transformes','Concentré de tomate artisanal','Pots de 400 g, transformation locale (annonce démo).',1500,'pot',300,'thies','Thiès ville',null),
 ('00000000-0000-4000-a000-000000000005'::uuid,'semences','Semences d''arachide certifiées','Variété adaptée au bassin arachidier (annonce démo).',900,'kg',1000,'kaolack','Kaolack',null),
 ('00000000-0000-4000-a000-000000000005'::uuid,'materiel-agricole','Motopompe 5,5 CV d''occasion','Bon état, révisée récemment (annonce démo).',180000,'unité',1,'saint-louis','Dagana',null),
 ('00000000-0000-4000-a000-000000000006'::uuid,'irrigation','Kit goutte-à-goutte 500 m²','Kit complet avec filtre et réservoir (annonce démo).',95000,'kit',10,'dakar','Rufisque',null),
 ('00000000-0000-4000-a000-000000000003'::uuid,'elevage','Poulets de chair','Poulets de 45 jours, élevés au sol (annonce démo).',3500,'unité',200,'thies','Pout',null)
) v(s,c,t,d,p,u,q,r,l,w);

-- AgriCommunity
insert into public.groups (id, slug, name, description, category, created_by, is_demo) values
 ('50000000-0000-4000-a000-000000000001','maraichers-niayes','Maraîchers des Niayes','Échanges entre maraîchers de la zone des Niayes (démo).','maraichage','00000000-0000-4000-a000-000000000006',true),
 ('50000000-0000-4000-a000-000000000002','eleveurs-senegal','Éleveurs du Sénégal','Aviculture, bovins, petits ruminants (démo).','elevage','00000000-0000-4000-a000-000000000005',true),
 ('50000000-0000-4000-a000-000000000003','financer-son-projet','Financer son projet agricole','Questions sur les financements et dossiers (démo).','financement','00000000-0000-4000-a000-000000000003',true)
on conflict (id) do nothing;
insert into public.group_members (group_id, user_id) values
 ('50000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000006'),
 ('50000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000003'),
 ('50000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000005'),
 ('50000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000003'),
 ('50000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000004')
on conflict do nothing;

insert into public.posts (id, author_id, group_id, kind, category, content, is_demo, created_at) values
 ('60000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000006',null,'post','maraichage',
  'Belle récolte d''oignons cette saison dans les Niayes ! Le séchage à l''ombre fait vraiment la différence pour la conservation. (publication démo)',true, now() - interval '2 hours'),
 ('60000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000003','50000000-0000-4000-a000-000000000003','question','financement',
  'Bonjour à tous, quelqu''un a-t-il déjà rédigé un plan de financement pour un projet de transformation de tomates ? Quels postes de dépenses oublie-t-on souvent ? (publication démo)',true, now() - interval '1 day'),
 ('60000000-0000-4000-a000-000000000003','00000000-0000-4000-a000-000000000004',null,'post','agriculture_durable',
  'Rappel : la rotation avec une légumineuse (niébé, arachide) aide à restaurer l''azote du sol. Pensez-y pour la prochaine campagne. (publication démo)',true, now() - interval '3 days'),
 ('60000000-0000-4000-a000-000000000004','00000000-0000-4000-a000-000000000005','50000000-0000-4000-a000-000000000002','post','elevage',
  'Nous avons installé des abreuvoirs automatiques dans notre poulailler, gain de temps énorme. (publication démo)',true, now() - interval '5 days')
on conflict (id) do nothing;
insert into public.comments (post_id, author_id, content) values
 ('60000000-0000-4000-a000-000000000002','00000000-0000-4000-a000-000000000004','Pensez au fonds de roulement des premiers mois et aux emballages, ils sont souvent sous-estimés. (démo)'),
 ('60000000-0000-4000-a000-000000000001','00000000-0000-4000-a000-000000000003','Bravo ! Vous vendez à quel prix au kilo en ce moment ? (démo)');
insert into public.likes (user_id, post_id) values
 ('00000000-0000-4000-a000-000000000003','60000000-0000-4000-a000-000000000001'),
 ('00000000-0000-4000-a000-000000000004','60000000-0000-4000-a000-000000000001'),
 ('00000000-0000-4000-a000-000000000003','60000000-0000-4000-a000-000000000003')
on conflict do nothing;

-- Candidature démo
insert into public.applications (user_id, opportunity_id, status, notes, reminder_at)
values ('00000000-0000-4000-a000-000000000003','20000000-0000-4000-a000-000000000002','preparation',
  'Rassembler les états financiers avec le comptable.', current_date + 7)
on conflict do nothing;
insert into public.saved_opportunities (user_id, opportunity_id) values
 ('00000000-0000-4000-a000-000000000003','20000000-0000-4000-a000-000000000001'),
 ('00000000-0000-4000-a000-000000000003','20000000-0000-4000-a000-000000000004')
on conflict do nothing;

-- Blog
insert into public.blog_posts (slug, title, excerpt, content, category, is_published, is_demo) values
 ('bienvenue-sur-agribridge','Bienvenue sur AgriBridge','Pourquoi nous avons créé AgriBridge et ce que la plateforme vous apporte.',
  E'AgriBridge rassemble en un seul endroit les opportunités de financement, les formations, l''expertise et le marché agricole.\n\n## Nos engagements\n- Des opportunités vérifiées, avec leur source et leur date de vérification\n- Aucune promesse de financement : nous vous aidons à préparer, vous candidatez\n- Vos données personnelles ne sont jamais vendues',
  'plateforme',true,false),
 ('5-erreurs-dossier-financement','5 erreurs fréquentes dans un dossier de financement','Les pièges à éviter pour maximiser vos chances. (article de démonstration)',
  E'## 1. Un projet flou\nDécrivez précisément votre activité.\n\n## 2. Un budget irréaliste\nAppuyez-vous sur des devis.\n\n## 3. Des pièces manquantes\nVérifiez la liste officielle.\n\n## 4. Une candidature de dernière minute\nAnticipez la date limite.\n\n## 5. Ne pas demander de retour\nUn refus est une occasion d''apprendre.',
  'conseils',true,true)
on conflict (slug) do nothing;
