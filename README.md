# Algbnb

Plateforme de reservation type Airbnb avec paiement Dahabiya sandbox, front web React/Vite, app mobile React Native et API Node/PostgreSQL.

## Demarrage local

1. Copier `controller/api/.env.example` vers `controller/api/.env`.
2. Copier `view/web/.env.example` vers `view/web/.env`.

3. Renseigner au minimum PostgreSQL, `JWT_SECRET`, `LOCATIONIQ_KEY`, `VITE_LOCATIONIQ_KEY`, `VITE_MAPTILER_KEY` et les variables Firebase si Google Auth doit etre actif.
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
- Reservation avec paiement Dahabiya sandbox et affichage du compte CCP hote.
- Favoris, avis, messagerie, notifications et dashboard hote.
- Auth classique et Google Auth via Firebase quand configure.

## Configuration cartes et Firebase

1. Ajouter `LOCATIONIQ_KEY` dans `controller/api/.env`.
2. Ajouter `VITE_LOCATIONIQ_KEY` et `VITE_MAPTILER_KEY` dans `view/web/.env`.
3. Creer projet Firebase si Google Auth doit etre teste.
4. Activer Google Auth si besoin.
5. Ajouter config Firebase client dans `view/web/.env`.
6. Ajouter domaines autorises : `http://127.0.0.1:5173`.

## Architecture

- `controller/api`: routes et controllers Express.
- `controller/client`: client API partage par les vues.
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
