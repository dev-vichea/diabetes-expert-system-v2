"""Adaptive assessment engine tests.

Personas are walked through the REAL engine (build_interview_state →
generate_final_assessment) and assert the behaviour from the spec:

1. common screening questions first, onset used as the discriminator
2. differential probing: sudden → T1-like exploration, gradual → T2-like
3. re-evaluation after every answer (stateless recompute — no locking)
4. multiple matching patterns and conflicting evidence are supported
5. the loop terminates: enough evidence or no useful question remains
6. "insufficient evidence" instead of forcing a result
7. never a Type 1 / Type 2 diagnosis — only *-like patterns + note
"""

from app.expert_system.adaptive_assessment import (
    CORE_SYMPTOMS,
    OTHER_SYMPTOMS,
    RISK_FIELDS,
    SAFETY_FIELDS,
    T2_PROBE_FIELDS,
    analyze_patterns,
    build_evidence,
    build_interview_state,
    generate_final_assessment,
)

BASE = {
    "age": 30,
    "sex": "male",
    "rapid_onset": False,
    "bmi": 24,
    "has_labs": "no",
    "no_labs_available": True,
}
for _k in CORE_SYMPTOMS + OTHER_SYMPTOMS + SAFETY_FIELDS + RISK_FIELDS:
    BASE[_k] = False

_ANSWER_GROUPS = {
    "symptoms_core": CORE_SYMPTOMS,
    "symptoms_other": OTHER_SYMPTOMS,
    "warning_signs": SAFETY_FIELDS,
    "risk_factors": RISK_FIELDS,
    "t2_probe": T2_PROBE_FIELDS,
}

_AUTO_VALUES = {
    "age": 30,
    "sex": "male",
    "currently_pregnant": False,
    "pregnancy_stage": "second",
    "gdm_previous": False,
    "extra": "nothing else",
}

# yesno nodes whose answer field differs from the question key
_KEY_TO_FIELD = {
    "child_probe": "bed_wetting",
    "symptom_onset": "rapid_onset",
    "gdm_previous": "gestational_history",
}


def _apply_answer(answers: dict, key: str):
    field = _KEY_TO_FIELD.get(key)
    if field:
        answers.setdefault(field, False)
        return
    if key in _ANSWER_GROUPS:
        for field in _ANSWER_GROUPS[key]:
            answers.setdefault(field, False)
    elif key == "body":
        answers.setdefault("bmi", 24)
    elif key == "has_labs":
        answers.setdefault("has_labs", "no")
        answers.setdefault("no_labs_available", True)
    elif key == "labs":
        answers.setdefault("fasting_glucose", 90)
    elif key in _AUTO_VALUES:
        answers.setdefault(key, _AUTO_VALUES[key])
    else:
        answers.setdefault(key, False)


def walk(persona: dict, max_steps: int = 30):
    """Drive the real engine until it stops; answer each asked question with
    the persona's value when present, else a neutral default."""
    current = dict(persona)
    order, seen = [], set()
    for _ in range(max_steps):
        state = build_interview_state(current)
        if state["done"]:
            return order, state
        key = state["next_question_key"]
        assert key, "engine asked for the next question but returned no key"
        assert key not in seen, f"engine re-asked an already answered question: {key}"
        seen.add(key)
        order.append(key)
        _apply_answer(current, key)
    raise AssertionError("interview did not terminate")


# ── 1. Healthy baseline: short interview, insufficient result, no forcing ──
def test_healthy_baseline_short_and_insufficient():
    order, state = walk(dict(BASE))
    assert state["done"]
    assert "thirst_alternatives" not in order  # the reverted probe stays gone
    assert "labs" not in order  # has_labs="no" closes the labs branch
    assert len(order) <= 8  # tight baseline interview

    final = generate_final_assessment(dict(BASE))
    assert final["status"] == "insufficient"
    assert final["recommended_next_step"] == "routine_screening"
    assert "no_lab_values" in final["uncertainty"]["reasons"]
    assert "no_dominant_pattern" in final["uncertainty"]["reasons"]
# ── end tests part 1 ──

# ── 2. T1-like child persona: sudden onset + classic trio + bed-wetting ──
def test_t1_like_child_persona():
    persona = dict(BASE)
    persona.update({"age": 9, "rapid_onset": True, "frequent_urination": True,
                    "excessive_thirst": True, "excessive_hunger": True,
                    "weight_loss": True, "bed_wetting": True})
    ev = build_evidence(persona)
    patterns = analyze_patterns(ev)
    assert patterns[0]["id"] == "insulin_deficiency_like"
    assert patterns[0]["strength"] >= 0.7
    assert "rapid_onset" in patterns[0]["supporting"]

    order, _state = walk({k: v for k, v in persona.items() if k != "bed_wetting"})
    assert "child_probe" in order  # the T1-like child probe is part of the flow
    if "symptoms_other" in order:  # only reached when the engine needs more evidence
        assert order.index("warning_signs") < order.index("symptoms_other")

    final = generate_final_assessment(persona)
    assert final["status"] == "sufficient"
    assert final["primary_pattern"] == "insulin_deficiency_like"
    assert final["recommended_next_step"] == "see_clinician_soon"
    assert "no_lab_values" in final["uncertainty"]["reasons"]  # honest uncertainty


# ── 3. T2-like adult persona: gradual + risk cluster + resistance signs ──
def test_t2_like_adult_persona():
    persona = dict(BASE)
    persona.update({"age": 52, "rapid_onset": False, "family_history": True,
                    "obesity": True, "hypertension": True, "sedentary_lifestyle": True,
                    "acanthosis_nigricans": True, "frequent_urination": True,
                    "excessive_thirst": True, "fatigue": True})
    ev = build_evidence(persona)
    patterns = analyze_patterns(ev)
    assert patterns[0]["id"] == "insulin_resistance_like"
    t1 = next(p for p in patterns if p["id"] == "insulin_deficiency_like")
    assert "gradual_onset" in t1["conflicting"]  # conflicting evidence is explicit

    final = generate_final_assessment(persona)
    assert final["status"] == "sufficient"
    assert final["primary_pattern"] == "insulin_resistance_like"


# ── 4. Competing patterns: sudden onset in a high-risk 50-year-old ──
def test_competing_patterns_and_conflicting_evidence():
    persona = dict(BASE)
    persona.update({"age": 50, "rapid_onset": True, "obesity": True,
                    "family_history": True, "weight_loss": True,
                    "frequent_urination": True, "excessive_thirst": True})
    ev = build_evidence(persona)
    patterns = analyze_patterns(ev)
    ids = [p["id"] for p in patterns]
    assert "insulin_deficiency_like" in ids
    assert "insulin_resistance_like" in ids

    final = generate_final_assessment(persona)
    top, second = final["patterns"][0], final["patterns"][1]
    assert (top["strength"] - second["strength"]) < 0.15
    assert "competing_patterns" in final["uncertainty"]["reasons"]
    assert any(e["key"] == "exp_competing_patterns" for e in final["explanation"])
    assert final["uncertainty"]["level"] in {"moderate", "high"}


# ── 5. Emergency signs short-circuit labs/body and drive the next step ──
def test_emergency_short_circuits_workup():
    persona = dict(BASE)
    persona.update({"vomiting": True, "abdominal_pain": True,
                    "frequent_urination": True, "excessive_thirst": True})
    order, _state = walk(persona)
    assert "has_labs" not in order and "labs" not in order
    assert "body" not in order

    final = generate_final_assessment(persona)
    assert final["patterns"][0]["id"] == "hyperglycemic_emergency_risk"
    assert final["recommended_next_step"] == "seek_emergency_care"


# ── 6. Differential selection: onset jumps the queue once a pattern exists ──
def test_onset_is_the_discriminator_once_pattern_exists():
    # strip rapid_onset so the onset question is genuinely unanswered
    persona = {k: v for k, v in BASE.items() if k != "rapid_onset"}
    persona.update({"excessive_thirst": True, "frequent_urination": True})
    state = build_interview_state(persona)
    assert state["next_question_key"] == "symptom_onset"

    # the branch follows the answer: gradual → T2-like probe, sudden → T1-like probing
    gradual = {k: v for k, v in persona.items() if k != "rapid_onset" and k not in T2_PROBE_FIELDS}
    gradual["rapid_onset"] = False
    after_gradual = build_interview_state(gradual)
    assert after_gradual["next_question_key"] == "t2_probe"
    assert after_gradual["focus"] == "focus_t2_like"

    child_sudden = {k: v for k, v in persona.items() if k not in ("rapid_onset", "bed_wetting")}
    child_sudden.update({"rapid_onset": True, "age": 9})
    after_sudden = build_interview_state(child_sudden)
    assert after_sudden["next_question_key"] in {"child_probe", "warning_signs"}
    assert after_sudden["focus"] == "focus_t1_like"


# ── 7. Never a diagnosis — only *-like patterns + explicit note ──
def test_never_states_a_type_diagnosis():
    personas = [
        {"age": 9, "rapid_onset": True, "frequent_urination": True, "excessive_thirst": True},
        {"age": 52, "rapid_onset": False, "obesity": True, "acanthosis_nigricans": True,
         "excessive_thirst": True, "frequent_urination": True},
        dict(BASE),
    ]
    for persona in personas:
        final = generate_final_assessment(persona)
        for pattern in final["patterns"]:
            assert pattern["id"].endswith("_like") or pattern["id"].endswith("_risk")
            assert "type_1" not in pattern["id"] and "type_2" not in pattern["id"]
        assert any(e["key"] == "not_a_diagnosis" for e in final["explanation"])
        assert set(final.keys()) == {
            "status", "patterns", "primary_pattern", "uncertainty",
            "screening_confidence", "explanation", "recommended_next_step",
        }


# ── 8. Tolerant normalization: yes/no strings and numeric strings ──
def test_tolerant_answer_normalization():
    ev = build_evidence({"age": "42", "excessive_thirst": "yes", "rapid_onset": "no",
                         "fasting_glucose": "130", "bmi": "31"})
    assert ev["core_true"] == ["excessive_thirst"]
    assert ev["gradual"] is True
    assert ev["age"] == 42.0
    assert ev["labs"]["fasting_glucose"] == 130.0
    assert ev["lab_flag"] == "diabetic"

