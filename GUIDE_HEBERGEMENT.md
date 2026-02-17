# Guide d'Hébergement - Système de Gestion des Tickets

Ce guide explique comment héberger votre application sur un serveur de production.

## 📋 Prérequis pour l'hébergement

### 1. Serveur/VPS
- **Option 1 : Serveur VPS** (Recommandé)
  - Ubuntu 20.04+ ou Debian 11+
  - Minimum : 2 CPU, 4GB RAM, 20GB SSD
  - Accès SSH root ou sudo
  - Exemples : DigitalOcean, AWS EC2, OVH, Scaleway, Hetzner

- **Option 2 : Services Cloud managés**
  - **Backend** : Railway, Render, Fly.io, Heroku
  - **Frontend** : Vercel, Netlify, Cloudflare Pages
  - **Base de données** : Supabase, AWS RDS, Google Cloud SQL, Railway PostgreSQL

### 2. Logiciels nécessaires sur le serveur
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Nginx (pour reverse proxy)
- Certbot (pour SSL/HTTPS)
- Git
- Docker & Docker Compose (optionnel mais recommandé)

### 3. Domaines et DNS
- Un nom de domaine (ex: `votre-app.com`)
- Accès à la configuration DNS de votre domaine
- Sous-domaines recommandés :
  - `api.votre-app.com` pour le backend
  - `app.votre-app.com` ou `votre-app.com` pour le frontend

## 🚀 Options d'hébergement

### Option A : Hébergement avec Docker (Recommandé - Plus simple)

**Avantages :**
- Isolation des services
- Configuration simplifiée
- Déploiement rapide
- Facile à maintenir

**Fichiers nécessaires :**
- `Dockerfile` (backend)
- `Dockerfile` (frontend)
- `docker-compose.yml`
- `.env.production` (backend)
- `.env.production` (frontend)

**Étapes :**
1. Copier tous les fichiers sur le serveur
2. Configurer les variables d'environnement
3. Lancer `docker-compose up -d`
4. Configurer Nginx comme reverse proxy
5. Configurer SSL avec Certbot

### Option B : Hébergement traditionnel (Sans Docker)

**Avantages :**
- Contrôle total
- Pas de dépendance Docker
- Performance native

**Étapes :**
1. Installer Python, Node.js, PostgreSQL
2. Cloner le projet
3. Configurer l'environnement virtuel Python
4. Installer les dépendances
5. Configurer PostgreSQL
6. Configurer Nginx
7. Configurer systemd pour les services
8. Configurer SSL

### Option C : Hébergement cloud managé (Le plus simple)

**Backend sur Railway/Render :**
- Connecter votre repo Git
- Configurer les variables d'environnement
- Déployer automatiquement

**Frontend sur Vercel/Netlify :**
- Connecter votre repo Git
- Configurer la variable `VITE_API_URL`
- Déployer automatiquement

**Base de données :**
- Utiliser PostgreSQL managé (Supabase, Railway, etc.)

## 📦 Configuration requise

### Variables d'environnement Backend (.env)

```env
# Base de données PostgreSQL
POSTGRES_USER=votre_user_db
POSTGRES_PASSWORD=mot_de_passe_securise
POSTGRES_DB=tickets_db
POSTGRES_HOST=localhost  # ou l'IP de votre serveur DB
POSTGRES_PORT=5432

# Sécurité JWT
SECRET_KEY=votre_cle_secrete_longue_et_aleatoire_changez_moi
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email SMTP
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
SENDER_EMAIL=votre_email@gmail.com
SENDER_NAME=Système de Gestion des Tickets
USE_TLS=true
VERIFY_SSL=true

# Environnement
ENVIRONMENT=production
```

### Variables d'environnement Frontend (.env.production)

```env
VITE_API_URL=https://api.votre-app.com
```

### Configuration CORS Backend

Mettre à jour `app/main.py` pour autoriser votre domaine de production :

```python
allow_origins=[
    "https://votre-app.com",
    "https://app.votre-app.com",
    # Garder localhost pour développement local si nécessaire
]
```

## 🔧 Étapes de déploiement détaillées

### Méthode 1 : Docker Compose (Recommandé)

Voir le fichier `DEPLOIEMENT_DOCKER.md` pour les instructions complètes.

### Méthode 2 : Déploiement manuel

Voir le fichier `DEPLOIEMENT_MANUEL.md` pour les instructions complètes.

### Méthode 3 : Services cloud

Voir le fichier `DEPLOIEMENT_CLOUD.md` pour les instructions complètes.

## 🔒 Sécurité

### Checklist de sécurité

- [ ] Changer toutes les valeurs par défaut dans `.env`
- [ ] Utiliser des mots de passe forts pour PostgreSQL
- [ ] Générer une `SECRET_KEY` aléatoire sécurisée
- [ ] Configurer HTTPS/SSL (obligatoire)
- [ ] Configurer un firewall (UFW sur Ubuntu)
- [ ] Limiter les accès SSH
- [ ] Configurer des sauvegardes automatiques de la base de données
- [ ] Mettre à jour régulièrement les dépendances
- [ ] Configurer la rotation des logs
- [ ] Activer les mises à jour automatiques de sécurité

### Configuration Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 📊 Monitoring et maintenance

### Logs

- Backend : `docker-compose logs -f backend` ou `journalctl -u tickets-backend`
- Frontend : Logs Nginx
- Base de données : Logs PostgreSQL

### Sauvegardes

Configurer des sauvegardes automatiques de PostgreSQL :

```bash
# Sauvegarde quotidienne
0 2 * * * pg_dump -U postgres tickets_db > /backups/tickets_db_$(date +\%Y\%m\%d).sql
```

### Mises à jour

1. Pull les dernières modifications
2. Rebuild les images Docker (si Docker)
3. Redémarrer les services
4. Vérifier les logs

## 🆘 Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
   - Vérifier que PostgreSQL est démarré
   - Vérifier les credentials dans `.env`
   - Vérifier les règles de firewall

2. **Erreur CORS**
   - Vérifier la configuration dans `app/main.py`
   - Vérifier que le domaine frontend est autorisé

3. **Erreur 502 Bad Gateway**
   - Vérifier que le backend est démarré
   - Vérifier la configuration Nginx
   - Vérifier les logs du backend

4. **Certificat SSL expiré**
   - Renouveler avec `certbot renew`

## 📞 Support

Pour plus d'aide, consultez :
- Les fichiers de configuration dans le dossier `deployment/`
- Les logs des services
- La documentation de Docker, Nginx, PostgreSQL
