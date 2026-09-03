"""Doctor-managed fact/symptom catalog: seeding, API, and reasoning overlay.

The catalog turns the static symptom knowledge into DB rows a doctor can edit
from the Knowledge Base. Reasoning fields (weight / type_indication / flags)
overlay app.expert_system.symptom_database at assessment time; education
fields (meaning / prevention, EN + KM) are attached to reports.
"""

import pytest
from sqlalchemy import text

from app import create_app
from app.config import Config
from app.extensions import db
from app.expert_system.symptom_confidence import calculate_symptom_score
from app.expert_system.symptom_database import (
    apply_fact_overlay,
    clear_fact_overlay,
    get_cardinal_symptoms,
    get_emergency_symptoms,
    get_symptom_info,
)
from app.models import Fact
from app.repositories import FactRepository
from app.services.fact_service import FactService
from app.utils.diabetes_fact_seed_data import FACT_CATALOG_SEED


@pytest.fixture(autouse=True)
def _clean_overlay():
    clear_fact_overlay()
    yield
    clear_fact_overlay()


# ── Seeding: insert-if-missing, doctor edits win ──


def test_seeding_inserts_catalog(app):
    with app.app_context():
        repo = FactRepository()
        keys = {row["key"] for row in repo.list_facts()}
        expected = {entry["key"] for entry in FACT_CATALOG_SEED}
        assert expected <= keys


def test_reseeding_preserves_doctor_edits(app):
    with app.app_context():
        repo = FactRepository()
        row = repo.get_by_key("fatigue")
        repo.update(row, {"meaning": "Doctor rewritten meaning", "weight": 0.44})

        from app.utils.seed import _seed_fact_catalog
        _seed_fact_catalog()

        refreshed = repo.get_by_key("fatigue")
        assert refreshed.meaning == "Doctor rewritten meaning"
        assert refreshed.weight == 0.44
        assert refreshed.source == "seed"  # untouched rows keep seed origin


# ── Reasoning overlay: doctor edits change the reasoning ──


def test_overlay_changes_weight_and_flags():
    apply_fact_overlay({
        "fatigue": {"weight": 0.9, "type_indication": "type1", "is_cardinal": True,
                    "is_emergency": False, "aliases": ["extreme_fatigue"]},
        "night_sweats": {"weight": 0.2, "type_indication": "both", "is_cardinal": False,
                         "is_emergency": True, "aliases": []},
    })
    info = get_symptom_info("fatigue")
    assert info["weight"] == 0.9
    assert info["type_indication"] == "type1"
    assert "fatigue" in get_cardinal_symptoms()
    # brand-new facts participate via the overlay too
    assert get_symptom_info("night_sweats")["is_emergency"] is True
    assert "night_sweats" in get_emergency_symptoms()
    assert calculate_symptom_score(["night_sweats"]) == 0.2


def test_overlay_aliases_resolve():
    apply_fact_overlay({
        "frequent_urination": {"weight": 0.5, "type_indication": "both", "is_cardinal": True,
                               "is_emergency": False, "aliases": ["polyuria"]},
    })
    assert get_symptom_info("polyuria")["weight"] == 0.5


def test_clearing_overlay_restores_static_knowledge():
    apply_fact_overlay({"fatigue": {"weight": 0.9, "type_indication": "both",
                                    "is_cardinal": False, "is_emergency": False, "aliases": []}})
    clear_fact_overlay()
    assert get_symptom_info("fatigue")["weight"] == pytest.approx(0.15, abs=0.11)
    assert "fatigue" not in get_cardinal_symptoms()


# ── Startup resilience: legacy DB without the facts table ──


def test_seeding_heals_missing_facts_table(tmp_path):
    """Regression: a dev DB created before the Fact model existed (user config:
    DB_AUTO_CREATE=false, SEED_DEMO_DATA=true) must not crash the backend —
    seed-time schema healing adds the missing table and seeds it."""
    db_path = tmp_path / "legacy.db"

    class LegacyConfig(Config):
        TESTING = True
        SECRET_KEY = "test-secret-key"
        CORS_ORIGINS = ["*"]
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
        DB_AUTO_CREATE = True
        SEED_DEMO_DATA = True
        JWT_ACCESS_EXPIRES_SECONDS = 300
        JWT_REFRESH_EXPIRES_SECONDS = 1800

    legacy_app = create_app(LegacyConfig)
    with legacy_app.app_context():
        db.session.execute(text("DROP TABLE facts"))
        db.session.commit()

    class UserConfig(LegacyConfig):
        DB_AUTO_CREATE = False  # the user's .env: no auto-create, seeding on

    # Startup must not raise...
    healed_app = create_app(UserConfig)
    with healed_app.app_context():
        # ...and the fact catalog must exist and be populated.
        assert Fact.query.filter_by(key="excessive_hunger").first() is not None
        assert Fact.query.count() == len(FACT_CATALOG_SEED)


# ── FactService validation ──


def test_service_rejects_duplicate_and_bad_keys(app):
    with app.app_context():
        service = FactService(FactRepository())
        service.create_fact({"key": "night_sweats", "label": "Night Sweats"})
        with pytest.raises(Exception):
            service.create_fact({"key": "night_sweats", "label": "Night Sweats"})
        with pytest.raises(Exception):
            service.create_fact({"key": "2bad key", "label": "Bad"})
        with pytest.raises(Exception):
            service.create_fact({"key": "ok_key", "label": ""})
        with pytest.raises(Exception):
            service.create_fact({"key": "ok_key2", "label": "X", "weight": 4})


def test_fact_keys_are_immutable(app):
    with app.app_context():
        service = FactService(FactRepository())
        created = service.create_fact({"key": "cold_hands", "label": "Cold Hands"})
        with pytest.raises(Exception):
            service.update_fact(created["id"], {"key": "renamed"})


# ── API ──


def test_facts_api_list_create_update(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}

    listed = client.get("/api/facts/", headers=headers)
    assert listed.status_code == 200
    body = listed.get_json()
    assert body["success"] is True
    assert any(item["key"] == "frequent_urination" for item in body["data"])

    created = client.post("/api/facts/", headers=headers, json={
        "key": "numb_toes",
        "label": "Numb Toes",
        "medical_term": "Numbness",
        "category": "nerve",
        "meaning": "Nerve damage from high glucose.",
        "weight": 0.12,
        "type_indication": "type2",
        "aliases": ["numb_toes_both"],
    })
    assert created.status_code == 201
    fact = created.get_json()["data"]

    updated = client.patch(f"/api/facts/{fact['id']}", headers=headers,
                           json={"meaning": "Updated by doctor", "weight": 0.2})
    assert updated.status_code == 200
    assert updated.get_json()["data"]["meaning"] == "Updated by doctor"

    deactivated = client.delete(f"/api/facts/{fact['id']}", headers=headers)
    assert deactivated.status_code == 200
    assert deactivated.get_json()["data"]["is_active"] is False


def test_facts_api_requires_manage_permission(client, patient_auth):
    headers = {"Authorization": f"Bearer {patient_auth['access_token']}"}
    response = client.post("/api/facts/", headers=headers, json={"key": "x", "label": "X"})
    assert response.status_code == 403
