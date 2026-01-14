from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Entreprise
from auth import get_current_user
from schemas import EntrepriseCreate

router = APIRouter(
    prefix="/entreprises",
    tags=["entreprises"]
)

@router.post("/")
def create_entreprise(
    entreprise: EntrepriseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_entreprise = Entreprise(
        tenant_id=current_user.tenant_id,
        **entreprise.dict()
    )
    db.add(new_entreprise)
    db.commit()
    db.refresh(new_entreprise)
    return new_entreprise

@router.get("/")
def list_entreprises(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Entreprise).filter(Entreprise.tenant_id == current_user.tenant_id).all()
