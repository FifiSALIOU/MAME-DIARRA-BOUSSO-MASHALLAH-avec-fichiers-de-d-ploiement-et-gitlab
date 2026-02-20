# Déployer les images Docker sur un serveur (VM)

Ce guide explique **comment déployer l’application sur une machine (VM ou serveur)** en utilisant les images déjà présentes dans le **GitLab Container Registry** (backend et frontend du projet `barki-mame-diarra-bousso`).

---

## Vue d’ensemble

1. Vous avez déjà les images dans GitLab : **barki-mame-diarra-bousso/backend** et **barki-mame-diarra-bousso/frontend**.
2. Sur la VM, on installe Docker (et Docker Compose), on se connecte au registry GitLab, on tire les images et on lance les conteneurs avec une base PostgreSQL.
3. Résultat : l’application tourne sur la VM (frontend, backend, base de données).

---

## Prérequis sur la VM

- Un **serveur** ou **VM** avec un système d’exploitation type **Linux** (Ubuntu, Debian, etc.) ou autre OS supportant Docker.
- Accès **SSH** ou accès console à cette machine.
- **Docker** et **Docker Compose** installés sur la VM (voir section 2).

---

## Étape 1 : Récupérer l’URL des images dans GitLab

1. Dans GitLab, ouvrez votre projet **barki-mame-diarra-bousso**.
2. Allez dans **Deploy** → **Container registry** (ou **Packages & Registries** → **Container Registry**).
3. Vous voyez les dépôts **backend** et **frontend**.
4. Cliquez sur **CLI commands** (bouton en haut à droite) pour afficher les commandes de connexion et de pull.
5. Notez les chemins complets des images, du type :
   - `registry.gitlab.com/VOTRE-GROUPE/barki-mame-diarra-bousso/backend:latest`
   - `registry.gitlab.com/VOTRE-GROUPE/barki-mame-diarra-bousso/frontend:latest`  
   Remplacez **VOTRE-GROUPE** par le nom réel du groupe ou de l’utilisateur GitLab (par ex. si l’URL du projet est `gitlab.com/mon-groupe/barki-mame-diarra-bousso`, alors VOTRE-GROUPE = `mon-groupe`).

---

## Étape 2 : Installer Docker et Docker Compose sur la VM

Connectez-vous en SSH à la VM, puis :

### Sur Ubuntu / Debian

```bash
# Mise à jour et installation de Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Vérifier
docker --version
docker compose version
```

Si votre hébergeur propose déjà Docker, vous pouvez ignorer cette étape.

---

## Étape 3 : Créer un dossier de déploiement sur la VM

```bash
mkdir -p ~/tickets-app
cd ~/tickets-app
```

Vous allez y mettre le fichier `docker-compose` et le `.env`.

---

## Étape 4 : Se connecter au GitLab Container Registry

Sur la VM, exécutez :

```bash
docker login registry.gitlab.com
```

- **Username** : votre identifiant GitLab (ou un utilisateur avec accès au projet).
- **Password** : un **Personal Access Token** avec au moins le droit **read_registry** (ou **read_api** selon la version de GitLab).

Pour créer un token : GitLab → **Settings** (ou profil) → **Access Tokens** → créer un token avec scope **read_registry**.

Vérifiez que le login réussit (pas de message d’erreur).

---

## Étape 5 : Fichiers sur la VM

Dans `~/tickets-app` vous devez avoir au moins :

1. **docker-compose.production.yml** (utiliser les images du registry).
2. **.env** (variables d’environnement : base de données, SECRET_KEY, CORS, etc.).

Optionnel pour PostgreSQL : **backend/init_db.sql** (si vous gardez le volume dans le compose ; sinon vous pouvez utiliser un fichier vide).

### 5.1 Copier le fichier docker-compose

Soit vous **clonez le dépôt** sur la VM (pour avoir aussi `backend/init_db.sql`) :

```bash
cd ~
git clone https://gitlab.com/VOTRE-GROUPE/barki-mame-diarra-bousso.git
cd barki-mame-diarra-bousso
```

Puis vous travaillerez dans ce dossier (et vous utiliserez `docker compose -f docker-compose.production.yml` depuis la racine du projet).

Soit vous **copiez uniquement** les fichiers nécessaires depuis votre PC vers la VM (avec `scp`, WinSCP, etc.) :

- `docker-compose.production.yml`
- `backend/init_db.sql` (ou créez un fichier vide `backend/init_db.sql` sur la VM si le volume du compose le requiert)

Dans la suite, on suppose que vous êtes dans le dossier qui contient **docker-compose.production.yml** (par ex. `~/tickets-app` ou `~/barki-mame-diarra-bousso`).

### 5.2 Adapter le docker-compose.production.yml (si besoin)

Le fichier utilise les variables `REGISTRY_IMAGE_BACKEND` et `REGISTRY_IMAGE_FRONTEND`. Vous devez les définir dans le **.env** avec les vrais chemins de votre registry (voir 5.3). Pas besoin de modifier le fichier compose si le .env est correct.

Si votre `docker-compose.production.yml` ne définit pas de commande pour le backend qui lance `init_db.py`, vous devrez lancer l’initialisation une fois à la main (étape 8).

### 5.3 Créer le fichier .env sur la VM

Dans le même dossier que `docker-compose.production.yml`, créez un fichier **.env** avec le contenu suivant (à adapter) :

```bash
# Base de données PostgreSQL (conteneur sur la VM)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=ChoisirUnMotDePasseSecurise
POSTGRES_DB=tickets_db

# Images du GitLab Container Registry (remplacer VOTRE-GROUPE par votre groupe GitLab)
REGISTRY_IMAGE_BACKEND=registry.gitlab.com/VOTRE-GROUPE/barki-mame-diarra-bousso/backend:latest
REGISTRY_IMAGE_FRONTEND=registry.gitlab.com/VOTRE-GROUPE/barki-mame-diarra-bousso/frontend:latest

# Backend
SECRET_KEY=generer_une_cle_longue_aleatoire
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email (optionnel)
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SENDER_EMAIL=
SENDER_NAME=Système de Gestion des Tickets
USE_TLS=true
VERIFY_SSL=true

# CORS : URL par laquelle les utilisateurs accèdent au frontend (IP ou nom de domaine)
# Exemple : http://192.168.1.100:3000  ou  https://tickets.mondomaine.com
ALLOWED_ORIGINS=http://IP_DE_LA_VM:3000
```

À faire :

- Remplacer **VOTRE-GROUPE** par le nom de votre groupe (ou utilisateur) GitLab dans les deux lignes `REGISTRY_IMAGE_*`.
- Remplacer **IP_DE_LA_VM** dans `ALLOWED_ORIGINS` par l’adresse IP (ou le nom de domaine) utilisée pour accéder au frontend (ex. `http://192.168.1.50:3000`). Vous pouvez ajouter plusieurs origines séparées par des virgules.
- Choisir un **mot de passe PostgreSQL** fort et une **SECRET_KEY** (ex. générée avec `python -c "import secrets; print(secrets.token_urlsafe(32))"`).

---

## Étape 6 : Monter le fichier init_db.sql (si le compose l’exige)

Le `docker-compose.production.yml` actuel monte `./backend/init_db.sql` dans le conteneur PostgreSQL. Donc :

- Soit vous êtes dans le clone du dépôt (dossier `barki-mame-diarra-bousso`) et le fichier `backend/init_db.sql` existe.
- Soit vous créez le dossier et un fichier vide :

```bash
mkdir -p backend
touch backend/init_db.sql
```

---

## Étape 7 : Lancer les conteneurs

Dans le dossier où se trouvent **docker-compose.production.yml** et **.env** :

```bash
# Télécharger les images depuis le registry
docker compose -f docker-compose.production.yml pull

# Démarrer les services (postgres, backend, frontend)
docker compose -f docker-compose.production.yml up -d
```

Vérifiez que les conteneurs tournent :

```bash
docker compose -f docker-compose.production.yml ps
```

Vous devez voir **postgres**, **backend** et **frontend** en état « Up ».

---

## Étape 8 : Initialiser la base de données (première fois)

Les tables et le compte admin sont créés par le script **init_db.py** dans le backend. Une fois les conteneurs démarrés, exécutez une seule fois :

```bash
docker compose -f docker-compose.production.yml exec backend python init_db.py
```

Cela crée les tables, les rôles et l’utilisateur **admin** / **admin123**. Changez ce mot de passe en production.

---

## Étape 9 : Vérifier l’accès

- **Frontend** : `http://IP_DE_LA_VM:3000`
- **Backend (API)** : `http://IP_DE_LA_VM:8000` (ex. documentation : `http://IP_DE_LA_VM:8000/docs`)

Connectez-vous avec **admin** / **admin123** (puis changez le mot de passe).

---

## Mise à jour après un nouveau build GitLab

Quand de nouvelles images sont poussées dans le registry (après un push et un pipeline réussi) :

```bash
cd ~/tickets-app   # ou le dossier où est docker-compose.production.yml
docker login registry.gitlab.com   # si la session a expiré
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

---

## Récapitulatif des étapes

| Étape | Action |
|-------|--------|
| 1 | Noter les URLs des images dans GitLab (Container Registry → CLI commands) |
| 2 | Installer Docker et Docker Compose sur la VM |
| 3 | Créer un dossier de déploiement |
| 4 | `docker login registry.gitlab.com` (token avec read_registry) |
| 5 | Copier ou créer `docker-compose.production.yml`, `.env`, et si besoin `backend/init_db.sql` |
| 6 | Vérifier que `backend/init_db.sql` existe (ou le créer vide) |
| 7 | `docker compose -f docker-compose.production.yml pull` puis `up -d` |
| 8 | `docker compose -f docker-compose.production.yml exec backend python init_db.py` (une fois) |
| 9 | Tester http://IP_VM:3000 et http://IP_VM:8000/docs |

Ainsi, vous déployez bien les images du **GitLab Container Registry** (barki-mame-diarra-bousso/backend et frontend) sur un serveur ou une VM.
