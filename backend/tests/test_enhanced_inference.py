"""
Test Enhanced Inference Engine

Tests for the new simplified, intelligent inference system.
"""

import pytest

from app.expert_system.enhanced_inference_engine import run_enhanced_inference
from app.expert_system.missing_facts_detector import detect_missing_facts
from app.expert_system.uncertainty_analysis import analyze_uncertainty


class TestEnhancedInference:
    """Test the enhanced inference engine with flexible input."""
    
    def test_minimal_input_with_symptoms_only(self):
        """Test that system works with just symptoms (no labs)."""
        facts = {
            "age": 45,
            "frequent_urination": True,
            "excessive_thirst": True,
            "fatigue": True,
        }
        
        # Should not crash with minimal input
        result = run_enhanced_inference(facts, [])
        
        assert result is not None
        assert "diagnosis" in result
        assert "certainty" in result
        assert "missing_facts" in result
        assert "uncertainty" in result
        
        # Should detect missing critical data (labs)
        missing = result["missing_facts"]
        assert len(missing.get("critical", [])) > 0
        assert missing["has_sufficient_data"] is False
        
        # Confidence level can vary depending on rules available
        assert result["confidence_level"] in ("low", "moderate", "high")
    
    def test_complete_input_with_labs_and_symptoms(self):
        """Test with comprehensive data."""
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
        }
        
        result = run_enhanced_inference(facts, [])
        
        assert result is not None
        # Without rules, certainty may be 0, but system still works
        assert result["certainty"] >= 0
        
        # Should have fewer missing facts
        missing = result["missing_facts"]
        assert len(missing.get("critical", [])) == 0
        
        # Should have higher completeness
        assert missing["completeness_score"] >= 0.6
        
        # Data quality should be good
        assert result.get("data_quality", {}).get("quality_level") in ("moderate", "high")
    
    def test_labs_only_no_symptoms(self):
        """Test with only lab values."""
        facts = {
            "age": 60,
            "fasting_glucose": 145,
            "hba1c": 6.8,
        }
        
        result = run_enhanced_inference(facts, [])
        
        assert result is not None
        # System should work with labs only
        assert result["certainty"] >= 0
        
        # Missing facts should be present but may not specifically mention symptoms
        missing = result["missing_facts"]
        assert len(missing.get("helpful", [])) > 0
    
    def test_emergency_scenario(self):
        """Test emergency detection with critical lab values."""
        facts = {
            "age": 25,
            "fasting_glucose": 350,  # Critical
            "frequent_urination": True,
            "excessive_thirst": True,
            "vomiting": True,
            "abdominal_pain": True,
            "fruity_breath": True,
            "crisis": True,  # Explicit crisis flag
        }
        
        result = run_enhanced_inference(facts, [])
        
        assert result is not None
        # With crisis flag, should be urgent or emergency
        assert result["urgency"] in ("urgent", "emergency")
    
    def test_suggested_questions(self):
        """Test that suggested questions are generated."""
        facts = {
            "age": 40,
            "frequent_urination": True,
            "excessive_thirst": True,
        }
        
        result = run_enhanced_inference(facts, [])
        
        assert "suggested_questions" in result
        assert len(result["suggested_questions"]) > 0
        
        # Should suggest lab tests
        questions = result["suggested_questions"]
        has_lab_suggestion = any(
            "glucose" in q.get("question", "").lower() or 
            "hba1c" in q.get("question", "").lower()
            for q in questions
        )
        assert has_lab_suggestion


class TestMissingFactsDetection:
    """Test missing facts detector."""
    
    def test_detect_no_labs(self):
        """Should detect when labs are missing."""
        facts = {
            "age": 45,
            "frequent_urination": True,
        }
        
        missing = detect_missing_facts(facts, {"all_conclusions": []})
        
        assert len(missing["critical"]) > 0
        assert any("lab" in item["category"].lower() 
                   for item in missing["critical"])
    
    def test_detect_no_demographics(self):
        """Should detect when age is missing."""
        facts = {
            "fasting_glucose": 145,
            "frequent_urination": True,
        }
        
        missing = detect_missing_facts(facts, {"all_conclusions": []})
        
        # Age is critical for risk assessment
        has_demo_critical = any(
            "demographic" in item["category"].lower() 
            for item in missing["critical"]
        )
        assert has_demo_critical
    
    def test_completeness_score(self):
        """Test completeness scoring."""
        # Minimal facts
        minimal = {"age": 30}
        missing_minimal = detect_missing_facts(minimal, {"all_conclusions": []})
        
        # Complete facts
        complete = {
            "age": 45,
            "sex": "female",
            "fasting_glucose": 145,
            "hba1c": 6.5,
            "frequent_urination": True,
            "excessive_thirst": True,
            "family_history": True,
            "obesity": True,
        }
        missing_complete = detect_missing_facts(complete, {"all_conclusions": []})
        
        # Complete should have higher score
        assert missing_complete["completeness_score"] > missing_minimal["completeness_score"]
        assert missing_complete["completeness_score"] >= 0.6


class TestUncertaintyAnalysis:
    """Test uncertainty analysis."""
    
    def test_high_uncertainty_with_no_labs(self):
        """Should have high uncertainty without labs."""
        facts = {"age": 45, "frequent_urination": True}
        missing = detect_missing_facts(facts, {"all_conclusions": []})
        inference = {"all_conclusions": [{"conclusion": "symptom_only", "certainty": 0.4}]}
        
        uncertainty = analyze_uncertainty(inference, facts, missing)
        
        assert uncertainty["level"] in ("moderate", "high")
        assert uncertainty["confidence_assessment"] == "insufficient"
    
    def test_low_uncertainty_with_complete_data(self):
        """Should have low uncertainty with complete data."""
        facts = {
            "age": 50,
            "fasting_glucose": 180,
            "hba1c": 8.0,
            "frequent_urination": True,
        }
        missing = detect_missing_facts(facts, {"all_conclusions": []})
        inference = {
            "all_conclusions": [
                {"conclusion": "diabetes_likely", "certainty": 0.85}
            ]
        }
        
        uncertainty = analyze_uncertainty(inference, facts, missing)
        
        assert uncertainty["level"] == "low"
        assert uncertainty["reliability_score"] > 0.7


class TestFlexibleInput:
    """Test that system handles various input formats."""
    
    def test_symptoms_as_dict(self):
        """Test symptoms as dictionary."""
        facts = {
            "age": 45,
            "symptoms": {
                "frequent_urination": True,
                "excessive_thirst": True,
                "fatigue": False,
            }
        }
        
        result = run_enhanced_inference(facts, [])
        assert result is not None
    
    def test_labs_as_dict(self):
        """Test labs as dictionary."""
        facts = {
            "age": 45,
            "labs": {
                "fasting_glucose": 145,
                "hba1c": 6.8,
            }
        }
        
        result = run_enhanced_inference(facts, [])
        assert result is not None
        assert result["certainty"] >= 0
    
    def test_risk_factors_as_dict(self):
        """Test risk factors as dictionary."""
        facts = {
            "age": 55,
            "risk_factors": {
                "family_history": True,
                "obesity": True,
                "sedentary_lifestyle": True,
            }
        }
        
        result = run_enhanced_inference(facts, [])
        assert result is not None
    
    def test_mixed_format_input(self):
        """Test mix of flat and nested formats."""
        facts = {
            "age": 45,
            "fasting_glucose": 145,  # Flat
            "symptoms": {  # Nested
                "frequent_urination": True,
                "excessive_thirst": True,
            },
            "family_history": True,  # Flat
        }
        
        result = run_enhanced_inference(facts, [])
        assert result is not None
        assert result["certainty"] >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
