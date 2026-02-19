from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import os
import traceback

from .routers import auth, tickets, users, notifications, settings, ticket_config, assets, maintenance
from .scheduler import run_scheduled_tasks


def create_app() -> FastAPI:
    app = FastAPI(title="Système de gestion des tickets")

    @app.exception_handler(Exception)
    async def log_unhandled_exception(request: Request, exc: Exception):
        """Log toute exception non gérée avec la trace pour faciliter le diagnostic des 500."""
        tb = traceback.format_exc()
        print(f"[500] Unhandled exception on {request.method} {request.url.path}\n{tb}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    # Configuration CORS pour permettre les requêtes depuis le frontend
    # Récupérer les origines depuis les variables d'environnement ou utiliser les valeurs par défaut
    allowed_origins_str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
    )
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # Routers principaux
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
    app.include_router(settings.router, tags=["settings"])
    app.include_router(ticket_config.router)
    # Routes d'actifs : exposées directement sous /assets/ pour correspondre au frontend
    app.include_router(assets.router, tags=["assets"])
    # Routes de maintenance (statistiques base de données, etc.)
    app.include_router(maintenance.router, tags=["maintenance"])

    # Configurer le scheduler pour exécuter les tâches planifiées
    scheduler = BackgroundScheduler()
    # Exécuter toutes les heures
    scheduler.add_job(
        run_scheduled_tasks,
        trigger=CronTrigger(minute=0),  # Toutes les heures à la minute 0
        id='run_scheduled_tasks',
        name='Exécuter les tâches planifiées (rappels et clôtures)',
        replace_existing=True
    )
    scheduler.start()

    return app


app = create_app()


