"""
Adaptive assessment engine — the backend-owned interview pipeline:

    Assessment Session -> Evidence -> Rule Engine -> Pattern Analysis
        -> Select Next Question -> Final Assessment

The backend owns the loop. It derives evidence from the answers collected
so far, analyses which diabetes-like patterns the evidence supports, and
returns ONLY a question KEY for the next most useful question (or None
when the interview is complete).

Question definitions, text and rendering stay in the frontend: it maps
each returned key onto its hardcoded question. This module never emits
human-readable strings and never diagnoses Type 1 / Type 2 — patterns are
expressed as "*-like" evidence profiles to guide screening and clinician
review, with "insufficient evidence" as a first-class outcome.
"""

from __future__ import annotations

# ── Fact groups (mirror the frontend interview field groups) ──
CORE_SYMPTOMS = ["frequent_urination", "excessive_thirst", "excessive_hunger", "weight_loss"]
OTHER_SYMPTOMS = [
    "fatigue", "blurred_vision", "slow_healing", "nausea", "tingling_hands_feet",
    "frequent_infections", "acanthosis_nigricans", "irritability",
    "recurrent_uti_yeast", "bed_wetting",
]
SAFETY_FIELDS = [
    "sweating", "shaking", "dizziness", "vomiting",
    "abdominal_pain", "fruity_breath", "deep_rapid_breathing",
]
RISK_FIELDS = [
    "family_history", "obesity", "hypertension", "sedentary_lifestyle",
    "gestational_history", "smoking", "high_cholesterol", "pcos_history",
    "ethnicity_high_risk",
]
EMERGENCY_FIELDS = ["vomiting", "abdominal_pain", "fruity_breath", "deep_rapid_breathing"]
T2_PROBE_FIELDS = ["acanthosis_nigricans", "slow_healing", "tingling_hands_feet", "frequent_infections"]

# lab group -> answer keys that may carry it, and (prediabetes, diabetic, critical) cutoffs
LAB_SOURCES = {
    "fasting_glucose": (["fasting_glucose", "fasting_plasma_glucose"], (100.0, 126.0, 250.0)),
    "hba1c": (["hba1c"], (5.7, 6.5, 10.0)),
    "random_plasma_glucose": (["random_plasma_glucose", "blood_glucose"], (140.0, 200.0, 300.0)),
    "ogtt_2h": (["ogtt_2h", "2h_ogtt_75g"], (140.0, 200.0, 300.0)),
}
LAB_FLAG_ORDER = {"prediabetes": 1, "diabetic": 2, "critical": 3}

# Fixed-count floor ported from the original interview stop rule: once this
# many questions are settled the engine may declare enough evidence.
MIN_QUESTIONS_FOR_EVIDENCE = 6

_TRUE_STRINGS = {"yes", "true", "1", "y"}
_FALSE_STRINGS = {"no", "false", "0", "n"}


def _as_bool(value):
    """Tolerant bool: True/False for known truthy/falsy forms, else None."""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and value in (0, 1):
        return bool(value)
    if isinstance(value, str):
        v = value.strip().lower()
        if v in _TRUE_STRINGS:
            return True
        if v in _FALSE_STRINGS:
            return False
    return None


def _as_float(value):
    if isinstance(value, bool) or value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def normalize_answers(payload) -> dict:
    """Keep informative values only (drop None / empty-string entries)."""
    if not isinstance(payload, dict):
        return {}
    return {str(k): v for k, v in payload.items() if v is not None and v != ""}


def build_evidence(answers) -> dict:
    """Evidence model: what the collected answers establish so far."""
    answers = normalize_answers(answers)

    def trues(keys):
        return [k for k in keys if _as_bool(answers.get(k)) is True]

    core_true = trues(CORE_SYMPTOMS)
    other_true = trues(OTHER_SYMPTOMS)
    safety_true = trues(SAFETY_FIELDS)
    risk_true = trues(RISK_FIELDS)

    emergency = any(k in safety_true for k in EMERGENCY_FIELDS) or _as_bool(answers.get("crisis")) is True

    age = _as_float(answers.get("age"))
    bmi = _as_float(answers.get("bmi"))
    sex = str(answers.get("sex") or "").strip().lower() or None
    pregnant = sex == "female" and _as_bool(answers.get("currently_pregnant")) is True
    rapid_onset = _as_bool(answers.get("rapid_onset"))  # True / False / None (unknown)

    labs = {}
    lab_flag = None
    for group, (keys, (pre, diabetic, critical)) in LAB_SOURCES.items():
        value = None
        for key in keys:
            value = _as_float(answers.get(key))
            if value is not None:
                break
        if value is None:
            continue
        labs[group] = value
        if value >= critical:
            flag = "critical"
        elif value >= diabetic:
            flag = "diabetic"
        elif value >= pre:
            flag = "prediabetes"
        else:
            flag = None
        if flag and (lab_flag is None or LAB_FLAG_ORDER[flag] > LAB_FLAG_ORDER[lab_flag]):
            lab_flag = flag

    if lab_flag == "critical":
        emergency = True

    return {
        "answers": answers,
        "core_true": core_true,
        "other_true": other_true,
        "safety_true": safety_true,
        "risk_true": risk_true,
        "emergency": emergency,
        "age": age,
        "bmi": bmi,
        "sex": sex,
        "pregnant": pregnant,
        "rapid_onset": rapid_onset,
        "sudden": rapid_onset is True,
        "gradual": rapid_onset is False,
        "labs": labs,
        "lab_flag": lab_flag,
        "has_signal": bool(core_true or other_true or safety_true or risk_true or emergency),
    }
# ── end build_evidence ──

# ── Pattern analysis ──
def analyze_patterns(evidence: dict) -> list:
    """Score competing diabetes-like evidence profiles.

    Patterns are NOT diagnoses — ids are "*-like"/"*-risk" and every final
    assessment carries an explicit not-a-diagnosis note. Multiple patterns
    and conflicting evidence are supported by design.
    """
    ev = evidence
    patterns = []
    keto = [k for k in ("fruity_breath", "deep_rapid_breathing") if k in ev["safety_true"]]
    lab_boost = 0.25 if ev["lab_flag"] in ("diabetic", "critical") else 0.0

    # 1) Hyperglycemic emergency risk — dominates everything when present.
    if ev["emergency"]:
        supporting = [k for k in EMERGENCY_FIELDS if k in ev["safety_true"]]
        if _as_bool(ev["answers"].get("crisis")) is True:
            supporting.append("crisis")
        if ev["lab_flag"] == "critical":
            supporting.append("critical_lab_values")
        patterns.append({"id": "hyperglycemic_emergency_risk", "strength": 0.95,
                         "supporting": supporting, "conflicting": []})

    # 2) Insulin-deficiency-like (T1-like): classic trio + sudden + catabolic/keto signs.
    t1, t1_sup, t1_con = 0.0, [], []
    if ev["core_true"]:
        t1 += min(0.45, 0.15 * len(ev["core_true"]))
        t1_sup += ev["core_true"]
    if ev["sudden"]:
        t1 += 0.25
        t1_sup.append("rapid_onset")
    if ev["gradual"]:
        t1 -= 0.15
        t1_con.append("gradual_onset")
    if keto:
        t1 += 0.2
        t1_sup += keto
    if ev["age"] is not None and ev["age"] < 18 and ev["core_true"]:
        t1 += 0.2
        t1_sup.append("age_under_18")
    if "bed_wetting" in ev["other_true"]:
        t1 += 0.15
        t1_sup.append("bed_wetting")
    if "irritability" in ev["other_true"]:
        t1 += 0.1
        t1_sup.append("irritability")
    if (ev["bmi"] is not None and ev["bmi"] >= 30) or "obesity" in ev["risk_true"]:
        t1 -= 0.1
        t1_con.append("obesity")
    if ev["age"] is not None and ev["age"] >= 35:
        t1_con.append("age_35_plus")
    t1 += lab_boost
    if lab_boost:
        t1_sup.append("lab_hyperglycemia")
    t1 = max(0.0, min(0.95, t1))
    if t1 > 0:
        patterns.append({"id": "insulin_deficiency_like", "strength": round(t1, 2),
                         "supporting": t1_sup, "conflicting": t1_con})
# ── end t1 ──
    # 3) Insulin-resistance-like (T2-like): gradual + risk cluster + resistance signs.
    t2, t2_sup, t2_con = 0.0, [], []
    if ev["gradual"]:
        t2 += 0.2
        t2_sup.append("gradual_onset")
    if ev["sudden"]:
        t2_con.append("rapid_onset")
    if ev["risk_true"]:
        t2 += min(0.36, 0.12 * len(ev["risk_true"]))
        t2_sup += ev["risk_true"]
    if (ev["bmi"] is not None and ev["bmi"] >= 25) or "obesity" in ev["risk_true"]:
        t2 += 0.2
        t2_sup.append("elevated_bmi")
    if "acanthosis_nigricans" in ev["other_true"]:
        t2 += 0.2
        t2_sup.append("acanthosis_nigricans")
    for k in ("slow_healing", "tingling_hands_feet", "recurrent_uti_yeast", "frequent_infections"):
        if k in ev["other_true"]:
            t2 += 0.08
            t2_sup.append(k)
    if ev["age"] is not None and ev["age"] >= 45:
        t2 += 0.2
        t2_sup.append("age_45_plus")
    elif ev["age"] is not None and ev["age"] >= 35:
        t2 += 0.1
        t2_sup.append("age_35_plus")
    if ev["age"] is not None and ev["age"] < 18:
        t2 -= 0.15
        t2_con.append("age_under_18")
    if keto:
        t2_con += keto
    t2 += lab_boost
    if lab_boost:
        t2_sup.append("lab_hyperglycemia")
    t2 = max(0.0, min(0.95, t2))
    if t2 > 0:
        patterns.append({"id": "insulin_resistance_like", "strength": round(t2, 2),
                         "supporting": t2_sup, "conflicting": t2_con})

    # 4) Gestational risk — pregnancy uses its own stricter screening lens.
    if ev["pregnant"]:
        g, g_sup = 0.45, ["currently_pregnant"]
        if ev["core_true"]:
            g += 0.2
            g_sup += ev["core_true"]
        if _as_bool(ev["answers"].get("gestational_history")) is True:
            g += 0.2
            g_sup.append("gestational_history")
        if ev["risk_true"]:
            g += 0.1
        patterns.append({"id": "gestational_risk", "strength": round(min(0.95, g), 2),
                         "supporting": g_sup, "conflicting": []})

    patterns.sort(key=lambda p: p["strength"], reverse=True)
    return patterns
# ── end patterns ──

# ── Question registry (keys only — text lives in the frontend) ──
def _question_registry() -> list:
    """Static registry: relevance + order per question KEY. The keys MUST
    match the frontend interview node ids — the frontend owns the question
    definitions and text; the backend owns relevance and ordering only.
    Priorities mirror the original fixed interview order.

    Grid / yes-no questions are LIST-DRIVEN: they settle only when the
    frontend reports them answered (`answered`/`skipped` lists). Their form
    values default to `false`, so value-based checks would wrongly treat
    unanswered questions as answered."""
    return [
        {"key": "patient", "priority": 0,
         "applies": lambda ev, needs_patient: needs_patient,
         "answered": lambda a: bool(str(a.get("patient_id") or "").strip())},
        {"key": "age", "priority": 1,
         "applies": lambda ev, needs_patient: True,
         "answered": lambda a: _as_float(a.get("age")) is not None},
        {"key": "sex", "priority": 2,
         "applies": lambda ev, needs_patient: True,
         "answered": lambda a: str(a.get("sex") or "").strip().lower() in {"male", "female", "other"}},
        {"key": "currently_pregnant", "priority": 3,
         "applies": lambda ev, needs_patient: ev["sex"] == "female" and (ev["age"] is None or 10 <= ev["age"] <= 70),
         "answered": lambda a: False},  # list-driven (default false ≠ answered)
        {"key": "pregnancy_stage", "priority": 4,
         "applies": lambda ev, needs_patient: ev["pregnant"],
         "answered": lambda a: str(a.get("pregnancy_stage") or "").strip().lower() in {"first", "second", "third", "unsure"}},
        {"key": "gdm_previous", "priority": 5,
         "applies": lambda ev, needs_patient: ev["pregnant"],
         "answered": lambda a: False},  # list-driven (default false ≠ answered)
        {"key": "symptoms_core", "priority": 10,
         "applies": lambda ev, needs_patient: True,
         "answered": lambda a: False},  # list-driven (default false ≠ answered)
        {"key": "symptom_onset", "priority": 13,
         "applies": lambda ev, needs_patient: bool(ev["core_true"] or ev["other_true"]),
         "answered": lambda a: _as_bool(a.get("rapid_onset")) is not None},
        {"key": "t2_probe", "priority": 14,
         "applies": lambda ev, needs_patient: ev["gradual"] and bool(ev["core_true"]),
         "answered": lambda a: False},  # list-driven (default false ≠ answered)
        {"key": "child_probe", "priority": 14,
         "applies": lambda ev, needs_patient: ev["age"] is not None and ev["age"] < 18 and bool(ev["core_true"]),
         "answered": lambda a: _as_bool(a.get("bed_wetting")) is not None},
        {"key": "warning_signs", "priority": 15,
         "applies": lambda ev, needs_patient: True,
         "answered": lambda a: False},  # list-driven (default false ≠ answered)
        {"key": "symptoms_other", "priority": 17,
         "applies": lambda ev, needs_patient: any(_as_bool(ev["answers"].get(k)) is None for k in OTHER_SYMPTOMS),
         "answered": lambda a: False},  # list-driven (default false ≠ answered)
        {"key": "risk_factors", "priority": 20,
         "applies": lambda ev, needs_patient: True,
         "answered": lambda a: False},  # list-driven (default false ≠ answered)
        {"key": "body", "priority": 22,
         "applies": lambda ev, needs_patient: not ev["emergency"],
         "answered": lambda a: _as_float(a.get("bmi")) is not None},
        {"key": "has_labs", "priority": 24,
         "applies": lambda ev, needs_patient: not ev["emergency"],
         "answered": lambda a: str(a.get("has_labs") or "").strip().lower() in {"yes", "no"}},
        {"key": "labs", "priority": 25,
         "applies": lambda ev, needs_patient: (
             not ev["emergency"]
             and _as_bool(ev["answers"].get("no_labs_available")) is not True
             and str(ev["answers"].get("has_labs") or "").strip().lower() != "no"
         ),
         "answered": lambda a: any(
             _as_float(a.get(k)) is not None
             for _keys, _ in LAB_SOURCES.values() for k in _keys
         )},
        {"key": "extra", "priority": 30,
         "applies": lambda ev, needs_patient: True,
         "answered": lambda a: bool(str(a.get("extra_symptoms") or "").strip())},
    ]
# ── end registry ──

# ── Select Next Question ──
def _focus_key(ev: dict, patterns: list) -> str:
    """What the engine is investigating right now (key only — the frontend
    translates it if it chooses to display it)."""
    if ev["emergency"]:
        return "focus_urgent"
    if ev["gradual"] and ev["core_true"]:
        return "focus_t2_like"
    if ev["sudden"] and ev["core_true"]:
        return "focus_t1_like"
    if len(ev["core_true"]) >= 2:
        return "focus_onset"
    if ev["core_true"] or ev["other_true"]:
        return "focus_symptoms"
    return "focus_baseline"


def build_interview_state(answers, skipped=None, needs_patient=False, answered=None) -> dict:
    """One loop step: re-evaluate ALL evidence from scratch (Ask → Analyze →
    Choose → Re-evaluate) and return the next question KEY, or done.

    Nothing is cached between steps — every answer can strengthen, weaken or
    flip a pattern, so the remaining questions are re-ranked each time and no
    patient is ever locked into one type.

    `answered` carries the frontend's authoritative list of question KEYS the
    user actually completed. Grid/yes-no questions settle ONLY from it (plus
    `skipped`) — the form's default `false` values must never count as
    answers."""
    answers = normalize_answers(answers)
    skipped = {str(k) for k in (skipped or [])}
    settled_keys = {str(k) for k in (answered or [])} | skipped
    ev = build_evidence(answers)

    applicable, open_items = [], []
    for q in _question_registry():
        if not q["applies"](ev, needs_patient):
            continue
        applicable.append(q["key"])
        if not (q["answered"](answers) or q["key"] in settled_keys):
            open_items.append(q)

    warning_pending = any(q["key"] == "warning_signs" for q in open_items)
    done = (
        not open_items
        or len(applicable) - len(open_items) >= MIN_QUESTIONS_FOR_EVIDENCE
        or (ev["emergency"] and not warning_pending)
    )
    if done and open_items:
        # The evidence floor never suppresses the differential probes — they
        # are exactly the questions that tell competing patterns apart.
        probe_keys = {"symptom_onset", "child_probe", "t2_probe"}
        if any(q["key"] in probe_keys for q in open_items):
            done = False

    next_key = None
    if not done and open_items:
        def rank(q):
            base = q["priority"]
            # Differential focus: with 2+ classic symptoms the onset question
            # is the sharpest T1-like/T2-like discriminator — jump to it.
            if q["key"] == "symptom_onset" and len(ev["core_true"]) >= 2:
                base -= 3
            return base
        open_items.sort(key=rank)
        next_key = open_items[0]["key"]

    patterns = analyze_patterns(ev)
    return {
        "done": done,
        "next_question_key": next_key,
        "focus": _focus_key(ev, patterns),
        "patterns": [{"id": p["id"], "strength": p["strength"]} for p in patterns[:3]],
        "answered_count": len(applicable) - len(open_items),
        "applicable_count": len(applicable),
    }
# ── end selection ──

# ── Final Assessment ──
def generate_final_assessment(answers, skipped=None) -> dict:
    """Patterns + supporting/conflicting evidence + uncertainty + explanation
    + recommended next step. 'insufficient' is a first-class outcome and no
    output ever states a Type 1 / Type 2 diagnosis — only *-like patterns
    with explicit supporting and conflicting evidence."""
    answers = normalize_answers(answers)
    ev = build_evidence(answers)
    patterns = analyze_patterns(ev)

    top = patterns[0] if patterns else None
    second = patterns[1] if len(patterns) > 1 else None
    top_strength = top["strength"] if top else 0.0

    level = "low"
    reasons = []
    if not ev["labs"]:
        reasons.append("no_lab_values")
        level = "moderate"
    if top is None or top_strength < 0.5:
        reasons.append("no_dominant_pattern")
        level = "high" if not ev["labs"] else "moderate"
    if top and second and (top["strength"] - second["strength"]) < 0.15:
        reasons.append("competing_patterns")
        if level != "high":
            level = "moderate"
    if top and top["conflicting"]:
        reasons.append("conflicting_evidence")
        if level == "low":
            level = "moderate"
    if ev["emergency"]:
        level = "low"  # the safety path is clear regardless of pattern spread

    status = "sufficient" if (top_strength >= 0.35 or ev["labs"] or ev["emergency"]) else "insufficient"

    explanation = []
    if ev["core_true"]:
        explanation.append({"key": "exp_core_symptoms", "params": {"count": len(ev["core_true"])}})
    if ev["sudden"]:
        explanation.append({"key": "exp_sudden_onset"})
    if ev["gradual"]:
        explanation.append({"key": "exp_gradual_onset"})
    if ev["risk_true"]:
        explanation.append({"key": "exp_risk_factors", "params": {"count": len(ev["risk_true"])}})
    if ev["labs"]:
        explanation.append({"key": "exp_lab_evidence", "params": {"flag": ev["lab_flag"] or "normal"}})
    if ev["pregnant"]:
        explanation.append({"key": "exp_pregnancy"})
    if top and second:
        explanation.append({"key": "exp_competing_patterns",
                            "params": {"primary": top["id"], "secondary": second["id"]}})
    explanation.append({"key": "not_a_diagnosis"})

    if ev["emergency"]:
        next_step = "seek_emergency_care"
    elif ev["lab_flag"] in ("diabetic", "critical"):
        next_step = "see_clinician_soon"
    elif ev["lab_flag"] == "prediabetes":
        next_step = "retest_confirm"
    elif top_strength >= 0.5:
        next_step = "see_clinician_soon"
    elif top_strength >= 0.35:
        next_step = "get_lab_tests"
    else:
        next_step = "routine_screening"

    return {
        "status": status,
        "patterns": patterns,
        "primary_pattern": top["id"] if top else None,
        "uncertainty": {"level": level, "reasons": reasons},
        "screening_confidence": int(round(min(0.95, top_strength) * 100)),
        "explanation": explanation,
        "recommended_next_step": next_step,
    }
# ── end final assessment ──





