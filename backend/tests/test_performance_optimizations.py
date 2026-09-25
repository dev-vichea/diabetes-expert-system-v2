import pytest
from sqlalchemy import event
from app.repositories.fact_repository import FactRepository
from app.extensions import db


def test_patients_pagination_and_query_count(client, doctor_auth, app):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    
    # 1. Test pagination metadata
    response = client.get("/api/patients?page=1&limit=5", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert body.get("page") == 1
    assert body.get("limit") == 5
    assert "total" in body
    assert "total_pages" in body
    assert len(body["data"]) <= 5

    # Check fields in patient item
    if body["data"]:
        patient = body["data"][0]
        assert "id" in patient
        assert "full_name" in patient
        assert "diagnosis_count" in patient
        assert "latest_diagnosis" in patient

    # 2. Test query count boundedness (N+1 elimination)
    queries = []
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        queries.append(statement)

    with app.app_context():
        event.listen(db.engine, "before_cursor_execute", before_cursor_execute)
        try:
            res = client.get("/api/patients/?page=1&limit=20", headers=headers)
            assert res.status_code == 200
        finally:
            event.remove(db.engine, "before_cursor_execute", before_cursor_execute)

    # In N+1 scenario with 20 patients, queries would be 20 * 3 + 1 = 61+ queries.
    # With batching and eager loading plus auth session permission resolution, query count must be <= 10:
    assert len(queries) <= 10, f"Expected <= 10 queries, got {len(queries)} queries: {queries}"


def test_admin_users_pagination(client, admin_auth):
    headers = {"Authorization": f"Bearer {admin_auth['access_token']}"}
    response = client.get("/api/admin/users?page=1&limit=5", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert body.get("page") == 1
    assert body.get("limit") == 5
    assert "total" in body
    assert "total_pages" in body
    assert len(body["data"]) <= 5


def test_admin_audit_logs_pagination(client, admin_auth):
    headers = {"Authorization": f"Bearer {admin_auth['access_token']}"}
    response = client.get("/api/admin/audit-logs?page=1&limit=10", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert body.get("page") == 1
    assert body.get("limit") == 10
    assert "total" in body
    assert "total_pages" in body


def test_diagnosis_review_pagination(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    response = client.get("/api/diagnosis/review?page=1&limit=10", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert body.get("page") == 1
    assert body.get("limit") == 10
    assert "total" in body
    assert "total_pages" in body


def test_fact_repository_caching(app):
    with app.app_context():
        FactRepository.invalidate_cache()
        assert FactRepository._ACTIVE_FACT_MAP_CACHE is None
        
        repo = FactRepository()
        # First call: populates cache
        facts1 = repo.get_active_fact_map()
        assert FactRepository._ACTIVE_FACT_MAP_CACHE is not None
        assert isinstance(facts1, dict)
        
        # Second call: returns cached dict
        facts2 = repo.get_active_fact_map()
        assert facts1 == facts2
        
        # Invalidation clears cache
        FactRepository.invalidate_cache()
        assert FactRepository._ACTIVE_FACT_MAP_CACHE is None


def test_admin_system_stats_has_totals(client, admin_auth):
    headers = {"Authorization": f"Bearer {admin_auth['access_token']}"}
    response = client.get("/api/admin/stats", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    data = body.get("data", {})
    assert "assessments" in data
    assert "total" in data["assessments"]
    assert "treatment_plans" in data
    assert "total" in data["treatment_plans"]


def test_patient_history_query_efficiency(client, doctor_auth, app):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}

    # Fetch patient 1
    queries = []
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        queries.append(statement)

    with app.app_context():
        event.listen(db.engine, "before_cursor_execute", before_cursor_execute)
        try:
            res = client.get("/api/patients/1/history?limit=10", headers=headers)
            assert res.status_code == 200
        finally:
            event.remove(db.engine, "before_cursor_execute", before_cursor_execute)

    body = res.get_json()
    data = body.get("data", {})
    assert "patient" in data
    assert "symptoms" in data
    assert "lab_results" in data
    assert "diagnosis_history" in data
    assert len(queries) <= 12, f"Expected <= 12 queries, got {len(queries)} queries: {queries}"


def test_rules_and_facts_limits(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}

    # Test rules with limit
    res_rules = client.get("/api/rules?limit=3", headers=headers)
    assert res_rules.status_code == 200
    rules_body = res_rules.get_json()
    assert len(rules_body.get("data", [])) <= 3

    # Test facts with limit
    res_facts = client.get("/api/facts?limit=4", headers=headers)
    assert res_facts.status_code == 200
    facts_body = res_facts.get_json()
    assert len(facts_body.get("data", [])) <= 4


def test_clinical_dashboard_aggregation(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    response = client.get("/api/dashboard/clinical?days=30", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    data = body.get("data", {})
    assert "rules_analytics" in data
    ra = data["rules_analytics"]
    assert "active_rules" in ra
    assert "accuracy" in ra
    assert "top_triggered_rules" in ra
    assert "rule_distribution" in ra
