import requests
import json

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com" # You might need to change this if your DB has different users
ADMIN_PASSWORD = "password"       # You might need to change this

def get_token():
    print("1. Authenticating...")
    response = requests.post(f"{BASE_URL}/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if response.status_code != 200:
        print(f"Failed to login: {response.text}")
        return None
    return response.json()["access_token"]

def verify_quality_module():
    token = get_token()
    if not token:
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Ticket
    print("\n2. Creating a Quality Ticket...")
    ticket_payload = {
        "subject": "Problème Projecteur Salle B",
        "description": "Le projecteur ne s'allume pas.",
        "category": "TECHNICAL"
    }
    resp = requests.post(f"{BASE_URL}/quality/tickets", json=ticket_payload, headers=headers)
    if resp.status_code == 200:
        print("✅ Ticket Created Successfully")
        print(resp.json())
    else:
        print(f"❌ Failed to create ticket: {resp.text}")

    # 2. Get Tickets
    print("\n3. Listing Tickets...")
    resp = requests.get(f"{BASE_URL}/quality/tickets", headers=headers)
    if resp.status_code == 200:
        print(f"✅ Retrieved {len(resp.json())} tickets")
    else:
        print("❌ Failed to list tickets")

    # 3. Create Survey
    print("\n4. Submitting a Survey Response...")
    survey_payload = {
        "type": "MID_TERM",
        "score": 9,
        "comment": "Très bonne formation."
    }
    resp = requests.post(f"{BASE_URL}/quality/surveys", json=survey_payload, headers=headers)
    if resp.status_code == 200:
        print("✅ Survey Submitted Successfully")
    else:
        print(f"❌ Failed to submit survey: {resp.text}")

    # 4. Check Audit Logs (The Critical Step)
    print("\n5. Verifying Audit Logs...")
    resp = requests.get(f"{BASE_URL}/quality/audit-logs", headers=headers)
    if resp.status_code == 200:
        logs = resp.json()
        print(f"✅ Retrieved {len(logs)} audit logs")
        
        # Verify the Ticket creation was logged
        found_ticket_log = False
        for log in logs:
            if "POST /quality/tickets" in log["action"] or "/quality/tickets" in log["endpoint"]:
                found_ticket_log = True
                print(f"   -> Found Audit Log for Ticket Creation: {log['action']} at {log['timestamp']}")
                break
        
        if found_ticket_log:
            print("✅ Audit Middleware is working correctly!")
        else:
            print("⚠️ WARNING: Did not find the specific log for ticket creation yet. It might be async or masked?")
            print("Recent Logs:", json.dumps(logs[:2], indent=2))

    else:
        print(f"❌ Failed to fetch audit logs: {resp.text}")

if __name__ == "__main__":
    try:
        verify_quality_module()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to localhost:8000. Is the server running?")
