from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Attendance, Invoice, InvoiceStatus, ContratDossier, ContratVersion, SessionDay
from auth import get_current_user
from schemas import AttendanceCreate, InvoiceGenerate
from services.billing_service import BillingService
from datetime import date

router = APIRouter(
    tags=["finance"]
)

@router.post("/attendance")
def declare_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Idempotency: Update if exists, else Create
    attendance = db.query(Attendance).filter(
        Attendance.contrat_version_id == data.contrat_version_id,
        Attendance.session_day_id == data.session_day_id,
        Attendance.tenant_id == current_user.tenant_id
    ).first()
    
    if attendance:
        attendance.status = data.status
    else:
        attendance = Attendance(
            tenant_id=current_user.tenant_id,
            session_day_id=data.session_day_id,
            contrat_version_id=data.contrat_version_id,
            status=data.status
        )
        db.add(attendance)
        
    db.commit()
    db.refresh(attendance)
    return attendance

@router.post("/invoices/generate")
def generate_invoice(
    data: InvoiceGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get Dossier & Active Version
    dossier = db.query(ContratDossier).filter(
        ContratDossier.id == data.contrat_dossier_id,
        ContratDossier.tenant_id == current_user.tenant_id
    ).first()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier not found")
        
    version = db.query(ContratVersion).filter(
        ContratVersion.contrat_dossier_id == dossier.id,
        ContratVersion.is_active == True
    ).first()
    
    if not version:
        raise HTTPException(status_code=400, detail="No active version")

    # Calculate
    service = BillingService()
    amount = service.calculate_billable_amount(
        db, version, data.periode_debut, data.periode_fin
    )
    
    # Create Invoice
    numero = f"F{date.today().year}-{dossier.id}-{date.today().month}" # Simplistic numbering
    
    invoice = Invoice(
        tenant_id=current_user.tenant_id,
        contrat_dossier_id=dossier.id,
        numero_facture=numero,
        montant_ht=amount,
        statut=InvoiceStatus.BROUILLON,
        date_emission=date.today(),
        periode_debut=data.periode_debut,
        periode_fin=data.periode_fin
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice
