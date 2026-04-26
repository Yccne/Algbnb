# Algbnb

Plateforme de reservation type Airbnb sans paiement, avec front web React/Vite, app mobile React Native et API Node/PostgreSQL.

## Demarrage local

1. Copier `controller/api/.env.example` vers `controller/api/.env`.
2. Copier `view/web/.env.example` vers `view/web/.env`.
3. Renseigner au minimum PostgreSQL, `JWT_SECRET`, `LOCATIONIQ_KEY` et les variables Firebase si Google Auth doit etre actif.
4. Lancer `start.bat`.

Le backend ecoute sur `http://127.0.0.1:3001` et le front sur `http://127.0.0.1:5173`.

## Structure du projet

- `controller`: API Express et client API partage par les vues.
- `model`: logique metier, acces SQL, validations, DTOs et configuration backend.
- `view/web`: front web React/Vite, interface principale du produit.
- `view/mobile`: app mobile React Native conservee comme app secondaire.
- `database`: schema SQL et sauvegardes locales non sensibles.
- `docs`: guides, rapport de test et documents de specification.
- `tools`: scripts utilitaires ponctuels.
- `uploads`: assets servis par l API; seuls les SVG de demo sont suivis par Git.

## Fonctionnalites principales

- Recherche et carte des logements en Algerie.
- Creation et gestion d annonces hote avec position exacte sur carte.
- Reservation sans paiement.
- Favoris, avis, messagerie, notifications et dashboard hote.
- Auth classique et connexions Google/Facebook via Firebase quand la configuration est disponible.
- Administration des utilisateurs, annonces et litiges.

## Configuration Google/Facebook Auth avec Firebase

Google/Facebook Auth reste une fonctionnalite produit, mais l application doit continuer a charger si Firebase n est pas encore configure localement.

1. Creer un projet Firebase pour `algbnb`.
2. Activer `Authentication > Sign-in method > Google`.
3. Activer `Authentication > Sign-in method > Facebook` et renseigner l App ID/secret Meta dans Firebase Console.
4. Creer une application Web Firebase.
5. Copier la configuration client dans `view/web/.env`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
6. Ajouter `http://127.0.0.1:5173` et `http://localhost:5173` dans les domaines autorises si Firebase le demande.
7. Generer une cle Admin SDK depuis `Project settings > Service accounts`.
8. Copier les valeurs Admin dans `controller/api/.env`:
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Tant que ces valeurs ne sont pas presentes:

- la landing charge normalement;
- l auth classique fonctionne;
- les boutons Google/Facebook restent visibles mais indisponibles avec un message explicite.

## Architecture Model / View / Controller

La racine expose une architecture MVC lisible, tout en gardant une separation interne maintenable:

- `controller/api`: routes HTTP, controllers Express, middlewares et scripts API.
- `controller/client`: client API utilise par les vues web/mobile.
- `model/api/services`: logique metier, permissions et orchestration.
- `model/api/repositories`: toutes les requetes SQL et transactions PostgreSQL.
- `model/api/validators`: normalisation et validation des entrees.
- `model/api/models`: DTOs et formatteurs de reponses reutilisables.
- `model/api/config`, `model/api/utils` et `model/api/db.js`: configuration, helpers techniques et connexion PostgreSQL.
- `view/web` et `view/mobile`: vues utilisateur; elles appellent le controller client et ne parlent jamais directement au model.

Pour verifier les frontieres MVC:

```bash
npm.cmd run check:mvc
```

La commande echoue si du SQL sort des repositories, si un service/repository manipule `req` ou `res`, ou si une route/controller accede directement a la base.

## Tests

Depuis la racine:

```bash
npm.cmd run check:mvc
npm.cmd run qa:web-api
npm.cmd run audit:web
npm.cmd run lint
npm.cmd run build
```

`qa:web-api` verifie notamment que le parcours reservation reste sans paiement.

## Documentation complementaire

- `docs/SETUP.md`: configuration detaillee locale, PostgreSQL et Firebase.
- `docs/TEST_REPORT.md`: rapport des derniers tests manuels/API.
- `database/bdd.sql`: schema SQL de reference.
