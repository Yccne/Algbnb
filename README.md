# Algbnb 🏠

**Plateforme de location de logements de courte durée** - PFE (Projet de Fin d'Études)

## 🎯 Fonctionnalités principales

- ✅ Authentification Google avec Firebase
- ✅ Gestion des logements et annonces
- ✅ Système de réservation
- ✅ Messagerie entre utilisateurs
- ✅ Avis et notes des logements
- ✅ Tableau de bord pour hôtes
- ✅ Gestion des paiements

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 12+
- Compte Firebase (gratuit)

### Installation

1. **Clonez le repository**
   ```bash
   git clone https://github.com/Yccne/Algbnb.git
   cd Algbnb
   ```

2. **Suivez le guide de configuration**
   - [📖 Guide complet: SETUP.md](./SETUP.md)

3. **Démarrez l'application**
   ```bash
   # Terminal 1 - Backend
   cd rout && npm install && npm start
   
   # Terminal 2 - Frontend
   cd apps/web-view && npm install && npm run dev
   ```

---

## 🔐 Authentification Google Firebase

### Configuration requise:

1. **Créer un projet Firebase**
   - https://console.firebase.google.com/
   - Activez "Google Sign-In" dans Authentification

2. **Configurer Google OAuth 2.0**
   - https://console.cloud.google.com/
   - Créez des identifiants OAuth pour votre app web

3. **Variables d'environnement**
   - Copier `.env.example` → `.env` dans `rout/` et `apps/web-view/`
   - Ajouter vos clés Firebase

👉 **[Guide détaillé: SETUP.md](./SETUP.md)**

---

## 📁 Structure du projet

```
Algbnb/
├── rout/                 # Backend (Express.js + PostgreSQL)
├── apps/
│   ├── web-view/        # Frontend web (React + Vite)
│   └── mobile-view/      # App mobile (React Native)
├── packages/
│   └── core/            # Code partagé
├── uploads/             # Stockage fichiers
└── bdd.sql              # Schéma base de données
```

---

## 🛠️ Stack technologique

### Backend
- **Express.js** - Framework HTTP
- **PostgreSQL** - Base de données
- **Firebase Admin SDK** - Authentification
- **JWT** - Tokens sécurisés

### Frontend
- **React 19** - Framework UI
- **Vite** - Build tool
- **Firebase SDK** - Authentification client
- **React Router** - Navigation

---

## 📝 Configuration détaillée

👉 Voir [SETUP.md](./SETUP.md) pour:
- Configuration PostgreSQL
- Configuration Firebase & Google Sign-In
- Variables d'environnement
- Dépannage des erreurs courantes

---

## 🤝 Contribution

Les contributions sont bienvenues ! Assurez-vous de:
1. Faire un fork du projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

---

## 📧 Support

Pour les questions ou problèmes:
- Ouvrez une [Issue GitHub](https://github.com/Yccne/Algbnb/issues)
- Consultez [SETUP.md](./SETUP.md) pour le dépannage

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour les détails.

---

**Dernière mise à jour:** Avril 2026
