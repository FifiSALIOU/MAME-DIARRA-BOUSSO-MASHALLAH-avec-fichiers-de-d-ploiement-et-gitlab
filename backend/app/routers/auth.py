import os
import secrets
from datetime import timedelta
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..email_service import email_service
from ..security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    decode_set_initial_password_token,
    get_password_hash,
    get_current_user,
    verify_password,
)

router = APIRouter()


@router.get("/register-info", response_model=schemas.RegisterInfo)
def get_register_info(db: Session = Depends(get_db)):
    """Retourne l'id du rôle Utilisateur et la liste des agences pour l'inscription publique (sans auth)."""
    role = db.query(models.Role).filter(models.Role.name == "Utilisateur").first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Registration is not available",
        )
    # Liste des agences (départements actifs) pour le formulaire d'inscription
    agencies: List[str] = []
    try:
        result = db.execute(
            text("SELECT name FROM departments WHERE is_active = TRUE ORDER BY name ASC")
        )
        agencies = [row[0] for row in result.fetchall()]
    except Exception:
        # Table departments peut ne pas exister si init_db n'a pas été réexécuté après mise à jour
        pass
    return schemas.RegisterInfo(default_role_id=role.id, agencies=agencies)


@router.post("/register", response_model=schemas.UserRead)
def register_user(
    user_in: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.User)
        .filter(
            (models.User.email == user_in.email)
            | (models.User.username == user_in.username)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with same email or username already exists",
        )

    # Mot de passe par défaut : envoyé par email ; l'utilisateur devra le changer à la première connexion
    default_password = secrets.token_urlsafe(10)  # mot de passe par défaut lisible
    db_user = models.User(
        full_name=user_in.full_name,
        email=user_in.email,
        agency=user_in.agency,
        phone=user_in.phone,
        username=user_in.username,
        password_hash=get_password_hash(default_password),
        must_change_password=True,
        role_id=user_in.role_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Envoyer l'email avec identifiants (username + mot de passe par défaut)
    if user_in.email and user_in.email.strip():
        background_tasks.add_task(
            email_service.send_registration_welcome,
            to_email=user_in.email.strip(),
            full_name=user_in.full_name,
            username=user_in.username,
            password=default_password,
        )

    return db_user


@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password, or account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Vérifier que l'utilisateur a un rôle valide
    if not user.role_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has no role assigned",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Charger le rôle pour s'assurer qu'il existe
    user.role = db.query(models.Role).filter(models.Role.id == user.role_id).first()
    if not user.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    must_change = getattr(user, "must_change_password", False)
    return schemas.Token(
        access_token=access_token,
        must_change_password=must_change,
    )


@router.post("/forgot-password")
def forgot_password(
    body: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Envoie un lien de réinitialisation par email si l'adresse existe."""
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email requis",
        )
    user = db.query(models.User).filter(models.User.email.ilike(email)).first()
    if not user:
        # Ne pas révéler si l'email existe ou non
        return {"message": "Si cet email est associé à un compte, un lien de réinitialisation a été envoyé."}
    if not user.actif:
        return {"message": "Si cet email est associé à un compte, un lien de réinitialisation a été envoyé."}
    token = create_password_reset_token(user.id)
    app_base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
    reset_link = f"{app_base_url}/reset-password?token={token}"
    if user.email and user.email.strip():
        background_tasks.add_task(
            email_service.send_password_reset_link,
            to_email=user.email.strip(),
            reset_link=reset_link,
            full_name=user.full_name,
        )
    return {"message": "Si cet email est associé à un compte, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
def reset_password(
    body: schemas.ResetPasswordWithToken,
    db: Session = Depends(get_db),
):
    """Définit un nouveau mot de passe via le token reçu par email (réinitialisation ou première connexion)."""
    user_id = decode_password_reset_token(body.token)
    if user_id is None:
        user_id = decode_set_initial_password_token(body.token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.",
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable",
        )
    if not body.new_password or len(body.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 6 caractères",
        )
    user.password_hash = get_password_hash(body.new_password)
    if getattr(user, "must_change_password", None) is True:
        user.must_change_password = False
    db.commit()
    return {"message": "Mot de passe mis à jour. Vous pouvez vous connecter."}


@router.post("/change-password")
def change_password(
    body: schemas.ChangePasswordRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permet à l'utilisateur connecté de changer son mot de passe (ex. après première connexion)."""
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mot de passe actuel incorrect",
        )
    if not body.new_password or len(body.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nouveau mot de passe doit contenir au moins 6 caractères",
        )
    current_user.password_hash = get_password_hash(body.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Mot de passe mis à jour. Vous pouvez continuer."}


@router.get("/me", response_model=schemas.UserRead)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Récupère les informations de l'utilisateur connecté"""
    # S'assurer que le rôle est chargé
    if current_user.role_id:
        current_user.role = db.query(models.Role).filter(models.Role.id == current_user.role_id).first()
    return current_user


@router.get("/roles", response_model=List[schemas.RoleRead])
def list_roles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Liste tous les rôles disponibles"""
    roles = db.query(models.Role).all()
    return roles


