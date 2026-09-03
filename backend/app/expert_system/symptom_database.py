"""
Comprehensive Diabetes Symptom Database

Based on Mayo Clinic, CDC, ADA, and WHO diabetes guidelines.
All symptoms are categorized by type and severity.
"""

# Classic "3 Ps" - Cardinal symptoms of diabetes
CARDINAL_SYMPTOMS = {
    "frequent_urination": {
        "name": "Frequent urination (Polyuria)",
        "question": "Do you need to urinate more often than usual, especially at night?",
        "category": "cardinal",
        "weight": 0.30,  # High diagnostic weight
        "type_indication": "both",  # Both Type 1 and Type 2
    },
    "excessive_thirst": {
        "name": "Excessive thirst (Polydipsia)",
        "question": "Do you feel unusually thirsty, even after drinking water?",
        "category": "cardinal",
        "weight": 0.30,
        "type_indication": "both",
    },
    "excessive_hunger": {
        "name": "Excessive hunger (Polyphagia)",
        "question": "Do you feel hungry all the time, even after eating?",
        "category": "cardinal",
        "weight": 0.25,
        "type_indication": "both",
    },
}

# Weight and energy symptoms
METABOLIC_SYMPTOMS = {
    "unexplained_weight_loss": {
        "name": "Unexplained weight loss",
        "question": "Have you lost weight without trying or without changing your diet?",
        "category": "metabolic",
        "weight": 0.25,
        "type_indication": "type1",  # More common in Type 1
    },
    "extreme_fatigue": {
        "name": "Extreme fatigue",
        "question": "Do you feel unusually tired or exhausted, even after rest?",
        "category": "metabolic",
        "weight": 0.15,
        "type_indication": "both",
    },
    "weakness": {
        "name": "General weakness",
        "question": "Do you feel weak or lack energy to do daily activities?",
        "category": "metabolic",
        "weight": 0.12,
        "type_indication": "both",
    },
    "increased_appetite": {
        "name": "Increased appetite despite eating",
        "question": "Do you eat more than usual but still feel hungry?",
        "category": "metabolic",
        "weight": 0.15,
        "type_indication": "both",
    },
}

# Vision problems
VISION_SYMPTOMS = {
    "blurred_vision": {
        "name": "Blurred or blurry vision",
        "question": "Is your vision blurry or have you noticed changes in your eyesight?",
        "category": "vision",
        "weight": 0.18,
        "type_indication": "both",
    },
    "difficulty_seeing": {
        "name": "Difficulty seeing at night",
        "question": "Do you have trouble seeing clearly, especially at night?",
        "category": "vision",
        "weight": 0.10,
        "type_indication": "both",
    },
}

# Skin and healing symptoms
SKIN_SYMPTOMS = {
    "slow_healing_wounds": {
        "name": "Slow healing cuts/bruises",
        "question": "Do cuts, bruises, or sores take longer than usual to heal?",
        "category": "skin",
        "weight": 0.18,
        "type_indication": "type2",
    },
    "frequent_infections": {
        "name": "Frequent infections",
        "question": "Do you get frequent infections (skin, gum, bladder, or yeast infections)?",
        "category": "skin",
        "weight": 0.15,
        "type_indication": "type2",
    },
    "itchy_skin": {
        "name": "Itchy or dry skin",
        "question": "Is your skin unusually dry, itchy, or irritated?",
        "category": "skin",
        "weight": 0.10,
        "type_indication": "both",
    },
    "dark_skin_patches": {
        "name": "Dark skin patches (Acanthosis nigricans)",
        "question": "Do you have dark, velvety patches of skin, especially on your neck or armpits?",
        "category": "skin",
        "weight": 0.20,
        "type_indication": "type2",
    },
}

# Neurological symptoms
NERVE_SYMPTOMS = {
    "tingling_hands_feet": {
        "name": "Tingling in hands/feet",
        "question": "Do you feel tingling, numbness, or pins-and-needles in your hands or feet?",
        "category": "neuropathy",
        "weight": 0.15,
        "type_indication": "type2",
    },
    "burning_sensation": {
        "name": "Burning sensation in extremities",
        "question": "Do you feel burning sensations in your hands, feet, or legs?",
        "category": "neuropathy",
        "weight": 0.12,
        "type_indication": "type2",
    },
    "numbness": {
        "name": "Numbness in extremities",
        "question": "Have you noticed numbness or loss of feeling in your hands or feet?",
        "category": "neuropathy",
        "weight": 0.12,
        "type_indication": "type2",
    },
}

# Sexual and reproductive symptoms
REPRODUCTIVE_SYMPTOMS = {
    "erectile_dysfunction": {
        "name": "Erectile dysfunction",
        "question": "Have you experienced erectile dysfunction or sexual problems? (For males)",
        "category": "reproductive",
        "weight": 0.10,
        "type_indication": "type2",
    },
    "yeast_infections": {
        "name": "Recurrent yeast infections",
        "question": "Do you have frequent vaginal yeast infections? (For females)",
        "category": "reproductive",
        "weight": 0.12,
        "type_indication": "type2",
    },
}

# Mood and cognitive symptoms
MENTAL_SYMPTOMS = {
    "irritability": {
        "name": "Irritability or mood changes",
        "question": "Have you been more irritable or experienced mood swings?",
        "category": "mental",
        "weight": 0.08,
        "type_indication": "both",
    },
    "difficulty_concentrating": {
        "name": "Difficulty concentrating",
        "question": "Do you have trouble concentrating or thinking clearly?",
        "category": "mental",
        "weight": 0.08,
        "type_indication": "both",
    },
}

# Emergency/DKA symptoms (Type 1 specific)
EMERGENCY_SYMPTOMS = {
    "nausea": {
        "name": "Nausea",
        "question": "Do you feel nauseous or sick to your stomach?",
        "category": "emergency",
        "weight": 0.10,
        "type_indication": "type1",
    },
    "vomiting": {
        "name": "Vomiting",
        "question": "Have you been vomiting?",
        "category": "emergency",
        "weight": 0.15,
        "type_indication": "type1",
    },
    "abdominal_pain": {
        "name": "Abdominal pain",
        "question": "Do you have stomach pain or cramping?",
        "category": "emergency",
        "weight": 0.12,
        "type_indication": "type1",
    },
    "fruity_breath": {
        "name": "Fruity-smelling breath",
        "question": "Have others noticed a fruity or sweet smell to your breath?",
        "category": "emergency",
        "weight": 0.18,
        "type_indication": "type1",
    },
    "rapid_breathing": {
        "name": "Rapid or deep breathing",
        "question": "Are you breathing faster or deeper than normal?",
        "category": "emergency",
        "weight": 0.15,
        "type_indication": "type1",
    },
    "confusion": {
        "name": "Confusion or difficulty staying awake",
        "question": "Do you feel confused or have trouble staying awake?",
        "category": "emergency",
        "weight": 0.20,
        "type_indication": "type1",
    },
}

# Child-specific symptoms (for pediatric screening)
PEDIATRIC_SYMPTOMS = {
    "bed_wetting": {
        "name": "Bed-wetting (in previously dry children)",
        "question": "Has bed-wetting started after being dry at night? (For children)",
        "category": "pediatric",
        "weight": 0.18,
        "type_indication": "type1",
    },
    "diaper_rash": {
        "name": "Persistent diaper rash",
        "question": "Does the child have a persistent diaper rash that won't heal? (For infants)",
        "category": "pediatric",
        "weight": 0.10,
        "type_indication": "type1",
    },
}

# Compile all symptoms
ALL_SYMPTOMS = {
    **CARDINAL_SYMPTOMS,
    **METABOLIC_SYMPTOMS,
    **VISION_SYMPTOMS,
    **SKIN_SYMPTOMS,
    **NERVE_SYMPTOMS,
    **REPRODUCTIVE_SYMPTOMS,
    **MENTAL_SYMPTOMS,
    **EMERGENCY_SYMPTOMS,
    **PEDIATRIC_SYMPTOMS,
}


SYMPTOM_ALIASES = {
    "weight_loss": "unexplained_weight_loss",
    "fatigue": "extreme_fatigue",
    "acanthosis_nigricans": "dark_skin_patches",
    "slow_healing": "slow_healing_wounds",
    "polyuria": "frequent_urination",
    "polydipsia": "excessive_thirst",
    "polyphagia": "excessive_hunger",
    "general_weakness": "weakness",
    "dry_skin": "itchy_skin",
    "tingling": "tingling_hands_feet",
}


# ── DB-driven overlay (doctor-managed facts) ──────────────────────────────
# The assessment services overlay rows from the doctor-managed fact catalog
# (app.models.Fact) over this static catalog before running inference, so
# edited weights / type indications / cardinal-emergency flags immediately
# change the reasoning. Without an overlay (tests, rule sandbox, DB down) the
# static knowledge above is used unchanged.
_FACT_OVERLAY = {}
_OVERLAY_ALIASES = {}


def _canonical_fact_key(code):
    code = str(code or "").strip()
    if not code:
        return None
    if code in _FACT_OVERLAY or code in ALL_SYMPTOMS:
        return code
    canonical = SYMPTOM_ALIASES.get(code)
    if canonical and (canonical in _FACT_OVERLAY or canonical in ALL_SYMPTOMS):
        return canonical
    return _OVERLAY_ALIASES.get(code)


def apply_fact_overlay(fact_map) -> None:
    """Merge doctor-managed fact rows (FactRepository.get_active_fact_map())
    over the static catalog. Row fields: weight, type_indication, question,
    label, category, is_cardinal, is_emergency, aliases."""
    global _FACT_OVERLAY, _OVERLAY_ALIASES
    overlay = {}
    aliases = {}
    for key, row in (fact_map or {}).items():
        canonical = str(key or "").strip().lower()
        if not canonical:
            continue
        static = ALL_SYMPTOMS.get(canonical) or ALL_SYMPTOMS.get(SYMPTOM_ALIASES.get(canonical, ""))
        entry = dict(static) if static else {
            "name": str(row.get("label") or canonical.replace("_", " ")).title(),
            "question": "",
            "category": "other",
            "weight": 0.05,
            "type_indication": "none",
        }
        if row.get("label"):
            entry["name"] = row["label"]
        if row.get("question"):
            entry["question"] = row["question"]
        if row.get("category"):
            entry["category"] = row["category"]
        if row.get("weight") is not None:
            try:
                entry["weight"] = max(0.0, min(1.0, float(row["weight"])))
            except (TypeError, ValueError):
                pass
        if row.get("type_indication"):
            entry["type_indication"] = row["type_indication"]
        entry["is_cardinal"] = bool(row.get("is_cardinal")) or canonical in CARDINAL_SYMPTOMS
        entry["is_emergency"] = bool(row.get("is_emergency")) or canonical in EMERGENCY_SYMPTOMS
        overlay[canonical] = entry
        for alias in row.get("aliases") or []:
            alias = str(alias).strip().lower()
            if alias and alias != canonical:
                aliases[alias] = canonical
    _FACT_OVERLAY = overlay
    _OVERLAY_ALIASES = aliases


def clear_fact_overlay() -> None:
    global _FACT_OVERLAY, _OVERLAY_ALIASES
    _FACT_OVERLAY = {}
    _OVERLAY_ALIASES = {}


def get_symptom_info(symptom_code: str) -> dict | None:
    """Get detailed information about a symptom (overlay first, then static)."""
    if not symptom_code:
        return None
    canonical = _canonical_fact_key(symptom_code)
    if canonical and canonical in _FACT_OVERLAY:
        return _FACT_OVERLAY[canonical]
    fallback = SYMPTOM_ALIASES.get(symptom_code, symptom_code)
    return ALL_SYMPTOMS.get(symptom_code) or ALL_SYMPTOMS.get(fallback)


def get_symptoms_by_category(category: str) -> dict:
    """Get all symptoms in a category."""
    return {
        code: info
        for code, info in ALL_SYMPTOMS.items()
        if info["category"] == category
    }


def get_cardinal_symptoms() -> list[str]:
    """The classic 3 Ps plus any doctor-flagged cardinal facts."""
    keys = set(CARDINAL_SYMPTOMS.keys())
    keys.update(k for k, v in _FACT_OVERLAY.items() if v.get("is_cardinal"))
    return list(keys)


def get_emergency_symptoms() -> list[str]:
    """Emergency/DKA symptoms plus any doctor-flagged emergency facts."""
    keys = set(EMERGENCY_SYMPTOMS.keys())
    keys.update(k for k, v in _FACT_OVERLAY.items() if v.get("is_emergency"))
    return list(keys)


def calculate_symptom_score(present_symptoms: list[str]) -> float:
    """Calculate total symptom score based on weights."""
    total = 0.0
    for symptom in present_symptoms:
        info = get_symptom_info(symptom)
        if info:
            total += info["weight"]
    return min(total, 1.0)  # Cap at 1.0


def get_type_indication(present_symptoms: list[str]) -> dict:
    """Analyze which diabetes type the symptoms suggest."""
    type1_score = 0.0
    type2_score = 0.0
    
    for symptom in present_symptoms:
        info = get_symptom_info(symptom)
        if not info:
            continue
        
        indication = info["type_indication"]
        weight = info["weight"]
        
        if indication == "type1":
            type1_score += weight
        elif indication == "type2":
            type2_score += weight
        elif indication == "both":
            type1_score += weight * 0.5
            type2_score += weight * 0.5
    
    return {
        "type1_score": round(type1_score, 3),
        "type2_score": round(type2_score, 3),
        "likely_type": "Type 1" if type1_score > type2_score else "Type 2",
    }
