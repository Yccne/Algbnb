# Algbnb

Plateforme de reservation type Airbnb sans paiement, avec front web React/Vite, app mobile React Native et API Node/PostgreSQL.

## Demarrage local

1. Copier `rout/.env.example` vers `rout/.env`.
2. Copier `apps/web-view/.env.example` vers `apps/web-view/.env`.
3. Renseigner au minimum PostgreSQL, `JWT_SECRET`, `LOCATIONIQ_KEY` et les variables Firebase si Google Auth doit etre actif.
4. Lancer `start.bat`.

Le backend ecoute sur `http://127.0.0.1:3001` et le front sur `http://127.0.0.1:5173`.

## Fonctionnalites principales

- Recherche et carte des logements en Algerie.
- Creation et gestion d annonces hote avec position exacte sur carte.
- Reservation sans paiement.
- Favoris, avis, messagerie, notifications et dashboard hote.
- Auth classique et Google Auth via Firebase quand la configuration est disponible.
- Administration des utilisateurs, annonces et litiges.

## Configuration Google Auth avec Firebase

Google Auth reste une fonctionnalite produit, mais l application doit continuer a charger si Firebase n est pas encore configure localement.

1. Creer un projet Firebase pour `algbnb`.
2. Activer `Authentication > Sign-in method > Google`.
3. Creer une application Web Firebase.
4. Copier la configuration client dans `apps/web-view/.env`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
5. Ajouter `http://127.0.0.1:5173` et `http://localhost:5173` dans les domaines autorises si Firebase le demande.
6. Generer une cle Admin SDK depuis `Project settings > Service accounts`.
7. Copier les valeurs Admin dans `rout/.env`:
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Tant que ces valeurs ne sont pas presentes:

- la landing charge normalement;
- l auth classique fonctionne;
- le bouton Google reste visible mais indisponible avec un message explicite.

## Architecture MVC Backend

L API Express suit une separation MVC stricte:

- `rout/routes`: declare uniquement les URLs, middlewares et controllers.
- `rout/controllers`: lit `req`, appelle un service, renvoie `res`.
- `rout/services`: porte la logique metier, les permissions et l orchestration.
- `rout/repositories`: contient toutes les requetes SQL et transactions PostgreSQL.
- `rout/validators`: normalise et valide les entrees.
- `rout/models`: formatte les DTOs/reponses reutilisables.
- `rout/config` et `rout/utils`: gardent la configuration et les helpers techniques.

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

- `SETUP.md`: configuration detaillee locale, PostgreSQL et Firebase.
- `TEST_REPORT.md`: rapport des derniers tests manuels/API.
