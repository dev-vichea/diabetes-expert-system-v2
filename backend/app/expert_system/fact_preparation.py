from dataclasses import dataclass

from app.expert_system.fact_normalizer import derive_facts, normalize_fact_name, normalize_input_facts


@dataclass
class PreparedFacts:
    facts: dict
    trace: list[dict]


def prepare_facts(payload: dict) -> PreparedFacts:
    payload = payload if isinstance(payload, dict) else {}
    facts: dict = {}
    trace: list[dict] = []

    def set_fact(name: str, value, source: str):
        normalized_name = normalize_fact_name(name)
        if not normalized_name:
            return
        if value is None:
            return
        facts[normalized_name] = value
        trace.append({"fact": normalized_name, "value": value, "source": source})

    normalize_input_facts(payload, set_fact)
    derive_facts(facts, set_fact)

    return PreparedFacts(facts=facts, trace=trace)
