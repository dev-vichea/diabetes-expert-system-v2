from dataclasses import dataclass


PRIORITY_WEIGHT = {
    "high": 1.0,
    "medium": 0.9,
    "low": 0.8,
}


@dataclass
class RankedConclusion:
    conclusion: str
    certainty: float
    supporting_rules: list[dict]


def get_priority_weight(priority: str) -> float:
    return PRIORITY_WEIGHT.get(str(priority or "").lower(), 0.9)


def combine_certainty(current: float, incoming: float) -> float:
    current = _clamp(current)
    incoming = _clamp(incoming)
    return _clamp(current + incoming * (1 - current))


def rank_conclusions(conclusion_evidence: list[dict]) -> list[dict]:
    scores = {}

    for evidence in conclusion_evidence:
        conclusion = str(evidence.get("conclusion", "")).strip()
        if not conclusion:
            continue

        if conclusion not in scores:
            scores[conclusion] = RankedConclusion(conclusion=conclusion, certainty=0.0, supporting_rules=[])

        ranked = scores[conclusion]
        ranked.certainty = combine_certainty(ranked.certainty, float(evidence.get("effective_certainty", 0)))
        ranked.supporting_rules.append(
            {
                "rule_id": evidence.get("rule_id"),
                "rule_name": evidence.get("rule_name"),
                "priority": evidence.get("priority"),
                "certainty_factor": evidence.get("certainty_factor"),
                "effective_certainty": round(float(evidence.get("effective_certainty", 0)), 4),
            }
        )

    ordered = sorted(scores.values(), key=lambda item: item.certainty, reverse=True)
    return [
        {
            "conclusion": item.conclusion,
            "certainty": round(item.certainty, 4),
            "supporting_rules": item.supporting_rules,
        }
        for item in ordered
    ]


def _clamp(value: float) -> float:
    if value < 0:
        return 0.0
    if value > 1:
        return 1.0
    return value
