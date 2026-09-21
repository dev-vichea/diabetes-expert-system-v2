from dataclasses import dataclass

from app.expert_system.fact_normalizer import derive_facts, normalize_fact_name, normalize_input_facts


@dataclass
class PreparedFacts:
    facts: dict
    trace: list[dict]


def prepare_facts(payload: dict, *, rule_output_keys=None) -> PreparedFacts:
    payload = payload if isinstance(payload, dict) else {}
    facts: dict = {}
    trace: list[dict] = []
    protected = {
        "classic_hyperglycemia_symptoms", "diabetes_evidence_base", "ketosis_signs_present",
        "type2_risk_increased", "is_obese", "no_lab_values_available", "no_labs_available",
        *(rule_output_keys or ()),
    }

    def set_fact(name: str, value, source: str):
        normalized_name = normalize_fact_name(name)
        if not normalized_name:
            return
        if value is None:
            return
        if normalized_name in protected and not source.startswith("derived."):
            trace.append({"fact": normalized_name, "source": source, "ignored": True,
                          "reason": "This fact must be produced by fact preparation or an active rule."})
            return
        facts[normalized_name] = value
        trace.append({"fact": normalized_name, "value": value, "source": source})

    normalize_input_facts(payload, set_fact)
    derive_facts(facts, set_fact)

    return PreparedFacts(facts=facts, trace=trace)
