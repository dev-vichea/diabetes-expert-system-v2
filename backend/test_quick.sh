#!/bin/bash
echo "🧪 Quick API Test"
echo ""

# Test complete assessment
echo "📝 Testing complete assessment..."
curl -s -X POST http://localhost:5001/api/conversation/complete \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-123",
    "answers": {
      "age": 52,
      "sex": "male",
      "frequent_urination": true,
      "excessive_thirst": true,
      "excessive_hunger": true,
      "extreme_fatigue": true,
      "blurred_vision": true,
      "family_history": true,
      "obesity": true
    }
  }' | python3 -m json.tool

echo ""
echo "✅ Test complete!"
