# Guide de Déploiement sur Services Cloud Managés

Ce guide explique comment déployer l'application sur des plateformes cloud managées (Railway, Render, Vercel, etc.).

## 🌐 Option 1 : Railway (Recommandé - Tout-en-un)

Railway peut héberger le backend, le frontend et la base de données.

### Backend sur Railway

1. **Créer un compte** sur [railway.app](https://railway.app)

2. **Créer un nouveau projet** → "New Project" → "Deploy from GitHub repo"

3. **Sélectionner votre repository**

4. **Ajouter PostgreSQL** :
   - Cliquer sur "New" → "Database" → "PostgreSQL"
   - Railway créera automatiquement les variables d'environnement

5. **Configurer les variables d'environnement** :
   ```
   POSTGRES_HOST=${{Postgres.PGHOST}}
   POSTGRES_USER=${{Postgres.PGUSER}}
   POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
   POSTGRES_DB=${{Postgres.PGDATABASE}}
   POSTGRES_PORT=${{Postgres.PGPORT}}
   SECRET_KEY=votre_cle_secrete_longue_et_aleatoire
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   EMAIL_ENABLED=true
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=votre_email@gmail.com
   SMTP_PASSWORD=votre_mot_de_passe_app
   SENDER_EMAIL=votre_email@gmail.com
   SENDER_NAME=Système de Gestion des Tickets
   USE_TLS=true
   VERIFY_SSL=true
   ```

6. **Configurer le service** :
   - Root Directory : `BARKI-MAME-DIARRA-BOUSSO/backend`
   - Build Command : `pip install -r requirements.txt`
   - Start Command : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

7. **Créer un fichier `railway.json`** dans `backend/` :
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

8. **Obtenir l'URL du backend** : Railway génère automatiquement une URL (ex: `https://votre-app.up.railway.app`)

### Frontend sur Railway

1. **Ajouter un nouveau service** dans le même projet Railway

2. **Sélectionner le repository** (même repo)

3. **Configurer** :
   - Root Directory : `BARKI-MAME-DIARRA-BOUSSO/frontend/ticket-frontend`
   - Build Command : `npm install && npm run build`
   - Start Command : `npx serve -s dist -l $PORT`

4. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.up.railway.app
   ```

5. **Mettre à jour CORS** dans le backend pour autoriser l'URL du frontend Railway

### Initialiser la base de données

1. **Se connecter à Railway CLI** :
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Se connecter à PostgreSQL** :
   ```bash
   railway connect postgres
   ```

3. **Exécuter les scripts d'initialisation** :
   ```bash
   python init_db.py
   python create_test_users.py
   ```

## 🚀 Option 2 : Render

### Backend sur Render

1. **Créer un compte** sur [render.com](https://render.com)

2. **Nouveau Web Service** → Connecter votre repo GitHub

3. **Configuration** :
   - Name : `tickets-backend`
   - Environment : `Python 3`
   - Build Command : `pip install -r requirements.txt`
   - Start Command : `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Root Directory : `BARKI-MAME-DIARRA-BOUSSO/backend`

4. **Ajouter PostgreSQL** :
   - "New" → "PostgreSQL"
   - Noter les credentials

5. **Variables d'environnement** :
   ```
   POSTGRES_HOST=votre-host.render.com
   POSTGRES_USER=votre_user
   POSTGRES_PASSWORD=votre_password
   POSTGRES_DB=tickets_db
   POSTGRES_PORT=5432
   SECRET_KEY=votre_cle_secrete
   # ... autres variables
   ```

### Frontend sur Render

1. **Nouveau Static Site** → Connecter votre repo

2. **Configuration** :
   - Build Command : `cd frontend/ticket-frontend && npm install && npm run build`
   - Publish Directory : `frontend/ticket-frontend/dist`

3. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.onrender.com
   ```

## ⚡ Option 3 : Vercel (Frontend) + Railway/Render (Backend)

### Frontend sur Vercel

1. **Créer un compte** sur [vercel.com](https://vercel.com)

2. **Nouveau projet** → Import depuis GitHub

3. **Configuration** :
   - Framework Preset : `Vite`
   - Root Directory : `BARKI-MAME-DIARRA-BOUSSO/frontend/ticket-frontend`
   - Build Command : `npm run build`
   - Output Directory : `dist`

4. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.up.railway.app
   ```

5. **Déployer** → Vercel génère automatiquement une URL

### Backend sur Railway ou Render

Suivre les instructions de l'Option 1 ou 2 pour le backend.

## 🗄️ Option 4 : Base de données managée

### Supabase (PostgreSQL)

1. **Créer un compte** sur [supabase.com](https://supabase.com)

2. **Créer un nouveau projet**

3. **Récupérer les credentials** :
   - Aller dans "Settings" → "Database"
   - Noter : Host, Database name, Port, User, Password

4. **Utiliser ces credentials** dans vos variables d'environnement backend

### AWS RDS / Google Cloud SQL

Pour des besoins plus importants, utiliser des services cloud managés :
- AWS RDS PostgreSQL
- Google Cloud SQL
- Azure Database for PostgreSQL

## 🔧 Configuration CORS pour production

Mettre à jour `backend/app/main.py` :

```python
import os

# Récupérer les origines depuis les variables d'environnement
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

Ajouter dans les variables d'environnement :
```
ALLOWED_ORIGINS=https://votre-frontend.vercel.app,https://votre-domaine.com
```

## 📝 Checklist de déploiement cloud

- [ ] Backend déployé et accessible
- [ ] Base de données créée et connectée
- [ ] Variables d'environnement configurées
- [ ] CORS configuré pour autoriser le frontend
- [ ] Frontend déployé avec `VITE_API_URL` correct
- [ ] Base de données initialisée (`init_db.py`)
- [ ] Utilisateurs de test créés (optionnel)
- [ ] SSL/HTTPS activé (automatique sur Railway/Vercel/Render)
- [ ] Logs vérifiés pour erreurs
- [ ] Test de connexion depuis le frontend

## 🆘 Dépannage cloud

### Backend ne démarre pas

- Vérifier les logs dans le dashboard Railway/Render
- Vérifier que toutes les variables d'environnement sont définies
- Vérifier que le port utilise `$PORT` (variable d'environnement)

### Erreur de connexion à la base de données

- Vérifier que les credentials PostgreSQL sont corrects
- Vérifier que la base de données est accessible depuis le backend
- Sur Render, vérifier que le backend et la DB sont dans la même région

### Erreur CORS

- Vérifier que `ALLOWED_ORIGINS` contient l'URL exacte du frontend
- Vérifier que `VITE_API_URL` pointe vers la bonne URL backend
- Redéployer après modification

### Frontend ne charge pas les données

- Vérifier que `VITE_API_URL` est correct dans les variables d'environnement
- Vérifier la console du navigateur pour les erreurs
- Vérifier que le backend est accessible publiquement
