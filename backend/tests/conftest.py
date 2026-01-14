import pytest
import sys
import os
from fastapi.testclient import TestClient

# Add project root to sys.path to allow importing main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import Base, get_db
from models import User, Tenant
from auth import create_access_token, get_password_hash

# Use a separate test database or the same one if acceptable for E2E (be careful with data)
# For E2E on running container, we often modify the DB. 
# Here we will use the existing DB connection but we could mock it if needed.
# However, "E2E" implies testing the real stack.

@pytest.fixture(scope="module")
def client():
    # Use TestClient for synchronous testing of FastAPI app
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def admin_token(client):
    """
    Get a valid admin token. 
    Assumes database is seeded with admin@lyon.cfa.com / secret_lyon
    """
    login_data = {
        "username": "admin@lyon.cfa.com",
        "password": "secret_lyon"
    }
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    return token

@pytest.fixture(scope="module")
def auth_header(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
