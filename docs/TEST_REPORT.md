# Rapport De Test - Algbnb

Derniere passe automatisee: 26 avril 2026.

## Resultat

- API QA: 37/37 scenarios OK.
- Audit navigateur: 15/15 scenarios OK.
- MVC boundary check: OK.
- Build front: OK.
- Lint front: OK, sans warnings React Hook.

## Scenarios Couverts

- Healthcheck API et connexion PostgreSQL.
- Auth inscription, doublon, connexion, provider Google et reset password.
- Recherche publique, carte, detail logement et disponibilites.
- Creation annonce hote avec validation front/back et coherence geographique.
- Favoris, reservations, paiement Dahabiya sandbox, confirmation hote et avis.
- Messages, notifications, dashboard hote et admin.
- Verification explicite qu une ligne `paiement` est creee par le parcours QA Dahabiya.

## Donnees QA

Les comptes et annonces de test sont prefixes `qa.codex.*` et `[QA GEO]` pour rester identifiables.

## Notes

Ce rapport ne contient volontairement aucun secret, mot de passe local, cle Firebase reelle ou contenu de `.env`.
