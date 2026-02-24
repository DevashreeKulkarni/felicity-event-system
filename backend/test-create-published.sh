#!/bin/bash

# Test creating a published event directly

echo "Testing create event with Published status..."
echo ""

# Login as organizer
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"org1@iiit.ac.in","password":"Org@123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

# Create event with Published status
CREATE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Test Published Event",
    "eventDescription": "Testing direct publish",
    "eventType": "Normal",
    "eligibility": "IIIT Only",
    "registrationDeadline": "2026-02-18T10:00:00.000Z",
    "eventStartDate": "2026-02-20T10:00:00.000Z",
    "eventEndDate": "2026-02-20T18:00:00.000Z",
    "registrationLimit": 100,
    "registrationFee": 0,
    "venue": "Test Venue",
    "status": "Published",
    "eventTags": ["test"],
    "customForm": []
  }')

echo "Create Response:"
echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Extract event ID and status
EVENT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('_id', 'N/A'))" 2>/dev/null)
STATUS=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('status', 'N/A'))" 2>/dev/null)

echo "Created Event ID: $EVENT_ID"
echo "Status from response: $STATUS"
echo ""

if [ "$STATUS" == "Published" ]; then
  echo "✅ Event created with Published status"
else
  echo "❌ Event status is $STATUS, expected Published"
fi

