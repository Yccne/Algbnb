# Algbnb

Plateforme de reservation type Airbnb sans paiement, avec front web React/Vite et API Node/PostgreSQL.

## Demarrage local

1. Copier `rout/.env.example` vers `rout/.env`.
2. Copier `apps/web-view/.env.example` vers `apps/web-view/.env`.
3. Renseigner au minimum la base PostgreSQL, `JWT_SECRET`, `LOCATIONIQ_KEY` et `VITE_MAPTILER_KEY`.
4. Lancer `start.bat`.

Le backend ecoute sur `http://127.0.0.1:3001` et le front sur `http://127.0.0.1:5173`.

## Variables d environnement

- `rout/.env`
  Variables backend PostgreSQL, JWT, Firebase Admin et services externes.
- `apps/web-view/.env`
  Variables front Vite, notamment Firebase client et MapTiler.

## Configuration Google Auth avec Firebase

Google Auth reste obligatoire cote produit, mais l application ne doit plus planter si Firebase n est pas encore configure localement.

1. Creer un projet Firebase nomme `algbnb`.
2. Dans `Authentication > Sign-in method`, activer `Google`.
3. Dans Firebase, creer une application Web pour le front.
4. Recuperer la configuration cliente et la copier dans `apps/web-view/.env`:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
5. Ajouter `http://127.0.0.1:5173` et `http://localhost:5173` dans les domaines autorises de l authentification si Firebase le demande.
6. Depuis `Project settings > Service accounts`, generer une cle Admin SDK.
7. Reporter `project_id`, `client_email` et `private_key` dans `rout/.env` via:
   `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Tant que ces valeurs ne sont pas presentes:
- la landing doit continuer a se charger normalement
- l auth classique doit continuer a fonctionner
- le bouton Google reste visible mais indisponible avec un message explicite

## Architecture MVC Backend

L API Express suit maintenant une separation MVC stricte:

- `rout/routes`: declare uniquement les URLs, middlewares et controllers.
- `rout/controllers`: lit `req`, appelle un service, renvoie `res`.
- `rout/services`: porte la logique metier, les permissions et l orchestration.
- `rout/repositories`: contient toutes les requetes SQL et transactions PostgreSQL.
- `rout/validators`: normalise et valide les entrees.
- `rout/models`: formatte les DTOs/reponses reutilisables.
- `rout/config` et `rout/utils`: gardent la configuration et les helpers techniques.

Pour verifier les frontieres MVC:

```bash
npm.cmd --prefix rout run check:mvc
```

La commande echoue si du SQL sort des repositories, si un service/repository manipule `req` ou `res`, ou si une route/controller accede directement a la base.
