# RonyIA — Suivi de prospection

Mini-CRM + dashboard de prospection pour l'agence d'automatisation IA RonyIA.

- **Dashboard** : KPI (prospects, actifs, calls de la semaine, signés du mois, CA signé, CA potentiel, conversion), objectifs mensuels, graphiques par étape et par mois, « À faire aujourd'hui », derniers prospects
- **Pipeline** : Kanban en glisser-déposer (souris et tactile), total € par colonne, raison demandée au passage en « Perdu »
- **Prospects** : tableau avec recherche, filtres (étape, priorité, source, ville), tri par colonne, import / export CSV
- **Fiche prospect** : toutes les infos, boutons Appeler / Email / LinkedIn, historique des interactions, modifier / supprimer / marquer comme perdu
- **Agenda** : calendrier mensuel des relances et calls, retards en rouge
- **Paramètres** : étapes du pipeline, sources, objectifs mensuels, données de démo

Stack : Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase (Postgres + Auth + RLS) · Recharts · dnd-kit.

---

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → **New project** (région *West EU (Paris)* conseillée). Note le mot de passe de la base.
2. Une fois le projet prêt, ouvre **SQL Editor → New query**, colle le contenu de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) et clique **Run**.
   → crée les tables `prospects`, `interactions`, `settings`, la Row Level Security et les triggers.
3. Nouvelle requête : colle [`supabase/seed.sql`](supabase/seed.sql) et clique **Run**.
   → crée la fonction `seed_demo_data()` (les données seront chargées depuis l'app).
4. **Authentication → Sign In / Providers → Email** : laisse *Email* activé.
   - Pour aller vite (usage perso), désactive **Confirm email** : le compte est utilisable immédiatement.
   - Si tu la gardes activée, va dans **Authentication → URL Configuration** et renseigne
     *Site URL* (`http://localhost:3000` en local, puis l'URL Vercel) et ajoute `https://ton-app.vercel.app/auth/callback` dans *Redirect URLs*.

## 2. Variables d'environnement (`.env.local`)

Dans Supabase : **Project Settings → API** (ou **Connect**), récupère :

- **Project URL**
- **anon / publishable key** (jamais la `service_role` / secret key)

Puis à la racine du projet :

```powershell
Copy-Item .env.example .env.local
```

et remplis :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...   # ou sb_publishable_...
```

> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` est aussi accepté à la place de `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 3. Lancer en local

Prérequis : Node.js 20+.

```powershell
npm install
npm run dev
```

Ouvre http://localhost:3000 → **Créer un compte** → puis **Paramètres → Charger les données de démo** pour remplir le dashboard (20 prospects fictifs, supprimables en un clic).

## 4. Pousser sur GitHub

```powershell
git add .
git commit -m "Mise à jour"
git push origin main
```

(`.env.local` est ignoré par git : tes clés ne partent jamais sur GitHub.)

## 5. Déployer sur Vercel

1. [vercel.com](https://vercel.com) → **Add New… → Project** → importe le repo GitHub `perso`.
2. Framework : **Next.js** (détecté automatiquement), aucune autre option à changer.
3. **Environment Variables** : ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (mêmes valeurs que `.env.local`).
4. **Deploy**.
5. De retour dans Supabase → **Authentication → URL Configuration** : mets l'URL Vercel en *Site URL* et ajoute `https://<ton-app>.vercel.app/auth/callback` dans *Redirect URLs*.

Chaque `git push` sur `main` redéploie automatiquement.

---

## Structure

```
app/
  (auth)/login, signup        Connexion / inscription
  (app)/                      Zone protégée (sidebar)
    page.tsx                  Dashboard
    pipeline/                 Kanban
    prospects/                Tableau, nouveau, fiche [id], modifier
    agenda/                   Calendrier des relances
    parametres/               Étapes, sources, objectifs, démo
  auth/callback/              Confirmation email Supabase
components/                   UI (shadcn/ui) et composants métier
lib/
  actions/                    Server Actions (prospects, réglages, auth)
  supabase/                   Clients Supabase navigateur / serveur
  queries.ts, stats.ts        Lecture des données et calcul des KPI
  csv.ts, format.ts           Import/export CSV, formats fr-FR (heure de Paris)
proxy.ts                      Rafraîchit la session et protège les pages
supabase/
  migrations/0001_init.sql    Schéma + RLS + triggers
  seed.sql                    Fonction de données de démo
```

## Notes

- **Sécurité** : chaque table a la Row Level Security activée ; un utilisateur ne voit et ne modifie que ses propres lignes. Testé : un second compte ne voit aucune donnée du premier et ne peut rien y écrire.
- **Étapes** : « Signé » (clé `signe`) et « Perdu » (clé `perdu`) sont fixes ; les autres étapes sont libres. La date de signature est remplie automatiquement par la base au passage en « Signé ».
- **Dates** : relances et calls sont calculés en heure de Paris.
- **Import CSV** : colonnes reconnues : Entreprise (obligatoire), Contact, Poste, Email, Téléphone, LinkedIn, Site web, Ville, Secteur, Source, Étape, Montant estimé, Priorité, Prochaine relance, Besoins. Séparateur `,` ou `;`. L'export s'ouvre directement dans Excel.
