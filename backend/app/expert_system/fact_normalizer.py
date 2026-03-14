from __future__ import annotations

import re
from typing import Any, Callable


NUMERIC_FACT_KEYS = {
    "fasting_glucose",
    "fasting_plasma_glucose",
    "hba1c",
    "a1c",
    "2h_ogtt_75g",
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
    "prediabetes_possible",
    "type2_risk_increased",
    "unequivocal_hyperglycemia_or_crisis",
    "crisis",
    "only_symptoms_available",
    "no_lab_values_available",
    "no_labs_available",
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

    _load_symptom_facts(payload.get("symptoms"), set_fact)
    _load_lab_facts(payload.get("labs") or payload.get("lab_results"), set_fact)
    _load_risk_factor_facts(payload.get("risk_factors"), set_fact)


def derive_facts(facts: dict, set_fact: SetFactCallback) -> None:
    _derive_bmi_and_obesity(facts, set_fact)
    _derive_classic_hyperglycemia_symptoms(facts, set_fact)
    _derive_hyperglycemia_presence(facts, set_fact)
    _derive_hypoglycemia_presence(facts, set_fact)
    _derive_type2_risk_pattern(facts, set_fact)


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

    if polyuria and polydipsia:
        set_fact("classic_hyperglycemia_symptoms", True, "derived.classic_hyperglycemia_symptoms")
    if polyuria and polydipsia and weight_loss:
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
