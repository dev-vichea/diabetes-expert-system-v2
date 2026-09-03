#!/usr/bin/env python3
"""
Conversational Assessment Demo

Demonstrates the new intelligent, symptom-based conversation system.
Shows how it works WITHOUT lab results and feels like talking to a doctor.
"""

import json
from app.expert_system.intelligent_interview import IntelligentInterview
from app.expert_system.symptom_confidence import calculate_symptom_confidence, get_confidence_explanation
from app.expert_system.symptom_based_rules import get_symptom_based_assessment, generate_symptom_rules
from app.expert_system.enhanced_inference_engine import run_enhanced_inference


def print_header(title: str):
    """Print a nice header."""
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)


def print_question(q: dict, num: int):
    """Print a question nicely."""
    importance = q.get("importance", "medium")
    emoji = "🚨" if importance == "critical" else "⚠️" if importance == "high" else "❓"
    
    print(f"\n{emoji} Question {num}: {q['question']}")
    if q.get("explanation"):
        print(f"   💡 {q['explanation']}")


def scenario_1_classic_diabetes():
    """Scenario 1: Classic Type 2 diabetes with 3 Ps."""
    print_header("SCENARIO 1: Classic Type 2 Diabetes (3 Ps Present)")
    
    print("\n👤 Patient Profile:")
    print("   - Age 52, overweight, family history")
    print("   - All 3 cardinal symptoms present")
    print("   - NO lab results available")
    
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
    
    # Calculate confidence
    confidence = calculate_symptom_confidence(
        symptoms, 
        age=52, 
        risk_factors={"family_history": True, "obesity": True}
    )
    
    print(f"\n📊 ASSESSMENT RESULTS:")
    print(f"   Confidence Score: {confidence['confidence_score']:.1%}")
    print(f"   Confidence Level: {confidence['confidence_level'].upper()}")
    print(f"   Assessment Quality: {confidence['assessment_quality'].upper()}")
    
    print(f"\n💬 Explanation:")
    print(f"   {get_confidence_explanation(confidence)}")
    
    print(f"\n🎯 Key Factors:")
    for factor in confidence['contributing_factors'][:3]:
        print(f"   ✓ {factor['factor']} (boost: +{factor['boost']:.2%})")
    
    print(f"\n📋 Recommendations:")
    for i, rec in enumerate(confidence['recommendations'][:3], 1):
        print(f"   {i}. {rec}")


def scenario_2_early_warning():
    """Scenario 2: Early warning signs without full triad."""
    print_header("SCENARIO 2: Early Warning Signs (Only 2 Cardinal Symptoms)")
    
    print("\n👤 Patient Profile:")
    print("   - Age 45, sedentary lifestyle")
    print("   - Thirst + fatigue, no lab tests")
    
    symptoms = {
        "age": 45,
        "sex": "female",
        "excessive_thirst": True,
        "extreme_fatigue": True,
        "blurred_vision": True,
        "sedentary_lifestyle": True,
    }
    
    confidence = calculate_symptom_confidence(
        symptoms,
        age=45,
        risk_factors={"sedentary_lifestyle": True}
    )
    
    print(f"\n📊 ASSESSMENT RESULTS:")
    print(f"   Confidence Score: {confidence['confidence_score']:.1%}")
    print(f"   Confidence Level: {confidence['confidence_level'].upper()}")
    
    print(f"\n💬 Explanation:")
    explanation = get_confidence_explanation(confidence)
    print(f"   {explanation}")
    
    print(f"\n📋 Recommendations:")
    for rec in confidence['recommendations']:
        print(f"   • {rec}")


def scenario_3_pediatric_type1():
    """Scenario 3: Child with Type 1 pattern."""
    print_header("SCENARIO 3: Pediatric Type 1 Pattern (Child Age 12)")
    
    print("\n👤 Patient Profile:")
    print("   - Age 12, recent weight loss")
    print("   - Bed-wetting, all 3 Ps present")
    print("   - NO lab results")
    
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
        "rapid_onset": True,  # Symptoms developed quickly
    }
    
    confidence = calculate_symptom_confidence(symptoms, age=12)
    
    # Get type indication
    quick_assess = get_symptom_based_assessment(symptoms)
    
    print(f"\n📊 ASSESSMENT RESULTS:")
    print(f"   Confidence Score: {confidence['confidence_score']:.1%}")
    print(f"   Confidence Level: {confidence['confidence_level'].upper()}")
    print(f"   Suspected Type: {quick_assess['type_indication']['likely_type']}")
    
    print(f"\n⚠️  URGENT NOTICE:")
    print(f"   Type 1 diabetes in children requires IMMEDIATE medical attention!")
    print(f"   Rapid progression can lead to serious complications.")
    
    print(f"\n📋 Immediate Actions:")
    for rec in confidence['recommendations']:
        print(f"   🚨 {rec}")


def scenario_4_emergency():
    """Scenario 4: Emergency DKA symptoms."""
    print_header("SCENARIO 4: EMERGENCY - Possible DKA")
    
    print("\n👤 Patient Profile:")
    print("   - Age 28, known diabetes symptoms")
    print("   - NOW: Vomiting, fruity breath, confusion")
    
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
        "extreme_fatigue": True,
    }
    
    confidence = calculate_symptom_confidence(symptoms, age=28)
    
    print(f"\n🚨 EMERGENCY ASSESSMENT:")
    print(f"   Confidence Score: {confidence['confidence_score']:.1%}")
    print(f"   Emergency Symptoms: {confidence['symptom_counts']['emergency_symptoms']}")
    
    print(f"\n⚠️  CRITICAL:")
    print(f"   {confidence['recommendations'][0]}")
    print(f"\n   This is a medical emergency. Call 911 or go to ER immediately.")


def scenario_5_gestational():
    """Scenario 5: Pregnant woman with symptoms."""
    print_header("SCENARIO 5: Gestational Diabetes Pattern")
    
    print("\n👤 Patient Profile:")
    print("   - Age 32, pregnant (2nd trimester)")
    print("   - Excessive thirst + fatigue")
    print("   - Previous gestational diabetes")
    
    symptoms = {
        "age": 32,
        "sex": "female",
        "currently_pregnant": True,
        "excessive_thirst": True,
        "frequent_urination": True,
        "extreme_fatigue": True,
        "gestational_history": True,
    }
    
    confidence = calculate_symptom_confidence(
        symptoms,
        age=32,
        risk_factors={"gestational_history": True}
    )
    
    print(f"\n📊 ASSESSMENT RESULTS:")
    print(f"   Confidence Score: {confidence['confidence_score']:.1%}")
    print(f"   Special Context: Pregnancy")
    
    print(f"\n📋 Recommendations:")
    for rec in confidence['recommendations']:
        print(f"   • {rec}")
    print(f"   • Contact your OB/GYN for glucose testing")


def scenario_6_interview_flow():
    """Scenario 6: Show the intelligent interview flow."""
    print_header("SCENARIO 6: Intelligent Interview Flow (Like Talking to Doctor)")
    
    print("\n👩‍⚕️ Doctor: Hello! I'll ask you some questions about your health.")
    print("           Let's start with basic information.\n")
    
    interview = IntelligentInterview()
    answers = {}
    
    # Simulate a conversation
    conversation = [
        ("age", 55, "👤 Patient: I'm 55 years old"),
        ("sex", "Female", "👤 Patient: Female"),
        ("frequent_urination", True, "👤 Patient: Yes, I urinate a lot, especially at night"),
        ("excessive_thirst", True, "👤 Patient: Yes, I'm thirsty all the time"),
        ("excessive_hunger", True, "👤 Patient: Yes, even after eating I still feel hungry"),
        ("unexplained_weight_loss", False, "👤 Patient: No, I haven't lost weight"),
        ("extreme_fatigue", True, "👤 Patient: Yes, I'm very tired lately"),
        ("family_history", True, "👤 Patient: Yes, my mother had diabetes"),
    ]
    
    question_num = 1
    for key, value, patient_response in conversation:
        # Get next question
        q = interview.get_next_question(answers)
        if not q:
            break
        
        # Show doctor's question
        print_question(q, question_num)
        
        # Show patient's answer
        print(f"   {patient_response}")
        
        # Record answer
        answers[key] = value
        question_num += 1
    
    # Show progress
    progress = interview.get_interview_progress()
    print(f"\n📊 Interview Progress: {progress['estimated_completion']}%")
    print(f"   Questions Answered: {progress['questions_answered']}")
    print(f"   Sufficient for Assessment: {'Yes ✓' if progress['has_sufficient_data'] else 'No'}")
    
    # Generate assessment
    print(f"\n👩‍⚕️ Doctor: Thank you for answering these questions.")
    print(f"           Based on what you've told me, here's my assessment:\n")
    
    confidence = calculate_symptom_confidence(answers, age=55, risk_factors={"family_history": True})
    
    print(f"   Diagnosis: Likely Type 2 Diabetes")
    print(f"   Confidence: {confidence['confidence_score']:.1%} ({confidence['confidence_level'].upper()})")
    print(f"\n   {get_confidence_explanation(confidence)}")
    
    print(f"\n   What you should do next:")
    for i, rec in enumerate(confidence['recommendations'][:3], 1):
        print(f"   {i}. {rec}")


def scenario_7_inference_rules():
    """Scenario 7: Show how inference rules work with symptoms only."""
    print_header("SCENARIO 7: Inference Engine with Symptom-Only Rules")
    
    print("\n🧠 Testing 18 symptom-based inference rules...")
    
    symptoms = {
        "age": 58,
        "frequent_urination": True,
        "excessive_thirst": True,
        "slow_healing_wounds": True,
        "tingling_hands_feet": True,
        "obesity": True,
        "family_history": True,
        "sedentary_lifestyle": True,
    }
    
    # Generate rules
    rules = generate_symptom_rules()
    
    print(f"\n📚 Loaded {len(rules)} symptom-based rules")
    
    # Run inference
    result = run_enhanced_inference(symptoms, rules)
    
    print(f"\n🔥 Fired Rules:")
    for rule in result.get("triggered_rules", [])[:5]:
        print(f"   ✓ {rule.get('name', 'Unknown')}")
    
    print(f"\n📊 Conclusions:")
    for conclusion in result.get("all_conclusions", [])[:3]:
        print(f"   • {conclusion.get('conclusion')}: {conclusion.get('certainty', 0):.1%}")
    
    print(f"\n🎯 Final Diagnosis: {result.get('diagnosis', 'Unknown')}")
    print(f"   Certainty: {result.get('certainty', 0):.1%}")
    print(f"   Urgency: {result.get('urgency', 'routine').upper()}")


def main():
    """Run all scenarios."""
    print("\n" + "="*80)
    print("  🩺 INTELLIGENT SYMPTOM-BASED DIABETES ASSESSMENT SYSTEM")
    print("  Working WITHOUT Lab Results - Pure Symptom Intelligence")
    print("="*80)
    
    print("\n📝 What makes this system intelligent:")
    print("   ✓ 40+ symptoms from Mayo Clinic, CDC, ADA guidelines")
    print("   ✓ 18 symptom-based inference rules")
    print("   ✓ Works WITHOUT lab results (but accepts them if available)")
    print("   ✓ Intelligent interview - asks follow-up questions like a doctor")
    print("   ✓ Enhanced confidence calculation for symptom-only cases")
    print("   ✓ Emergency detection and urgency assessment")
    print("   ✓ Type 1 vs Type 2 pattern recognition")
    
    input("\n🎬 Press Enter to start demonstrations...")
    
    # Run scenarios
    scenario_1_classic_diabetes()
    input("\n➡️  Press Enter for next scenario...")
    
    scenario_2_early_warning()
    input("\n➡️  Press Enter for next scenario...")
    
    scenario_3_pediatric_type1()
    input("\n➡️  Press Enter for next scenario...")
    
    scenario_4_emergency()
    input("\n➡️  Press Enter for next scenario...")
    
    scenario_5_gestational()
    input("\n➡️  Press Enter for next scenario...")
    
    scenario_6_interview_flow()
    input("\n➡️  Press Enter for next scenario...")
    
    scenario_7_inference_rules()
    
    # Summary
    print_header("🎉 SUMMARY")
    print("\n✅ System Successfully Demonstrated:")
    print("   • Works entirely with symptoms (NO labs required)")
    print("   • Intelligent conversation flow")
    print("   • Multiple patient scenarios")
    print("   • Emergency detection")
    print("   • Type discrimination (T1 vs T2)")
    print("   • Confidence calculation WITHOUT labs")
    print("   • Clinical rule-based reasoning")
    
    print("\n🚀 API Endpoints Available:")
    print("   GET  /api/conversation/start         - Start conversation")
    print("   POST /api/conversation/next          - Get next question")
    print("   POST /api/conversation/complete      - Complete assessment")
    print("   GET  /api/conversation/questions     - Get all questions")
    
    print("\n📚 Documentation:")
    print("   README_START_HERE.md    - Quick start guide")
    print("   HOW_IT_WORKS_SIMPLE.md  - System explanation")
    
    print("\n" + "="*80)
    print("  ✨ SYSTEM READY FOR USE!")
    print("="*80 + "\n")


if __name__ == "__main__":
    main()
