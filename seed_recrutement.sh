#!/bin/bash

BASE_URL="http://localhost:8000"
ADMIN_EMAIL="admin@lyon.cfa.com"
ADMIN_PASSWORD="secret_lyon"

# 1. Login
echo "Authenticating..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Could not get token"
  exit 1
fi

echo "Token received."

# 2. Create Candidates
create_candidat() {
  local FIRST="$1"
  local LAST="$2"
  local EMAIL="$3"
  local STATUS="$4"
  
  echo "Creating $FIRST $LAST ($STATUS)..."
  curl -s -X POST "$BASE_URL/candidats/" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"first_name\": \"$FIRST\",
      \"last_name\": \"$LAST\",
      \"email\": \"$EMAIL\",
      \"civilite\": \"M\",
      \"statut\": \"$STATUS\"
    }"
  echo ""
}

create_candidat "Thomas" "Anderson" "neo@matrix.com" "NOUVEAU"
create_candidat "Sara" "Connor" "sara@resistance.org" "ADMISSIBLE"
create_candidat "Ellen" "Ripley" "ripley@nostromo.space" "ENTRETIEN"
create_candidat "Marty" "McFly" "marty@future.com" "PLACE"
create_candidat "Luke" "Skywalker" "luke@force.com" "NOUVEAU"

echo "✅ Data provisioned! Refresh your Kanban."
