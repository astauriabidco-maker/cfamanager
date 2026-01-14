#!/bin/bash

BASE_URL="http://localhost:8000"
ADMIN_EMAIL="admin@lyon.cfa.com"
ADMIN_PASSWORD="secret_lyon"

echo "1. Getting Token..."
# authenticating and extracting token using grep/sed fallback if jq missing
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD")

if [[ $TOKEN_RESPONSE == *"access_token"* ]]; then
  echo "✅ Authentication successful"
else
  echo "❌ Authentication failed: $TOKEN_RESPONSE"
  exit 1
fi

# Extract token (simple greedy regex for demo purposes)
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

# 2. Create Ticket
echo -e "\n2. Creating Ticket (Action to Audit)..."
TICKET_RESP=$(curl -s -X POST "$BASE_URL/quality/tickets" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Ticket Curl",
    "description": "Description via curl",
    "category": "ADMIN"
  }')

echo "Response: $TICKET_RESP"

# 3. Verify Audit Log
echo -e "\n3. Checking Audit Logs..."
LOGS_RESP=$(curl -s -X GET "$BASE_URL/quality/audit-logs" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Check if our action is in the logs
if [[ $LOGS_RESP == *"POST /quality/tickets"* ]]; then
  echo -e "\n✅ SUCCESS: Found 'POST /quality/tickets' in audit logs!"
else
  echo -e "\n❌ FAILURE: Could not find action in audit logs."
  echo "Logs: $LOGS_RESP"
fi
