from unittest.mock import patch
import pytest

from app.models import User


MOCK_CLIENT_ID = "mock-google-client-id.apps.googleusercontent.com"


@pytest.fixture(autouse=True)
def configure_google_client_id(app):
    """Ensure GOOGLE_CLIENT_ID is configured on the app and auth service for tests."""
    with app.app_context():
        original_client_id = app.config.get("GOOGLE_CLIENT_ID")
        app.config["GOOGLE_CLIENT_ID"] = MOCK_CLIENT_ID
        from app.dependencies import get_auth_service
        service = get_auth_service()
        service.google_client_id = MOCK_CLIENT_ID
        yield
        app.config["GOOGLE_CLIENT_ID"] = original_client_id
        service.google_client_id = original_client_id


def test_google_login_missing_credential(client):
    response = client.post("/api/auth/google", json={})
    assert response.status_code == 400
    body = response.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "validation_error"


def test_google_login_not_configured_returns_clear_error(client, app):
    with app.app_context():
        from app.dependencies import get_auth_service
        app.config["GOOGLE_CLIENT_ID"] = None
        get_auth_service().google_client_id = None

    response = client.post("/api/auth/google", json={"credential": "some-token"})
    assert response.status_code == 400
    body = response.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "GOOGLE_LOGIN_NOT_CONFIGURED"



def test_google_login_invalid_token(client):
    with patch("google.oauth2.id_token.verify_oauth2_token", side_effect=ValueError("Token expired")):
        response = client.post("/api/auth/google", json={"credential": "invalid-token"})
        assert response.status_code == 401
        body = response.get_json()
        assert body["success"] is False
        assert body["error"]["code"] == "unauthorized"


def test_google_login_unverified_email_rejected(client):
    token_claims = {
        "sub": "google-sub-unverified",
        "email": "unverified@example.com",
        "email_verified": False,
        "name": "Unverified User",
    }
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=token_claims):
        response = client.post("/api/auth/google", json={"credential": "mock-credential"})
        assert response.status_code == 401
        body = response.get_json()
        assert body["success"] is False
        assert "not verified" in body["error"]["message"].lower()


def test_google_login_new_user_creates_patient_and_returns_standard_shape(client, app):
    token_claims = {
        "sub": "google-sub-new-12345",
        "email": "newgoogleuser@example.com",
        "email_verified": True,
        "name": "Google Patient",
        "picture": "https://example.com/avatar.jpg",
    }
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=token_claims):
        response = client.post("/api/auth/google", json={"credential": "mock-credential"})
        assert response.status_code == 200
        body = response.get_json()
        assert body["success"] is True
        assert body["message"] == "Google login successful."

        data = body["data"]
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "Bearer"
        assert isinstance(data["expires_in"], int)

        user = data["user"]
        assert user["email"] == "newgoogleuser@example.com"
        assert user["name"] == "Google Patient"
        assert user["role"] == "patient"
        assert user["roles"] == ["patient"]
        assert user["patient_id"] is not None
        assert user["profile_completed"] is False
        assert user["avatar_url"] == "https://example.com/avatar.jpg"

    with app.app_context():
        db_user = User.query.filter_by(email="newgoogleuser@example.com").first()
        assert db_user is not None
        assert db_user.google_sub == "google-sub-new-12345"
        assert db_user.password_hash is None
        assert db_user.patient_profile is not None


def test_google_created_user_password_login_fails_gracefully(client, app):
    # Attempt normal password login for Google user with no password hash
    response = client.post("/api/auth/login", json={
        "email": "newgoogleuser@example.com",
        "password": "anypassword",
    })
    assert response.status_code == 401
    body = response.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "unauthorized"


def test_google_login_existing_patient_links_account_and_subsequent_login(client, app):
    # 1. Self-register a patient via password
    reg_response = client.post("/api/auth/register", json={
        "name": "Existing Patient",
        "email": "existing-patient@example.com",
        "password": "password123",
    })
    assert reg_response.status_code == 201

    token_claims = {
        "sub": "google-sub-linked-777",
        "email": "existing-patient@example.com",
        "email_verified": True,
        "name": "Existing Patient Updated",
    }

    # 2. First Google login links google_sub
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=token_claims):
        link_response = client.post("/api/auth/google", json={"credential": "mock-credential"})
        assert link_response.status_code == 200
        link_data = link_response.get_json()["data"]
        assert link_data["user"]["email"] == "existing-patient@example.com"

    with app.app_context():
        user = User.query.filter_by(email="existing-patient@example.com").first()
        assert user.google_sub == "google-sub-linked-777"

    # 3. Subsequent login resolves by google_sub
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=token_claims):
        second_response = client.post("/api/auth/google", json={"credential": "mock-credential"})
        assert second_response.status_code == 200
        assert second_response.get_json()["data"]["user"]["email"] == "existing-patient@example.com"


def test_google_login_rejects_matching_non_patient_account(client, app):
    # doctor@example.com is a seeded doctor account
    token_claims = {
        "sub": "google-sub-doctor-hacker",
        "email": "doctor@example.com",
        "email_verified": True,
        "name": "Dr. Lina",
    }
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=token_claims):
        response = client.post("/api/auth/google", json={"credential": "mock-credential"})
        assert response.status_code == 403
        body = response.get_json()
        assert body["success"] is False
        assert body["error"]["code"] == "forbidden"

    # Verify google_sub was NOT linked
    with app.app_context():
        doctor = User.query.filter_by(email="doctor@example.com").first()
        assert doctor.google_sub != "google-sub-doctor-hacker"


def test_google_login_rejects_inactive_user(client, app):
    # Create an inactive patient
    with app.app_context():
        from app.extensions import db
        inactive_user = User(
            email="inactive-patient@example.com",
            name="Inactive Person",
            is_active=False,
            google_sub="google-sub-inactive",
        )
        db.session.add(inactive_user)
        db.session.commit()

    token_claims = {
        "sub": "google-sub-inactive",
        "email": "inactive-patient@example.com",
        "email_verified": True,
        "name": "Inactive Person",
    }
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=token_claims):
        response = client.post("/api/auth/google", json={"credential": "mock-credential"})
        assert response.status_code == 401
        body = response.get_json()
        assert body["success"] is False
        assert "inactive" in body["error"]["message"].lower()


def test_google_login_with_access_token_success(client, app):
    userinfo_claims = {
        "sub": "google-sub-oauth-user",
        "email": "oauthuser@example.com",
        "email_verified": True,
        "name": "OAuth User",
        "picture": "https://example.com/avatar.jpg",
    }
    class MockResponse:
        status_code = 200
        def json(self):
            return userinfo_claims

    with patch("requests.get", return_value=MockResponse()):
        response = client.post("/api/auth/google", json={"credential": "ya29.mock-access-token"})
        assert response.status_code == 200
        body = response.get_json()
        assert body["success"] is True
        assert body["data"]["user"]["email"] == "oauthuser@example.com"
        assert body["data"]["user"]["name"] == "OAuth User"

