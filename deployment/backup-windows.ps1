# Sauvegarde manuelle de la base tickets_db (Windows)
# Usage: .\backup-windows.ps1
# Ou planifier dans le Planificateur de tâches Windows.

$ErrorActionPreference = "Stop"
$BackupDir = Join-Path $PSScriptRoot "..\backups"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$DbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$DbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "tickets_db" }

# Charger .env à la racine du projet pour POSTGRES_PASSWORD si besoin
$EnvPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $EnvPath) {
    Get-Content $EnvPath | ForEach-Object {
        if ($_ -match '^\s*POSTGRES_(\w+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable("POSTGRES_$($matches[1])", $matches[2].Trim(), "Process")
        }
    }
}

$PgPassword = $env:POSTGRES_PASSWORD
if (-not $PgPassword) {
    Write-Host "Définissez POSTGRES_PASSWORD (dans .env ou variable d'environnement)." -ForegroundColor Yellow
    exit 1
}

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$OutFile = Join-Path $BackupDir "tickets_db_$Date.sql"

$env:PGPASSWORD = $PgPassword
try {
    & pg_dump -U $DbUser -h localhost -p 5432 $DbName -F p -f $OutFile
    if ($LASTEXITCODE -ne 0) { throw "pg_dump a échoué" }
    Write-Host "Sauvegarde OK : $OutFile" -ForegroundColor Green
} finally {
    $env:PGPASSWORD = $null
}
