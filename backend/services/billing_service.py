from sqlalchemy.orm import Session
from datetime import date
from decimal import Decimal
from models import ContratVersion, SessionDay, Attendance, AttendanceStatus

HOURS_PER_DAY = 7

class BillingService:
    def calculate_billable_amount(
        self,
        db: Session,
        contract: ContratVersion,
        start_date: date,
        end_date: date
    ) -> Decimal:
        if not contract.cout_npec or not contract.heures_formation:
            return Decimal("0.00")
            
        hourly_rate = contract.cout_npec / Decimal(contract.heures_formation)
        
        # 1. Count Scheduled Days in Period (Intersect Contract Dates & Billing Period & Session Days)
        # Assuming SessionDays are already generated
        scheduled_days = db.query(SessionDay).filter(
            SessionDay.session_id == contract.session_id,
            SessionDay.date >= start_date,
            SessionDay.date <= end_date,
            SessionDay.date >= contract.date_debut,
            SessionDay.date <= contract.date_fin
        ).count()
        
        # 2. Count Unjustified Absences
        # Join with SessionDay to ensure we check dates in period
        unjustified_count = db.query(Attendance).join(SessionDay).filter(
            Attendance.contrat_version_id == contract.id,
            Attendance.status == AttendanceStatus.ABSENT_INJUSTIFIE,
            SessionDay.date >= start_date,
            SessionDay.date <= end_date
        ).count()
        
        billable_days = scheduled_days - unjustified_count
        billable_hours = billable_days * HOURS_PER_DAY
        
        amount = Decimal(billable_hours) * hourly_rate
        return round(amount, 2)
