# Historique et modifications du projet – Système de gestion des tickets

Ce document résume tout ce qui a été fait sur le projet **BARKI-MAME-DIARRA-BOUSSO** (système de gestion de tickets) : configuration, corrections, déploiement et utilisation de la base de données.

---

## 1. Contexte du projet

- **Nom** : BARKI-MAME-DIARRA-BOUSSO  
- **Chemin** : `BARKI BAYE LAHAD MBACKE7575\BARKI-MAME-DIARRA-BOUSSO`  
- **Stack** : Backend FastAPI, frontend React/Vite, base PostgreSQL. Déploiement avec Docker Compose et CI/CD GitLab.

---

## 2. GitLab CI/CD

- **Fichier** : `.gitlab-ci.yml` à la racine du projet.  
- **Rôle** : Pipeline qui construit les images Docker du backend et du frontend, puis les pousse vers le **GitLab Container Registry**.  
- **Guide** : `GUIDE_DEPLOIEMENT_GITLAB.md` décrit le déploiement (pipeline → images → VM).  
- **Corrections effectuées** :  
  - Le fichier CI manquait sur GitLab (erreur « Missing CI config file ») : il a été créé et poussé.  
  - Frontend : le build échouait (TypeScript + Node). Ajustements :  
    - `package.json` : script `"build": "vite build"`.  
    - Dockerfile frontend : utilisation de `node:20-alpine` (Vite 7 nécessite Node 20+).  
    - Corrections TypeScript dans plusieurs pages (variables inutilisées, `RegistrationPage`, `SecretaryDashboard`, etc.).  
  - Résultat : pipeline vert, images disponibles dans le registry.

---

## 3. Déploiement Docker local

- **Fichiers** : `docker-compose.yml`, `.env` à la racine (copie de `.env.example`).  
- **Actions** :  
  - Génération d’une `SECRET_KEY` avec :  
    `python -c "import secrets; print(secrets.token_urlsafe(32))"`  
  - Lancement : `docker compose up -d --build` (après démarrage de Docker Desktop).  
  - Services : PostgreSQL, backend et frontend.  
  - Base initialisée via `init_db.py` dans le conteneur backend ; utilisateur **admin** / **admin123** créé.  
- **URLs** :  
  - Frontend : http://localhost:3000  
  - Backend (Swagger) : http://localhost:8000/docs  

---

## 4. Problème de connexion (CORS + erreurs 500)

- **Symptômes** : Sur http://localhost:3000, message « Impossible de contacter le serveur », erreurs CORS et `POST http://localhost:8000/auth/token` en **500**.  
- **Cause CORS** : `ALLOWED_ORIGINS` ne contenait que `http://localhost:5173, http://localhost:5174`, alors que le front Docker est servi sur le port **3000**.  
- **Modifications** :  
  - Dans le **.env** à la racine et dans **docker-compose.yml** (valeur par défaut), ajout de **`http://localhost:3000`** dans `ALLOWED_ORIGINS`.  
  - Puis : `docker compose restart backend`.  
- **Résultat** : CORS corrigé ; certaines requêtes `POST /auth/token` renvoyaient **200 OK**, d’autres encore **500**, et `GET /auth/register-info` aussi en **500**.

---

## 5. Erreurs 500 sur `/auth/token` et `/auth/register-info`

- **Cause identifiée pour register-info** : La route interroge la table **`departments`**, qui n’était pas créée par `init_db.py` (elle venait d’un script de migration séparé).  
- **Modifications** :  
  1. **`backend/init_db.py`** :  
     - Création de la table **`departments`** si elle n’existe pas (même structure que la migration), lors de l’initialisation.  
  2. **`backend/app/routers/auth.py`** (route `get_register_info`) :  
     - Requête sur `departments` entourée d’un `try/except` : en cas d’erreur (table absente, etc.), on retourne une liste d’agences **vide** au lieu de faire remonter une 500.  
  3. **`backend/app/main.py`** :  
     - Ajout d’un **gestionnaire d’exception global** qui log la trace complète Python pour toute exception non gérée (pour diagnostiquer les 500 sur `/auth/token` ou ailleurs).  

- **Base de données** : Tout le code utilise la base **`tickets_db`** configurée dans le projet (`.env`, `app/database.py`) ; aucune autre base n’a été introduite.

---

## 6. Utilisation de votre base de données `tickets_db` (données existantes)

- **Problème** : En Docker, le backend se connectait au PostgreSQL **du conteneur** (base vide ou réinitialisée), donc les tickets et utilisateurs déjà créés n’apparaissaient pas.  
- **Cause** : Dans `docker-compose.yml`, `POSTGRES_HOST` était fixé à **`postgres`** (conteneur), et non au PostgreSQL de votre machine.  
- **Modifications** :  
  1. **`docker-compose.yml`** :  
     - `POSTGRES_HOST` utilise maintenant la variable d’environnement : **`${POSTGRES_HOST:-postgres}`** (par défaut `postgres` si non définie).  
  2. **`.env` à la racine** :  
     - **`POSTGRES_HOST=host.docker.internal`** pour que le backend dans Docker se connecte au **PostgreSQL de votre machine** (où se trouve votre base `tickets_db`).  
     - Commentaires ajoutés : avec Docker → `host.docker.internal` ; sans Docker (backend en local) → `localhost`.  

- **Résultat** : L’application Docker utilise bien **votre** base `tickets_db` (tickets, utilisateurs, etc.).  
- **À faire** :  
  - Démarrer PostgreSQL sur votre PC.  
  - En cas de conflit sur le port 5432 avec le conteneur `postgres`, arrêter le conteneur : `docker stop tickets_postgres`, puis `docker compose up -d backend`.

---

## 7. Avertissement Docker Compose

- **Message** : « The attribute `version` is obsolete » dans `docker-compose.yml`.  
- **Action possible** : Supprimer l’attribut **`version`** en haut du fichier `docker-compose.yml` pour faire disparaître l’avertissement (optionnel).

---

## 8. Récapitulatif des fichiers modifiés ou créés

| Fichier | Action |
|--------|--------|
| `.gitlab-ci.yml` | Créé / configuré pour le pipeline GitLab |
| `GUIDE_DEPLOIEMENT_GITLAB.md` | Référence pour le déploiement GitLab |
| `.env` (racine) | `ALLOWED_ORIGINS`, `POSTGRES_HOST=host.docker.internal`, `SECRET_KEY` |
| `docker-compose.yml` | `POSTGRES_HOST` variable, `ALLOWED_ORIGINS` par défaut |
| `backend/init_db.py` | Création de la table `departments` si absente |
| `backend/app/routers/auth.py` | Route `/auth/register-info` tolérante si `departments` manquant |
| `backend/app/main.py` | Gestionnaire d’exception global (log des 500) |
| Frontend (package.json, Dockerfile, pages TS) | Build Vite, Node 20+, corrections TypeScript |
| `HISTORIQUE_ET_MODIFICATIONS.md` | Ce fichier – synthèse de tout ce qui a été fait |

---

## 9. Commandes utiles

```bash
# Démarrer l’application (depuis la racine du projet)
docker compose up -d --build

# Redémarrer uniquement le backend
docker compose restart backend

# Voir les logs backend (dont les traces des 500)
docker compose logs backend --tail 100

# Arrêter le conteneur PostgreSQL si conflit de port avec votre PostgreSQL local
docker stop tickets_postgres

# Réinitialiser la base (création tables, rôles, admin) dans le conteneur
docker compose exec backend python init_db.py
```

---

## 10. Connexion par défaut après init

- **Utilisateur** : `admin`  
- **Mot de passe** : `admin123`  
- (À changer en production.)

---

*Document généré pour garder une trace de l’ensemble des modifications et configurations effectuées sur le projet.*
