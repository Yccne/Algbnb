# Guide De Configuration - Algbnb

## Prerequis

- Node.js 18+
- PostgreSQL 12+
- Un projet Firebase si Google Auth doit etre teste

## Backend

1. Copier l exemple:

```bash
copy controller\api\.env.example controller\api\.env
```

2. Renseigner PostgreSQL et JWT dans `controller/api/.env`:

```env
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=projet
PGUSER=postgres
PGPASSWORD=replace_me
JWT_SECRET=replace_me_with_a_long_random_secret
LOCATIONIQ_KEY=replace_me
```

3. Initialiser la base si necessaire:

```bash
psql -U postgres -d projet -f database/bdd.sql
```

4. Lancer l API:

```bash
npm.cmd --prefix controller/api run start
```

L API doit repondre sur `http://127.0.0.1:3001/api/health`.

## Front Web

1. Copier l exemple:

```bash
copy view\web\.env.example view\web\.env
```

2. Renseigner au minimum:

```env
VITE_API_URL=http://127.0.0.1:3001/api
VITE_LOCATIONIQ_KEY=replace_me
VITE_MAPTILER_KEY=replace_me
```

3. Lancer Vite:

```bash
npm.cmd --prefix view/web run dev -- --host 0.0.0.0
```

Le front doit repondre sur `http://127.0.0.1:5173`.

## Google Auth Firebase

1. Creer un projet Firebase.
2. Activer `Authentication > Sign-in method > Google`.
3. Creer une application Web Firebase.
4. Copier les variables client dans `view/web/.env`.
5. Generer une cle Admin SDK.
6. Copier `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` et `FIREBASE_PRIVATE_KEY` dans `controller/api/.env`.

Sans ces variables, le site doit continuer a fonctionner: seule l'action Google est desactivee avec un message clair.

## Commandes De Validation

Depuis la racine:

```bash
npm.cmd run check:mvc
npm.cmd run qa:web-api
npm.cmd run audit:web
npm.cmd run lint
npm.cmd run build
```

## Depannage Rapide

- PostgreSQL refuse la connexion: verifier le service PostgreSQL et `PGPASSWORD`.
- Google Auth indisponible: verifier les variables Firebase front et Admin backend.
- La carte/recherche ne geocode pas: verifier `LOCATIONIQ_KEY`, `VITE_LOCATIONIQ_KEY` et `VITE_MAPTILER_KEY`.
- Le front appelle la mauvaise URL: verifier que `VITE_API_URL` finit par `/api`.
