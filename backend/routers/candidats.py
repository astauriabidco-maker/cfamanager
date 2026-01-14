from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db
from models import User, Candidat, CandidatStatus
from auth import get_current_user
from repository import BaseRepository
from services.cv_parser import CvParserService

router = APIRouter(
    prefix="/candidats",
    tags=["candidats"]
)

@router.post("/upload")
def upload_cv(
    file: UploadFile = File(...),
    # Optional metadata if we want to force names, otherwise we default to "Inconnu" until parsed 
    # But checking requrements: "Tente de trouver l'email...". 
    # Let's assume user might send other data or we create a skeleton candidate.
    # Requirement says: "Crée une route... accepte fichier... Sauvegarde... Parsing... Regex Email... Pré-remplis".
    # It implies we are creating the candidate here.
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = CvParserService(current_user.tenant_id)
    
    # 1. Save
    file_path = service.save_upload(file)
    
    # 2. Extract
    raw_text = service.extract_text(file_path)
    
    # 3. Detect Email
    detected_email = service.extract_email(raw_text)
    
    # Create Model
    # Note: Name is mandatory in DB, so we put placeholders if not provided. 
    # In a real UI, this would be a 2-step process or a form with file + fields.
    # For this exercise context, we auto-create.
    
    new_candidat = Candidat(
        tenant_id=current_user.tenant_id,
        first_name="Candidat", # Placeholder
        last_name="Inconnu",   # Placeholder
        email=detected_email,  # Might be None
        cv_filename=file.filename,
        cv_raw_text=raw_text,
        statut=CandidatStatus.NOUVEAU
    )
    
    db.add(new_candidat)
    db.commit()
    db.refresh(new_candidat)
    
    return {
        "id": new_candidat.id,
        "email_detected": detected_email,
        "text_preview": raw_text[:200] + "..." if raw_text else "",
        "status": new_candidat.statut
    }

@router.get("/")
def list_candidats(
    page: int = 1,
    size: int = 50,
    status: Optional[CandidatStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Tenant Isolation via Repository logic manual here
    query = db.query(Candidat).filter(Candidat.tenant_id == current_user.tenant_id)
    
    if status:
        query = query.filter(Candidat.statut == status)
        
    # Validating pagination
    if page < 1: page = 1
    if size < 1: size = 50
    if size > 100: size = 100 # Cap max size
    
    skip = (page - 1) * size
    return query.offset(skip).limit(size).all()

from schemas import CandidatCreate

@router.post("/", status_code=201)
def create_candidat(
    candidat: CandidatCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_candidat = Candidat(
        tenant_id=current_user.tenant_id,
        first_name=candidat.first_name,
        last_name=candidat.last_name,
        email=candidat.email,
        civilite=candidat.civilite,
        statut=candidat.statut
    )
    db.add(new_candidat)
    db.commit()
    db.refresh(new_candidat)
    return new_candidat

@router.patch("/{id}/status")
def update_status(
    id: int,
    status: CandidatStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Strict isolation check
    candidat = db.query(Candidat).filter(
        Candidat.id == id,
        Candidat.tenant_id == current_user.tenant_id
    ).first()
    
    if not candidat:
        raise HTTPException(status_code=404, detail="Candidat not found")
        
    candidat.statut = status
    db.commit()
    db.refresh(candidat)
    return candidat
