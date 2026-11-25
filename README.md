# RonyIA — Suivi de prospection

Mini-CRM + dashboard de prospection pour l'agence d'automatisation IA RonyIA. **Accès direct, sans connexion.**

- **Dashboard** : KPI (prospects, actifs, calls de la semaine, signés du mois, CA signé, CA potentiel, conversion), objectifs mensuels, graphiques par étape et par mois, « À faire aujourd'hui », derniers prospects
- **Pipeline** : Kanban en glisser-déposer (souris et tactile), total € par colonne, raison demandée au passage en « Perdu »
- **Prospects** : tableau avec recherche, filtres (étape, priorité, source, ville), tri par colonne, import / export CSV
- **Fiche prospect** : toutes les infos, boutons Appeler / Email / LinkedIn, historique des interactions, modifier / supprimer / marquer comme perdu
- **Agenda** : calendrier mensuel des relances et calls, retards en rouge
- **Paramètres** : étapes du pipeline, sources, objectifs mensuels, données de démo, sauvegarde / restauration

Stack : Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Recharts · dnd-kit.

## Où sont mes données ?

Il n'y a ni compte ni base de données en ligne : **les données sont enregistrées dans le navigateur** (localStorage) de l'appareil utilisé.

- Au premier lancement, l'app est remplie avec 20 prospects de démo (supprimables dans **Paramètres → Données de démo**).
- Chaque navigateur / appareil a ses propres données : ce que tu saisis sur ton PC n'apparaît pas sur ton téléphone.
- Vider les données du navigateur efface tout → utilise **Paramètres → Sauvegarde des données → Télécharger une sauvegarde** régulièrement. Le fichier `.json` se restaure en un clic, y compris sur un autre appareil.
- L'adresse Vercel est publique, mais chaque visiteur ne voit que les données de son propre navigateur (au départ, la démo).

## Lancer en local

Prérequis : Node.js 20+.

```powershell
npm install
npm run dev
```

Puis ouvre http://localhost:3000.

## Pousser sur GitHub

```powershell
git add .
git commit -m "Mise à jour"
git push origin main
```

## Déployer sur Vercel

1. [vercel.com/new](https://vercel.com/new) → connecte-toi avec GitHub → importe le repo `perso`.
2. Garde les réglages proposés (préréglage **Next.js**), aucune variable d'environnement n'est nécessaire.
3. **Deploy**.

Ensuite, chaque `git push` sur `main` redéploie automatiquement.

## Structure

```
app/(app)/                    Pages (dashboard, pipeline, prospects, agenda, paramètres)
components/views/             Vues des pages (lisent les données locales)
components/                   UI (shadcn/ui) et composants métier
lib/store.ts                  Données locales + toutes les actions (prospects, interactions, réglages, sauvegarde)
lib/demo-data.ts              20 prospects de démo
lib/stats.ts                  Calcul des KPI
lib/csv.ts, lib/format.ts     Import/export CSV, formats fr-FR (heure de Paris)
lib/validation.ts             Validation des formulaires
```

## Notes

- **Étapes** : « Signé » et « Perdu » sont fixes (renommables) ; les autres étapes sont libres. La date de signature se remplit automatiquement au passage en « Signé ».
- **Import CSV** : colonnes reconnues : Entreprise (obligatoire), Contact, Poste, Email, Téléphone, LinkedIn, Site web, Ville, Secteur, Source, Étape, Montant estimé, Priorité, Prochaine relance, Besoins. Séparateur `,` ou `;`. L'export s'ouvre directement dans Excel.
- **Plus tard** : pour retrouver les mêmes données sur tous tes appareils, il faudra brancher une base en ligne (ex. Supabase). La première version avec Supabase est dans l'historique Git (commit initial).
