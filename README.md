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
- Auth classique et Google/Facebook Auth via Firebase quand configure.

## Configuration Firebase

1. Creer projet Firebase.
2. Activer Google et Facebook Auth si besoin.
3. Ajouter config dans `view/web/.env`.
4. Ajouter domaines autorises : `http://127.0.0.1:5173`.

## Architecture

- `controller/api`: routes et controllers Express.
- `model/api/services`: logique metier.
- `model/api/repositories`: SQL uniquement.
- `model/api/validators`: validation inputs.
- `model/api/models`: DTOs.
- `view/web` et `view/mobile`: frontends.

## Tests

```bash
npm.cmd run check:mvc
npm.cmd run qa:web-api
npm.cmd run audit:web
npm.cmd run lint
npm.cmd run build