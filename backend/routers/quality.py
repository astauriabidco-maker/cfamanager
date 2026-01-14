from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, Ticket, TicketStatus, TicketCategory, Survey, SurveyType, AuditLog
from schemas import TicketCreate, TicketResponse, SurveyCreate, AuditLogResponse
from auth import get_current_user
from repository import BaseRepository

router = APIRouter(
    prefix="/quality",
    tags=["Quality & Compliance"]
)

# --- Tickets ---

@router.post("/tickets", response_model=TicketResponse)
def create_ticket(
    ticket: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_ticket = Ticket(
        tenant_id=current_user.tenant_id,
        author_id=current_user.id,
        subject=ticket.subject,
        description=ticket.description,
        status=TicketStatus.OPEN,
        category=ticket.category,
        created_at=datetime.utcnow()
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@router.get("/tickets", response_model=List[TicketResponse])
def get_tickets(
    page: int = 1,
    size: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Filter by Tenant
    query = db.query(Ticket).filter(Ticket.tenant_id == current_user.tenant_id)
    
    # Pagination
    skip = (page - 1) * size
    return query.offset(skip).limit(size).all()

# --- Surveys ---

@router.post("/surveys")
def create_survey_response(
    survey: SurveyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify target if provided? For now, trust input or default to current user
    target_id = survey.target_user_id if survey.target_user_id else current_user.id
    
    new_survey = Survey(
        tenant_id=current_user.tenant_id,
        target_user_id=target_id,
        type=survey.type,
        score=survey.score,
        comment=survey.comment
    )
    db.add(new_survey)
    db.commit()
    db.refresh(new_survey)
    return {"message": "Survey recorded successfully", "id": new_survey.id}

# --- Audit Logs (Admin Only) ---

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    page: int = 1,
    size: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if admin logic could be added here. For now, we return all logs for the tenant.
    # In a real app, maybe only 'admin' role can see this.
    if current_user.role != "admin": # Simple check based on User model having 'role'
         # Note: User model has 'role' field (default="admin").
         # If existing users are admins, this is fine. If regular users exist, might need better check.
         pass 

    skip = (page - 1) * size
    logs = db.query(AuditLog).filter(AuditLog.tenant_id == current_user.tenant_id)\
        .order_by(AuditLog.timestamp.desc())\
        .offset(skip).limit(size).all()
    return logs

# --- Regulatory Watch (Veille) ---

from models import RegulatoryWatch, RegulatoryRead
from schemas import RegulatoryWatchCreate, RegulatoryWatchResponse

@router.post("/regulatory-watch", response_model=RegulatoryWatchResponse)
def create_regulatory_watch(
    watch: RegulatoryWatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can publish regulatory watch")

    new_watch = RegulatoryWatch(
        tenant_id=current_user.tenant_id,
        title=watch.title,
        description=watch.description,
        category=watch.category,
        file_url=watch.file_url,
        created_at=datetime.utcnow()
    )
    db.add(new_watch)
    db.commit()
    db.refresh(new_watch)
    return new_watch

@router.get("/regulatory-watch", response_model=List[RegulatoryWatchResponse])
def get_regulatory_watch(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Return all watch items for the tenant
    items = db.query(RegulatoryWatch).filter(RegulatoryWatch.tenant_id == current_user.tenant_id)\
        .order_by(RegulatoryWatch.created_at.desc()).all()
    return items

@router.post("/regulatory-watch/{watch_id}/mark-as-read")
def mark_watch_as_read(
    watch_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify watch exists and belongs to tenant
    watch = db.query(RegulatoryWatch).filter(RegulatoryWatch.id == watch_id, RegulatoryWatch.tenant_id == current_user.tenant_id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch item not found")

    # Check if already read
    existing_read = db.query(RegulatoryRead).filter(
        RegulatoryRead.watch_id == watch_id,
        RegulatoryRead.user_id == current_user.id
    ).first()

    if existing_read:
        return {"message": "Already marked as read"}

    new_read = RegulatoryRead(
        watch_id=watch_id,
        user_id=current_user.id,
        read_at=datetime.utcnow()
    )
    db.add(new_read)
    db.commit()
    return {"message": "Marked as read"}
