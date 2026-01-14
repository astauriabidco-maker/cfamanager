from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date, DateTime, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class CandidatStatus(str, enum.Enum):
    NOUVEAU = "NOUVEAU"
    ADMISSIBLE = "ADMISSIBLE"
    ENTRETIEN = "ENTRETIEN"
    PLACE = "PLACE"
    REJETE = "REJETE"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT_JUSTIFIE = "ABSENT_JUSTIFIE"
    ABSENT_INJUSTIFIE = "ABSENT_INJUSTIFIE"

class InvoiceStatus(str, enum.Enum):
    BROUILLON = "BROUILLON"
    EMISE = "EMISE"
    PAYEE = "PAYEE"

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    email = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="admin")

    tenant = relationship("Tenant")

class Civilite(str, enum.Enum):
    M = "M"
    MME = "MME"

class Candidat(Base):
    __tablename__ = "candidats"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False, index=True) # Search index
    civilite = Column(Enum(Civilite), default=Civilite.M, nullable=True) # Added for BPF
    email = Column(String, index=True) # Search index
    telephone = Column(String, nullable=True)
    
    statut = Column(Enum(CandidatStatus), default=CandidatStatus.NOUVEAU)
    cv_filename = Column(String, nullable=True)
    cv_raw_text = Column(Text, nullable=True)

    tenant = relationship("Tenant")

class Entreprise(Base):
    __tablename__ = "entreprises"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    raison_sociale = Column(String, nullable=False)
    siret = Column(String, nullable=True)
    adresse = Column(Text, nullable=True)
    code_idcc = Column(String, nullable=True)

    tenant = relationship("Tenant")

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    nom = Column(String, nullable=False)
    date_debut = Column(Date)
    date_fin = Column(Date)
    formation_rncp_id = Column(String, nullable=True)
    
    tenant = relationship("Tenant")
    days = relationship("SessionDay", back_populates="session", cascade="all, delete-orphan")

class SessionDay(Base):
    __tablename__ = "session_days"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    is_morning = Column(Boolean, default=True)
    is_afternoon = Column(Boolean, default=True)
    
    session = relationship("Session", back_populates="days")

class ContratDossier(Base):
    __tablename__ = "contrats_dossier"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    candidat_id = Column(Integer, ForeignKey("candidats.id"), nullable=False, index=True) # FK Index
    entreprise_id = Column(Integer, ForeignKey("entreprises.id"), nullable=True, index=True)
    
    tenant = relationship("Tenant")
    candidat = relationship("Candidat")
    entreprise = relationship("Entreprise")
    versions = relationship("ContratVersion", back_populates="dossier")

class ContratVersion(Base):
    __tablename__ = "contrats_versions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    contrat_dossier_id = Column(Integer, ForeignKey("contrats_dossier.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True) 
    version_number = Column(Integer, nullable=False)
    
    salaire = Column(Numeric(10, 2))
    cout_npec = Column(Numeric(10, 2), nullable=True) # NEW
    heures_formation = Column(Integer, nullable=True)     # NEW
    
    intitule_poste = Column(String, nullable=True)
    date_debut = Column(Date)
    date_fin = Column(Date)
    is_active = Column(Boolean, default=False)

    dossier = relationship("ContratDossier", back_populates="versions")
    tenant = relationship("Tenant")
    session = relationship("Session")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    session_day_id = Column(Integer, ForeignKey("session_days.id"), nullable=False, index=True)
    contrat_version_id = Column(Integer, ForeignKey("contrats_versions.id"), nullable=False, index=True)
    status = Column(Enum(AttendanceStatus), nullable=False)
    
    tenant = relationship("Tenant")
    session_day = relationship("SessionDay")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    contrat_dossier_id = Column(Integer, ForeignKey("contrats_dossier.id"), nullable=False)
    numero_facture = Column(String, nullable=False)
    montant_ht = Column(Numeric(10, 2), nullable=False)
    statut = Column(Enum(InvoiceStatus), default=InvoiceStatus.BROUILLON)
    date_emission = Column(Date, nullable=True)
    periode_debut = Column(Date, nullable=True)
    periode_fin = Column(Date, nullable=True)
    
    tenant = relationship("Tenant")
    dossier = relationship("ContratDossier")

# --- Quality & Compliance Module (Module F) ---

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Can be null if system action
    
    action = Column(String, nullable=False) # e.g., "CREATE_CONTRACT"
    endpoint = Column(String, nullable=False)
    method = Column(String, nullable=False)
    payload = Column(Text, nullable=True) # JSON stored as Text
    timestamp = Column(DateTime, nullable=False)

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class TicketCategory(str, enum.Enum):
    PEDAGOGY = "PEDAGOGY"
    ADMIN = "ADMIN"
    TECHNICAL = "TECHNICAL"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    category = Column(Enum(TicketCategory), nullable=False)
    created_at = Column(DateTime, nullable=False)

    tenant = relationship("Tenant")
    author = relationship("User")

class SurveyType(str, enum.Enum):
    J30 = "J30"
    MID_TERM = "MID_TERM"
    END = "END"

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Who is this about? Or who filled it? Assuming target/respondent.
    
    type = Column(Enum(SurveyType), nullable=False)
    score = Column(Integer, nullable=False) # 1-10
    comment = Column(Text, nullable=True)
    
    tenant = relationship("Tenant")
    target_user = relationship("User")

class WatchCategory(str, enum.Enum):
    LOI = "LOI"
    TECH = "TECH"
    PEDAGO = "PEDAGO"
    HANDICAP = "HANDICAP"

class RegulatoryWatch(Base):
    __tablename__ = "regulatory_watch"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(WatchCategory), nullable=False)
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)

    tenant = relationship("Tenant")
    reads = relationship("RegulatoryRead", back_populates="watch", cascade="all, delete-orphan")

class RegulatoryRead(Base):
    __tablename__ = "regulatory_reads"

    watch_id = Column(Integer, ForeignKey("regulatory_watch.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    read_at = Column(DateTime, nullable=False)

    watch = relationship("RegulatoryWatch", back_populates="reads")
    user = relationship("User")

