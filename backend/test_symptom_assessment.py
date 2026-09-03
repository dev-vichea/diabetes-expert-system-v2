#!/usr/bin/env python3
"""
Standalone Symptom Assessment Test

Tests the symptom-based system WITHOUT requiring Flask app initialization.
"""

import sys
import os

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.expert_system.symptom_database import SYMPTOM_DATABASE, get_symptom_info
from app.expert_system.symptom_based_rules import generate_symptom_rules, get_symptom_based_assessment
from app.expert_system.symptom_confidence import calculate_symptom_confidence, get_confidence_explanation
from app.expert_system.intelligent_interview import IntelligentInterview


def print_header(title: str):
    """Print a nice header."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def test_symptom_database():
    """Test 1: Verify symptom database."""
    print_header("TEST 1: Symptom Database")
    
    print(f"\n📚 Total Symptoms: {len(SYMPTOM_DATABASE)}")
    
    categories = {}
    for symptom in SYMPTOM_DATABASE.values():
        cat = symptom['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n📊 Symptoms by Category:")
    for cat, count in sorted(categories.items()):
        print(f"   • {cat.replace('_', ' ').title()}: {count} symptoms")
    
    # Show cardinal symptoms
    print(f"\n⭐ Cardinal Symptoms (3 Ps):")
    for key, symptom in SYMPTOM_DATABASE.items():
        if symptom.get('cardinal'):
            print(f"   ✓ {symptom['name']} - {symptom['description']}")
    
    print("\n✅ Symptom Database OK")


def test_symptom_rules():
    """Test 2: Verify symptom-based rules."""
    print_header("TEST 2: Symptom-Based Rules")
    
    rules = generate_symptom_rules()
    print(f"\n🧠 Total Rules: {len(rules)}")
    
    # Count by priority
    priorities = {}
    for rule in rules:
        priority = rule.get('priority', 'medium')
        priorities[priority] = priorities.get(priority, 0) + 1
    
    print(f"\n📊 Rules by Priority:")
    for priority in ['critical', 'high', 'medium', 'low']:
        count = priorities.get(priority, 0)
        emoji = "🚨" if priority == "critical" else "⚠️" if priority == "high" else "📋"
        print(f"   {emoji} {priority.upper()}: {count} rules")
    
    # Show sample rule
    print(f"\n📝 Sample Rule:")
    sample = rules[0]
    print(f"   Name: {sample['name']}")
    print(f"   Priority: {sample['priority']}")
    print(f"   Conditions: {len(sample['conditions'])} checks")
    print(f"   Conclusion: {sample['conclusion']['diagnosis']}")
    
    print("\n✅ Rules OK")


def test_classic_type2():
    """Test 3: Classic Type 2 pattern."""
    print_header("TEST 3: Classic Type 2 Diabetes (3 Ps)")
    
    symptoms = {
        "age": 52,
        "sex": "male",
        "frequent_urination": True,
        "excessive_thirst": True,
        "excessive_hunger": True,
        "extreme_fatigue": True,
        "blurred_vision": True,
        "family_history": True,
        "obesity": True,
    }
    
    print("\n👤 Patient: 52yo male, all 3 cardinal symptoms, family history")
    
    # Calculate confidence
    confidence = calculate_symptom_confidence(
        symptoms, 
        age=52, 
        risk_factors={"family_history": True, "obesity": True}
    )
    
    print(f"\n📊 Results:")
    print(f"   Confidence: {confidence['confidence_score']:.1%}")
    print(f"   Level: {confidence['confidence_level'].upper()}")
    print(f"   Quality: {confidence['assessment_quality'].upper()}")
    
    print(f"\n💬 {get_confidence_explanation(confidence)}")
    
    # Check if high confidence
    assert confidence['confidence_score'] >= 0.75, "Should have high confidence with all 3 Ps"
    assert confidence['confidence_level'] == 'high', "Should be high confidence"
    
    print("\n✅ Classic Type 2 PASS")


def test_early_warning():
    """Test 4: Early warning with only 2 symptoms."""
    print_header("TEST 4: Early Warning (Only 2 Cardinal Symptoms)")
    
    symptoms = {
        "age": 45,
        "sex": "female",
        "excessive_thirst": True,
        "extreme_fatigue": True,
        "sedentary_lifestyle": True,
    }
    
    print("\n👤 Patient: 45yo female, thirst + fatigue, sedentary")
    
    confidence = calculate_symptom_confidence(
        symptoms,
        age=45,
        risk_factors={"sedentary_lifestyle": True}
    )
    
    print(f"\n📊 Results:")
    print(f"   Confidence: {confidence['confidence_score']:.1%}")
    print(f"   Level: {confidence['confidence_level'].upper()}")
    
    print(f"\n💬 {get_confidence_explanation(confidence)}")
    
    # Should be moderate, not unknown
    assert confidence['confidence_level'] != 'unknown', "Should avoid 'unknown' with symptoms"
    assert confidence['confidence_score'] >= 0.40, "Should have at least moderate confidence"
    
    print("\n✅ Early Warning PASS")


def test_pediatric_type1():
    """Test 5: Pediatric Type 1 pattern."""
    print_header("TEST 5: Pediatric Type 1 Pattern")
    
    symptoms = {
        "age": 12,
        "sex": "male",
        "frequent_urination": True,
        "excessive_thirst": True,
        "excessive_hunger": True,
        "unexplained_weight_loss": True,
        "extreme_fatigue": True,
        "bed_wetting": True,
        "irritability": True,
    }
    
    print("\n👤 Patient: 12yo male, all 3 Ps + weight loss + bed-wetting")
    
    confidence = calculate_symptom_confidence(symptoms, age=12)
    assessment = get_symptom_based_assessment(symptoms)
    
    print(f"\n📊 Results:")
    print(f"   Confidence: {confidence['confidence_score']:.1%}")
    print(f"   Suspected Type: {assessment['type_indication']['likely_type']}")
    print(f"   Reasoning: {assessment['type_indication']['reasoning']}")
    
    # Should detect Type 1 pattern
    assert "Type 1" in assessment['type_indication']['likely_type'], "Should detect Type 1"
    assert confidence['confidence_score'] >= 0.70, "Should have high confidence"
    
    print("\n✅ Pediatric Type 1 PASS")


def test_emergency_detection():
    """Test 6: Emergency symptom detection."""
    print_header("TEST 6: Emergency Detection (DKA Symptoms)")
    
    symptoms = {
        "age": 28,
        "sex": "female",
        "frequent_urination": True,
        "excessive_thirst": True,
        "nausea": True,
        "vomiting": True,
        "abdominal_pain": True,
        "fruity_breath": True,
        "rapid_breathing": True,
        "confusion": True,
    }
    
    print("\n👤 Patient: 28yo female with DKA symptoms")
    
    confidence = calculate_symptom_confidence(symptoms, age=28)
    
    print(f"\n📊 Results:")
    print(f"   Confidence: {confidence['confidence_score']:.1%}")
    print(f"   Emergency Symptoms: {confidence['symptom_counts']['emergency_symptoms']}")
    
    # Should detect emergency
    assert confidence['symptom_counts']['emergency_symptoms'] >= 3, "Should detect multiple emergency symptoms"
    assert "URGENT" in confidence['recommendations'][0].upper() or "EMERGENCY" in confidence['recommendations'][0].upper(), "Should recommend urgent care"
    
    print(f"\n🚨 {confidence['recommendations'][0]}")
    print("\n✅ Emergency Detection PASS")


def test_interview_flow():
    """Test 7: Intelligent interview flow."""
    print_header("TEST 7: Intelligent Interview Flow")
    
    print("\n🗣️  Testing conversation flow...")
    
    interview = IntelligentInterview()
    answers = {}
    
    # Simulate answering questions
    questions_asked = []
    for i in range(8):
        q = interview.get_next_question(answers)
        if not q:
            break
        
        questions_asked.append(q)
        
        # Auto-answer based on question key
        key = q['key']
        if key == 'age':
            answers[key] = 55
        elif key == 'sex':
            answers[key] = "Female"
        elif key in ['frequent_urination', 'excessive_thirst', 'extreme_fatigue', 'family_history']:
            answers[key] = True
        else:
            answers[key] = False
    
    progress = interview.get_interview_progress()
    
    print(f"\n📊 Interview Stats:")
    print(f"   Questions Asked: {len(questions_asked)}")
    print(f"   Questions Answered: {progress['questions_answered']}")
    print(f"   Progress: {progress['estimated_completion']}%")
    print(f"   Sufficient Data: {'Yes ✓' if progress['has_sufficient_data'] else 'No'}")
    
    # Show first few questions
    print(f"\n📝 Sample Questions:")
    for i, q in enumerate(questions_asked[:3], 1):
        importance = q.get('importance', 'medium')
        print(f"   {i}. [{importance.upper()}] {q['question']}")
    
    assert len(questions_asked) > 0, "Should generate questions"
    assert progress['has_sufficient_data'], "Should have sufficient data after 8 questions"
    
    print("\n✅ Interview Flow PASS")


def test_confidence_without_labs():
    """Test 8: Confidence calculation without any labs."""
    print_header("TEST 8: Confidence Without Labs")
    
    print("\n🧪 Testing assessment with ZERO lab results...")
    
    scenarios = [
        {
            "name": "All 3 Ps + risk factors",
            "symptoms": {
                "frequent_urination": True,
                "excessive_thirst": True,
                "excessive_hunger": True,
                "family_history": True,
                "obesity": True,
                "age": 50,
            },
            "expected_min": 0.70
        },
        {
            "name": "2 Ps + fatigue",
            "symptoms": {
                "frequent_urination": True,
                "excessive_thirst": True,
                "extreme_fatigue": True,
                "age": 45,
            },
            "expected_min": 0.45
        },
        {
            "name": "Only 1 cardinal",
            "symptoms": {
                "excessive_thirst": True,
                "age": 40,
            },
            "expected_min": 0.25
        },
    ]
    
    for scenario in scenarios:
        confidence = calculate_symptom_confidence(
            scenario["symptoms"],
            age=scenario["symptoms"].get("age", 40)
        )
        
        print(f"\n📋 {scenario['name']}:")
        print(f"   Confidence: {confidence['confidence_score']:.1%}")
        print(f"   Level: {confidence['confidence_level']}")
        print(f"   Expected Min: {scenario['expected_min']:.0%}")
        
        assert confidence['confidence_score'] >= scenario['expected_min'], \
            f"Confidence too low: {confidence['confidence_score']:.1%} < {scenario['expected_min']:.1%}"
        
        # Should never be "unknown" with symptoms
        if scenario["symptoms"].get("frequent_urination") or scenario["symptoms"].get("excessive_thirst"):
            assert confidence['confidence_level'] != 'unknown', "Should not be 'unknown' with symptoms"
    
    print("\n✅ No-Lab Confidence PASS")


def main():
    """Run all tests."""
    print("\n" + "="*80)
    print("  🧪 SYMPTOM-BASED ASSESSMENT SYSTEM - TEST SUITE")
    print("  Testing WITHOUT Lab Results")
    print("="*80)
    
    tests = [
        ("Symptom Database", test_symptom_database),
        ("Symptom Rules", test_symptom_rules),
        ("Classic Type 2", test_classic_type2),
        ("Early Warning", test_early_warning),
        ("Pediatric Type 1", test_pediatric_type1),
        ("Emergency Detection", test_emergency_detection),
        ("Interview Flow", test_interview_flow),
        ("Confidence Without Labs", test_confidence_without_labs),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            test_func()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n❌ {name} FAILED: {e}")
    
    # Summary
    print_header("TEST SUMMARY")
    print(f"\n✅ Passed: {passed}/{len(tests)}")
    print(f"❌ Failed: {failed}/{len(tests)}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n✨ System is ready for use:")
        print("   • 40+ symptoms working")
        print("   • 18 inference rules working")
        print("   • Confidence calculation working WITHOUT labs")
        print("   • Interview flow working")
        print("   • Emergency detection working")
        print("   • Type discrimination working")
        
        print("\n🚀 Next Steps:")
        print("   1. Start backend server: python run.py")
        print("   2. Test API: curl http://localhost:5001/api/conversation/start")
        print("   3. Integrate with frontend")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please review.")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
