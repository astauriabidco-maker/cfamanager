from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, ContratDossier, ContratVersion, Candidat, Entreprise
from auth import get_current_user
from services.pdf_service import PdfService
import io
import zipfile

router = APIRouter(
    prefix="/contrats",
    tags=["exports"]
)

@router.get("/{dossier_id}/export-zip")
def export_contrat_zip(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch Data (Strict Isolation)
    dossier = db.query(ContratDossier).filter(
        ContratDossier.id == dossier_id, 
        ContratDossier.tenant_id == current_user.tenant_id
    ).first()
    
    if not dossier:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
        
    # Get Active Version
    version = db.query(ContratVersion).filter(
        ContratVersion.contrat_dossier_id == dossier.id,
        ContratVersion.is_active == True
    ).first()
    
    if not version:
        raise HTTPException(status_code=400, detail="Aucune version active pour ce contrat")

    candidat = db.query(Candidat).filter(Candidat.id == dossier.candidat_id).first()
    entreprise = db.query(Entreprise).filter(Entreprise.id == dossier.entreprise_id).first()

    # 2. Prepare Context for PDF
    context = {
        "entreprise_nom": entreprise.raison_sociale if entreprise else "N/A",
        "entreprise_adresse": entreprise.adresse or "N/A",
        "entreprise_siret": entreprise.siret or "N/A",
        "candidat_nom": candidat.last_name,
        "candidat_prenom": candidat.first_name,
        "candidat_email": candidat.email,
        "intitule_poste": version.intitule_poste,
        "date_debut": version.date_debut.strftime("%d/%m/%Y") if version.date_debut else "N/A",
        "date_fin": version.date_fin.strftime("%d/%m/%Y") if version.date_fin else "N/A",
        "salaire": str(version.salaire),
        "version_number": version.version_number
    }

    # 3. Generate PDF
    pdf_service = PdfService()
    try:
        pdf_bytes = pdf_service.generate_contrat_pdf(context)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du PDF")

    # 4. Create ZIP in Memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # Add PDF
        pdf_filename = f"Contrat_{candidat.last_name}_{candidat.first_name}_V{version.version_number}.pdf"
        zip_file.writestr(pdf_filename, pdf_bytes)
        
        # Add a text file with details (Metadata)
        details = f"""
        Export OPCO - Mode Dégradé
        Généré le: {context['date_jour']}
        Tenant ID: {current_user.tenant_id}
        Dossier ID: {dossier.id}
        Version Active: {version.version_number}
        """.strip()
        zip_file.writestr("details.txt", details)

    zip_buffer.seek(0)

    # 5. Return Stream
    return StreamingResponse(
        zip_buffer, 
        media_type="application/zip", 
        headers={"Content-Disposition": f"attachment; filename=export_contrat_{dossier.id}.zip"}
    )
