"""
Script pour ajouter la colonne must_change_password à la table users.
À exécuter une fois : depuis la racine du backend, python add_must_change_password_column.py
"""
from sqlalchemy import text
from app.database import engine


def add_must_change_password_column():
    try:
        with engine.begin() as conn:
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'users'
                AND column_name = 'must_change_password'
            """))
            if result.fetchone():
                print("[OK] La colonne must_change_password existe déjà.")
                return
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN must_change_password BOOLEAN DEFAULT false
            """))
            print("[OK] Colonne must_change_password ajoutée avec succès.")
    except Exception as e:
        print(f"[ERREUR] {e}")
        raise


if __name__ == "__main__":
    add_must_change_password_column()
