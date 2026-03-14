from __future__ import annotations

import json
import re
from typing import Any

from app.expert_system.fact_preparation import normalize_fact_name


SUPPORTED_OPERATORS = ("==", "!=", ">", "<", ">=", "<=", "in", "contains")
SUPPORTED_LOGICAL_OPERATORS = ("and", "or")

_LEGACY_OPERATOR_ALIASES = {
    "eq": "==",
    "neq": "!=",
    "gt": ">",
    "gte": ">=",
    "lt": "<",
    "lte": "<=",
    "is_true": "==",
    "is_false": "==",
}

_FACT_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_\-]*$")
_COMPARE_PATTERN = re.compile(r"^(?P<fact>[A-Za-z_][A-Za-z0-9_\-]*)\s*(?P<op>==|!=|>=|<=|>|<)\s*(?P<value>.+)$")
_TEXT_OP_PATTERN = re.compile(r"^(?P<fact>[A-Za-z_][A-Za-z0-9_\-]*)\s+(?P<op>in|contains)\s+(?P<value>.+)$", re.IGNORECASE)
_NOT_PATTERN = re.compile(r"^not\s+(?P<fact>[A-Za-z_][A-Za-z0-9_\-]*)$", re.IGNORECASE)


class ConditionError(Exception):
    """Base condition evaluator error."""


class ConditionValidationError(ConditionError):
    pass


class ConditionEvaluationError(ConditionError):
    pass


class UnsupportedOperatorError(ConditionValidationError):
    pass


def normalize_conditions(
    *,
    conditions: list[Any] | None = None,
    condition_expression: str | None = None,
    allow_legacy_aliases: bool = False,
) -> list[dict]:
    normalized: list[dict] = []
    source_conditions = conditions if isinstance(conditions, list) else []

    if source_conditions:
        for index, raw_condition in enumerate(source_conditions, start=1):
            normalized.extend(
                _normalize_single_condition_entry(
                    raw_condition,
                    default_sequence=index,
                    allow_legacy_aliases=allow_legacy_aliases,
                )
            )
    elif condition_expression:
        normalized.extend(
            parse_condition_expression(
                condition_expression,
                base_sequence=1,
                default_logical_operator="and",
                allow_legacy_aliases=allow_legacy_aliases,
            )
        )

    if not normalized:
        return []

    normalized.sort(key=lambda item: int(item.get("sequence", 1)))
    normalized[0]["logical_operator"] = "and"

    for order_index, item in enumerate(normalized, start=1):
        item["order_index"] = order_index
        item.setdefault("group", "default")
        item["expression"] = item.get("expression") or _build_expression_from_structured(item)

    return normalized


def compose_condition_expression(conditions: list[dict]) -> str:
    if not conditions:
        return ""

    ordered = sorted(conditions, key=lambda item: int(item.get("sequence", item.get("order_index", 1))))
    expression = str(ordered[0].get("expression") or _build_expression_from_structured(ordered[0])).strip()
    if not expression:
        return ""

    for item in ordered[1:]:
        segment = str(item.get("expression") or _build_expression_from_structured(item)).strip()
        if not segment:
            continue
        logical_operator = _normalize_logical_operator(item.get("logical_operator", "and"))
        expression = f"({expression} {logical_operator} ({segment}))"

    return expression


def parse_condition_expression(
    expression: str,
    *,
    base_sequence: int = 1,
    default_logical_operator: str = "and",
    allow_legacy_aliases: bool = False,
) -> list[dict]:
    normalized_expression = str(expression or "").strip()
    if not normalized_expression:
        raise ConditionValidationError("Rule condition cannot be empty.")

    terms = _split_top_level_boolean_terms(normalized_expression)
    parsed: list[dict] = []
    sequence = int(base_sequence)
    next_logical = _normalize_logical_operator(default_logical_operator)

    for logical_operator, term in terms:
        term_logical = _normalize_logical_operator(logical_operator or next_logical)
        parsed_condition = _parse_single_term(
            term,
            sequence=sequence,
            logical_operator=term_logical,
            allow_legacy_aliases=allow_legacy_aliases,
        )
        parsed.append(parsed_condition)
        sequence += 1
        next_logical = term_logical

    if not parsed:
        raise ConditionValidationError("Rule condition cannot be empty.")

    parsed[0]["logical_operator"] = _normalize_logical_operator(default_logical_operator)
    return parsed


def evaluate_conditions(conditions: list[dict], facts: dict) -> bool:
    if not conditions:
        return False
    if not isinstance(facts, dict):
        raise ConditionEvaluationError("facts must be a dictionary.")

    ordered = sorted(conditions, key=lambda item: int(item.get("sequence", item.get("order_index", 1))))
    aggregate = None

    for index, condition in enumerate(ordered):
        matched = evaluate_condition(condition, facts)
        if index == 0 or aggregate is None:
            aggregate = matched
            continue

        logical_operator = _normalize_logical_operator(condition.get("logical_operator", "and"))
        if logical_operator == "or":
            aggregate = bool(aggregate) or matched
        else:
            aggregate = bool(aggregate) and matched

    return bool(aggregate)


def evaluate_condition(condition: dict, facts: dict) -> bool:
    fact_key = _normalize_fact_key(condition.get("fact_key"))
    operator = _normalize_operator(condition.get("operator"))
    expected_value = coerce_expected_value(condition.get("expected_value"))

    if fact_key not in facts:
        raise ConditionEvaluationError(f"Unknown fact: {fact_key}")

    actual_value = facts.get(fact_key)
    return _evaluate_operator(operator, actual_value, expected_value)


def coerce_expected_value(value: Any) -> Any:
    if isinstance(value, (bool, int, float, list, tuple, dict, set)):
        return value

    text = str(value or "").strip()
    if text == "":
        return None

    try:
        return json.loads(text)
    except (TypeError, ValueError):
        pass

    lowered = text.lower()
    if lowered in {"true", "yes", "1", "on", "y"}:
        return True
    if lowered in {"false", "no", "0", "off", "n"}:
        return False

    if text.startswith("[") and text.endswith("]"):
        inner = text[1:-1].strip()
        if not inner:
            return []
        return [coerce_expected_value(part.strip()) for part in _split_csv_preserving_quotes(inner)]

    try:
        if "." in text:
            return float(text)
        return int(text)
    except ValueError:
        pass

    if len(text) >= 2 and text[0] == text[-1] and text[0] in {"'", '"'}:
        return text[1:-1]

    return text


def _normalize_single_condition_entry(
    raw_condition: Any,
    *,
    default_sequence: int,
    allow_legacy_aliases: bool,
) -> list[dict]:
    if isinstance(raw_condition, str):
        return parse_condition_expression(
            raw_condition.strip(),
            base_sequence=default_sequence,
            default_logical_operator="and",
            allow_legacy_aliases=allow_legacy_aliases,
        )

    if not isinstance(raw_condition, dict):
        raise ConditionValidationError("Each condition must be an object or string.")

    sequence = raw_condition.get("sequence", raw_condition.get("order_index", default_sequence))
    try:
        sequence = int(sequence)
    except (TypeError, ValueError) as exc:
        raise ConditionValidationError("Condition sequence must be an integer.") from exc

    if sequence < 1:
        raise ConditionValidationError("Condition sequence must be >= 1.")

    logical_operator = _normalize_logical_operator(raw_condition.get("logical_operator", "and"))
    group = str(raw_condition.get("group", raw_condition.get("group_key", "default"))).strip() or "default"
    expression = str(raw_condition.get("expression") or "").strip()

    fact_key_raw = raw_condition.get("fact_key")
    operator_raw = raw_condition.get("operator")

    if fact_key_raw and operator_raw:
        fact_key = _normalize_fact_key(fact_key_raw)
        raw_operator_text = str(operator_raw).strip().lower()
        operator = _normalize_operator(raw_operator_text, allow_legacy_aliases=allow_legacy_aliases)
        expected_value = coerce_expected_value(raw_condition.get("expected_value"))
        if operator in {">", "<", ">=", "<=", "in", "contains"} and expected_value is None:
            raise ConditionValidationError(
                f"expected_value is required for operator '{operator}'."
            )
        if operator in {"==", "!="} and expected_value is None:
            expected_value = True
        if raw_operator_text == "is_false":
            expected_value = False
        return [
            {
                "fact_key": fact_key,
                "operator": operator,
                "expected_value": expected_value,
                "sequence": sequence,
                "group": group,
                "logical_operator": logical_operator,
                "expression": expression,
            }
        ]

    if expression:
        parsed = parse_condition_expression(
            expression,
            base_sequence=sequence,
            default_logical_operator=logical_operator,
            allow_legacy_aliases=allow_legacy_aliases,
        )
        if parsed:
            parsed[0]["logical_operator"] = logical_operator
            for item in parsed:
                item["group"] = group
        return parsed

    raise ConditionValidationError("Condition requires expression or structured fields.")


def _parse_single_term(
    term: str,
    *,
    sequence: int,
    logical_operator: str,
    allow_legacy_aliases: bool,
) -> dict:
    cleaned_term = _strip_outer_parentheses(term.strip())
    if not cleaned_term:
        raise ConditionValidationError("Rule condition term cannot be empty.")

    not_match = _NOT_PATTERN.match(cleaned_term)
    if not_match:
        fact_key = _normalize_fact_key(not_match.group("fact"))
        return {
            "fact_key": fact_key,
            "operator": "==",
            "expected_value": False,
            "sequence": sequence,
            "group": "default",
            "logical_operator": logical_operator,
            "expression": cleaned_term,
        }

    compare_match = _COMPARE_PATTERN.match(cleaned_term)
    if compare_match:
        fact_key = _normalize_fact_key(compare_match.group("fact"))
        operator = _normalize_operator(compare_match.group("op"), allow_legacy_aliases=allow_legacy_aliases)
        expected_value = coerce_expected_value(compare_match.group("value"))
        return {
            "fact_key": fact_key,
            "operator": operator,
            "expected_value": expected_value,
            "sequence": sequence,
            "group": "default",
            "logical_operator": logical_operator,
            "expression": cleaned_term,
        }

    text_operator_match = _TEXT_OP_PATTERN.match(cleaned_term)
    if text_operator_match:
        fact_key = _normalize_fact_key(text_operator_match.group("fact"))
        operator = _normalize_operator(text_operator_match.group("op"), allow_legacy_aliases=allow_legacy_aliases)
        expected_value = coerce_expected_value(text_operator_match.group("value"))
        return {
            "fact_key": fact_key,
            "operator": operator,
            "expected_value": expected_value,
            "sequence": sequence,
            "group": "default",
            "logical_operator": logical_operator,
            "expression": cleaned_term,
        }

    if _FACT_PATTERN.match(cleaned_term):
        fact_key = _normalize_fact_key(cleaned_term)
        return {
            "fact_key": fact_key,
            "operator": "==",
            "expected_value": True,
            "sequence": sequence,
            "group": "default",
            "logical_operator": logical_operator,
            "expression": cleaned_term,
        }

    raise ConditionValidationError(
        "Unsupported or not allowed condition syntax. Use structured conditions or simple comparisons with allowed operators."
    )


def _split_top_level_boolean_terms(expression: str) -> list[tuple[str, str]]:
    parts: list[tuple[str, str]] = []
    buffer: list[str] = []
    depth = 0
    quote_char = ""
    next_logical = "and"
    index = 0

    while index < len(expression):
        char = expression[index]

        if quote_char:
            buffer.append(char)
            if char == quote_char and (index == 0 or expression[index - 1] != "\\"):
                quote_char = ""
            index += 1
            continue

        if char in {"'", '"'}:
            quote_char = char
            buffer.append(char)
            index += 1
            continue

        if char == "(":
            depth += 1
            buffer.append(char)
            index += 1
            continue

        if char == ")":
            depth -= 1
            if depth < 0:
                raise ConditionValidationError("Invalid condition syntax: unbalanced parentheses.")
            buffer.append(char)
            index += 1
            continue

        if depth == 0:
            remaining = expression[index:].lower()
            if remaining.startswith(" and "):
                token = "".join(buffer).strip()
                if token:
                    parts.append((next_logical, token))
                buffer = []
                next_logical = "and"
                index += 5
                continue
            if remaining.startswith(" or "):
                token = "".join(buffer).strip()
                if token:
                    parts.append((next_logical, token))
                buffer = []
                next_logical = "or"
                index += 4
                continue

        buffer.append(char)
        index += 1

    if quote_char:
        raise ConditionValidationError("Invalid condition syntax: unterminated string literal.")
    if depth != 0:
        raise ConditionValidationError("Invalid condition syntax: unbalanced parentheses.")

    tail = "".join(buffer).strip()
    if tail:
        parts.append((next_logical, tail))

    return parts


def _strip_outer_parentheses(text: str) -> str:
    value = text.strip()
    while value.startswith("(") and value.endswith(")") and _is_wrapped_by_outer_parentheses(value):
        value = value[1:-1].strip()
    return value


def _is_wrapped_by_outer_parentheses(text: str) -> bool:
    depth = 0
    quote_char = ""
    for index, char in enumerate(text):
        if quote_char:
            if char == quote_char and (index == 0 or text[index - 1] != "\\"):
                quote_char = ""
            continue
        if char in {"'", '"'}:
            quote_char = char
            continue
        if char == "(":
            depth += 1
            continue
        if char == ")":
            depth -= 1
            if depth == 0 and index != len(text) - 1:
                return False
    return depth == 0


def _split_csv_preserving_quotes(text: str) -> list[str]:
    parts = []
    chunk = []
    quote_char = ""
    depth = 0
    for index, char in enumerate(text):
        if quote_char:
            chunk.append(char)
            if char == quote_char and (index == 0 or text[index - 1] != "\\"):
                quote_char = ""
            continue
        if char in {"'", '"'}:
            quote_char = char
            chunk.append(char)
            continue
        if char in {"[", "("}:
            depth += 1
            chunk.append(char)
            continue
        if char in {"]", ")"}:
            depth -= 1
            chunk.append(char)
            continue
        if char == "," and depth == 0:
            parts.append("".join(chunk).strip())
            chunk = []
            continue
        chunk.append(char)
    if chunk:
        parts.append("".join(chunk).strip())
    return [item for item in parts if item]


def _normalize_fact_key(raw_key: Any) -> str:
    candidate = normalize_fact_name(str(raw_key or ""))
    if not candidate:
        raise ConditionValidationError("fact_key is required for structured conditions.")
    if not _FACT_PATTERN.match(candidate):
        raise ConditionValidationError("fact_key contains unsupported characters.")
    return candidate


def _normalize_operator(raw_operator: Any, *, allow_legacy_aliases: bool = False) -> str:
    operator = str(raw_operator or "").strip().lower()
    if not operator:
        raise UnsupportedOperatorError("operator is required for structured conditions.")

    if allow_legacy_aliases and operator in _LEGACY_OPERATOR_ALIASES:
        return _LEGACY_OPERATOR_ALIASES[operator]

    if operator not in SUPPORTED_OPERATORS:
        supported = ", ".join(SUPPORTED_OPERATORS)
        raise UnsupportedOperatorError(f"Unsupported operator '{operator}'. Allowed operators: {supported}.")
    return operator


def _normalize_logical_operator(raw_operator: Any) -> str:
    logical_operator = str(raw_operator or "and").strip().lower()
    if logical_operator not in SUPPORTED_LOGICAL_OPERATORS:
        raise ConditionValidationError("logical_operator must be one of: and, or.")
    return logical_operator


def _evaluate_operator(operator: str, actual: Any, expected: Any) -> bool:
    if operator == "==":
        return _safe_equals(actual, expected)
    if operator == "!=":
        return not _safe_equals(actual, expected)
    if operator in {">", "<", ">=", "<="}:
        left = _as_number(actual)
        right = _as_number(expected)
        if operator == ">":
            return left > right
        if operator == "<":
            return left < right
        if operator == ">=":
            return left >= right
        return left <= right
    if operator == "in":
        return _evaluate_in(actual, expected)
    if operator == "contains":
        return _evaluate_contains(actual, expected)
    raise ConditionEvaluationError(f"Unsupported operator: {operator}")


def _safe_equals(left: Any, right: Any) -> bool:
    left_bool = _as_bool(left)
    right_bool = _as_bool(right)
    if left_bool is not None and right_bool is not None:
        return left_bool == right_bool

    try:
        left_number = _as_number(left)
        right_number = _as_number(right)
        return left_number == right_number
    except ConditionEvaluationError:
        pass

    return left == right


def _evaluate_in(actual: Any, expected: Any) -> bool:
    if expected is None:
        raise ConditionEvaluationError("Operator 'in' requires a non-empty expected value.")

    if isinstance(expected, str):
        options = [coerce_expected_value(item) for item in expected.split(",")] if "," in expected else [expected]
        return any(_safe_equals(actual, option) for option in options)

    if isinstance(expected, dict):
        return actual in expected.keys() or str(actual) in expected.keys()

    if isinstance(expected, (list, tuple, set)):
        return any(_safe_equals(actual, option) for option in expected)

    raise ConditionEvaluationError("Operator 'in' requires expected_value to be a list, tuple, set, dict, or string.")


def _evaluate_contains(actual: Any, expected: Any) -> bool:
    if actual is None:
        return False

    if isinstance(actual, str):
        return str(expected or "") in actual

    if isinstance(actual, dict):
        return expected in actual.keys() or str(expected) in actual.keys()

    if isinstance(actual, (list, tuple, set)):
        return any(_safe_equals(item, expected) for item in actual)

    raise ConditionEvaluationError("Operator 'contains' requires the fact value to be a list, tuple, set, dict, or string.")


def _as_number(value: Any) -> float:
    if isinstance(value, bool):
        raise ConditionEvaluationError(f"Expected numeric value, got boolean: {value!r}.")
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise ConditionEvaluationError(f"Expected numeric value, got {value!r}.") from exc


def _as_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "yes", "1", "on", "y"}:
            return True
        if lowered in {"false", "no", "0", "off", "n"}:
            return False
    return None


def _build_expression_from_structured(condition: dict) -> str:
    fact_key = _normalize_fact_key(condition.get("fact_key"))
    operator = _normalize_operator(condition.get("operator"), allow_legacy_aliases=True)
    expected_value = coerce_expected_value(condition.get("expected_value"))

    if operator in {"==", "!="} and isinstance(expected_value, bool):
        if operator == "==":
            return fact_key if expected_value else f"(not {fact_key})"
        return f"(not {fact_key})" if expected_value else fact_key

    expected_literal = _format_literal(expected_value)
    if operator in {"in", "contains"}:
        return f"{fact_key} {operator} {expected_literal}"
    return f"{fact_key} {operator} {expected_literal}"


def _format_literal(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (list, tuple, dict, set)):
        try:
            return json.dumps(list(value) if isinstance(value, set) else value)
        except (TypeError, ValueError):
            return repr(value)
    if value is None:
        return "null"
    return json.dumps(str(value))
