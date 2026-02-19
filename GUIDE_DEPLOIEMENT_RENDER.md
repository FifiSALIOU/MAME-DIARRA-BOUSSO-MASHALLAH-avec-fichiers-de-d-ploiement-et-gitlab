# Guide complet : héberger l’application sur Render

Ce guide décrit comment héberger **le backend FastAPI**, **le frontend React/Vite** et **la base PostgreSQL** de l’application de gestion de tickets sur [Render](https://render.com), en gratuit.

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Vue d’ensemble](#2-vue-densemble)
3. [Étape 1 : Préparer le dépôt Git](#3-étape-1--préparer-le-dépôt-git)
4. [Étape 2 : Créer la base PostgreSQL](#4-étape-2--créer-la-base-postgresql)
5. [Étape 3 : Créer le Web Service Backend (FastAPI)](#5-étape-3--créer-le-web-service-backend-fastapi)
6. [Étape 4 : Créer le Static Site Frontend (React/Vite)](#6-étape-4--créer-le-static-site-frontend-reactvite)
7. [Étape 5 : Lier les services et CORS](#7-étape-5--lier-les-services-et-cors)
8. [Étape 6 : Initialiser / importer les données](#8-étape-6--initialiser--importer-les-données)
9. [Limites de l’offre gratuite](#9-limites-de-loffre-gratuite)
10. [Dépannage](#10-dépannage)

---

## 1. Prérequis

- Un **compte Render** (gratuit) : [https://dashboard.render.com/register](https://dashboard.render.com/register)
- Le projet versionné dans un dépôt **Git** (GitHub ou GitLab) auquel Render peut accéder
- Votre code à jour (backend + frontend) poussé sur ce dépôt

---

## 2. Vue d’ensemble

Sur Render vous allez créer **3 éléments** :

| Type Render   | Rôle                    | Techno de votre projet |
|---------------|-------------------------|-------------------------|
| **PostgreSQL**| Base de données         | PostgreSQL (`tickets_db`) |
| **Web Service** | API / backend         | FastAPI (Python)        |
| **Static Site** | Interface utilisateur | React + Vite            |

L’ordre conseillé : **1) Base de données → 2) Backend → 3) Frontend**, car le backend a besoin de l’URL de la base, et le frontend de l’URL du backend.

---

## 3. Étape 1 : Préparer le dépôt Git

1. Créez un dépôt sur **GitHub** ou **GitLab** (si ce n’est pas déjà fait).
2. À la racine du projet, vous devez avoir une structure du type :
   ```
   BARKI-MAME-DIARRA-BOUSSO/
   ├── backend/           # FastAPI
   │   ├── app/
   │   ├── requirements.txt
   │   ├── init_db.py
   │   └── ...
   ├── frontend/
   │   └── ticket-frontend/   # React + Vite
   │       ├── package.json
   │       ├── vite.config.ts
   │       └── src/
   ├── .env.example
   └── ...
   ```
3. Poussez tout le code sur le dépôt (`git add`, `git commit`, `git push`).
4. Dans Render, vous connecterez **ce même dépôt** pour les 2 services (Backend et Frontend), en indiquant un **Root Directory** différent pour chacun.

---

## 4. Étape 2 : Créer la base PostgreSQL

1. Connectez-vous à [Render Dashboard](https://dashboard.render.com).
2. Cliquez sur **New +** → **PostgreSQL**.
3. Renseignez :
   - **Name** : par ex. `tickets-db`
   - **Database** : `tickets_db` (ou laisser par défaut)
   - **User** / **Password** : notés par Render (ou personnalisés selon le formulaire)
   - **Region** : choisir une région (ex. Frankfurt pour l’Europe)
4. Cliquez sur **Create Database**.
5. Une fois la base créée :
   - Allez dans l’onglet de la base.
   - Dans **Connect**, copiez l’**Internal Database URL** (à utiliser depuis le backend sur Render).
   - Format type : `postgresql://user:password@hostname/dbname` (ou `postgres://...` ; le backend accepte les deux).

Vous en aurez besoin à l’étape 5 pour le Web Service Backend.

---

## 5. Étape 3 : Créer le Web Service Backend (FastAPI)

1. Dans le Dashboard Render : **New +** → **Web Service**.
2. Connectez votre dépôt Git (GitHub/GitLab) et choisissez le dépôt du projet.
3. Configuration du service :
   - **Name** : par ex. `tickets-backend`
   - **Region** : même région que la base (recommandé).
   - **Branch** : `main` (ou la branche que vous utilisez).
   - **Root Directory** : **`backend`** (obligatoire, car le code FastAPI est dans ce dossier).
   - **Runtime** : **Python 3**.
   - **Build Command** :
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command** :
     ```bash
     python init_db.py || true && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
     (`init_db.py` crée les tables et rôles au premier démarrage ; `$PORT` est fourni par Render.)
4. **Environment (Variables d’environnement)** : ajoutez les clés suivantes.

   | Key             | Value / remarque |
   |-----------------|------------------|
   | `DATABASE_URL`  | Collez l’**Internal Database URL** copiée à l’étape 2 (connexion à la base Render). |
   | `SECRET_KEY`    | Une clé secrète longue et aléatoire (ex. générée avec `python -c "import secrets; print(secrets.token_urlsafe(32))"`). |
   | `ALLOWED_ORIGINS` | L’URL de votre frontend sur Render, ex. `https://tickets-frontend-xxxx.onrender.com` (vous pourrez la mettre à jour après avoir créé le Static Site). En attendant, vous pouvez mettre `https://*.onrender.com` ou l’URL exacte une fois connue. |

   Optionnel selon votre besoin :
   - `ACCESS_TOKEN_EXPIRE_MINUTES` : ex. `1440`
   - `EMAIL_ENABLED`, `SMTP_*`, etc. si vous utilisez l’envoi d’emails (sinon laissez désactivé ou par défaut).

5. Cliquez sur **Create Web Service**.
6. Attendez le premier déploiement. Une fois vert, notez l’URL du service, par ex. :
   `https://tickets-backend-xxxx.onrender.com`

Cette URL sera utilisée comme **API** par le frontend (variable `VITE_API_URL` à l’étape 6).

---

## 6. Étape 4 : Créer le Static Site Frontend (React/Vite)

1. Dans le Dashboard : **New +** → **Static Site**.
2. Même dépôt Git que le backend.
3. Configuration :
   - **Name** : par ex. `tickets-frontend`
   - **Branch** : `main` (ou votre branche).
   - **Root Directory** : **`frontend/ticket-frontend`** (obligatoire).
   - **Build Command** :
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory** : **`dist`** (dossier généré par `vite build`).
4. **Environment** : ajoutez une variable **au moment du build** (pour que Vite l’injecte dans le front) :
   - **Key** : `VITE_API_URL`
   - **Value** : l’URL du backend Render, **sans slash final**, ex. `https://tickets-backend-xxxx.onrender.com`
5. **Create Static Site** et attendez le déploiement.
6. Notez l’URL du site, ex. `https://tickets-frontend-xxxx.onrender.com`.

---

## 7. Étape 5 : Lier les services et CORS

1. **CORS (backend)**  
   Le backend doit autoriser l’origine de votre frontend. Dans le Web Service Backend, éditez la variable d’environnement :
   - **Key** : `ALLOWED_ORIGINS`
   - **Value** : l’URL exacte du Static Site, ex. `https://tickets-frontend-xxxx.onrender.com`  
   (Plusieurs origines possibles, séparées par des virgules si besoin.)
2. Redéployez le backend (bouton **Manual Deploy** → **Deploy latest commit** si rien n’a changé).
3. **Vérification**  
   - Ouvrez l’URL du Static Site.  
   - Vous devez voir l’interface de connexion et pouvoir appeler l’API (login, etc.) sans erreur CORS.

---

## 8. Étape 6 : Initialiser / importer les données

### Option A : Première utilisation (base vide)

- Au premier démarrage, le **Start Command** du backend exécute `python init_db.py`, qui crée les tables, les rôles et un utilisateur **admin** / **admin123**.
- Connectez-vous avec ces identifiants sur le frontend Render pour vérifier que tout fonctionne.

### Option B : Importer votre sauvegarde (.sql)

Si vous avez une sauvegarde (ex. `backups/tickets_db_20260219_233017.sql`) et souhaitez la charger dans la base Render :

1. **Méthode 1 – Render Shell (recommandé)**  
   - Dans le Dashboard, ouvrez votre base PostgreSQL.
   - Utilisez **Shell** (ou l’outil proposé par Render pour exécuter des commandes sur la base).
   - Si un client `psql` est disponible, vous pouvez faire (en adaptant le chemin/fichier) :
     ```bash
     psql $DATABASE_URL -f /chemin/vers/tickets_db_20260219_233017.sql
     ```
   - Si Render ne propose pas de shell avec accès fichier, utilisez la méthode 2.

2. **Méthode 2 – Connexion depuis votre PC**  
   - Dans la page de la base Render, copiez l’**External Database URL** (pour vous connecter depuis l’extérieur).
   - Sur votre PC (avec PostgreSQL en ligne de commande ou un outil type pgAdmin, DBeaver) :
     - Connexion avec l’URL externe.
     - Exécution du fichier `.sql` (restauration) dans cette base.
   - Après import, redémarrez ou redéployez le backend si besoin.

Une fois les données importées, les utilisateurs (dont admin) et les tickets seront ceux de la sauvegarde.

---

## 9. Limites de l’offre gratuite

- **Web Service (backend)**  
  - S’endort après environ **15 minutes** sans requête.  
  - Le premier appel après réveil peut prendre **30 secondes à 1 minute**.

- **PostgreSQL**  
  - Offre gratuite : la base peut être **supprimée après 30 à 90 jours** (vérifier la politique actuelle sur [Render](https://render.com/pricing)).  
  - Pensez à exporter régulièrement une sauvegarde (pg_dump) si vous restez en gratuit.

- **Static Site**  
  - Pas de “sleep” ; le site reste disponible.

- **Bande passante / heures**  
  - Quotas gratuits limités ; au-delà, Render peut demander de passer à un plan payant.

Pour un usage perso / démo, c’est en général suffisant.

---

## 10. Dépannage

### Le backend ne démarre pas

- Vérifiez les **logs** du Web Service (onglet **Logs**).
- Vérifiez que **Root Directory** = `backend`.
- Vérifiez que **DATABASE_URL** est bien l’**Internal** Database URL (pas l’External pour un service sur Render).
- Vérifiez que **Start Command** contient bien `$PORT` et que vous n’avez pas mis un port en dur (ex. 8000).

### Erreur CORS sur le frontend

- Vérifiez que **ALLOWED_ORIGINS** contient **exactement** l’URL du Static Site (schéma + domaine, sans slash final), ex. `https://tickets-frontend-xxxx.onrender.com`.
- Redéployez le backend après modification des variables.

### La base semble vide après import

- Vérifiez que vous avez bien exécuté le fichier `.sql` **dans la base** utilisée par le backend (celle dont l’URL est dans `DATABASE_URL`).
- Vérifiez que le backend pointe bien vers cette base (même projet / même région si vous avez plusieurs bases).

### Le frontend appelle encore localhost

- **VITE_API_URL** est prise en compte **au build**. Si vous l’avez modifiée après un premier build, faites un **nouveau déploiement** (rebuild) du Static Site pour que la nouvelle valeur soit utilisée.

### Erreur 503 ou timeout au premier chargement

- Sur l’offre gratuite, le backend peut être en veille. Attendez 30 s à 1 min et réessayez ; les appels suivants seront plus rapides tant que le service reste actif.

---

## Récapitulatif des URLs à retenir

| Élément   | Où le trouver |
|-----------|----------------|
| Base de données | Dashboard → votre PostgreSQL → **Internal Database URL** (pour le backend) |
| Backend  | Dashboard → Web Service → URL du type `https://tickets-backend-xxxx.onrender.com` |
| Frontend | Dashboard → Static Site → URL du type `https://tickets-frontend-xxxx.onrender.com` |

---

## Modifications apportées au projet pour Render

- **`backend/app/database.py`** : prise en charge de la variable **`DATABASE_URL`** (fournie par Render) et conversion automatique de `postgres://` en `postgresql://` si nécessaire. Vous n’avez rien à changer dans le code pour utiliser l’Internal Database URL.

Avec ce guide, vous pouvez héberger correctement l’application (backend + frontend + base) sur Render et, si besoin, importer votre sauvegarde pour retrouver vos données.
