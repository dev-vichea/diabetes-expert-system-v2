#!/bin/bash

# API Test Script for Conversational Assessment System
# Tests all endpoints with sample data

BASE_URL="http://localhost:5001/api/conversation"

echo "=================================================="
echo "  🧪 Testing Conversational Assessment API"
echo "=================================================="

# Test 1: Start conversation
echo -e "\n📝 TEST 1: Starting conversation..."
echo "GET $BASE_URL/start"
START_RESPONSE=$(curl -s "$BASE_URL/start")
echo "$START_RESPONSE" | python3 -m json.tool

# Extract session_id (if jq is available, use it; otherwise manual)
if command -v jq &> /dev/null; then
    SESSION_ID=$(echo "$START_RESPONSE" | jq -r '.session_id')
else
    # Fallback: extract manually
    SESSION_ID="test-session-123"
fi

echo -e "\n✓ Session ID: $SESSION_ID"

# Test 2: Submit first answer (age)
echo -e "\n📝 TEST 2: Submitting age..."
echo "POST $BASE_URL/next"
curl -s -X POST "$BASE_URL/next" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"answer\": {\"age\": 52}
  }" | python3 -m json.tool

# Test 3: Submit multiple answers
echo -e "\n📝 TEST 3: Submitting sex..."
curl -s -X POST "$BASE_URL/next" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"answer\": {\"sex\": \"male\"}
  }" | python3 -m json.tool

# Test 4: Complete assessment
echo -e "\n📝 TEST 4: Completing assessment..."
echo "POST $BASE_URL/complete"
COMPLETE_RESPONSE=$(curl -s -X POST "$BASE_URL/complete" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"answers\": {
      \"age\": 52,
      \"sex\": \"male\",
      \"frequent_urination\": true,
      \"excessive_thirst\": true,
      \"excessive_hunger\": true,
      \"extreme_fatigue\": true,
      \"blurred_vision\": true,
      \"family_history\": true,
      \"obesity\": true
    }
  }")

echo "$COMPLETE_RESPONSE" | python3 -m json.tool

# Extract and display key results
echo -e "\n=================================================="
echo "  📊 RESULTS SUMMARY"
echo "=================================================="

if command -v jq &> /dev/null; then
    echo -n "Diagnosis: "
    echo "$COMPLETE_RESPONSE" | jq -r '.diagnosis // "N/A"'
    
    echo -n "Confidence: "
    echo "$COMPLETE_RESPONSE" | jq -r '.confidence // "N/A"'
    
    echo -n "Confidence Level: "
    echo "$COMPLETE_RESPONSE" | jq -r '.confidence_level // "N/A"'
    
    echo -e "\nRecommendations:"
    echo "$COMPLETE_RESPONSE" | jq -r '.recommendations[]? // "No recommendations"'
else
    echo "Install 'jq' for formatted output"
    echo "$COMPLETE_RESPONSE"
fi

# Test 5: Get all questions (preview)
echo -e "\n📝 TEST 5: Getting all available questions..."
echo "GET $BASE_URL/questions"
QUESTIONS=$(curl -s "$BASE_URL/questions")
echo "$QUESTIONS" | python3 -m json.tool

if command -v jq &> /dev/null; then
    QUESTION_COUNT=$(echo "$QUESTIONS" | jq -r '.questions | length')
    echo -e "\n✓ Total Questions Available: $QUESTION_COUNT"
fi

echo -e "\n=================================================="
echo "  ✅ ALL API TESTS COMPLETE"
echo "=================================================="
