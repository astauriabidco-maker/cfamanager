from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
import json
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import AuditLog
import jwt
from jwt.exceptions import PyJWTError
from auth import SECRET_KEY, ALGORITHM

# Helper to mask sensitive fields
def mask_sensitive_data(data: dict) -> dict:
    masked = data.copy()
    sensitive_keys = ["password", "password_hash", "access_token", "token"]
    for key in masked:
        if key in sensitive_keys:
            masked[key] = "***MASKED***"
    return masked

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Process request normally first? Or after?
        # Logging AFTER ensures we only log if it didn't crash immediately, or we can log valid attempts.
        # But we need to read body BEFORE response is sent if we want to log the payload.
        
        if request.method not in ["POST", "PUT", "PATCH", "DELETE"]:
            return await call_next(request)

        # 2. Consume body safely
        # Request body is a stream. If we read it, we must replace it so downstream can read it again.
        body_bytes = await request.body()
        
        # Restore body for the actual handler
        async def receive():
            return {"type": "http.request", "body": body_bytes}
        request._receive = receive

        payload_str = ""
        try:
            if body_bytes:
                payload_json = json.loads(body_bytes)
                masked_payload = mask_sensitive_data(payload_json)
                payload_str = json.dumps(masked_payload)
        except Exception:
            payload_str = "Could not parse/mask JSON"

        # 3. Proceed with request
        response = await call_next(request)

        # 4. Log only if successful? Or always?
        # Requirement says "Enregistre une entrée... avec les détails".
        # Usually good to log success. Failure might be interesting too. 
        # For simplicity/safety, let's log if status is 2xx or equal. 
        # But maybe we want to log attempts? Let's log everything for now.
        
        # 5. Extract User & Tenant from Token
        # We need to manually parse the header because `Depends` doesn't work in Middleware easily.
        auth_header = request.headers.get("Authorization")
        user_id = None
        tenant_id = None
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                user_id = int(payload.get("sub"))
                tenant_id = int(payload.get("tenant_id"))
            except PyJWTError:
                pass # Invalid token, maybe login request or public endpoint

        # 6. Write to DB
        # We use a separate session to ensure we don't interfere with the request's transaction
        if tenant_id: # Only log if we identified a tenant context (most meaningful for us)
            db: Session = SessionLocal()
            try:
                audit_entry = AuditLog(
                    tenant_id=tenant_id,
                    user_id=user_id, # Can be None if system/unknown but tenant known? Unlikely in this app.
                    action=f"{request.method} {request.url.path}",
                    endpoint=str(request.url.path),
                    method=request.method,
                    payload=payload_str,
                    timestamp=datetime.utcnow()
                )
                db.add(audit_entry)
                db.commit()
            except Exception as e:
                print(f"Audit Log Failed: {e}")
            finally:
                db.close()

        return response
