#!/bin/bash
# Script de sauvegarde automatique de la base de données
# À placer dans /opt/scripts/backup-tickets.sh
# Ajouter au crontab: 0 2 * * * /opt/scripts/backup-tickets.sh

BACKUP_DIR="/backups/tickets"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-tickets_db}"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
# Si vous utilisez Docker:
# docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Si vous utilisez PostgreSQL directement:
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Compresser la sauvegarde
gzip $BACKUP_DIR/db_$DATE.sql

# Garder seulement les 30 derniers jours
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Sauvegarde terminée : db_$DATE.sql.gz"

# Optionnel: Upload vers un service cloud (S3, etc.)
# aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://votre-bucket/backups/
