from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import User, ContratDossier, ContratVersion, Candidat, Entreprise, SessionDay
from auth import get_current_user
from schemas import ContratCreate, ContratAvenant

router = APIRouter(
    prefix="/contrats",
    tags=["contrats"]
)

@router.get("/")
def get_contrats(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all Contract Dossiers for the tenant.
    Includes Candidat and Entreprise relationships.
    """
    dossiers = db.query(ContratDossier).options(
        joinedload(ContratDossier.candidat),
        joinedload(ContratDossier.entreprise),
        joinedload(ContratDossier.versions)
    ).filter(
        ContratDossier.tenant_id == current_user.tenant_id
    ).offset(skip).limit(limit).all()
    
    # We enrich the response with the active version details if needed
    results = []
    for d in dossiers:
        active_version = next((v for v in d.versions if v.is_active), None)
        results.append({
            "id": d.id,
            "candidat": d.candidat,
            "entreprise": d.entreprise,
            "active_version": active_version
        })
        
    return results

@router.post("/")
def create_contrat(
    contrat_data: ContratCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    candidat = db.query(Candidat).filter(Candidat.id == contrat_data.candidat_id, Candidat.tenant_id == current_user.tenant_id).first()
    if not candidat:
        raise HTTPException(status_code=404, detail="Candidat not found")
        
    entreprise = db.query(Entreprise).filter(Entreprise.id == contrat_data.entreprise_id, Entreprise.tenant_id == current_user.tenant_id).first()
    if not entreprise:
        raise HTTPException(status_code=404, detail="Entreprise not found")

    try:
        dossier = ContratDossier(
            tenant_id=current_user.tenant_id,
            candidat_id=contrat_data.candidat_id,
            entreprise_id=contrat_data.entreprise_id
        )
        db.add(dossier)
        db.flush()

        version_1 = ContratVersion(
            tenant_id=current_user.tenant_id,
            contrat_dossier_id=dossier.id,
            session_id=contrat_data.session_id, 
            version_number=1,
            salaire=contrat_data.salaire,
            cout_npec=contrat_data.cout_npec,          # NEW
            heures_formation=contrat_data.heures_formation, # NEW
            date_debut=contrat_data.date_debut,
            date_fin=contrat_data.date_fin,
            intitule_poste=contrat_data.intitule_poste,
            is_active=True
        )
        db.add(version_1)
        
        db.commit()
        db.refresh(dossier)
        return {"dossier_id": dossier.id, "message": "Contrat créé V1"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{dossier_id}/avenant")
def create_avenant(
    dossier_id: int,
    avenant_data: ContratAvenant,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dossier = db.query(ContratDossier).filter(ContratDossier.id == dossier_id, ContratDossier.tenant_id == current_user.tenant_id).first()
    if not dossier:
        raise HTTPException(status_code=404, detail="Contrat Dossier not found")

    try:
        current_version = db.query(ContratVersion).filter(
            ContratVersion.contrat_dossier_id == dossier.id,
            ContratVersion.is_active == True
        ).first()

        new_version_number = 1
        current_session_id = None
        current_npec = None
        current_hours = None
        
        if current_version:
            current_version.is_active = False
            new_version_number = current_version.version_number + 1
            current_session_id = current_version.session_id 
            current_npec = current_version.cout_npec
            current_hours = current_version.heures_formation
        
        new_session_id = avenant_data.session_id if avenant_data.session_id is not None else current_session_id
        new_npec = avenant_data.cout_npec if avenant_data.cout_npec is not None else current_npec
        new_hours = avenant_data.heures_formation if avenant_data.heures_formation is not None else current_hours

        new_version = ContratVersion(
            tenant_id=current_user.tenant_id,
            contrat_dossier_id=dossier.id,
            session_id=new_session_id, 
            version_number=new_version_number,
            salaire=avenant_data.salaire,
            cout_npec=new_npec,
            heures_formation=new_hours,
            date_debut=avenant_data.date_debut,
            date_fin=avenant_data.date_fin,
            intitule_poste=avenant_data.intitule_poste or (current_version.intitule_poste if current_version else "Avenant"),
            is_active=True
        )
        db.add(new_version)
        db.commit()
        
        return {"message": f"Avenant créé. Nouvelle version : {new_version_number}"}

    except Exception as e:
        db.rollback()
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dossier_id}")
def get_contrat_active(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dossier = db.query(ContratDossier).options(
        joinedload(ContratDossier.versions)
    ).filter(
        ContratDossier.id == dossier_id, 
        ContratDossier.tenant_id == current_user.tenant_id
    ).first()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Not found")
        
    active_version = next((v for v in dossier.versions if v.is_active), None)
    
    return {
        "dossier": dossier,
        "active_version": active_version
    }

@router.get("/{dossier_id}/history")
def get_contrat_history(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    versions = db.query(ContratVersion).filter(
        ContratVersion.contrat_dossier_id == dossier_id,
        ContratVersion.tenant_id == current_user.tenant_id
    ).order_by(ContratVersion.version_number.asc()).all()
    
    return versions

@router.get("/{dossier_id}/calendar")
def get_contrat_calendar(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Get Active Version
    version = db.query(ContratVersion).join(ContratDossier).filter(
        ContratDossier.id == dossier_id,
        ContratDossier.tenant_id == current_user.tenant_id,
        ContratVersion.is_active == True
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Contrat actif non trouvé")
        
    if not version.session_id:
        raise HTTPException(status_code=400, detail="Aucune session liée à ce contrat")

    # 2. Get Session Days intersecting Contract Dates
    days = db.query(SessionDay).filter(
        SessionDay.session_id == version.session_id,
        SessionDay.date >= version.date_debut,
        SessionDay.date <= version.date_fin
    ).order_by(SessionDay.date).all()
    
    return days
