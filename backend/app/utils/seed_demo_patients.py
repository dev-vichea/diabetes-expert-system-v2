"""
Seed realistic demo patients and clinical diagnosis results.

Populates the database with:
- 16 diverse patient profiles across genders, age groups, and risk profiles
- Multiple historical assessments with realistic dates (longitudinal trendlines)
- Mix of clinical outcomes: Confirmed Type 2, Gestational Diabetes, Suspected Type 1 in child,
  Prediabetes, Diabetic Neuropathy, Symptom-only assessments, and Normal healthy checks
- Doctor reviews and pending care team submissions for the review queue
- Corresponding LabResult and Symptom records for patient charts
"""

from datetime import datetime, timedelta, timezone
from app.extensions import db
from app.models import Patient, AssessmentSession, DiagnosisResult, LabResult, Symptom, User
from app.dependencies import get_diagnosis_service


DEMO_PATIENTS_DATA = [
    {
        "full_name": "Sokha Chan",
        "gender": "female",
        "date_of_birth": "1978-04-12",
        "phone": "+855 12 456 781",
        "height_cm": 158.0,
        "weight_kg": 74.5,
        "waist_circumference": 88.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": True,
        "sedentary_lifestyle": True,
        "smoking": False,
        "notes": "Long-term follow-up for metabolic syndrome. Reports fatigue and blurry vision.",
        "assessments": [
            {
                "days_ago": 120,
                "payload": {
                    "age": 48,
                    "sex": "female",
                    "bmi": 29.8,
                    "frequent_urination": True,
                    "excessive_thirst": True,
                    "fatigue": True,
                    "family_history": True,
                    "hypertension": True,
                    "fasting_glucose": 162.0,
                    "hba1c": 8.5,
                    "patient_note": "Feeling thirsty all the time and tired during afternoons.",
                },
                "reviewed": True,
                "review_note": "Confirmed Type 2 Diabetes. Initiated Metformin 500mg BID and referred to nutritionist. 3-month follow-up scheduled.",
                "doctor_sub": "2",
            },
            {
                "days_ago": 30,
                "payload": {
                    "age": 48,
                    "sex": "female",
                    "bmi": 29.2,
                    "frequent_urination": False,
                    "excessive_thirst": True,
                    "fatigue": False,
                    "family_history": True,
                    "hypertension": True,
                    "fasting_glucose": 138.0,
                    "hba1c": 7.6,
                    "patient_note": "Thirst has improved with medication. Energy levels are better.",
                },
                "reviewed": True,
                "review_note": "Good progress on glycemic control. HbA1c reduced from 8.5% to 7.6%. Continue current regimen.",
                "doctor_sub": "2",
            },
        ],
    },
    {
        "full_name": "Bopha Keo",
        "gender": "female",
        "date_of_birth": "1999-08-23",
        "phone": "+855 77 234 567",
        "height_cm": 162.0,
        "weight_kg": 68.0,
        "waist_circumference": 84.0,
        "family_history": True,
        "hypertension": False,
        "high_cholesterol": False,
        "sedentary_lifestyle": False,
        "smoking": False,
        "notes": "26 weeks pregnant (2nd trimester). Screened for gestational diabetes.",
        "assessments": [
            {
                "days_ago": 8,
                "payload": {
                    "age": 27,
                    "sex": "female",
                    "bmi": 25.9,
                    "currently_pregnant": True,
                    "pregnancy_stage": "second",
                    "gestational_history": False,
                    "fasting_glucose": 98.0,
                    "ogtt_2h": 164.0,
                    "family_history": True,
                    "excessive_thirst": True,
                    "patient_note": "Routine prenatal oral glucose tolerance test at 26 weeks.",
                },
                "reviewed": False,  # Pending in doctor review queue!
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Dara Sam",
        "gender": "male",
        "date_of_birth": "2015-02-14",
        "phone": "+855 16 889 012",
        "height_cm": 142.0,
        "weight_kg": 32.0,
        "waist_circumference": 58.0,
        "family_history": False,
        "hypertension": False,
        "high_cholesterol": False,
        "sedentary_lifestyle": False,
        "smoking": False,
        "notes": "Pediatric evaluation. Mother reports sudden onset of extreme thirst and new bed-wetting over the past 2 weeks.",
        "assessments": [
            {
                "days_ago": 3,
                "payload": {
                    "age": 11,
                    "sex": "male",
                    "bmi": 15.9,
                    "rapid_onset": True,
                    "frequent_urination": True,
                    "excessive_thirst": True,
                    "excessive_hunger": True,
                    "weight_loss": True,
                    "bed_wetting": True,
                    "fasting_glucose": 195.0,
                    "random_plasma_glucose": 240.0,
                    "patient_note": "Child started wetting the bed again and drinking water constantly.",
                },
                "reviewed": True,
                "review_note": "URGENT: Classic Type 1 Diabetes presentation in pediatric patient. Immediate pediatric endocrinology transfer arranged today for insulin initiation and DKA prevention.",
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Rathana Som",
        "gender": "male",
        "date_of_birth": "1972-11-05",
        "phone": "+855 11 908 123",
        "height_cm": 173.0,
        "weight_kg": 89.0,
        "waist_circumference": 98.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": True,
        "sedentary_lifestyle": True,
        "smoking": True,
        "notes": "Executive health checkup. Overweight with borderline fasting blood sugar.",
        "assessments": [
            {
                "days_ago": 150,
                "payload": {
                    "age": 54,
                    "sex": "male",
                    "bmi": 29.7,
                    "family_history": True,
                    "obesity": True,
                    "hypertension": True,
                    "high_cholesterol": True,
                    "smoking": True,
                    "sedentary_lifestyle": True,
                    "fasting_glucose": 118.0,
                    "hba1c": 6.2,
                    "fatigue": True,
                },
                "reviewed": True,
                "review_note": "Prediabetes (Impaired Fasting Glucose) with metabolic syndrome factors. Prescribed lifestyle modification, 30 min daily walking, and smoking cessation counseling.",
                "doctor_sub": "2",
            },
            {
                "days_ago": 15,
                "payload": {
                    "age": 54,
                    "sex": "male",
                    "bmi": 28.6,
                    "family_history": True,
                    "hypertension": True,
                    "high_cholesterol": True,
                    "smoking": False,
                    "fasting_glucose": 109.0,
                    "hba1c": 5.9,
                },
                "reviewed": False,  # Pending review!
                "doctor_sub": "2",
            },
        ],
    },
    {
        "full_name": "Channary Meas",
        "gender": "female",
        "date_of_birth": "1963-06-19",
        "phone": "+855 12 776 543",
        "height_cm": 155.0,
        "weight_kg": 65.0,
        "waist_circumference": 82.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": True,
        "sedentary_lifestyle": True,
        "smoking": False,
        "notes": "Complains of burning sensation and tingling in both feet, especially at night.",
        "assessments": [
            {
                "days_ago": 20,
                "payload": {
                    "age": 63,
                    "sex": "female",
                    "bmi": 27.1,
                    "rapid_onset": False,
                    "frequent_urination": True,
                    "excessive_thirst": True,
                    "tingling_hands_feet": True,
                    "burning_sensation": True,
                    "numbness": True,
                    "slow_healing": True,
                    "fasting_glucose": 174.0,
                    "hba1c": 8.9,
                    "patient_note": "Feet feel like they are burning and pins and needles when resting in bed.",
                },
                "reviewed": True,
                "review_note": "Diabetic Peripheral Neuropathy secondary to uncontrolled Type 2 Diabetes. Monofilament exam abnormal. Started Gabapentin and intensified glycemic management.",
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Sopheap Seng",
        "gender": "male",
        "date_of_birth": "1984-03-30",
        "phone": "+855 70 334 455",
        "height_cm": 170.0,
        "weight_kg": 72.0,
        "waist_circumference": 84.0,
        "family_history": True,
        "hypertension": False,
        "high_cholesterol": False,
        "sedentary_lifestyle": False,
        "smoking": True,
        "notes": "Walk-in patient without recent lab tests. Completed self-assessment via mobile app.",
        "assessments": [
            {
                "days_ago": 4,
                "payload": {
                    "age": 42,
                    "sex": "male",
                    "bmi": 24.9,
                    "frequent_urination": True,
                    "excessive_thirst": True,
                    "weight_loss": True,
                    "fatigue": True,
                    "blurred_vision": True,
                    "family_history": True,
                    "smoking": True,
                    "no_labs_available": True,
                    "patient_note": "Lost about 4kg recently without dieting, waking up 3 times each night to drink water and use the bathroom.",
                },
                "reviewed": False,  # Pending review!
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Piseth Ly",
        "gender": "male",
        "date_of_birth": "1995-09-15",
        "phone": "+855 10 556 677",
        "height_cm": 175.0,
        "weight_kg": 68.0,
        "waist_circumference": 78.0,
        "family_history": False,
        "hypertension": False,
        "high_cholesterol": False,
        "sedentary_lifestyle": False,
        "smoking": False,
        "notes": "Pre-employment medical clearance. Excellent general health.",
        "assessments": [
            {
                "days_ago": 45,
                "payload": {
                    "age": 31,
                    "sex": "male",
                    "bmi": 22.2,
                    "fasting_glucose": 86.0,
                    "hba1c": 5.1,
                    "frequent_urination": False,
                    "excessive_thirst": False,
                    "fatigue": False,
                },
                "reviewed": True,
                "review_note": "Normal glucose regulation. No evidence of diabetes or prediabetes. Routine screening recommended in 3 years.",
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Chenda Nuon",
        "gender": "female",
        "date_of_birth": "1987-12-08",
        "phone": "+855 12 998 877",
        "height_cm": 160.0,
        "weight_kg": 73.0,
        "waist_circumference": 86.0,
        "family_history": True,
        "hypertension": False,
        "high_cholesterol": True,
        "sedentary_lifestyle": True,
        "smoking": False,
        "notes": "Known history of Polycystic Ovary Syndrome (PCOS). High risk for insulin resistance.",
        "assessments": [
            {
                "days_ago": 60,
                "payload": {
                    "age": 39,
                    "sex": "female",
                    "bmi": 28.5,
                    "pcos_history": True,
                    "family_history": True,
                    "fatigue": True,
                    "fasting_glucose": 112.0,
                    "hba1c": 5.8,
                },
                "reviewed": True,
                "review_note": "Impaired fasting glucose in context of PCOS. Recommended low GI nutrition plan and resistance training.",
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Linda Oum",
        "gender": "female",
        "date_of_birth": "1967-05-14",
        "phone": "+855 78 112 233",
        "height_cm": 156.0,
        "weight_kg": 64.0,
        "waist_circumference": 81.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": False,
        "sedentary_lifestyle": False,
        "smoking": False,
        "notes": "Stable Type 2 diabetic on Metformin 850mg. Quarterly lab check.",
        "assessments": [
            {
                "days_ago": 180,
                "payload": {
                    "age": 59,
                    "sex": "female",
                    "bmi": 26.3,
                    "fasting_glucose": 142.0,
                    "hba1c": 7.8,
                    "hypertension": True,
                },
                "reviewed": True,
                "review_note": "Moderate glycemic elevation. Adjusted Metformin dose to 850mg twice daily.",
                "doctor_sub": "2",
            },
            {
                "days_ago": 90,
                "payload": {
                    "age": 59,
                    "sex": "female",
                    "bmi": 25.8,
                    "fasting_glucose": 128.0,
                    "hba1c": 7.1,
                    "hypertension": True,
                },
                "reviewed": True,
                "review_note": "Improved HbA1c to 7.1%. Blood pressure well controlled on Lisinopril.",
                "doctor_sub": "2",
            },
            {
                "days_ago": 10,
                "payload": {
                    "age": 59,
                    "sex": "female",
                    "bmi": 25.5,
                    "fasting_glucose": 122.0,
                    "hba1c": 6.8,
                    "hypertension": True,
                },
                "reviewed": False,  # Pending review!
                "doctor_sub": "2",
            },
        ],
    },
    {
        "full_name": "David Chen",
        "gender": "male",
        "date_of_birth": "1980-01-22",
        "phone": "+855 92 445 566",
        "height_cm": 172.0,
        "weight_kg": 81.0,
        "waist_circumference": 92.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": True,
        "sedentary_lifestyle": True,
        "smoking": False,
        "notes": "Referred from cardiology clinic. Borderline fasting sugars and high LDL.",
        "assessments": [
            {
                "days_ago": 25,
                "payload": {
                    "age": 46,
                    "sex": "male",
                    "bmi": 27.4,
                    "ethnicity_high_risk": True,
                    "family_history": True,
                    "hypertension": True,
                    "high_cholesterol": True,
                    "fasting_glucose": 124.0,
                    "hba1c": 6.3,
                    "fatigue": True,
                },
                "reviewed": False,  # Pending review!
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Maria Garcia",
        "gender": "female",
        "date_of_birth": "1974-10-18",
        "phone": "+855 12 334 991",
        "height_cm": 160.0,
        "weight_kg": 85.0,
        "waist_circumference": 96.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": True,
        "sedentary_lifestyle": True,
        "smoking": False,
        "notes": "Severe insulin resistance signs observed during dermatology visit (Acanthosis Nigricans on neck).",
        "assessments": [
            {
                "days_ago": 18,
                "payload": {
                    "age": 52,
                    "sex": "female",
                    "bmi": 33.2,
                    "obesity": True,
                    "acanthosis_nigricans": True,
                    "frequent_urination": True,
                    "excessive_thirst": True,
                    "slow_healing": True,
                    "fasting_glucose": 168.0,
                    "hba1c": 8.8,
                },
                "reviewed": True,
                "review_note": "Classic Acanthosis Nigricans and marked hyperglycemia. Started combination Metformin + SGLT2 inhibitor. Eye exam ordered.",
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "James Miller",
        "gender": "male",
        "date_of_birth": "1958-07-03",
        "phone": "+855 77 665 544",
        "height_cm": 178.0,
        "weight_kg": 84.0,
        "waist_circumference": 94.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": True,
        "sedentary_lifestyle": True,
        "smoking": True,
        "notes": "Elderly patient with non-healing foot laceration and recurrent skin infections.",
        "assessments": [
            {
                "days_ago": 12,
                "payload": {
                    "age": 68,
                    "sex": "male",
                    "bmi": 26.5,
                    "frequent_urination": True,
                    "slow_healing": True,
                    "frequent_infections": True,
                    "tingling_hands_feet": True,
                    "fasting_glucose": 155.0,
                    "hba1c": 8.1,
                    "hypertension": True,
                },
                "reviewed": True,
                "review_note": "Diabetic foot ulcer risk. Wound culture obtained, oral antibiotics initiated, diabetic wound care dressing applied.",
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Sarah Connor",
        "gender": "female",
        "date_of_birth": "1993-04-11",
        "phone": "+855 16 223 344",
        "height_cm": 166.0,
        "weight_kg": 57.0,
        "waist_circumference": 70.0,
        "family_history": False,
        "hypertension": False,
        "high_cholesterol": False,
        "sedentary_lifestyle": False,
        "smoking": False,
        "notes": "Fitness enthusiast self-check. No complaints.",
        "assessments": [
            {
                "days_ago": 70,
                "payload": {
                    "age": 33,
                    "sex": "female",
                    "bmi": 20.7,
                    "fasting_glucose": 88.0,
                    "hba1c": 5.0,
                },
                "reviewed": True,
                "review_note": "Normal metabolic panel. Continued healthy diet and exercise commended.",
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Vannak Phan",
        "gender": "male",
        "date_of_birth": "1976-08-29",
        "phone": "+855 12 887 766",
        "height_cm": 168.0,
        "weight_kg": 80.0,
        "waist_circumference": 92.0,
        "family_history": True,
        "hypertension": True,
        "high_cholesterol": False,
        "sedentary_lifestyle": True,
        "smoking": False,
        "notes": "Hypertensive follow-up. Night urination and blurred vision reported.",
        "assessments": [
            {
                "days_ago": 6,
                "payload": {
                    "age": 50,
                    "sex": "male",
                    "bmi": 28.3,
                    "frequent_urination": True,
                    "blurred_vision": True,
                    "fatigue": True,
                    "hypertension": True,
                    "family_history": True,
                    "fasting_glucose": 146.0,
                },
                "reviewed": False,  # Pending review!
                "doctor_sub": "2",
            }
        ],
    },
    {
        "full_name": "Sreymom Touch",
        "gender": "female",
        "date_of_birth": "1985-02-17",
        "phone": "+855 70 998 811",
        "height_cm": 157.0,
        "weight_kg": 66.0,
        "waist_circumference": 80.0,
        "family_history": True,
        "hypertension": False,
        "high_cholesterol": False,
        "sedentary_lifestyle": True,
        "smoking": False,
        "notes": "Symptom check for persistent fatigue and intermittent blurred vision.",
        "assessments": [
            {
                "days_ago": 2,
                "payload": {
                    "age": 41,
                    "sex": "female",
                    "bmi": 26.8,
                    "fatigue": True,
                    "blurred_vision": True,
                    "excessive_thirst": True,
                    "family_history": True,
                    "no_labs_available": True,
                    "patient_note": "Feeling exhausted even after 8 hours of sleep. Sometimes difficult to read phone screen.",
                },
                "reviewed": False,  # Pending review!
                "doctor_sub": "2",
            }
        ],
    },
]


def seed_demo_patients_and_results():
    """Seed demo patients, evaluations, sessions, symptoms, and labs."""
    now = datetime.now(timezone.utc)
    diagnosis_service = get_diagnosis_service()

    # Get doctor user (Dr. Lina)
    doctor_user = User.query.filter_by(email="doctor@example.com").first()
    doctor_id = doctor_user.id if doctor_user else None

    seeded_patient_count = 0
    seeded_result_count = 0

    for patient_data in DEMO_PATIENTS_DATA:
        # Check if already seeded
        existing = Patient.query.filter_by(full_name=patient_data["full_name"]).first()
        if existing:
            patient = existing
        else:
            dob = None
            if patient_data.get("date_of_birth"):
                try:
                    dob = datetime.strptime(patient_data["date_of_birth"], "%Y-%m-%d").date()
                except Exception:
                    pass

            patient = Patient(
                full_name=patient_data["full_name"],
                gender=patient_data.get("gender"),
                date_of_birth=dob,
                phone=patient_data.get("phone"),
                height_cm=patient_data.get("height_cm"),
                weight_kg=patient_data.get("weight_kg"),
                waist_circumference=patient_data.get("waist_circumference"),
                smoking=patient_data.get("smoking"),
                sedentary_lifestyle=patient_data.get("sedentary_lifestyle"),
                family_history=patient_data.get("family_history"),
                hypertension=patient_data.get("hypertension"),
                high_cholesterol=patient_data.get("high_cholesterol"),
                notes=patient_data.get("notes"),
                profile_completed_at=now - timedelta(days=200),
                created_at=now - timedelta(days=200),
            )
            db.session.add(patient)
            db.session.flush()
            seeded_patient_count += 1

        # Run each assessment for the patient
        for assess_info in patient_data.get("assessments", []):
            days_ago = assess_info.get("days_ago", 10)
            assess_time = now - timedelta(days=days_ago, hours=3, minutes=15)
            payload = dict(assess_info["payload"])
            payload["patient_id"] = patient.id
            payload["save"] = True
            payload["preview"] = False
            payload["mode"] = "diagnostic"
            if assess_info.get("reviewed") is False:
                payload["submitted_to_care_team"] = True

            # Use doctor or clinician user context
            current_user = {
                "sub": str(doctor_id or 2),
                "role": "doctor",
                "roles": ["doctor"],
            }

            eval_res = diagnosis_service.evaluate(payload, current_user)
            res_id = eval_res.get("diagnosis_result_id")
            sess_id = eval_res.get("assessment_session_id")

            if res_id:
                diag_row = DiagnosisResult.query.get(res_id)
                if diag_row:
                    diag_row.created_at = assess_time
                    if assess_info.get("reviewed"):
                        diag_row.reviewed_by_user_id = doctor_id
                        diag_row.reviewed_at = assess_time + timedelta(hours=2)
                        diag_row.review_note = assess_info.get("review_note")
                    else:
                        diag_row.reviewed_by_user_id = None
                        diag_row.reviewed_at = None
                        diag_row.review_note = None

            if sess_id:
                sess_row = AssessmentSession.query.get(sess_id)
                if sess_row:
                    sess_row.created_at = assess_time
                    sess_row.started_at = assess_time - timedelta(minutes=10)
                    sess_row.submitted_at = assess_time
                    sess_row.status = "reviewed" if assess_info.get("reviewed") else "submitted"

            # Seed specific lab results if present in payload
            if payload.get("fasting_glucose"):
                db.session.add(LabResult(
                    patient_id=patient.id,
                    test_name="Fasting Plasma Glucose",
                    test_value=float(payload["fasting_glucose"]),
                    unit="mg/dL",
                    reference_range="70-99",
                    measured_at=assess_time,
                    notes="Automated fasting blood sugar lab",
                ))
            if payload.get("hba1c"):
                db.session.add(LabResult(
                    patient_id=patient.id,
                    test_name="Glycated Hemoglobin (HbA1c)",
                    test_value=float(payload["hba1c"]),
                    unit="%",
                    reference_range="< 5.7",
                    measured_at=assess_time,
                    notes="Automated HbA1c venipuncture lab",
                ))
            if payload.get("ogtt_2h"):
                db.session.add(LabResult(
                    patient_id=patient.id,
                    test_name="2-Hour Oral Glucose Tolerance Test",
                    test_value=float(payload["ogtt_2h"]),
                    unit="mg/dL",
                    reference_range="< 140",
                    measured_at=assess_time,
                    notes="75g OGTT assessment",
                ))

            # Seed symptoms
            for sym_key, sym_name in [
                ("frequent_urination", "Frequent Urination"),
                ("excessive_thirst", "Excessive Thirst"),
                ("excessive_hunger", "Excessive Hunger"),
                ("fatigue", "Extreme Fatigue"),
                ("weight_loss", "Unexplained Weight Loss"),
                ("blurred_vision", "Blurred Vision"),
                ("tingling_hands_feet", "Tingling in Hands/Feet"),
                ("burning_sensation", "Burning Sensation"),
                ("slow_healing", "Slow Wound Healing"),
                ("bed_wetting", "Bed-Wetting"),
            ]:
                if payload.get(sym_key):
                    db.session.add(Symptom(
                        patient_id=patient.id,
                        symptom_code=sym_key,
                        symptom_name=sym_name,
                        severity=2,
                        present=True,
                        recorded_at=assess_time,
                    ))

            seeded_result_count += 1

    db.session.commit()
    print(f"Successfully seeded {seeded_patient_count} new patients and {seeded_result_count} assessments.")


if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        seed_demo_patients_and_results()
