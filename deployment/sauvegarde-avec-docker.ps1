# Sauvegarde de tickets_db avec Docker (pas besoin d'installer PostgreSQL sur le PC)
# Usage: .\deployment\sauvegarde-avec-docker.ps1

$BackupDir = Join-Path $PSScriptRoot "..\backups"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$FileName = "tickets_db_$Date.sql"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Chemin Windows pour le volume Docker
$BackupPathWin = (Resolve-Path $BackupDir).Path

docker run --rm `
  -e PGPASSWORD=Passer123 `
  -v "${BackupPathWin}:/backups" `
  postgres:17-alpine `
  pg_dump -U postgres -h host.docker.internal -p 5432 tickets_db -F p -f "/backups/$FileName"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Sauvegarde OK : backups\$FileName" -ForegroundColor Green
} else {
    Write-Host "Erreur. Verifiez que Docker tourne et que PostgreSQL ecoute sur le port 5432." -ForegroundColor Red
}
