from __future__ import annotations

import re
from typing import Any, Callable


NUMERIC_FACT_KEYS = {
    "fasting_glucose",
    "fasting_plasma_glucose",
    "hba1c",
    "a1c",
    "2h_ogtt_75g",
    "fact_2h_ogtt_75g",
    "two_hour_ogtt_75g",
    "random_plasma_glucose",
    "blood_glucose",
    "bmi",
    "age",
    "waist_circumference",
    "weight",
    "weight_kg",
    "height",
    "height_cm",
    "height_m",
    "ada_risk_score",
    "nocturia_count",
    "water_intake_liters",
    "fatigue_severity_scale",
    "unexplained_weight_loss_kg",
    "systolic_bp",
    "diastolic_bp",
    "physical_activity_minutes_week",
    "sleep_hours_night",
    "alcohol_drinks_week",
}

BOOLEAN_FACT_KEYS = {
    "frequent_urination",
    "excessive_thirst",
    "polyuria",
    "polydipsia",
    "fatigue",
    "blurred_vision",
    "weight_loss",
    "unexplained_weight_loss",
    "slow_healing",
    "nausea",
    "vomiting",
    "abdominal_pain",
    "sweating",
    "shaking",
    "dizziness",
    "family_history_diabetes",
    "family_history",
    "physical_activity_low",
    "classic_hyperglycemia_symptoms",
    "diabetes_evidence_base",
    "prediabetes_possible",
    "type2_risk_increased",
    "unequivocal_hyperglycemia_or_crisis",
    "crisis",
    "only_symptoms_available",
    "no_lab_values_available",
    "no_labs_available",
    "sedentary_lifestyle",
    "tingling_hands_feet",
    "frequent_infections",
    "acanthosis_nigricans",
    "gestational_history",
    "smoking",
    "high_cholesterol",
    "hypertension",
    "obesity",
    "pcos_history",
    "ethnicity_high_risk",
    "currently_pregnant",
    "gestational_diabetes_suspected",
    "pregnancy_screening_recommended",
    # ── Type-discrimination evidence (T1D vs T2D vs GDM) ──
    "excessive_hunger",
    "irritability",
    "recurrent_uti_yeast",
    "bed_wetting",
    "fruity_breath",
    "deep_rapid_breathing",
    "dry_mouth",
    "heat_exposure",
    "intense_exercise",
    "new_medication",
    "rapid_onset",
    "ketosis_signs_present",
    "catabolic_pattern",
    "type1_pattern_evidence",
    "type2_pattern_evidence",
    "mixed_type_features",
    "burning_sensation",
    "numbness",
    "itchy_skin",
    "weakness",
    "difficulty_seeing",
    "difficulty_concentrating",
    "yeast_infections",
    # ── New clinical dimensions ──
    "nocturia",
    "unquenchable_thirst",
    "severe_fatigue",
    "dyslipidemia_low_hdl",
    "dyslipidemia_high_tg",
    "cardiovascular_disease",
    "macrosomia_history",
    "physical_inactivity",
    "sugary_diet",
    "sleep_deprivation_apnea",
    "sleep_apnea_history",
    "alcohol_frequent",
    "urine_ketones",
    "high_ada_risk",
    "metabolic_syndrome",
    "asian_bmi_threshold_met",
    "central_obesity",
    "is_overweight",
}

LAB_FACT_ALIASES = {
    "fpg": "fasting_glucose",
    "fasting_blood_glucose": "fasting_glucose",
    "glucose_fasting": "fasting_glucose",
    "fasting_plasma_glucose": "fasting_glucose",
    "hba1c_percent": "hba1c",
    "a1c": "hba1c",
    "two_hour_ogtt_75g": "2h_ogtt_75g",
    "ogtt_2h_75g": "2h_ogtt_75g",
    "fact_2h_ogtt_75g": "2h_ogtt_75g",
    "random_glucose": "random_plasma_glucose",
}

SYMPTOM_FACT_ALIASES = {
    "polyuria": "frequent_urination",
    "polydipsia": "excessive_thirst",
    "unexplained_weight_loss": "weight_loss",
}

MIRRORED_FACTS = {
    "fasting_glucose": ("fasting_plasma_glucose",),
    "fasting_plasma_glucose": ("fasting_glucose",),
    "hba1c": ("a1c",),
    "a1c": ("hba1c",),
    "2h_ogtt_75g": ("two_hour_ogtt_75g",),
    "two_hour_ogtt_75g": ("2h_ogtt_75g",),
    "frequent_urination": ("polyuria",),
    "polyuria": ("frequent_urination",),
    "excessive_thirst": ("polydipsia",),
    "polydipsia": ("excessive_thirst",),
    "no_labs_available": ("no_lab_values_available",),
    "no_lab_values_available": ("no_labs_available",),
    "family_history_diabetes": ("family_history", "risk_family_history_diabetes"),
    "family_history": ("family_history_diabetes", "risk_family_history_diabetes"),
    "physical_activity_low": ("sedentary_lifestyle", "risk_physical_activity_low"),
    "sedentary_lifestyle": ("physical_activity_low", "risk_physical_activity_low"),
}


SetFactCallback = Callable[[str, Any, str], None]


def normalize_fact_name(name: str) -> str:
    if name is None:
        return ""

    normalized = re.sub(r"[^a-zA-Z0-9_]+", "_", str(name).strip().lower())
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    if not normalized:
        return ""
    if normalized[0].isdigit():
        normalized = f"fact_{normalized}"
    return normalized


def normalize_input_facts(payload: dict, set_fact: SetFactCallback) -> None:
    payload = payload if isinstance(payload, dict) else {}

    for raw_key, raw_value in payload.items():
        key = normalize_fact_name(raw_key)
        if key in NUMERIC_FACT_KEYS:
            value = coerce_optional_float(raw_value)
            if value is not None:
                _set_with_aliases(key, value, f"payload.{key}", set_fact)
        elif key in BOOLEAN_FACT_KEYS:
            value = coerce_optional_bool(raw_value)
            if value is not None:
                _set_with_aliases(key, value, f"payload.{key}", set_fact)
        elif key in {"ethnicity", "sex", "sugary_diet_frequency", "pregnancy_stage"}:
            if raw_value is not None:
                text_val = str(raw_value).strip().lower()
                if text_val:
                    _set_with_aliases(key, text_val, f"payload.{key}", set_fact)

    _load_symptom_facts(payload.get("symptoms"), set_fact)
    _load_lab_facts(payload.get("labs") or payload.get("lab_results"), set_fact)
    _load_risk_factor_facts(payload.get("risk_factors"), set_fact)


def derive_facts(facts: dict, set_fact: SetFactCallback) -> None:
    _derive_unified_glucose(facts, set_fact)
    _derive_bmi_and_obesity(facts, set_fact)
    _derive_ethnicity_and_central_obesity(facts, set_fact)
    _derive_obesity_from_risk_factor(facts, set_fact)
    _derive_cardiovascular_and_blood_pressure(facts, set_fact)
    _derive_quantified_symptoms(facts, set_fact)
    _derive_classic_hyperglycemia_symptoms(facts, set_fact)
    _derive_hyperglycemia_presence(facts, set_fact)
    _derive_hypoglycemia_presence(facts, set_fact)
    _derive_lifestyle_drivers(facts, set_fact)
    _derive_type2_risk_pattern(facts, set_fact)
    _derive_ada_risk_score(facts, set_fact)
    _derive_metabolic_syndrome(facts, set_fact)
    _derive_lab_availability(facts, set_fact)
    _derive_neuropathy_cluster(facts, set_fact)
    _derive_compound_risk_patterns(facts, set_fact)
    _derive_type_discrimination_patterns(facts, set_fact)


def coerce_optional_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    if isinstance(value, bool):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def coerce_optional_bool(value: Any) -> bool | None:
    if value in (None, ""):
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"1", "true", "yes", "on", "y"}:
            return True
        if lowered in {"0", "false", "no", "off", "n"}:
            return False
        return None
    return bool(value)


def coerce_generic_value(value: Any):
    if value in (None, ""):
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        maybe_bool = coerce_optional_bool(value)
        if maybe_bool is not None:
            return maybe_bool
        maybe_float = coerce_optional_float(value)
        if maybe_float is not None:
            return maybe_float
        text = value.strip()
        return text if text else None
    return value


def _load_symptom_facts(symptoms, set_fact: SetFactCallback) -> None:
    if isinstance(symptoms, dict):
        for raw_key, raw_value in symptoms.items():
            fact_name = normalize_fact_name(raw_key)
            if not fact_name:
                continue
            present = coerce_optional_bool(raw_value)
            if present is None:
                continue
            _set_with_aliases(fact_name, present, f"symptoms.{fact_name}", set_fact)
            set_fact(f"symptom_{fact_name}", present, f"symptoms.{fact_name}")

    if isinstance(symptoms, list):
        for index, item in enumerate(symptoms):
            source = f"symptoms[{index}]"
            if isinstance(item, str):
                symptom_name = normalize_fact_name(item)
                if symptom_name:
                    _set_with_aliases(symptom_name, True, source, set_fact)
                    set_fact(f"symptom_{symptom_name}", True, source)
                continue

            if not isinstance(item, dict):
                continue

            code = item.get("symptom_code") or item.get("code") or item.get("symptom_name") or item.get("name")
            symptom_name = normalize_fact_name(code)
            if not symptom_name:
                continue

            present = coerce_optional_bool(item.get("present", True))
            if present is None:
                continue

            _set_with_aliases(symptom_name, present, source, set_fact)
            set_fact(f"symptom_{symptom_name}", present, source)

            severity = coerce_optional_float(item.get("severity"))
            if severity is not None:
                set_fact(f"symptom_severity_{symptom_name}", severity, source)


def _load_lab_facts(labs, set_fact: SetFactCallback) -> None:
    if isinstance(labs, dict):
        for raw_key, raw_value in labs.items():
            fact_name = normalize_fact_name(raw_key)
            if not fact_name:
                continue
            value = coerce_optional_float(raw_value)
            if value is None:
                continue
            _set_with_aliases(fact_name, value, f"labs.{fact_name}", set_fact)

    if isinstance(labs, list):
        for index, item in enumerate(labs):
            source = f"lab_results[{index}]"
            if not isinstance(item, dict):
                continue

            test_name = item.get("test_name") or item.get("name") or item.get("code")
            test_value = item.get("test_value") if "test_value" in item else item.get("value")
            fact_name = normalize_fact_name(test_name)
            value = coerce_optional_float(test_value)

            if not fact_name or value is None:
                continue

            _set_with_aliases(fact_name, value, source, set_fact)


def _load_risk_factor_facts(risk_factors, set_fact: SetFactCallback) -> None:
    if isinstance(risk_factors, dict):
        for raw_key, raw_value in risk_factors.items():
            key = normalize_fact_name(raw_key)
            if not key:
                continue
            value = coerce_generic_value(raw_value)
            if value is None:
                continue
            _set_with_aliases(key, value, f"risk_factors.{key}", set_fact)
            set_fact(f"risk_{key}", value, f"risk_factors.{key}")

    if isinstance(risk_factors, list):
        for index, item in enumerate(risk_factors):
            source = f"risk_factors[{index}]"
            if isinstance(item, str):
                key = normalize_fact_name(item)
                if key:
                    _set_with_aliases(key, True, source, set_fact)
                    set_fact(f"risk_{key}", True, source)
                continue

            if not isinstance(item, dict):
                continue

            key = item.get("code") or item.get("name") or item.get("risk_factor")
            normalized_key = normalize_fact_name(key)
            if not normalized_key:
                continue

            value = item.get("value") if "value" in item else item.get("present", True)
            coerced = coerce_generic_value(value)
            if coerced is None:
                continue
            _set_with_aliases(normalized_key, coerced, source, set_fact)
            set_fact(f"risk_{normalized_key}", coerced, source)


def _derive_bmi_and_obesity(facts: dict, set_fact: SetFactCallback) -> None:
    bmi = _as_float(facts.get("bmi"))
    if bmi is None:
        weight_kg = _as_float(facts.get("weight_kg"))
        if weight_kg is None:
            weight_raw = _as_float(facts.get("weight"))
            if weight_raw is not None:
                weight_kg = weight_raw

        height_m = _as_float(facts.get("height_m"))
        if height_m is None:
            height_cm = _as_float(facts.get("height_cm"))
            if height_cm is None:
                height_raw = _as_float(facts.get("height"))
                if height_raw is not None:
                    if height_raw > 3:
                        height_cm = height_raw
                    elif height_raw >= 0.8:
                        height_m = height_raw
            if height_cm is not None and height_cm > 0:
                height_m = height_cm / 100.0

        if weight_kg is not None and height_m is not None and height_m > 0:
            bmi = round(weight_kg / (height_m * height_m), 2)
            set_fact("bmi", bmi, "derived.bmi_from_weight_height")

    if bmi is not None:
        set_fact("is_obese", bmi >= 30, "derived.is_obese")


def _derive_classic_hyperglycemia_symptoms(facts: dict, set_fact: SetFactCallback) -> None:
    polyuria = _as_bool(facts.get("polyuria")) or _as_bool(facts.get("frequent_urination"))
    polydipsia = _as_bool(facts.get("polydipsia")) or _as_bool(facts.get("excessive_thirst"))
    weight_loss = _as_bool(facts.get("weight_loss")) or _as_bool(facts.get("unexplained_weight_loss"))
    hunger = _as_bool(facts.get("excessive_hunger")) or _as_bool(facts.get("polyphagia"))

    cardinal_count = sum(1 for present in [polyuria, polydipsia, weight_loss, hunger] if present)

    if cardinal_count >= 2:
        set_fact("classic_hyperglycemia_symptoms", True, "derived.classic_hyperglycemia_symptoms")
    if polyuria and polydipsia and (weight_loss or hunger):
        set_fact("classic_symptom_cluster", True, "derived.classic_symptom_cluster")
        set_fact("symptom_strength", "high", "derived.symptom_strength")


def _derive_hyperglycemia_presence(facts: dict, set_fact: SetFactCallback) -> None:
    fasting = _first_float(facts, "fasting_plasma_glucose", "fasting_glucose")
    random_glucose = _first_float(facts, "random_plasma_glucose")
    ogtt = _first_float(facts, "2h_ogtt_75g", "two_hour_ogtt_75g")
    a1c = _first_float(facts, "hba1c", "a1c")

    objective = False
    if fasting is not None and fasting >= 126:
        objective = True
    if random_glucose is not None and random_glucose >= 200:
        objective = True
    if ogtt is not None and ogtt >= 200:
        objective = True
    if a1c is not None and a1c >= 6.5:
        objective = True

    if objective:
        set_fact("hyperglycemia_present", True, "derived.hyperglycemia_present")
        set_fact("objective_hyperglycemia_evidence", True, "derived.objective_hyperglycemia_evidence")


def _derive_hypoglycemia_presence(facts: dict, set_fact: SetFactCallback) -> None:
    glucose = _first_float(facts, "blood_glucose")
    if glucose is None:
        glucose = _first_float(facts, "random_plasma_glucose")
    if glucose is None:
        glucose = _first_float(facts, "fasting_plasma_glucose", "fasting_glucose")

    if glucose is not None and glucose < 70:
        set_fact("hypoglycemia_present", True, "derived.hypoglycemia_present")
        set_fact("hypoglycemia", True, "derived.hypoglycemia")


def _derive_unified_glucose(facts: dict, set_fact: SetFactCallback) -> None:
    # Derive generic 'blood_glucose' for triage thresholds (e.g. hypo <70)
    # ONLY from random_plasma_glucose (non-fasting), NOT from fasting values.
    # Fasting and random tests are clinically distinct — never cross-contaminate.
    if "blood_glucose" not in facts:
        glucose = _first_float(facts, "random_plasma_glucose")
        if glucose is not None:
            set_fact("blood_glucose", glucose, "derived.unified_glucose")

    # DO NOT derive random_plasma_glucose from fasting values.
    # Random PG >= 200 + symptoms is a distinct ADA criterion that requires
    # actual random blood draw, not a fasting test result.

def _derive_lab_availability(facts: dict, set_fact: SetFactCallback) -> None:
    has_labs = False
    for k in ["fasting_glucose", "fasting_plasma_glucose", "hba1c", "a1c", "2h_ogtt_75g", "random_plasma_glucose", "blood_glucose"]:
        if _as_float(facts.get(k)) is not None:
            has_labs = True
            break
    if not has_labs:
        set_fact("no_lab_values_available", True, "derived.no_lab_values_available")
        set_fact("only_symptoms_available", True, "derived.only_symptoms_available")


def _derive_type2_risk_pattern(facts: dict, set_fact: SetFactCallback) -> None:
    bmi = _first_float(facts, "bmi")
    family_history = _first_true(
        facts,
        "family_history_diabetes",
        "family_history",
        "risk_family_history_diabetes",
        "risk_family_history",
    )
    low_activity = _first_true(facts, "physical_activity_low", "risk_physical_activity_low")
    prediabetes = _first_true(facts, "prediabetes_possible")
    existing_type2_risk = _first_true(facts, "type2_risk_increased")

    if bmi is not None and bmi >= 25 and (family_history or low_activity or prediabetes or existing_type2_risk):
        set_fact("high_type2_risk_pattern", True, "derived.high_type2_risk_pattern")
        set_fact("type2_risk_increased", True, "derived.type2_risk_increased")


def _derive_obesity_from_risk_factor(facts: dict, set_fact: SetFactCallback) -> None:
    """Map the user-reported obesity risk factor to is_obese if BMI wasn't provided."""
    if facts.get("is_obese") is True:
        return  # already derived from BMI
    obesity_reported = _first_true(facts, "obesity", "risk_obesity")
    if obesity_reported:
        set_fact("is_obese", True, "derived.is_obese_from_risk_factor")


def _derive_neuropathy_cluster(facts: dict, set_fact: SetFactCallback) -> None:
    """Flag a hidden-diabetes cluster: tingling + frequent infections + fatigue."""
    tingling = _first_true(facts, "tingling_hands_feet")
    infections = _first_true(facts, "frequent_infections")
    fatigue = _first_true(facts, "fatigue")
    if tingling and infections:
        set_fact("neuropathy_infection_cluster", True, "derived.neuropathy_infection_cluster")
    if tingling and fatigue:
        set_fact("neuropathy_fatigue_cluster", True, "derived.neuropathy_fatigue_cluster")


def _derive_compound_risk_patterns(facts: dict, set_fact: SetFactCallback) -> None:
    """Flag high-risk compound patterns that increase diabetes probability."""
    smoking = _first_true(facts, "smoking", "risk_smoking")
    obesity = _first_true(facts, "is_obese", "obesity", "risk_obesity")
    family_hist = _first_true(
        facts, "family_history_diabetes", "family_history",
        "risk_family_history_diabetes", "risk_family_history",
    )
    gestational = _first_true(facts, "gestational_history", "risk_gestational_history")
    pcos = _first_true(facts, "pcos_history", "risk_pcos_history")
    prediabetes = _first_true(facts, "prediabetes_possible")

    if smoking and obesity and family_hist:
        set_fact("compound_risk_smoking_obesity_family", True, "derived.compound_risk")
    if gestational and obesity:
        set_fact("gestational_obesity_high_risk", True, "derived.gestational_obesity_high_risk")
    if pcos and obesity:
        set_fact("pcos_obesity_risk", True, "derived.pcos_obesity_risk")
    if pcos and prediabetes:
        set_fact("pcos_prediabetes_risk", True, "derived.pcos_prediabetes_risk")


def _derive_type_discrimination_patterns(facts: dict, set_fact: SetFactCallback) -> None:
    """Pre-compute cross-symptom patterns that discriminate T1D vs T2D.

    These give the classification rules a single stable fact to key off,
    independent of how the individual symptoms were collected.
    """
    fruity_breath = _first_true(facts, "fruity_breath")
    kussmaul = _first_true(facts, "deep_rapid_breathing")
    if fruity_breath or kussmaul:
        set_fact("ketosis_signs_present", True, "derived.ketosis_signs_present")

    weight_loss = _first_true(facts, "weight_loss", "unexplained_weight_loss")
    hunger = _first_true(facts, "excessive_hunger")
    if weight_loss and hunger:
        # Eating a lot while losing weight = catabolic state (insulin deficiency)
        set_fact("catabolic_pattern", True, "derived.catabolic_pattern")

    # Single gate for the type-pattern rules: any real diabetes evidence —
    # the classic 3 Ps, a hidden-diabetes symptom cluster, or lab hyperglycemia.
    # Without it, acanthosis/BMI/age alone must never assign a type.
    if (
        _first_true(facts, "classic_hyperglycemia_symptoms")
        or _first_true(facts, "neuropathy_infection_cluster", "neuropathy_fatigue_cluster")
        or _first_true(facts, "hyperglycemia_present", "unequivocal_hyperglycemia_or_crisis")
    ):
        set_fact("diabetes_evidence_base", True, "derived.diabetes_evidence_base")


def _derive_ethnicity_and_central_obesity(facts: dict, set_fact: SetFactCallback) -> None:
    ethnicity = str(facts.get("ethnicity") or "").strip().lower()
    if ethnicity in {"asian", "south_asian", "east_asian", "southeast_asian", "black", "african_american", "hispanic", "latino", "indigenous", "pacific_islander"}:
        set_fact("ethnicity_high_risk", True, "derived.ethnicity_high_risk")

    bmi = _first_float(facts, "bmi")
    is_asian = ethnicity in {"asian", "south_asian", "east_asian", "southeast_asian"} or ("asian" in ethnicity and "caucasian" not in ethnicity)
    if is_asian and bmi is not None:
        if bmi >= 23.0:
            set_fact("asian_bmi_threshold_met", True, "derived.asian_bmi_threshold_met")
            set_fact("is_overweight", True, "derived.asian_is_overweight")
            set_fact("overweight", True, "derived.asian_overweight")
        if bmi >= 27.5:
            set_fact("is_obese", True, "derived.asian_is_obese")
            set_fact("obesity", True, "derived.asian_obesity")

    waist = _first_float(facts, "waist_circumference")
    if waist is not None:
        sex = str(facts.get("sex") or "").strip().lower()
        if sex == "male":
            cutoff = 90.0 if is_asian else 102.0
        else:
            cutoff = 80.0 if is_asian else 88.0
        if waist >= cutoff:
            set_fact("central_obesity", True, "derived.central_obesity")
            set_fact("obesity", True, "derived.central_obesity_flag")


def _derive_cardiovascular_and_blood_pressure(facts: dict, set_fact: SetFactCallback) -> None:
    systolic = _first_float(facts, "systolic_bp")
    diastolic = _first_float(facts, "diastolic_bp")
    if (systolic is not None and systolic >= 130) or (diastolic is not None and diastolic >= 80):
        set_fact("hypertension", True, "derived.hypertension_from_bp")

    if _first_true(facts, "cardiovascular_disease", "heart_attack", "stroke"):
        set_fact("cardiovascular_disease", True, "derived.cardiovascular_disease")


def _derive_quantified_symptoms(facts: dict, set_fact: SetFactCallback) -> None:
    nocturia_count = _first_float(facts, "nocturia_count")
    if nocturia_count is not None and nocturia_count >= 2:
        set_fact("nocturia", True, "derived.nocturia_count")
        set_fact("frequent_urination", True, "derived.frequent_urination_from_nocturia")
        set_fact("polyuria", True, "derived.polyuria_from_nocturia")

    water_liters = _first_float(facts, "water_intake_liters")
    if water_liters is not None and water_liters >= 3.0:
        set_fact("unquenchable_thirst", True, "derived.water_intake_liters")
        set_fact("excessive_thirst", True, "derived.excessive_thirst_from_liters")
        set_fact("polydipsia", True, "derived.polydipsia_from_liters")

    fatigue_scale = _first_float(facts, "fatigue_severity_scale")
    if fatigue_scale is not None and fatigue_scale >= 7.0:
        set_fact("severe_fatigue", True, "derived.fatigue_severity_scale")
        set_fact("fatigue", True, "derived.fatigue_from_scale")

    loss_kg = _first_float(facts, "unexplained_weight_loss_kg")
    if loss_kg is not None and loss_kg >= 3.0:
        set_fact("unexplained_weight_loss", True, "derived.unexplained_weight_loss_kg")
        set_fact("weight_loss", True, "derived.weight_loss_from_kg")


def _derive_lifestyle_drivers(facts: dict, set_fact: SetFactCallback) -> None:
    activity_mins = _first_float(facts, "physical_activity_minutes_week")
    if activity_mins is not None and activity_mins < 150:
        set_fact("physical_inactivity", True, "derived.physical_activity_minutes_week")
        set_fact("sedentary_lifestyle", True, "derived.sedentary_from_minutes")
        set_fact("physical_activity_low", True, "derived.low_activity_from_minutes")

    sleep_hours = _first_float(facts, "sleep_hours_night")
    has_apnea = _as_bool(facts.get("sleep_apnea_history"))
    if (sleep_hours is not None and sleep_hours < 6.0) or has_apnea:
        set_fact("sleep_deprivation_apnea", True, "derived.sleep_deprivation_apnea")

    sugary_freq = str(facts.get("sugary_diet_frequency") or "").strip().lower()
    if sugary_freq in {"daily", "frequently", "often", "3_5_times"} or _as_bool(facts.get("sugary_diet")):
        set_fact("sugary_diet", True, "derived.sugary_diet")

    alcohol_drinks = _first_float(facts, "alcohol_drinks_week")
    if alcohol_drinks is not None:
        sex = str(facts.get("sex") or "").strip().lower()
        threshold = 14.0 if sex == "male" else 7.0
        if alcohol_drinks > threshold:
            set_fact("alcohol_frequent", True, "derived.alcohol_drinks_week")


def _derive_metabolic_syndrome(facts: dict, set_fact: SetFactCallback) -> None:
    crit_count = 0
    if _first_true(facts, "central_obesity", "obesity", "is_obese"):
        crit_count += 1
    if _first_true(facts, "hypertension"):
        crit_count += 1
    if _first_true(facts, "dyslipidemia_high_tg"):
        crit_count += 1
    if _first_true(facts, "dyslipidemia_low_hdl"):
        crit_count += 1
    fasting = _first_float(facts, "fasting_glucose", "fasting_plasma_glucose")
    if (fasting is not None and fasting >= 100) or _first_true(facts, "hyperglycemia_present"):
        crit_count += 1

    if crit_count >= 3:
        set_fact("metabolic_syndrome", True, "derived.metabolic_syndrome")
        set_fact("type2_risk_increased", True, "derived.type2_risk_from_metabolic_syndrome")


def _derive_ada_risk_score(facts: dict, set_fact: SetFactCallback) -> None:
    score = 0
    age = _first_float(facts, "age")
    if age is not None:
        if age >= 60:
            score += 3
        elif age >= 50:
            score += 2
        elif age >= 40:
            score += 1

    sex = str(facts.get("sex") or "").strip().lower()
    if sex == "male":
        score += 1

    if sex == "female" and _first_true(facts, "gestational_history", "macrosomia_history"):
        score += 1

    if _first_true(facts, "family_history", "family_history_diabetes", "risk_family_history_diabetes"):
        score += 1

    if _first_true(facts, "hypertension"):
        score += 1

    if _first_true(facts, "physical_inactivity", "sedentary_lifestyle", "physical_activity_low"):
        score += 1

    bmi = _first_float(facts, "bmi")
    ethnicity = str(facts.get("ethnicity") or "").strip().lower()
    is_asian = ethnicity in {"asian", "south_asian", "east_asian", "southeast_asian"} or ("asian" in ethnicity and "caucasian" not in ethnicity)
    if bmi is not None:
        if is_asian:
            if bmi >= 32.5:
                score += 3
            elif bmi >= 27.5:
                score += 2
            elif bmi >= 23.0:
                score += 1
        else:
            if bmi >= 40.0:
                score += 3
            elif bmi >= 30.0:
                score += 2
            elif bmi >= 25.0:
                score += 1
    elif _first_true(facts, "obesity", "is_obese", "central_obesity"):
        score += 2

    set_fact("ada_risk_score", float(score), "derived.ada_risk_score")
    if score >= 5:
        set_fact("high_ada_risk", True, "derived.high_ada_risk")
        set_fact("type2_risk_increased", True, "derived.type2_risk_from_ada_score")


def _set_with_aliases(name: str, value: Any, source: str, set_fact: SetFactCallback) -> None:
    normalized = normalize_fact_name(name)
    if not normalized:
        return
    set_fact(normalized, value, source)

    if normalized in LAB_FACT_ALIASES:
        set_fact(LAB_FACT_ALIASES[normalized], value, f"{source}.alias")
    if normalized in SYMPTOM_FACT_ALIASES:
        set_fact(SYMPTOM_FACT_ALIASES[normalized], value, f"{source}.alias")

    for alias in MIRRORED_FACTS.get(normalized, ()):
        set_fact(alias, value, f"{source}.mirror")


def _as_float(value: Any) -> float | None:
    return coerce_optional_float(value)


def _as_bool(value: Any) -> bool:
    coerced = coerce_optional_bool(value)
    return bool(coerced)


def _first_float(facts: dict, *keys: str) -> float | None:
    for key in keys:
        value = _as_float(facts.get(key))
        if value is not None:
            return value
    return None


def _first_true(facts: dict, *keys: str) -> bool:
    for key in keys:
        if _as_bool(facts.get(key)):
            return True
    return False
