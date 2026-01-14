from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import Dict, Any

from database import get_db
from models import User, ContratVersion, Invoice, Candidat, CandidatStatus, Session as TrainingSession, Attendance, AttendanceStatus, SessionDay, InvoiceStatus
from auth import get_current_user

router = APIRouter(
    prefix="/analytics",
    tags=["Intelligence & Analytics"]
)

@router.get("/dashboard")
def get_financial_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.tenant_id

    # 1. CA Prévisionnel : Somme (Coût NPEC) des contrats actifs
    # Note: Si cout_npec est null, on considère 0.
    ca_previsionnel = db.query(func.sum(ContratVersion.cout_npec))\
        .filter(ContratVersion.tenant_id == tenant_id, ContratVersion.is_active == True)\
        .scalar() or 0

    # 2. CA Réalisé : Somme (montant_ht) des factures EMISE ou PAYEE
    ca_realise = db.query(func.sum(Invoice.montant_ht))\
        .filter(
            Invoice.tenant_id == tenant_id, 
            Invoice.statut.in_([InvoiceStatus.EMISE, InvoiceStatus.PAYEE])
        ).scalar() or 0

    # 3. Taux Transformation : (Statut 'PLACE' / Total) * 100
    total_candidats = db.query(func.count(Candidat.id))\
        .filter(Candidat.tenant_id == tenant_id).scalar() or 0
    
    places_candidats = db.query(func.count(Candidat.id))\
        .filter(Candidat.tenant_id == tenant_id, Candidat.statut == CandidatStatus.PLACE)\
        .scalar() or 0

    taux_transformation = 0.0
    if total_candidats > 0:
        taux_transformation = (places_candidats / total_candidats) * 100

    return {
        "ca_previsionnel": float(ca_previsionnel),
        "ca_realise": float(ca_realise),
        "taux_transformation": round(taux_transformation, 2)
    }

@router.get("/bpf-preview")
def get_bpf_preview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tenant_id = current_user.tenant_id

    # 1. Répartition Sexe (Candidats avec un contrat ou juste candidats ? Le prompt dit "basé sur la table Candidats liée aux Contrats actifs")
    # Interpretation: Join ContratVersion active -> ContratDossier -> Candidat
    # Ou plus simple: Tous les candidats pour l'instant, ou ceux qui sont 'PLACE'.
    # Suivons la consigne stricte : "liée aux Contrats actifs"
    
    # Query: Group by civilite, Count
    # Join path: Candidat -> ContratDossier -> ContratVersion(is_active=True)
    # Fix: Use explicit joins as reverse relationships might not be defined
    from models import ContratDossier
    
    sex_stats = db.query(Candidat.civilite, func.count(Candidat.id))\
        .join(ContratDossier, ContratDossier.candidat_id == Candidat.id)\
        .join(ContratVersion, ContratVersion.contrat_dossier_id == ContratDossier.id)\
        .filter(
            Candidat.tenant_id == tenant_id,
            ContratVersion.is_active == True
        ).group_by(Candidat.civilite).all()
    
    repartition_sexe = {
        "H": 0,
        "F": 0,
        "AUTRE": 0
    }
    for civ, count in sex_stats:
        if civ == "M": repartition_sexe["H"] += count
        elif civ == "MME": repartition_sexe["F"] += count
        else: repartition_sexe["AUTRE"] += count

    # 2. Total Heures Réalisées (Attendance PRESENT)
    # Join Attendance -> SessionDay
    # Logic: 3.5h per half day.
    # We can sum (is_morning + is_afternoon) * 3.5 roughly or be more precise.
    # Let's count morning presents + afternoon presents if we tracked them separately?
    # Model Attendance has 'session_day_id'. SessionDay has is_morning/is_afternoon.
    # BUT Attendance status is global for the day? Or usually Attendance is per half-day?
    # Schema says: Attendance linked to SessionDay. SessionDay has date.
    # Usually attendance is granular. Assuming AttendanceStatus.PRESENT means "Present for the required duration of that day".
    # SessionDay has 'is_morning' (bool) and 'is_afternoon' (bool).
    # If both are true -> 7h. If one -> 3.5h.
    
    # Let's fetch all PRESENT attendances and sum their theoretical hours.
    # Optimization: perform sum in DB.
    # CASE WHEN (is_morning AND is_afternoon) THEN 7 ELSE 3.5 END
    
    total_hours = db.query(
        func.sum(
            case(
                (SessionDay.is_morning & SessionDay.is_afternoon, 7.0),
                else_=3.5
            )
        )
    ).select_from(Attendance).join(SessionDay, Attendance.session_day_id == SessionDay.id)\
     .filter(
         Attendance.tenant_id == tenant_id,
         Attendance.status == AttendanceStatus.PRESENT
     ).scalar() or 0

    # 3. Répartition RNCP
    # Group by Session.formation_rncp_id, Count (Distinct Candidat via Contrat)
    rncp_stats = db.query(TrainingSession.formation_rncp_id, func.count(ContratVersion.id))\
        .join(ContratVersion, ContratVersion.session_id == TrainingSession.id)\
        .filter(
            TrainingSession.tenant_id == tenant_id,
            ContratVersion.is_active == True
        ).group_by(TrainingSession.formation_rncp_id).all()
    
    repartition_rncp = {rncp: count for rncp, count in rncp_stats if rncp}

    return {
        "repartition_sexe": repartition_sexe,
        "total_heures_realisees": total_hours,
        "repartition_rncp": repartition_rncp
    }
