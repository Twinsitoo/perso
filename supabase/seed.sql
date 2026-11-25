-- =====================================================================
-- RonyIA — données de démo (20 prospects fictifs + historique)
--
-- 1) Exécute ce fichier une fois dans le SQL Editor : il crée la fonction.
-- 2) Ensuite, deux façons de charger les données :
--    - dans l'app : Paramètres > Données de démo > « Charger les données de démo »
--    - en SQL :     select public.seed_demo_data((select id from auth.users where email = 'ton@email.fr'));
--
-- Toutes les dates sont relatives à aujourd'hui pour que le dashboard soit vivant.
-- Les prospects de démo sont marqués is_demo = true et peuvent être supprimés d'un clic.
-- =====================================================================

create or replace function public.seed_demo_data(p_user uuid default auth.uid())
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted integer;
  today date := (now() at time zone 'Europe/Paris')::date;
begin
  if p_user is null then
    raise exception 'Utilisateur inconnu : connecte-toi ou passe un user id.';
  end if;

  insert into public.settings (user_id) values (p_user) on conflict (user_id) do nothing;

  with data (company, contact_name, job_title, email, phone, linkedin, website, city, sector, source, stage,
             amount, priority, follow_up_in, call_in_hours, needs, lost_reason, signed_days_ago, created_days_ago) as (
    values
      ('Horizon Immobilier', 'Claire Martin', 'Directrice d''agence', 'c.martin@horizon-immo.example', '01 99 00 12 01',
       'https://www.linkedin.com/in/exemple-claire-martin', 'https://horizon-immo.example', 'Lyon', 'Immobilier', 'LinkedIn', 'negociation',
       6800, 'haute', 0, null, 'Qualification automatique des leads entrants (SeLoger, Leboncoin) + relances SMS via n8n.', null, null, 41),
      ('Cabinet Durand & Associés', 'Marc Durand', 'Expert-comptable associé', 'm.durand@durand-associes.example', '01 99 00 12 02',
       'https://www.linkedin.com/in/exemple-marc-durand', 'https://durand-associes.example', 'Paris', 'Expertise comptable', 'Réseau', 'devis',
       9500, 'haute', 2, null, 'Extraction automatique des factures fournisseurs (OCR + IA) et pré-saisie dans le logiciel comptable.', null, null, 33),
      ('Maison Lumen', 'Sarah Benali', 'Fondatrice', 'sarah@maison-lumen.example', '01 99 00 12 03',
       'https://www.linkedin.com/in/exemple-sarah-benali', 'https://maison-lumen.example', 'Bordeaux', 'E-commerce', 'Cold email', 'call',
       4200, 'moyenne', null, 26, 'Agent IA de SAV sur Shopify + automatisation du suivi des retours.', null, null, 18),
      ('BTP Rénov Sud', 'Julien Ferrand', 'Gérant', 'j.ferrand@btp-renov-sud.example', '01 99 00 12 04',
       'https://www.linkedin.com/in/exemple-julien-ferrand', 'https://btp-renov-sud.example', 'Marseille', 'BTP', 'Bouche-à-oreille', 'discussion',
       7500, 'moyenne', -2, null, 'Génération automatique des devis à partir des visites de chantier (notes vocales → devis).', null, null, 25),
      ('Clinique Vétérinaire des Alpes', 'Dr Élise Roux', 'Vétérinaire associée', 'e.roux@veto-alpes.example', '01 99 00 12 05',
       null, 'https://veto-alpes.example', 'Grenoble', 'Santé', 'Événement', 'contacte',
       3200, 'basse', 5, null, 'Prise de RDV et rappels automatiques, agent vocal pour les appels hors horaires.', null, null, 9),
      ('Agence Pixel Nord', 'Thomas Lefèvre', 'CEO', 'thomas@pixelnord.example', '01 99 00 12 06',
       'https://www.linkedin.com/in/exemple-thomas-lefevre', 'https://pixelnord.example', 'Lille', 'Marketing', 'LinkedIn', 'signe',
       12000, 'haute', null, null, 'Reporting client automatisé (Meta Ads + Google Ads → dashboards Looker) et génération de contenus.', null, 12, 70),
      ('Optique Vision Plus', 'Nadia Cherif', 'Responsable réseau', 'n.cherif@visionplus.example', '01 99 00 12 07',
       'https://www.linkedin.com/in/exemple-nadia-cherif', 'https://visionplus.example', 'Nantes', 'Retail', 'Cold email', 'nouveau',
       5000, 'moyenne', 1, null, 'Centraliser les avis Google des 8 magasins et répondre automatiquement avec l''IA.', null, null, 2),
      ('Transports Garnier', 'Philippe Garnier', 'Directeur général', 'p.garnier@transports-garnier.example', '01 99 00 12 08',
       null, 'https://transports-garnier.example', 'Rouen', 'Logistique', 'Réseau', 'signe',
       18500, 'haute', null, null, 'Automatisation des bons de livraison, rapprochement factures et alertes retards clients.', null, 48, 120),
      ('Studio Yoga Prana', 'Camille Petit', 'Gérante', 'camille@yoga-prana.example', '01 99 00 12 09',
       'https://www.linkedin.com/in/exemple-camille-petit', 'https://yoga-prana.example', 'Montpellier', 'Bien-être', 'Site web', 'perdu',
       1800, 'basse', null, null, 'Chatbot Instagram pour les réservations de cours.', 'Budget insuffisant', null, 60),
      ('Avocats Mercier', 'Me Laurent Mercier', 'Avocat associé', 'l.mercier@mercier-avocats.example', '01 99 00 12 10',
       'https://www.linkedin.com/in/exemple-laurent-mercier', 'https://mercier-avocats.example', 'Paris', 'Juridique', 'Réseau', 'devis',
       8200, 'haute', -1, null, 'Assistant IA de recherche documentaire interne + automatisation de l''ouverture de dossiers.', null, null, 28),
      ('Garage Auto Pro 31', 'Karim Haddad', 'Gérant', 'contact@autopro31.example', '01 99 00 12 11',
       null, 'https://autopro31.example', 'Toulouse', 'Automobile', 'Bouche-à-oreille', 'contacte',
       2600, 'basse', 3, null, 'Relances automatiques entretien / contrôle technique par SMS.', null, null, 6),
      ('Hôtel Les Embruns', 'Isabelle Morel', 'Directrice', 'direction@les-embruns.example', '01 99 00 12 12',
       'https://www.linkedin.com/in/exemple-isabelle-morel', 'https://les-embruns.example', 'La Rochelle', 'Hôtellerie', 'Événement', 'call',
       6000, 'haute', null, 50, 'Concierge IA multilingue (WhatsApp) + synchronisation des réservations.', null, null, 15),
      ('RH Talents Conseil', 'Aurélie Blanc', 'Associée', 'a.blanc@rh-talents.example', '01 99 00 12 13',
       'https://www.linkedin.com/in/exemple-aurelie-blanc', 'https://rh-talents.example', 'Lyon', 'Ressources humaines', 'LinkedIn', 'signe',
       9800, 'moyenne', null, null, 'Tri automatique des CV avec scoring IA et intégration ATS.', null, 85, 150),
      ('Boulangeries Fournil & Co', 'Antoine Girard', 'Fondateur', 'antoine@fournil-co.example', '01 99 00 12 14',
       null, 'https://fournil-co.example', 'Dijon', 'Food', 'Cold email', 'nouveau',
       3500, 'moyenne', 0, null, 'Prévision de production par boutique à partir des ventes et de la météo.', null, null, 1),
      ('Immo Prestige Riviera', 'Sophie Lambert', 'Responsable marketing', 's.lambert@prestige-riviera.example', '01 99 00 12 15',
       'https://www.linkedin.com/in/exemple-sophie-lambert', 'https://prestige-riviera.example', 'Nice', 'Immobilier', 'LinkedIn', 'discussion',
       11000, 'haute', 4, null, 'Génération automatique d''annonces multilingues + visites virtuelles commentées par IA.', null, null, 20),
      ('Cabinet Kiné Santé+', 'Hugo Fontaine', 'Kinésithérapeute', 'h.fontaine@kine-sante.example', '01 99 00 12 16',
       null, null, 'Rennes', 'Santé', 'Site web', 'perdu',
       2200, 'basse', null, null, 'Rappels de RDV et questionnaire patient automatisé.', 'A choisi un concurrent', null, 45),
      ('Domaine Saint-Clair', 'Pierre Vidal', 'Directeur commercial', 'p.vidal@domaine-saintclair.example', '01 99 00 12 17',
       'https://www.linkedin.com/in/exemple-pierre-vidal', 'https://domaine-saintclair.example', 'Bordeaux', 'Vins & spiritueux', 'Réseau', 'negociation',
       14500, 'haute', 1, null, 'CRM + prospection B2B automatisée vers cavistes et restaurants, scoring des leads.', null, null, 37),
      ('EcoHabitat Conseil', 'Léa Moreau', 'Gérante', 'lea@ecohabitat.example', '01 99 00 12 18',
       'https://www.linkedin.com/in/exemple-lea-moreau', 'https://ecohabitat.example', 'Strasbourg', 'Énergie', 'Cold email', 'contacte',
       4800, 'moyenne', -4, null, 'Qualification des demandes d''audit énergétique et prise de RDV automatique.', null, null, 12),
      ('Startup Fleetly', 'Yanis Okafor', 'COO', 'yanis@fleetly.example', '01 99 00 12 19',
       'https://www.linkedin.com/in/exemple-yanis-okafor', 'https://fleetly.example', 'Paris', 'SaaS', 'LinkedIn', 'signe',
       7200, 'moyenne', null, null, 'Onboarding client automatisé et agent IA de support niveau 1.', null, 26, 64),
      ('Pharmacie du Marché', 'Valérie Simon', 'Pharmacienne titulaire', 'v.simon@pharma-marche.example', '01 99 00 12 20',
       null, null, 'Lille', 'Santé', 'Bouche-à-oreille', 'nouveau',
       2900, 'basse', 6, null, 'Gestion automatisée des commandes fournisseurs et alertes de stock.', null, null, 0)
  )
    insert into public.prospects (
      user_id, company, contact_name, job_title, email, phone, linkedin_url, website, city, sector, source, stage,
      estimated_amount, priority, next_follow_up, next_call_at, needs, lost_reason, signed_at, is_demo, created_at
    )
    select
      p_user, d.company, d.contact_name, d.job_title, d.email, d.phone, d.linkedin, d.website, d.city, d.sector, d.source, d.stage,
      d.amount, d.priority,
      case when d.follow_up_in is null then null else today + d.follow_up_in end,
      case when d.call_in_hours is null then null
           else date_trunc('hour', now()) + make_interval(hours => d.call_in_hours) end,
      d.needs, d.lost_reason,
      case when d.signed_days_ago is null then null else now() - make_interval(days => d.signed_days_ago) end,
      true,
      now() - make_interval(days => d.created_days_ago)
    from data d;

  -- Instruction séparée : la policy RLS des interactions doit « voir » les prospects insérés.
  insert into public.interactions (user_id, prospect_id, type, occurred_at, notes)
  select p_user, pr.id, i.type, now() - make_interval(days => i.days_ago), i.notes
  from public.prospects pr
  join (values
    ('Horizon Immobilier', 'linkedin', 38, 'Premier message après son post sur la gestion des leads.'),
    ('Horizon Immobilier', 'call', 30, 'Call découverte : 120 leads/mois, 40 % jamais rappelés.'),
    ('Horizon Immobilier', 'rdv', 14, 'Démo du workflow n8n de qualification. Très intéressée.'),
    ('Horizon Immobilier', 'email', 3, 'Envoi de la proposition révisée (remise de 10 % si signature avant fin du mois).'),
    ('Cabinet Durand & Associés', 'call', 25, 'Présentation par Jérôme (réseau BNI). 3 000 factures / mois à traiter.'),
    ('Cabinet Durand & Associés', 'email', 6, 'Devis envoyé : setup + abonnement maintenance mensuel.'),
    ('Maison Lumen', 'email', 16, 'Réponse au cold email : intéressée par un agent SAV.'),
    ('Maison Lumen', 'call', 8, 'Qualification : 60 tickets / jour. Démo planifiée.'),
    ('BTP Rénov Sud', 'call', 20, 'Recommandé par un client. Perd 6 h / semaine sur les devis.'),
    ('BTP Rénov Sud', 'rdv', 9, 'Visite sur place, récupération d''exemples de devis.'),
    ('Clinique Vétérinaire des Alpes', 'rdv', 9, 'Rencontre au salon Tech & Santé.'),
    ('Agence Pixel Nord', 'linkedin', 65, 'Échange suite à un commentaire sur mon post n8n.'),
    ('Agence Pixel Nord', 'rdv', 40, 'Atelier de cadrage avec l''équipe.'),
    ('Agence Pixel Nord', 'email', 12, 'Contrat signé 🎉 Kick-off la semaine prochaine.'),
    ('Transports Garnier', 'call', 110, 'Premier échange via le réseau CCI.'),
    ('Transports Garnier', 'rdv', 60, 'Présentation au comité de direction.'),
    ('Transports Garnier', 'email', 48, 'Bon de commande reçu.'),
    ('Studio Yoga Prana', 'email', 55, 'Demande via le formulaire du site.'),
    ('Studio Yoga Prana', 'call', 50, 'Budget trop serré pour le moment, à recontacter dans 6 mois.'),
    ('Avocats Mercier', 'rdv', 22, 'Déjeuner de présentation.'),
    ('Avocats Mercier', 'email', 10, 'Devis envoyé avec 2 options.'),
    ('Garage Auto Pro 31', 'call', 5, 'Appel entrant, recommandé par Fournil & Co.'),
    ('Hôtel Les Embruns', 'rdv', 14, 'Rencontre au salon Hôtellerie Ouest.'),
    ('Hôtel Les Embruns', 'email', 4, 'Confirmation de la démo concierge WhatsApp.'),
    ('RH Talents Conseil', 'linkedin', 140, 'Prise de contact LinkedIn.'),
    ('RH Talents Conseil', 'email', 85, 'Signature du contrat.'),
    ('Immo Prestige Riviera', 'linkedin', 18, 'Message suite à la publication de son annonce de recrutement.'),
    ('Immo Prestige Riviera', 'call', 7, 'Besoin validé, attend l''accord du directeur.'),
    ('Cabinet Kiné Santé+', 'call', 40, 'A finalement choisi une solution logicielle tout-en-un.'),
    ('Domaine Saint-Clair', 'rdv', 30, 'Dégustation + présentation de la démarche.'),
    ('Domaine Saint-Clair', 'email', 5, 'Contre-proposition reçue, négociation sur le périmètre.'),
    ('EcoHabitat Conseil', 'email', 11, 'Cold email ouvert 3 fois, réponse positive.'),
    ('Startup Fleetly', 'linkedin', 60, 'Contact via un post sur les agents IA.'),
    ('Startup Fleetly', 'call', 35, 'Démo de l''agent support.'),
    ('Startup Fleetly', 'email', 26, 'Signature électronique reçue.')
  ) as i (company, type, days_ago, notes) on i.company = pr.company
  where pr.user_id = p_user and pr.is_demo;

  select count(*) into inserted from public.prospects where user_id = p_user and is_demo;
  return inserted;
end;
$$;

grant execute on function public.seed_demo_data(uuid) to authenticated;
