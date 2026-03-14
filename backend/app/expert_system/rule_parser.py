import ast
from dataclasses import dataclass


class RuleParserError(Exception):
    """Base parser error for rule condition expressions."""


class RuleSyntaxError(RuleParserError):
    pass


class UnsafeRuleError(RuleParserError):
    pass


class RuleEvaluationError(RuleParserError):
    pass


class UnknownFactError(RuleEvaluationError):
    def __init__(self, fact_name: str):
        super().__init__(f"Unknown fact: {fact_name}")
        self.fact_name = fact_name


@dataclass(frozen=True)
class ParsedCondition:
    raw_expression: str
    expression_ast: ast.Expression
    required_facts: tuple[str, ...]

    def evaluate(self, facts: dict) -> bool:
        return bool(_eval_node(self.expression_ast.body, facts))


def parse_condition(expression: str) -> ParsedCondition:
    normalized = str(expression or "").strip()
    if not normalized:
        raise RuleSyntaxError("Rule condition cannot be empty.")

    try:
        expression_ast = ast.parse(normalized, mode="eval")
    except SyntaxError as exc:
        raise RuleSyntaxError(f"Invalid rule condition syntax: {exc.msg}") from exc

    _ConditionValidator().visit(expression_ast)
    required_facts = tuple(sorted({node.id for node in ast.walk(expression_ast) if isinstance(node, ast.Name)}))
    return ParsedCondition(
        raw_expression=normalized,
        expression_ast=expression_ast,
        required_facts=required_facts,
    )


class _ConditionValidator(ast.NodeVisitor):
    ALLOWED_COMPARE_OPS = (ast.Gt, ast.GtE, ast.Lt, ast.LtE, ast.Eq, ast.NotEq)
    ALLOWED_BIN_OPS = (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod)

    def visit_Expression(self, node: ast.Expression):
        self.visit(node.body)

    def visit_BoolOp(self, node: ast.BoolOp):
        if not isinstance(node.op, (ast.And, ast.Or)):
            raise UnsafeRuleError("Only 'and' and 'or' boolean operators are allowed.")
        if not node.values:
            raise UnsafeRuleError("Boolean expressions must contain at least one value.")
        for value in node.values:
            self.visit(value)

    def visit_UnaryOp(self, node: ast.UnaryOp):
        if isinstance(node.op, ast.Not):
            self.visit(node.operand)
            return
        if isinstance(node.op, ast.USub):
            self.visit(node.operand)
            return
        raise UnsafeRuleError("Only 'not' unary operator is allowed in rule conditions.")

    def visit_Compare(self, node: ast.Compare):
        self.visit(node.left)
        for comparator in node.comparators:
            self.visit(comparator)
        for operator in node.ops:
            if not isinstance(operator, self.ALLOWED_COMPARE_OPS):
                raise UnsafeRuleError("Unsupported comparison operator in rule condition.")

    def visit_BinOp(self, node: ast.BinOp):
        if not isinstance(node.op, self.ALLOWED_BIN_OPS):
            raise UnsafeRuleError("Unsupported arithmetic operator in rule condition.")
        self.visit(node.left)
        self.visit(node.right)

    def visit_Name(self, node: ast.Name):
        if not node.id or not node.id.replace("_", "a").isalnum():
            raise UnsafeRuleError("Fact names must use alphanumeric and underscore characters.")

    def visit_Constant(self, node: ast.Constant):
        if isinstance(node.value, (bool, int, float, str)) or node.value is None:
            return
        raise UnsafeRuleError("Unsupported constant type in rule condition.")

    def visit_Call(self, node: ast.Call):
        raise UnsafeRuleError("Function calls are not allowed in rule conditions.")

    def visit_Attribute(self, node: ast.Attribute):
        raise UnsafeRuleError("Attribute access is not allowed in rule conditions.")

    def visit_Subscript(self, node: ast.Subscript):
        raise UnsafeRuleError("Indexing is not allowed in rule conditions.")

    def visit_List(self, node: ast.List):
        raise UnsafeRuleError("List literals are not allowed in rule conditions.")

    def visit_Dict(self, node: ast.Dict):
        raise UnsafeRuleError("Dictionary literals are not allowed in rule conditions.")

    def generic_visit(self, node):
        allowed_nodes = (
            ast.Load,
            ast.Expr,
            ast.Expression,
            ast.BoolOp,
            ast.UnaryOp,
            ast.Compare,
            ast.BinOp,
            ast.Name,
            ast.Constant,
            ast.And,
            ast.Or,
            ast.Not,
            ast.USub,
            ast.Gt,
            ast.GtE,
            ast.Lt,
            ast.LtE,
            ast.Eq,
            ast.NotEq,
            ast.Add,
            ast.Sub,
            ast.Mult,
            ast.Div,
            ast.Mod,
        )
        if not isinstance(node, allowed_nodes):
            raise UnsafeRuleError(f"Unsupported syntax in rule condition: {type(node).__name__}")
        super().generic_visit(node)


def _eval_node(node, facts: dict):
    if isinstance(node, ast.BoolOp):
        values = [_eval_node(value, facts) for value in node.values]
        if isinstance(node.op, ast.And):
            return all(values)
        if isinstance(node.op, ast.Or):
            return any(values)
        raise RuleEvaluationError("Unsupported boolean operator.")

    if isinstance(node, ast.UnaryOp):
        value = _eval_node(node.operand, facts)
        if isinstance(node.op, ast.Not):
            return not value
        if isinstance(node.op, ast.USub):
            return -_as_number(value)
        raise RuleEvaluationError("Unsupported unary operator.")

    if isinstance(node, ast.BinOp):
        left = _as_number(_eval_node(node.left, facts))
        right = _as_number(_eval_node(node.right, facts))
        if isinstance(node.op, ast.Add):
            return left + right
        if isinstance(node.op, ast.Sub):
            return left - right
        if isinstance(node.op, ast.Mult):
            return left * right
        if isinstance(node.op, ast.Div):
            if right == 0:
                raise RuleEvaluationError("Division by zero in rule condition.")
            return left / right
        if isinstance(node.op, ast.Mod):
            if right == 0:
                raise RuleEvaluationError("Modulo by zero in rule condition.")
            return left % right
        raise RuleEvaluationError("Unsupported arithmetic operator.")

    if isinstance(node, ast.Compare):
        left = _eval_node(node.left, facts)
        for operator, comparator in zip(node.ops, node.comparators):
            right = _eval_node(comparator, facts)
            if not _apply_comparator(operator, left, right):
                return False
            left = right
        return True

    if isinstance(node, ast.Name):
        if node.id not in facts:
            raise UnknownFactError(node.id)
        return facts[node.id]

    if isinstance(node, ast.Constant):
        return node.value

    raise RuleEvaluationError(f"Unsupported expression node: {type(node).__name__}")


def _as_number(value):
    try:
        return float(value)
    except (TypeError, ValueError) as exc:
        raise RuleEvaluationError(f"Expected numeric value, got {value!r}.") from exc


def _apply_comparator(operator, left, right) -> bool:
    if isinstance(operator, ast.Gt):
        return left > right
    if isinstance(operator, ast.GtE):
        return left >= right
    if isinstance(operator, ast.Lt):
        return left < right
    if isinstance(operator, ast.LtE):
        return left <= right
    if isinstance(operator, ast.Eq):
        return left == right
    if isinstance(operator, ast.NotEq):
        return left != right
    raise RuleEvaluationError("Unsupported comparator.")
