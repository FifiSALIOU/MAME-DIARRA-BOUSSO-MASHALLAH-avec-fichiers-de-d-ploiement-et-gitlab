# Sauvegarde de la base de données

## Votre situation actuelle

- **Aucune sauvegarde automatique** n’est configurée sur votre PC.
- Vos données sont dans **PostgreSQL sur votre machine** (avec `POSTGRES_HOST=host.docker.internal`), pas dans le conteneur Docker.
- Il est important de **faire des sauvegardes régulières** pour ne pas perdre tickets et utilisateurs.

## Sauvegarde manuelle (Windows)

### Prérequis

- PostgreSQL installé sur votre machine (client `pg_dump` disponible).
- Si `pg_dump` n’est pas dans le PATH, ajoutez le dossier `bin` de PostgreSQL (ex. `C:\Program Files\PostgreSQL\15\bin`) à la variable d’environnement PATH.

### Commande rapide (PowerShell)

Depuis la racine du projet, avec les variables du fichier `.env` (utilisateur/mot de passe/base) :

```powershell
cd "c:\Users\easys\OneDrive\Documents\BARKI BAYE LAHAD MBACKE7575\BARKI-MAME-DIARRA-BOUSSO"
$env:PGPASSWORD = "Passer123"
pg_dump -U postgres -h localhost -p 5432 tickets_db -F p -f "backups\tickets_db_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$env:PGPASSWORD = $null
```

Créez d’abord le dossier `backups` à la racine du projet si besoin : `mkdir backups`

### Script fourni

Le script **`deployment\backup-windows.ps1`** lit le `.env` et enregistre un fichier dans `backups\` :

```powershell
cd "chemin\vers\BARKI-MAME-DIARRA-BOUSSO"
.\deployment\backup-windows.ps1
```

Les sauvegardes sont créées dans le dossier **`backups`** (ignoré par Git).

## Planifier une sauvegarde automatique (Windows)

1. Ouvrir le **Planificateur de tâches** Windows.
2. Créer une tâche (ex. quotidienne à 2 h du matin).
3. Action : Démarrer un programme  
   - Programme : `powershell.exe`  
   - Arguments : `-ExecutionPolicy Bypass -File "C:\Users\easys\OneDrive\Documents\BARKI BAYE LAHAD MBACKE7575\BARKI-MAME-DIARRA-BOUSSO\deployment\backup-windows.ps1"`

Votre base sera alors sauvegardée automatiquement.

## Restaurer une sauvegarde

```powershell
psql -U postgres -h localhost -p 5432 tickets_db -f backups\tickets_db_20250217_120000.sql
```

(Adapter le nom du fichier et le mot de passe si besoin.)
