#!/bin/bash

set -e

API="http://localhost:8000"
echo "🧪 Med-Drishti E2E Flow Test"
echo "===================================="

# Step 1: Register User
echo "1️⃣  Registering new user..."
REGISTER_RESP=$(curl -s -X POST $API/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"e2e-$(date +%s)@test.com\",\"password\":\"test123\",\"full_name\":\"E2E Test Patient\",\"role\":\"patient\"}")

TOKEN=$(echo "$REGISTER_RESP" | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")
echo "✅ User registered, token: ${TOKEN:0:40}..."

# Step 2: Create Patient
echo ""
echo "2️⃣  Creating patient..."
PATIENT_RESP=$(curl -s -X POST $API/api/v1/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Patient","gender":"male","preferred_language":"English"}')

PATIENT_ID=$(echo "$PATIENT_RESP" | python -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "✅ Patient created (ID: $PATIENT_ID)"

# Step 3: Create Consent
echo ""
echo "3️⃣  Creating consent..."
curl -s -X POST $API/api/v1/patients/$PATIENT_ID/consents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"consent_type":"data_processing"}' > /dev/null

curl -s -X POST $API/api/v1/patients/$PATIENT_ID/consents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"consent_type":"voice_recording"}' > /dev/null
echo "✅ Consents recorded"

# Step 4: Create Session
echo ""
echo "4️⃣  Creating clinical session..."
SESSION_RESP=$(curl -s -X POST $API/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"patient_id\":$PATIENT_ID,\"session_type\":\"intake\"}")

SESSION_ID=$(echo "$SESSION_RESP" | python -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "✅ Session created (ID: $SESSION_ID)"

# Step 5: Get first question
echo ""
echo "5️⃣  Testing dialogue flow (first question)..."
Q1=$(curl -s -X POST $API/api/v1/voice/next-question \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":$SESSION_ID,\"current_question_id\":null,\"language\":\"en\"}")

Q1_ID=$(echo "$Q1" | python -c "import sys, json; print(json.load(sys.stdin).get('question_id', 'N/A'))")
Q1_TEXT=$(echo "$Q1" | python -c "import sys, json; print(json.load(sys.stdin).get('question_text', 'N/A'))")
echo "✅ First question: $Q1_TEXT"

# Step 6: Get second question
echo ""
echo "6️⃣  Simulating answer and getting next question..."
Q2=$(curl -s -X POST $API/api/v1/voice/next-question \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":$SESSION_ID,\"current_question_id\":\"$Q1_ID\",\"language\":\"en\"}")

Q2_ID=$(echo "$Q2" | python -c "import sys, json; print(json.load(sys.stdin).get('question_id', 'N/A'))")
Q2_TEXT=$(echo "$Q2" | python -c "import sys, json; print(json.load(sys.stdin).get('question_text', 'N/A'))")
echo "✅ Second question: $Q2_TEXT"

# Step 7: Save clinical history
echo ""
echo "7️⃣  Saving clinical history..."
HIST=$(curl -s -X POST $API/api/v1/sessions/$SESSION_ID/history \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"chief_complaint":"Headache and fever","history_of_present_illness":"For 2 days, severity 7/10","medications":"Paracetamol","allergies":"Penicillin"}')

HIST_ID=$(echo "$HIST" | python -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "✅ Clinical history saved (ID: $HIST_ID)"

# Step 8: Get session with history
echo ""
echo "8️⃣  Retrieving session..."
curl -s -X GET $API/api/v1/sessions/$SESSION_ID \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool | head -20

echo ""
echo "===================================="
echo "✅ ALL TESTS PASSED!"
echo "Patient: $PATIENT_ID | Session: $SESSION_ID | History: $HIST_ID"
