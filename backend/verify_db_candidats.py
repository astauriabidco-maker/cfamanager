from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Candidat, User

import os

# Adjust connection string if needed. Docker uses 'db', host uses localhost if port mapped
# Assuming we run this from host, and port 5432 is mapped to 5432
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/cfa_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify():
    db = SessionLocal()
    try:
        print("--- Testing DB Connection ---")
        users = db.query(User).all()
        print(f"Users found: {len(users)}")
        for u in users:
            print(f"User: {u.email} (Tenant: {u.tenant_id})")

        print("\n--- Checking Candidats ---")
        candidats = db.query(Candidat).all()
        print(f"Total Candidats: {len(candidats)}")
        for c in candidats:
            print(f"- #{c.id} {c.first_name} {c.last_name} (Status: {c.statut}, Tenant: {c.tenant_id})")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
