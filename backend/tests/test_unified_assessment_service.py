"""
Test Unified Assessment Service

Integration tests for the simplified assessment service.
"""

import pytest
from unittest.mock import Mock, MagicMock

from app.services.unified_assessment_service import UnifiedAssessmentService


class TestUnifiedAssessmentService:
    """Test the unified assessment service."""
    
    @pytest.fixture
    def service(self):
        """Create a service with mocked repositories."""
        rule_repo = Mock()
        rule_repo.list_rules = Mock(return_value=[])
        
        diagnosis_repo = Mock()
        diagnosis_repo.create_result = Mock(return_value=Mock(id=1))
        
        assessment_repo = Mock()
        assessment_repo.create_session = Mock(return_value=Mock(id=1))
        assessment_repo.save_answers = Mock(return_value=1)
        assessment_repo.mark_completed = Mock()
        
        patient_repo = Mock()
        audit_repo = Mock()
        
        return UnifiedAssessmentService(
            rule_repository=rule_repo,
            diagnosis_repository=diagnosis_repo,
            assessment_repository=assessment_repo,
            patient_repository=patient_repo,
            audit_log_repository=audit_repo
        )
    
    def test_validate_input_minimal(self, service):
        """Test input validation with minimal data."""
        payload = {
            "age": 45,
            "fasting_glucose": 145,
        }
        
        validated = service._validate_input(payload)
        
        assert validated["age"] == 45
        assert validated["fasting_glucose"] == 145
    
    def test_validate_input_with_symptoms(self, service):
        """Test input validation with symptoms."""
        payload = {
            "age": 50,
            "symptoms": {
                "frequent_urination": True,
                "excessive_thirst": True,
                "fatigue": False,
            }
        }
        
        validated = service._validate_input(payload)
        
        assert validated["age"] == 50
        assert validated["frequent_urination"] is True
        assert validated["excessive_thirst"] is True
        assert validated["fatigue"] is False
    
    def test_validate_input_with_labs_dict(self, service):
        """Test input validation with labs as dict."""
        payload = {
            "age": 55,
            "labs": {
                "fasting_glucose": 180,
                "hba1c": 8.5,
            }
        }
        
        validated = service._validate_input(payload)
        
        assert validated["age"] == 55
        assert validated["fasting_glucose"] == 180
        assert validated["hba1c"] == 8.5
    
    def test_validate_input_range_checks(self, service):
        """Test that range validation works."""
        # Age too high
        with pytest.raises(Exception):
            service._validate_input({"age": 150})
        
        # Glucose too low
        with pytest.raises(Exception):
            service._validate_input({"fasting_glucose": 10})
        
        # BMI out of range
        with pytest.raises(Exception):
            service._validate_input({"bmi": 100})
    
    def test_normalize_symptoms_dict(self, service):
        """Test symptom normalization from dict."""
        symptoms = {
            "frequent_urination": True,
            "excessive_thirst": "yes",
            "fatigue": False,
        }
        
        result = service._normalize_symptoms(symptoms)
        
        assert result["frequent_urination"] is True
        assert result["excessive_thirst"] is True
        assert result["fatigue"] is False
    
    def test_normalize_symptoms_list(self, service):
        """Test symptom normalization from list."""
        symptoms = [
            {"symptom_code": "frequent_urination", "present": True},
            {"symptom_code": "fatigue", "present": False},
            "excessive_thirst",  # String form
        ]
        
        result = service._normalize_symptoms(symptoms)
        
        assert result["frequent_urination"] is True
        assert result["fatigue"] is False
        assert result["excessive_thirst"] is True
    
    def test_normalize_labs_dict(self, service):
        """Test lab normalization from dict."""
        labs = {
            "fasting_glucose": 145,
            "hba1c": 6.8,
        }
        
        result = service._normalize_labs(labs)
        
        assert result["fasting_glucose"] == 145.0
        assert result["hba1c"] == 6.8
    
    def test_normalize_labs_list(self, service):
        """Test lab normalization from list."""
        labs = [
            {"test_name": "fasting_glucose", "test_value": 145},
            {"test_name": "hba1c", "value": 6.8},
        ]
        
        result = service._normalize_labs(labs)
        
        assert result["fasting_glucose"] == 145.0
        assert result["hba1c"] == 6.8
    
    def test_to_bool_conversions(self, service):
        """Test boolean conversion."""
        assert service._to_bool(True) is True
        assert service._to_bool(False) is False
        assert service._to_bool("true") is True
        assert service._to_bool("yes") is True
        assert service._to_bool("1") is True
        assert service._to_bool("false") is False
        assert service._to_bool("no") is False
        assert service._to_bool(1) is True
        assert service._to_bool(0) is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
