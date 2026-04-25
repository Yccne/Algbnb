# 🚀 Guide de Configuration - Algbnb

## Installation & Configuration de l'Authentification Google Firebase

### 📋 Prérequis
- Node.js 18+
- PostgreSQL 12+
- Compte Firebase (Google Cloud)

---

## 1️⃣ Configuration Backend (rout/)

### Étape 1: Copier le fichier `.env`
```bash
cd rout/
cp .env.example .env
```

### Étape 2: Configurer PostgreSQL
1. **Installer PostgreSQL** si ce n'est pas fait
2. **Créer une base de données :**
   ```bash
   psql -U postgres
   CREATE DATABASE projet;
   \q
   ```

3. **Initialiser les tables :**
   ```bash
   psql -U postgres -d projet -f ../bdd.sql
   ```

### Étape 3: Variables d'environnement Backend

Éditez `rout/.env` avec vos valeurs :

```env
# Server
PORT=3001
HOST=0.0.0.0

# PostgreSQL (IMPORTANT)
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=projet
PGUSER=postgres
PGPASSWORD=your_postgres_password  # ⚠️ À remplacer

# JWT (Générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_secret_key_here

# Firebase API (obtenir depuis Firebase Console)
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # ⚠️ Required
FIREBASE_PROJECT_ID=algbnb-c0a71  # ⚠️ À adapter à votre projet

# Client
CLIENT_URL=http://localhost:5173
```

---

## 2️⃣ Configuration Frontend (apps/web-view/)

### Étape 1: Copier le fichier `.env`
```bash
cd apps/web-view/
cp .env.example .env
```

### Étape 2: Variables d'environnement Frontend

Éditez `apps/web-view/.env` :

```env
VITE_API_URL=http://localhost:3001

# Firebase (obtenir depuis Firebase Console > Paramètres du projet)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Maps
VITE_MAPTILER_KEY=your_maptiler_key
VITE_LOCATIONIQ_KEY=your_locationiq_key
```

---

## 3️⃣ Obtenir les clés Firebase

### Accédez à Firebase Console:
1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet `algbnb-c0a71`
3. **Paramètres du projet** > **Onglet "Vos applications"**
4. Choisissez votre app Web
5. Copiez les valeurs dans `firebaseConfig`

### Configuration Google Sign-In:
1. **Firebase Console** > **Authentification** > **Fournisseurs de connexion**
2. Activez **Google**
3. **Créez des identifiants OAuth:**
   - https://console.cloud.google.com/
   - **Identifiants** > **Créer les identifiants** > **ID client OAuth 2.0**
   - Type: Application Web
   - URI autorisés:
     ```
     http://localhost:5173
     http://localhost:3001
     https://votre-domaine.com
     ```

---

## 4️⃣ Démarrer l'application

### Terminal 1 - Backend:
```bash
cd rout/
npm install
npm start
# Sortie: [server] API lancee sur http://0.0.0.0:3001
```

### Terminal 2 - Frontend:
```bash
cd apps/web-view/
npm install
npm run dev
# Sortie: VITE v5.x.x  ready in ??? ms
```

Ouvrez: http://localhost:5173

---

## ✅ Vérification

- ✅ Backend qui répond: http://localhost:3001/api/health
- ✅ PostgreSQL connecté: Vérifiez le log de démarrage du backend
- ✅ Firebase chargé: Ouvrez la console du navigateur (F12)
- ✅ Authentification Google: Testez le bouton "Sign in with Google"

---

## 🐛 Dépannage

### "connect ECONNREFUSED 127.0.0.1:5432"
```bash
# Vérifiez que PostgreSQL est en cours d'exécution
# Windows: Services.msc > Cherchez "postgresql" > Démarrer
# macOS/Linux: brew services start postgresql
```

### "FIREBASE_API_KEY manquant"
- Vérifiez que `.env` contient `FIREBASE_API_KEY`
- Allez sur Firebase Console pour obtenir la clé

### "Token Google invalide"
- Vérifiez que le token n'est pas expiré
- Assurez-vous que les URI OAuth sont correctes dans Google Cloud

---

## 📚 Documentation supplémentaire
- [Firebase SDK Setup](https://firebase.google.com/docs/web/setup)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)
- [PostgreSQL Docker Config](https://hub.docker.com/_/postgres)
