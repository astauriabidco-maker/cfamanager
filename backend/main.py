from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db, engine, Base
from models import User
from auth import verify_password, create_access_token, get_current_user
from repository import BaseRepository
from routers import candidats, entreprises, contrats, finance, exports, pedagogie, quality, analytics
from models import Civilite # Ensure Enum is registered
from middleware.audit import AuditMiddleware

# Initialize DB
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CFA Manager API", version="1.0.0")

# Add Middleware
app.add_middleware(AuditMiddleware)

# Include Routers
app.include_router(candidats.router)
app.include_router(entreprises.router)
app.include_router(contrats.router)
app.include_router(finance.router)
app.include_router(exports.router)
app.include_router(pedagogie.router)
app.include_router(quality.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {"Hello": "Cfamanager Backend API Secured"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- Auth Endpoints ---

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # 1. Find user by email
    # Note: In a real multi-tenant app, might need tenant_slug in URL or header to disambiguate email.
    # Here we assume email is unique globally for simplicity or pick the first match.
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Create Token with Tenant ID in payload
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
            "tenant_id": user.tenant_id
        }
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Protected Endpoints ---

@app.get("/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "tenant_id": current_user.tenant_id,
        "role": current_user.role
    }

@app.get("/users")
def read_all_users_for_my_tenant(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Use the Tenant-Aware Repository
    # We instantiate the repository injecting the current user's tenant_id
    repo = BaseRepository(db, User, current_user.tenant_id)
    users = repo.get_all()
    
    return [
        {"id": u.id, "email": u.email, "tenant_id": u.tenant_id} 
        for u in users
    ]
