from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List
from models import SessionDay

class PlanningService:
    def generate_session_days(
        self, 
        db: Session, 
        session_id: int, 
        start_date: date, 
        end_date: date, 
        days_of_week: List[int]
    ):
        """
        Generates SessionDay entries for each date in [start_date, end_date] 
        where date.weekday() is in days_of_week.
        """
        # Clear existing days? Maybe. For now, we assume fresh generation or manual delete.
        # Strict update: delete overlapping? Let's just append and handle uniqueness via DB constraint or ignore.
        # To be safe: "DELETE FROM session_days WHERE session_id=..." is drastic but simplest for this "Generate" feature.
        db.query(SessionDay).filter(SessionDay.session_id == session_id).delete()
        
        current = start_date
        days_to_add = []
        
        while current <= end_date:
            if current.weekday() in days_of_week:
                day = SessionDay(
                    session_id=session_id,
                    date=current,
                    is_morning=True, 
                    is_afternoon=True
                )
                days_to_add.append(day)
            current += timedelta(days=1)
            
        if days_to_add:
            db.add_all(days_to_add)
            db.commit()
            
        return len(days_to_add)
