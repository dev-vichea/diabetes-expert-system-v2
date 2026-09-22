"""Doctor-facing clinical dashboard: custom date range + personal workload."""

from datetime import datetime

from app.extensions import db
from app.models import DiagnosisResult, Patient

# A window far enough in the past that demo seeding does not overlap it, so
# every assertion below can be written as a delta against a baseline fetch.
WINDOW = {"start": "2025-03-10", "end": "2025-03-12"}


def _fetch(client, headers, **params):
    response = client.get("/api/dashboard/clinical", headers=headers, query_string=params)
    assert response.status_code == 200, response.get_json()
    return response.get_json()["data"]


def test_custom_range_is_echoed_and_end_day_is_inclusive(client, app, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    baseline = _fetch(client, headers, **WINDOW)

    assert baseline["range"]["is_custom"] is True
    assert baseline["range"]["days"] is None
    assert baseline["range"]["start"].startswith(WINDOW["start"])
    assert baseline["range"]["end"].startswith(WINDOW["end"])

    inside = datetime(2025, 3, 11, 9, 0, 0)
    last_minute_of_end_day = datetime(2025, 3, 12, 23, 30, 0)
    outside = datetime(2025, 3, 20, 9, 0, 0)
    before_window = datetime(2025, 2, 1, 8, 0, 0)
    doctor_id = doctor_auth["user"]["id"]

    with app.app_context():
        patient = Patient(full_name="Range Boundary Patient", gender="unknown")
        db.session.add(patient)
        db.session.flush()
        patient_id = patient.id

        db.session.add_all([
            # 1. urgent + un-reviewed, created by the signed-in doctor
            DiagnosisResult(
                patient_id=patient_id,
                diagnosed_by_user_id=doctor_id,
                diagnosis="Diabetes",
                certainty=0.8,
                facts_json={},
                triggered_rules_json=[],
                is_urgent=True,
                created_at=inside,
            ),
            # 2. non-urgent pending right at the end of the requested window
            DiagnosisResult(
                patient_id=patient_id,
                diagnosis="Prediabetes",
                certainty=0.5,
                facts_json={},
                triggered_rules_json=[],
                is_urgent=False,
                created_at=last_minute_of_end_day,
            ),
            # 3. urgent pending, but created after the window → must not count
            DiagnosisResult(
                patient_id=patient_id,
                diagnosis="Diabetes",
                certainty=0.8,
                facts_json={},
                triggered_rules_json=[],
                is_urgent=True,
                created_at=outside,
            ),
            # 4. created before the window, signed off by the doctor inside it
            DiagnosisResult(
                patient_id=patient_id,
                diagnosis="Normal",
                certainty=0.9,
                facts_json={},
                triggered_rules_json=[],
                is_urgent=False,
                created_at=before_window,
                reviewed_at=inside,
                reviewed_by_user_id=doctor_id,
            ),
        ])
        db.session.commit()

    after = _fetch(client, headers, **WINDOW)
    workload = after["doctor_workload"]

    assert workload["pending_reviews"] == baseline["doctor_workload"]["pending_reviews"] + 2
    assert workload["urgent_pending"] == baseline["doctor_workload"]["urgent_pending"] + 1
    assert workload["reviewed_by_me"] == baseline["doctor_workload"]["reviewed_by_me"] + 1
    assert workload["assessed_by_me"] == baseline["doctor_workload"]["assessed_by_me"] + 1
    assert 0 <= workload["signoff_share"] <= 100


def test_custom_window_shapes_trend_buckets(client, doctor_auth):
    """A custom window must anchor the chart timeline on its own end date."""
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}

    short = _fetch(client, headers, start="2025-03-08", end="2025-03-12")
    assert len(short["monthly_trend"]) == 5
    assert short["monthly_trend"][0]["month"] == "Mar 08"
    assert short["monthly_trend"][-1]["month"] == "Mar 12"

    long_window = _fetch(client, headers, start="2024-12-01", end="2025-03-12")
    assert len(long_window["monthly_trend"]) == 6
    assert long_window["monthly_trend"][-1]["month"] == "Mar"


def test_preset_days_and_all_time_still_work(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}

    preset = _fetch(client, headers, days=30)
    assert preset["range"]["days"] == 30
    assert preset["range"]["is_custom"] is False
    assert preset["range"]["start"] is not None

    all_time = _fetch(client, headers)
    assert all_time["range"]["days"] is None
    assert all_time["range"]["is_custom"] is False
    assert all_time["range"]["start"] is None
    assert set(all_time["doctor_workload"]) == {
        "pending_reviews",
        "urgent_pending",
        "reviewed_by_me",
        "assessed_by_me",
        "signoff_share",
    }


def test_inverted_range_is_rejected(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    response = client.get(
        "/api/dashboard/clinical",
        headers=headers,
        query_string={"start": "2026-02-01", "end": "2026-01-01"},
    )
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"


def test_malformed_range_is_rejected(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    response = client.get(
        "/api/dashboard/clinical",
        headers=headers,
        query_string={"start": "yesterday"},
    )
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "validation_error"


def test_workload_ignores_other_reviewers(client, app, doctor_auth):
    """A different reviewer's sign-offs must not appear in the doctor's block."""
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    baseline = _fetch(client, headers, **WINDOW)

    with app.app_context():
        patient = Patient(full_name="Other Reviewer Patient", gender="unknown")
        db.session.add(patient)
        db.session.flush()
        db.session.add(
            DiagnosisResult(
                patient_id=patient.id,
                diagnosis="Normal",
                certainty=0.9,
                facts_json={},
                triggered_rules_json=[],
                is_urgent=False,
                created_at=datetime(2025, 3, 11, 12, 0, 0),
                reviewed_at=datetime(2025, 3, 11, 13, 0, 0),
                reviewed_by_user_id=None,
            )
        )
        db.session.commit()

    after = _fetch(client, headers, **WINDOW)
    assert after["doctor_workload"]["reviewed_by_me"] == baseline["doctor_workload"]["reviewed_by_me"]
