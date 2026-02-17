# Guide de Déploiement avec GitLab CI/CD et Docker

Ce guide explique comment déployer l'application en utilisant **GitLab** comme plateforme CI/CD, produisant des **images Docker** déployables sur une **VM (machine virtuelle)**.

---

## Vue d'ensemble du processus

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────────┐     ┌─────────┐
│   Push Git  │ ──► │  GitLab CI/CD   │ ──► │  GitLab Container    │ ──► │   VM    │
│   (main)    │     │  Build images   │     │  Registry (images)   │     │ Déploiement│
└─────────────┘     └─────────────────┘     └──────────────────────┘     └─────────┘
```

1. **Push sur GitLab** → Déclenche le pipeline
2. **Pipeline CI/CD** → Construit les images Docker (backend + frontend)
3. **GitLab Container Registry** → Stocke les images
4. **VM** → Récupère les images et les exécute avec Docker Compose

---

## Partie 1 : Configuration GitLab

### 1.1 Prérequis

- Un projet GitLab avec le code source
- GitLab Runner configuré (ou utilisez les runners GitLab.com partagés)
- Un accès Docker sur le runner

### 1.2 Variables CI/CD à configurer

Dans votre projet GitLab : **Settings** → **CI/CD** → **Variables**

| Variable | Type | Masquée | Description |
|----------|------|---------|-------------|
| `VITE_API_URL` | Variable | Non | URL de l'API en production (ex: `https://api.votre-domaine.com`) |
| `CI_REGISTRY_PASSWORD` | Variable | Oui | Générée automatiquement par GitLab (token de registry) |

> **Note** : GitLab fournit automatiquement `CI_REGISTRY`, `CI_REGISTRY_USER`, `CI_REGISTRY_IMAGE` lors des pipelines.

---

## Partie 2 : Fichier `.gitlab-ci.yml`

Créer le fichier `.gitlab-ci.yml` à la **racine du projet** (au même niveau que `docker-compose.yml`) :

```yaml
stages:
  - build
  - push

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""
  # Préfixe des images dans le GitLab Container Registry
  BACKEND_IMAGE: $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHORT_SHA
  FRONTEND_IMAGE: $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHORT_SHA
  BACKEND_IMAGE_LATEST: $CI_REGISTRY_IMAGE/backend:latest
  FRONTEND_IMAGE_LATEST: $CI_REGISTRY_IMAGE/frontend:latest

# Build et push de l'image backend
build-backend:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_BUILDKIT: 1
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build
        -t $BACKEND_IMAGE
        -t $BACKEND_IMAGE_LATEST
        -f backend/Dockerfile
        backend/
  after_script:
    - docker push $BACKEND_IMAGE
    - docker push $BACKEND_IMAGE_LATEST

# Build et push de l'image frontend
build-frontend:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_BUILDKIT: 1
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build
        --build-arg VITE_API_URL=${VITE_API_URL:-http://localhost:8000}
        -t $FRONTEND_IMAGE
        -t $FRONTEND_IMAGE_LATEST
        -f frontend/ticket-frontend/Dockerfile
        frontend/ticket-frontend/
  after_script:
    - docker push $FRONTEND_IMAGE
    - docker push $FRONTEND_IMAGE_LATEST
```

### Explication des chemins

- `backend/` : répertoire contenant le Dockerfile backend
- `frontend/ticket-frontend/` : répertoire contenant le Dockerfile frontend

> **Important** : Si la structure de votre dépôt est différente (ex: le projet est dans un sous-dossier `BARKI-MAME-DIARRA-BOUSSO`), adaptez les chemins dans `-f` et à la fin des commandes `docker build`.

---

## Partie 3 : Structure du dépôt pour GitLab

Si votre dépôt GitLab contient le projet dans un sous-dossier (ex: `BARKI-MAME-DIARRA-BOUSSO`), ajustez le `.gitlab-ci.yml` ainsi :

```yaml
# Exemple si le projet est dans BARKI-MAME-DIARRA-BOUSSO/
script:
  - docker build -t $BACKEND_IMAGE -t $BACKEND_IMAGE_LATEST -f BARKI-MAME-DIARRA-BOUSSO/backend/Dockerfile BARKI-MAME-DIARRA-BOUSSO/backend/
```

Ou placez le `.gitlab-ci.yml` à la racine de ce qui est poussé sur GitLab. Idéalement, le dépôt GitLab a la structure :

```
votre-repo/
├── .gitlab-ci.yml
├── docker-compose.yml
├── docker-compose.production.yml   # voir Partie 5
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
└── frontend/
    └── ticket-frontend/
        ├── Dockerfile
        └── ...
```

---

## Partie 4 : GitLab Container Registry

Une fois le pipeline exécuté avec succès :

1. Aller dans **Deploy** → **Container Registry** de votre projet
2. Les images apparaissent :
   - `registry.gitlab.com/votre-groupe/votre-projet/backend:latest`
   - `registry.gitlab.com/votre-groupe/votre-projet/backend:<commit-sha>`
   - `registry.gitlab.com/votre-groupe/votre-projet/frontend:latest`
   - `registry.gitlab.com/votre-groupe/votre-projet/frontend:<commit-sha>`

### Activer le Container Registry

Si le Container Registry n’est pas activé : **Settings** → **General** → **Visibility** → s’assurer que le projet peut utiliser le registry (activé par défaut sur GitLab.com).

---

## Partie 5 : Déploiement sur la VM

### 5.1 Prérequis sur la VM

- Docker installé
- Docker Compose installé
- Accès réseau au GitLab Container Registry

### 5.2 Fichier `docker-compose.production.yml`

Créer `docker-compose.production.yml` à la racine (pour la VM) :

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: tickets_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init_db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - tickets_network
    restart: unless-stopped

  backend:
    image: ${REGISTRY_IMAGE_BACKEND:-registry.gitlab.com/votre-groupe/votre-projet/backend:latest}
    container_name: tickets_backend
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_HOST: postgres
      POSTGRES_PORT: 5432
      SECRET_KEY: ${SECRET_KEY}
      ACCESS_TOKEN_EXPIRE_MINUTES: ${ACCESS_TOKEN_EXPIRE_MINUTES:-1440}
      EMAIL_ENABLED: ${EMAIL_ENABLED:-true}
      SMTP_SERVER: ${SMTP_SERVER}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USERNAME: ${SMTP_USERNAME}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      SENDER_EMAIL: ${SENDER_EMAIL}
      SENDER_NAME: ${SENDER_NAME:-Système de Gestion des Tickets}
      USE_TLS: ${USE_TLS:-true}
      VERIFY_SSL: ${VERIFY_SSL:-true}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - tickets_network
    restart: unless-stopped

  frontend:
    image: ${REGISTRY_IMAGE_FRONTEND:-registry.gitlab.com/votre-groupe/votre-projet/frontend:latest}
    container_name: tickets_frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - tickets_network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  tickets_network:
    driver: bridge
```

> Remplacer `votre-groupe/votre-projet` par le chemin réel de votre projet GitLab.

### 5.3 Authentification au GitLab Registry sur la VM

Sur la VM, se connecter au registry :

```bash
docker login registry.gitlab.com
```

- **Username** : votre identifiant GitLab ou un token
- **Password** : Personal Access Token avec scope `read_registry`, ou token de déploiement

### 5.4 Créer le fichier `.env` sur la VM

```bash
# Exemple .env pour la VM
POSTGRES_USER=postgres
POSTGRES_PASSWORD=VotreMotDePasseSecurise
POSTGRES_DB=tickets_db

SECRET_KEY=cle_secrete_generee_avec_secrets_token_urlsafe
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# SMTP
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre_email@gmail.com
SMTP_PASSWORD=mot_de_passe_app
SENDER_EMAIL=votre_email@gmail.com
SENDER_NAME=Système de Gestion des Tickets
USE_TLS=true
VERIFY_SSL=true

# CORS - URL publique du frontend
ALLOWED_ORIGINS=https://votre-domaine.com,http://IP_VM:3000

# Images du registry (optionnel si vous utilisez les valeurs par défaut)
REGISTRY_IMAGE_BACKEND=registry.gitlab.com/votre-groupe/votre-projet/backend:latest
REGISTRY_IMAGE_FRONTEND=registry.gitlab.com/votre-groupe/votre-projet/frontend:latest
```

### 5.5 Lancer le déploiement sur la VM

```bash
# 1. Cloner ou copier les fichiers nécessaires sur la VM
#    (docker-compose.production.yml, .env, backend/init_db.sql)

# 2. Se connecter au registry
docker login registry.gitlab.com

# 3. Pull des images et démarrage
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d

# 4. Initialiser la base de données (première fois)
docker compose -f docker-compose.production.yml exec backend python init_db.py

# 5. Vérifier
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f
```

### 5.6 Mise à jour après un nouveau build GitLab

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

---

## Partie 6 : Automatisation du déploiement sur la VM (optionnel)

Vous pouvez ajouter un job de déploiement dans `.gitlab-ci.yml` qui se connecte en SSH à la VM et lance les commandes :

```yaml
deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
  script:
    - ssh -o StrictHostKeyChecking=no $SSH_USER@$VM_HOST "
        cd /chemin/vers/app &&
        docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY &&
        docker compose -f docker-compose.production.yml pull &&
        docker compose -f docker-compose.production.yml up -d
      "
  only:
    - main
  when: manual  # Déploiement manuel pour plus de contrôle
```

Variables à configurer dans GitLab CI/CD :
- `SSH_PRIVATE_KEY` : clé privée SSH pour accéder à la VM
- `SSH_USER` : utilisateur SSH
- `VM_HOST` : adresse IP ou hostname de la VM

---

## Checklist récapitulative

### Sur GitLab
- [ ] Projet créé et code poussé
- [ ] `.gitlab-ci.yml` à la racine
- [ ] Variable `VITE_API_URL` configurée (URL API de production)
- [ ] Pipeline exécuté avec succès
- [ ] Images visibles dans Container Registry

### Sur la VM
- [ ] Docker et Docker Compose installés
- [ ] `docker-compose.production.yml` et `.env` en place
- [ ] `backend/init_db.sql` présent
- [ ] Connexion au GitLab Registry (`docker login`)
- [ ] Base de données initialisée
- [ ] Firewall configuré (ports 80/443, 3000, 8000 si exposés)

---

## Résumé

| Étape | Action |
|-------|--------|
| 1 | Push sur GitLab → Pipeline construit les images |
| 2 | Images poussées vers GitLab Container Registry |
| 3 | Sur la VM : `docker login` + `docker compose pull` + `docker compose up -d` |
| 4 | Mise à jour : nouveau push → nouveau pipeline → sur la VM, `pull` puis `up -d` |

Ce flux permet d’avoir des images Docker reproductibles et un déploiement maîtrisé sur votre VM.
