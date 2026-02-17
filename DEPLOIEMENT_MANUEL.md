# Guide de Déploiement Manuel (Sans Docker)

Ce guide explique comment déployer l'application sans Docker, directement sur le serveur.

## 📋 Prérequis

- Serveur Ubuntu 20.04+ ou Debian 11+
- Accès root ou sudo
- Un nom de domaine configuré

## 🔧 Installation des dépendances

### 1. Mettre à jour le système

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Installer Python 3.11

```bash
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip -y
```

### 3. Installer Node.js 18+

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 4. Installer PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5. Installer Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Installer Certbot (pour SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## 🗄️ Configuration de PostgreSQL

### 1. Créer la base de données et l'utilisateur

```bash
sudo -u postgres psql
```

Dans PostgreSQL :

```sql
CREATE USER tickets_user WITH PASSWORD 'VotreMotDePasseSecurise123!';
CREATE DATABASE tickets_db OWNER tickets_user;
GRANT ALL PRIVILEGES ON DATABASE tickets_db TO tickets_user;
\q
```

### 2. Configurer PostgreSQL pour accepter les connexions

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Décommenter/modifier :
```
listen_addresses = 'localhost'
```

```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Ajouter :
```
host    tickets_db    tickets_user    127.0.0.1/32    md5
```

Redémarrer PostgreSQL :

```bash
sudo systemctl restart postgresql
```

## 🚀 Déploiement du Backend

### 1. Créer le répertoire de l'application

```bash
sudo mkdir -p /opt/tickets-app
sudo chown $USER:$USER /opt/tickets-app
cd /opt/tickets-app
```

### 2. Cloner le projet

```bash
git clone <votre-repo-url> .
cd BARKI-MAME-DIARRA-BOUSSO/backend
```

### 3. Créer l'environnement virtuel Python

```bash
python3.11 -m venv venv
source venv/bin/activate
```

### 4. Installer les dépendances

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Configurer les variables d'environnement

```bash
cp .env.example .env
nano .env
```

Modifier avec vos valeurs :

```env
POSTGRES_USER=tickets_user
POSTGRES_PASSWORD=VotreMotDePasseSecurise123!
POSTGRES_DB=tickets_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
SECRET_KEY=VotreCleSecreteTresLongueEtAleatoireChangezMoi12345678901234567890
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

### 6. Initialiser la base de données

```bash
python init_db.py
python create_test_users.py  # Optionnel
```

### 7. Mettre à jour la configuration CORS

Modifier `app/main.py` :

```python
allow_origins=[
    "https://votre-domaine.com",
    "https://www.votre-domaine.com",
]
```

### 8. Créer un service systemd pour le backend

```bash
sudo nano /etc/systemd/system/tickets-backend.service
```

Contenu :

```ini
[Unit]
Description=Tickets Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/tickets-app/BARKI-MAME-DIARRA-BOUSSO/backend
Environment="PATH=/opt/tickets-app/BARKI-MAME-DIARRA-BOUSSO/backend/venv/bin"
ExecStart=/opt/tickets-app/BARKI-MAME-DIARRA-BOUSSO/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable tickets-backend
sudo systemctl start tickets-backend
sudo systemctl status tickets-backend
```

## 🎨 Déploiement du Frontend

### 1. Aller dans le répertoire frontend

```bash
cd /opt/tickets-app/BARKI-MAME-DIARRA-BOUSSO/frontend/ticket-frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Créer le fichier .env.production

```bash
nano .env.production
```

Contenu :

```env
VITE_API_URL=https://api.votre-domaine.com
```

### 4. Build l'application

```bash
npm run build
```

### 5. Configurer Nginx pour servir le frontend

```bash
sudo nano /etc/nginx/sites-available/tickets-frontend
```

Contenu :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    root /opt/tickets-app/BARKI-MAME-DIARRA-BOUSSO/frontend/ticket-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activer :

```bash
sudo ln -s /etc/nginx/sites-available/tickets-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Configuration Nginx pour le Backend

```bash
sudo nano /etc/nginx/sites-available/tickets-backend
```

Contenu :

```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts pour les requêtes longues
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Activer :

```bash
sudo ln -s /etc/nginx/sites-available/tickets-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Configuration SSL

```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com -d api.votre-domaine.com
```

Certbot configurera automatiquement Nginx pour utiliser HTTPS.

## 🔄 Mises à jour

### Backend

```bash
cd /opt/tickets-app
git pull
cd BARKI-MAME-DIARRA-BOUSSO/backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart tickets-backend
```

### Frontend

```bash
cd /opt/tickets-app/BARKI-MAME-DIARRA-BOUSSO/frontend/ticket-frontend
git pull
npm install
npm run build
sudo systemctl reload nginx
```

## 💾 Sauvegardes

### Script de sauvegarde automatique

Créer `/opt/scripts/backup-tickets.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/backups/tickets"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
pg_dump -U tickets_user tickets_db > $BACKUP_DIR/db_$DATE.sql

# Compresser
gzip $BACKUP_DIR/db_$DATE.sql

# Garder seulement les 30 derniers jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Sauvegarde terminée : db_$DATE.sql.gz"
```

Rendre exécutable :

```bash
chmod +x /opt/scripts/backup-tickets.sh
```

Ajouter au crontab :

```bash
crontab -e
```

Ajouter :

```
0 2 * * * /opt/scripts/backup-tickets.sh
```

## 📊 Monitoring

### Vérifier les services

```bash
# Backend
sudo systemctl status tickets-backend

# PostgreSQL
sudo systemctl status postgresql

# Nginx
sudo systemctl status nginx
```

### Voir les logs

```bash
# Backend
sudo journalctl -u tickets-backend -f

# Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```
