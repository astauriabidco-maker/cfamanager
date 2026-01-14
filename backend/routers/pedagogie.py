from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import User, Session as SessionModel, SessionDay, ContratDossier, ContratVersion
from auth import get_current_user
from schemas import SessionCreate, CalendarGenerate
from services.planning_service import PlanningService

router = APIRouter(
    prefix="/sessions", # Note: We also handle contract calendar here or separate? Requirement said /contrats/.../calendar.
    tags=["pedagogie"]
)

# /sessions endpoints
@router.post("/")
def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_session = SessionModel(
        tenant_id=current_user.tenant_id,
        nom=session_data.nom,
        date_debut=session_data.date_debut,
        date_fin=session_data.date_fin,
        formation_rncp_id=session_data.formation_rncp_id
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/{session_id}/generate-calendar")
def generate_session_calendar(
    session_id: int,
    calendar_data: CalendarGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.tenant_id == current_user.tenant_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    service = PlanningService()
    count = service.generate_session_days(
        db, 
        session_id, 
        session.date_debut, 
        session.date_fin, 
        calendar_data.days_of_week
    )
    
    return {"message": f"{count} jours de formation générés"}

# Contract Calendar Endpoint 
# Putting it here or in Contrats router? 
# Planning is Pedagogy domain, but URL is /contrats.
# I will put it in this file but mount it correctly or just add a separate router strictly for this?
# Simplest: Add it here with prefix override or just use /contrats prefix in this router? 
# No, let's keep clean separation. I will add this specific endpoint to `routers/contrats.py` or just define it here with specific path.
# Let's keep it here but the path is specific. Or I can add `GET /sessions/contrat/{dossier_id}/calendar`.
# User requirement said `GET /contrats/{dossier_id}/calendar`.
# I will implement it in `routers/contrats.py` as it makes more sense there (resource is contract).
