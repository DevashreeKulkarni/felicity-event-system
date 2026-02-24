#!/bin/bash

echo "=== Testing Event Flow ==="
echo ""

# Get organizer token
echo "1. Logging in as organizer..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"org1@iiit.ac.in","password":"Org@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi
echo "✅ Login successful"
echo ""

# Get organizer's events
echo "2. Fetching organizer's events..."
EVENTS_RESPONSE=$(curl -s -X GET http://localhost:5000/api/events/organizer/my-events \
  -H "Authorization: Bearer $TOKEN")

echo "$EVENTS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$EVENTS_RESPONSE"
echo ""

# Get first event ID
EVENT_ID=$(echo "$EVENTS_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$EVENT_ID" ]; then
  echo "3. Testing publish event with ID: $EVENT_ID"
  PUBLISH_RESPONSE=$(curl -s -X PUT http://localhost:5000/api/events/$EVENT_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status":"Published"}')
  
  echo "$PUBLISH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PUBLISH_RESPONSE"
  echo ""
  
  echo "4. Fetching updated event details..."
  EVENT_DETAILS=$(curl -s -X GET http://localhost:5000/api/events/$EVENT_ID \
    -H "Authorization: Bearer $TOKEN")
  
  echo "$EVENT_DETAILS" | python3 -m json.tool 2>/dev/null || echo "$EVENT_DETAILS"
fi

echo ""
echo "=== Test Complete ==="
