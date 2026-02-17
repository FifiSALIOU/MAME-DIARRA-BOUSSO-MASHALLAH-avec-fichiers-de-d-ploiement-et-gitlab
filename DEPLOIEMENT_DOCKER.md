# Guide de Déploiement avec Docker

Ce guide explique comment déployer l'application complète avec Docker Compose.

## 📋 Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Un serveur avec au moins 2GB RAM
- Un nom de domaine (optionnel mais recommandé)

## 🚀 Déploiement rapide

### 1. Préparer le serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker --version
docker-compose --version
```

### 2. Cloner le projet

```bash
cd /opt
git clone <votre-repo-url> tickets-app
cd tickets-app/BARKI-MAME-DIARRA-BOUSSO
```

### 3. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```bash
nano .env
```

Contenu minimal :

```env
# Base de données
POSTGRES_USER=tickets_user
POSTGRES_PASSWORD=VotreMotDePasseSecurise123!
POSTGRES_DB=tickets_db

# Sécurité
SECRET_KEY=VotreCleSecreteTresLongueEtAleatoireChangezMoi12345678901234567890

# Email
SMTP_USERNAME=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app_gmail
SENDER_EMAIL=votre_email@gmail.com

# Frontend API URL (remplacer par votre domaine)
VITE_API_URL=https://api.votre-domaine.com
```

### 4. Modifier le Dockerfile frontend pour accepter les variables d'environnement

Le Dockerfile frontend doit être modifié pour accepter `VITE_API_URL` comme argument de build.

### 5. Construire et démarrer les conteneurs

```bash
# Construire les images
docker-compose build

# Démarrer les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

### 6. Initialiser la base de données

```bash
# Entrer dans le conteneur backend
docker-compose exec backend bash

# Initialiser la base de données
python init_db.py

# Créer les utilisateurs de test (optionnel)
python create_test_users.py

# Sortir du conteneur
exit
```

### 7. Configurer Nginx comme reverse proxy

Créer `/etc/nginx/sites-available/tickets-app` :

```nginx
# Backend API
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/tickets-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Configurer SSL avec Certbot

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir les certificats SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com -d api.votre-domaine.com

# Le renouvellement automatique est configuré par défaut
```

### 9. Mettre à jour la configuration CORS du backend

Modifier `backend/app/main.py` pour autoriser votre domaine :

```python
allow_origins=[
    "https://votre-domaine.com",
    "https://www.votre-domaine.com",
]
```

Redémarrer le backend :

```bash
docker-compose restart backend
```

## 🔧 Commandes utiles

### Gestion des conteneurs

```bash
# Voir les conteneurs en cours d'exécution
docker-compose ps

# Voir les logs
docker-compose logs -f [service_name]

# Redémarrer un service
docker-compose restart [service_name]

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION : supprime les données)
docker-compose down -v

# Reconstruire après modification du code
docker-compose up -d --build
```

### Sauvegardes

```bash
# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U tickets_user tickets_db > backup_$(date +%Y%m%d).sql

# Restaurer la base de données
docker-compose exec -T postgres psql -U tickets_user tickets_db < backup_20240217.sql
```

### Mises à jour

```bash
# Pull les dernières modifications
git pull

# Reconstruire et redémarrer
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f
```

## 🐛 Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier les ports utilisés
sudo netstat -tulpn | grep -E '8000|5432|80'
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs PostgreSQL
docker-compose logs postgres

# Tester la connexion
docker-compose exec postgres psql -U tickets_user -d tickets_db
```

### Erreur CORS

- Vérifier que le domaine frontend est dans `allow_origins` du backend
- Vérifier que `VITE_API_URL` pointe vers le bon domaine
- Redémarrer le backend après modification

## 📊 Monitoring

### Ressources système

```bash
# Utilisation des ressources
docker stats

# Espace disque
df -h
docker system df
```

### Logs

```bash
# Tous les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```
