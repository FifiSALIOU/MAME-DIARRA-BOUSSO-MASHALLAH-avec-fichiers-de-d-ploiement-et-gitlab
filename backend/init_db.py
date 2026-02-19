"""
Script d'initialisation de la base de données
Crée les tables et les rôles par défaut
"""
from app.database import Base, engine, SessionLocal
from app import models
from app.security import get_password_hash
from sqlalchemy import text


def _table_exists(conn, table_name: str) -> bool:
    """Vérifie si une table existe dans la base."""
    result = conn.execute(
        text(
            "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = :t"
        ),
        {"t": table_name},
    )
    return result.first() is not None


def init_departments_table():
    """Crée la table departments si elle n'existe pas (utilisée par /auth/register-info)."""
    with engine.connect() as conn:
        if _table_exists(conn, "departments"):
            return
        conn.execute(
            text(
                """
                CREATE TABLE departments (
                    id        SERIAL PRIMARY KEY,
                    name      TEXT NOT NULL UNIQUE,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE
                );
                """
            )
        )
        conn.commit()
    print("OK - Table departments creee")

def init_roles(db):
    """Crée les rôles par défaut"""
    roles_data = [
        {
            "name": "Utilisateur",
            "description": "Utilisateur standard qui peut créer des tickets et suivre leur statut"
        },
        {
            "name": "Secrétaire DSI",
            "description": "Peut assigner et gérer les tickets"
        },
        {
            "name": "Adjoint DSI",
            "description": "Peut assigner, réassigner, escalader et générer des rapports"
        },
        {
            "name": "Technicien",
            "description": "Peut prendre en charge et résoudre les tickets"
        },
        {
            "name": "DSI",
            "description": "Directeur des Systèmes Informatiques - Accès complet"
        },
        {
            "name": "Admin",
            "description": "Administrateur système avec tous les droits"
        }
    ]
    
    for role_data in roles_data:
        existing = db.query(models.Role).filter(models.Role.name == role_data["name"]).first()
        if not existing:
            role = models.Role(**role_data)
            db.add(role)
            print(f"OK - Role cree: {role_data['name']}")
        else:
            print(f"-> Role existe deja: {role_data['name']}")
    
    db.commit()

def init_admin_user(db):
    """Crée un utilisateur administrateur par défaut"""
    admin_role = db.query(models.Role).filter(models.Role.name == "Admin").first()
    if not admin_role:
        print("ERREUR: Le role Admin n'existe pas")
        return
    
    existing = db.query(models.User).filter(models.User.username == "admin").first()
    if not existing:
        admin_user = models.User(
            full_name="Administrateur",
            email="admin@example.com",
            username="admin",
            password_hash=get_password_hash("admin123"),  # Changez ce mot de passe en production !
            role_id=admin_role.id,
            agency="Agence IT",
            actif=True
        )
        db.add(admin_user)
        db.commit()
        print("OK - Utilisateur admin cree (username: admin, password: admin123)")
        print("ATTENTION: Changez le mot de passe admin en production !")
    else:
        print("-> Utilisateur admin existe deja")


def init_ticket_types_and_categories(db):
    """
    Initialise les types et catégories de tickets par défaut si les tables sont vides.
    Ces données pourront ensuite être modifiées directement dans la base.
    """
    # Types de tickets
    existing_types = db.query(models.TicketTypeModel).count()
    if existing_types == 0:
        default_types = [
            {"code": "materiel", "label": "Matériel"},
            {"code": "applicatif", "label": "Applicatif"},
        ]
        for t in default_types:
            db.add(models.TicketTypeModel(**t))
        db.commit()
        print("OK - Types de tickets par défaut créés")

    # Catégories de tickets
    existing_categories = db.query(models.TicketCategory).count()
    if existing_categories == 0:
        # Récupérer les IDs des types depuis la base
        materiel_type = db.query(models.TicketTypeModel).filter(models.TicketTypeModel.code == "materiel").first()
        applicatif_type = db.query(models.TicketTypeModel).filter(models.TicketTypeModel.code == "applicatif").first()
        
        if not materiel_type or not applicatif_type:
            print("ERREUR: Les types de tickets (materiel, applicatif) doivent exister avant de créer les catégories")
            return
        
        default_categories = [
            # Matériel
            {"name": "Ordinateur portable", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Ordinateur de bureau", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Imprimante", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Scanner", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Écran/Moniteur", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Clavier/Souris", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Réseau (Switch, Routeur)", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Serveur", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Téléphone/IP Phone", "description": None, "ticket_type_id": materiel_type.id},
            {"name": "Autre matériel", "description": None, "ticket_type_id": materiel_type.id},
            # Applicatif
            {"name": "Système d'exploitation", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Logiciel bureautique", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Application métier", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Email/Messagerie", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Navigateur web", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Base de données", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Sécurité/Antivirus", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Application web", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "API/Service", "description": None, "ticket_type_id": applicatif_type.id},
            {"name": "Autre applicatif", "description": None, "ticket_type_id": applicatif_type.id},
        ]
        for c in default_categories:
            db.add(models.TicketCategory(**c))
        db.commit()
        print("OK - Catégories de tickets par défaut créées")

def main():
    print("Initialisation de la base de donnees...")
    print("-" * 50)
    
    # Créer toutes les tables
    print("\nCreation des tables...")
    Base.metadata.create_all(bind=engine)
    print("OK - Tables creees")

    # Table departments (pour inscription publique /auth/register-info)
    init_departments_table()

    # Initialiser les rôles
    print("\nCreation des roles...")
    db = SessionLocal()
    try:
        init_roles(db)
        init_admin_user(db)
        init_ticket_types_and_categories(db)
    finally:
        db.close()
    
    print("\n" + "-" * 50)
    print("OK - Initialisation terminee avec succes !")
    print("\nVous pouvez maintenant:")
    print("  - Lancer le backend: uvicorn app.main:app --reload")
    print("  - Vous connecter avec: username=admin, password=admin123")

if __name__ == "__main__":
    main()

