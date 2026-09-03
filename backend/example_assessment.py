#!/usr/bin/env python3
"""
Example Assessment Script

Demonstrates the new simplified, intelligent assessment system.
Run this to see how the system handles various scenarios.
"""

from app.expert_system.enhanced_inference_engine import run_enhanced_inference


def print_result(title: str, result: dict):
    """Pretty print assessment result."""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")
    
    print(f"\n📊 DIAGNOSIS: {result['diagnosis']}")
    print(f"🎯 Certainty: {result['certainty']:.2f} ({int(result['certainty']*100)}%)")
    print(f"📈 Confidence Level: {result['confidence_level']}")
    print(f"💡 {result['confidence_explanation']}")
    
    if result.get('suspected_type'):
        st = result['suspected_type']
        print(f"\n🔍 Suspected Type: {st['type']} (confidence: {st['certainty']:.2f})")
    
    print(f"\n🚨 Urgency: {result['urgency']}")
    
    # Missing facts
    missing = result['missing_facts']
    print(f"\n📋 Data Completeness: {int(missing['completeness_score']*100)}%")
    
    if missing['critical']:
        print(f"\n⚠️  CRITICAL MISSING DATA:")
        for item in missing['critical']:
            print(f"   - {item['category']}: {item['reason']}")
    
    if missing['helpful']:
        print(f"\n💡 HELPFUL ADDITIONAL DATA:")
        for item in missing['helpful'][:3]:
            print(f"   - {item['category']}: {item['reason']}")
    
    # Suggested questions
    if result.get('suggested_questions'):
        print(f"\n❓ SUGGESTED QUESTIONS:")
        for q in result['suggested_questions'][:3]:
            print(f"   [{q['priority']}] {q['question']}")
    
    print(f"\n✅ Can Conclude: {'Yes' if result['can_conclude'] else 'No'}")
    print(f"📌 Needs More Data: {'Yes' if result['needs_more_data'] else 'No'}")


def scenario_1_minimal_symptoms():
    """Scenario 1: Just a few symptoms, no labs."""
    facts = {
        "age": 45,
        "frequent_urination": True,
        "excessive_thirst": True,
        "fatigue": True,
    }
    
    result = run_enhanced_inference(facts, [])
    print_result("Scenario 1: Minimal Symptoms (No Labs)", result)


def scenario_2_complete_data():
    """Scenario 2: Complete data with labs and full history."""
    facts = {
        "age": 52,
        "sex": "male",
        "bmi": 32.5,
        "fasting_glucose": 185,
        "hba1c": 8.5,
        "frequent_urination": True,
        "excessive_thirst": True,
        "excessive_hunger": True,
        "weight_loss": True,
        "family_history": True,
        "obesity": True,
        "sedentary_lifestyle": True,
        "rapid_onset": False,
    }
    
    result = run_enhanced_inference(facts, [])
    print_result("Scenario 2: Complete Data (Type 2 Pattern)", result)


def scenario_3_labs_only():
    """Scenario 3: Only lab values, minimal other info."""
    facts = {
        "age": 60,
        "fasting_glucose": 145,
        "hba1c": 6.8,
    }
    
    result = run_enhanced_inference(facts, [])
    print_result("Scenario 3: Labs Only (Prediabetes Range)", result)


def scenario_4_emergency():
    """Scenario 4: Emergency scenario with DKA signs."""
    facts = {
        "age": 25,
        "fasting_glucose": 350,
        "frequent_urination": True,
        "excessive_thirst": True,
        "vomiting": True,
        "abdominal_pain": True,
        "fruity_breath": True,
        "deep_rapid_breathing": True,
        "crisis": True,
    }
    
    result = run_enhanced_inference(facts, [])
    print_result("Scenario 4: Emergency (Possible DKA)", result)


def scenario_5_type1_pattern():
    """Scenario 5: Young person with rapid onset (Type 1 pattern)."""
    facts = {
        "age": 16,
        "bmi": 19.5,
        "fasting_glucose": 245,
        "frequent_urination": True,
        "excessive_thirst": True,
        "excessive_hunger": True,
        "weight_loss": True,
        "rapid_onset": True,
        "bed_wetting": True,
        "irritability": True,
    }
    
    result = run_enhanced_inference(facts, [])
    print_result("Scenario 5: Young with Rapid Onset (Type 1 Pattern)", result)


def scenario_6_pregnancy():
    """Scenario 6: Pregnant woman with elevated glucose."""
    facts = {
        "age": 32,
        "sex": "female",
        "currently_pregnant": True,
        "fasting_glucose": 98,
        "gestational_history": True,
        "family_history": True,
        "bmi": 28,
    }
    
    result = run_enhanced_inference(facts, [])
    print_result("Scenario 6: Pregnancy (Gestational Pattern)", result)


def scenario_7_flexible_input():
    """Scenario 7: Flexible input formats (nested structures)."""
    facts = {
        "age": 48,
        "symptoms": {  # Nested dict
            "frequent_urination": True,
            "excessive_thirst": True,
            "fatigue": True,
        },
        "labs": {  # Nested dict
            "fasting_glucose": 155,
            "hba1c": 7.2,
        },
        "risk_factors": {  # Nested dict
            "family_history": True,
            "obesity": True,
        }
    }
    
    result = run_enhanced_inference(facts, [])
    print_result("Scenario 7: Flexible Input Format", result)


def main():
    """Run all scenarios."""
    print("\n" + "="*80)
    print("  🩺 INTELLIGENT DIABETES ASSESSMENT SYSTEM - EXAMPLES")
    print("="*80)
    print("\nDemonstrating flexible, fact-based expert system that:")
    print("  ✓ Works with ANY combination of facts")
    print("  ✓ Detects missing critical information")
    print("  ✓ Provides confidence levels and uncertainty analysis")
    print("  ✓ Suggests what additional data would help")
    print("  ✓ Handles multiple input formats")
    
    # Run all scenarios
    scenario_1_minimal_symptoms()
    scenario_2_complete_data()
    scenario_3_labs_only()
    scenario_4_emergency()
    scenario_5_type1_pattern()
    scenario_6_pregnancy()
    scenario_7_flexible_input()
    
    print("\n" + "="*80)
    print("  ✅ ALL SCENARIOS COMPLETED")
    print("="*80)
    print("\nThe system handled all scenarios successfully, from minimal")
    print("symptoms to complete data, emergency situations, and various")
    print("input formats. This demonstrates the flexibility and intelligence")
    print("of the new assessment architecture.\n")


if __name__ == "__main__":
    main()
