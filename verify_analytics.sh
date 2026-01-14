#!/bin/bash

BASE_URL="http://localhost:8000"
ADMIN_EMAIL="admin@lyon.cfa.com"
ADMIN_PASSWORD="secret_lyon"

echo "1. Getting Token..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | awk -F'"access_token":"' '{print $2}' | awk -F'"' '{print $1}')

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Authentication failed"
    exit 1
fi

echo "✅ Auth OK"

# 2. Get Dashboard
echo -e "\n2. Fetching Analytics Dashboard..."
DASH_RESP=$(curl -s -X GET "$BASE_URL/analytics/dashboard" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Dashboard: $DASH_RESP"

# Basic check
if [[ $DASH_RESP == *"ca_previsionnel"* ]]; then
    echo "✅ Dashboard JSON structure OK"
else
    echo "❌ Dashboard failed"
fi

# 3. Get BPF Preview
echo -e "\n3. Fetching BPF Preview..."
BPF_RESP=$(curl -s -X GET "$BASE_URL/analytics/bpf-preview" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "BPF: $BPF_RESP"

if [[ $BPF_RESP == *"repartition_sexe"* ]]; then
    echo "✅ BPF JSON structure OK"
else
    echo "❌ BPF failed"
fi
