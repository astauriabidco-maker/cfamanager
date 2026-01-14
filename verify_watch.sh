#!/bin/bash

BASE_URL="http://localhost:8000"
ADMIN_EMAIL="admin@lyon.cfa.com"
ADMIN_PASSWORD="secret_lyon"

echo "1. Getting Token..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD")

# Simpler token extraction
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | awk -F'"access_token":"' '{print $2}' | awk -F'"' '{print $1}')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo "✅ Auth OK"

# 2. Create Watch Item
echo -e "\n2. Creating Regulatory Watch Item..."
CREATE_RESP=$(curl -s -X POST "$BASE_URL/quality/regulatory-watch" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouvelle Loi Apprentissage 2026",
    "description": "Changements importants sur les aides.",
    "category": "LOI",
    "file_url": "http://legifrance..."
  }')

echo "Response: $CREATE_RESP"

# Extract ID using awk/sed roughly
WATCH_ID=$(echo $CREATE_RESP | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -z "$WATCH_ID" ]; then
    echo "❌ Failed to create watch item"
fi

# 3. Mark as Read
echo -e "\n3. Marking Watch #$WATCH_ID as Read..."
READ_RESP=$(curl -s -X POST "$BASE_URL/quality/regulatory-watch/$WATCH_ID/mark-as-read" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $READ_RESP"

if [[ $READ_RESP == *"Marked as read"* ]]; then
    echo "✅ Success: Marked as read"
else
    echo "❌ Failed to mark as read"
    # Don't exit, maybe it was already read
fi

# 4. List Items
echo -e "\n4. Listing Watch Items..."
LIST_RESP=$(curl -s -X GET "$BASE_URL/quality/regulatory-watch" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "${LIST_RESP:0:100}..." # Print start
