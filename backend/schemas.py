from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal
from models import AttendanceStatus

class EntrepriseCreate(BaseModel):
    raison_sociale: str
    siret: Optional[str] = None
    adresse: Optional[str] = None
    code_idcc: Optional[str] = None

class SessionCreate(BaseModel):
    nom: str
    date_debut: date
    date_fin: date
    formation_rncp_id: Optional[str] = None

from models import Civilite, CandidatStatus

class CandidatCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    civilite: Optional[Civilite] = Civilite.M
    statut: Optional[CandidatStatus] = CandidatStatus.NOUVEAU

class CalendarGenerate(BaseModel):
    days_of_week: List[int] 

class ContratCreate(BaseModel):
    candidat_id: int
    entreprise_id: int
    session_id: Optional[int] = None 
    salaire: Decimal
    cout_npec: Optional[Decimal] = None # NEW
    heures_formation: Optional[int] = None # NEW
    date_debut: date
    date_fin: date
    intitule_poste: Optional[str] = "Apprenti"

class ContratAvenant(BaseModel):
    session_id: Optional[int] = None 
    salaire: Decimal
    cout_npec: Optional[Decimal] = None # NEW
    heures_formation: Optional[int] = None # NEW
    date_debut: date
    date_fin: date
    intitule_poste: Optional[str] = None

class AttendanceCreate(BaseModel):
    session_day_id: int
    contrat_version_id: int
    status: AttendanceStatus

class InvoiceGenerate(BaseModel):
    contrat_dossier_id: int
    periode_debut: date
    periode_fin: date
    periode_fin: date

# --- Quality Schemas ---

from models import TicketStatus, TicketCategory, SurveyType
from datetime import datetime

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: TicketCategory

class TicketResponse(TicketCreate):
    id: int
    tenant_id: int
    author_id: int
    status: TicketStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

class SurveyCreate(BaseModel):
    type: SurveyType
    score: int
    comment: Optional[str] = None
    target_user_id: Optional[int] = None

class AuditLogResponse(BaseModel):
    id: int
    action: str
    endpoint: str
    method: str
    timestamp: datetime
    user_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# --- Regulatory Watch Schemas ---

from models import WatchCategory

class RegulatoryWatchCreate(BaseModel):
    title: str
    description: str
    category: WatchCategory
    file_url: Optional[str] = None

class RegulatoryWatchResponse(RegulatoryWatchCreate):
    id: int
    tenant_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

