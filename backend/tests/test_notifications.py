import pytest


def test_notifications_unauthenticated(client):
    res = client.get("/api/notifications")
    assert res.status_code == 401


def test_doctor_notifications_flow(client, doctor_auth):
    headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}

    # 1. Get notifications
    res = client.get("/api/notifications", headers=headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert "notifications" in data
    assert "unread_count" in data
    assert len(data["notifications"]) > 0
    initial_unread = data["unread_count"]
    assert initial_unread > 0

    # 2. Check unread-count endpoint
    res = client.get("/api/notifications/unread-count", headers=headers)
    assert res.status_code == 200
    count_data = res.get_json()["data"]
    assert count_data["unread_count"] == initial_unread

    # 3. Filter by unread
    res = client.get("/api/notifications?unread_only=true", headers=headers)
    assert res.status_code == 200
    unread_items = res.get_json()["data"]["notifications"]
    assert all(item["is_read"] is False for item in unread_items)

    # 4. Mark first unread as read
    first_unread = unread_items[0]
    notif_id = first_unread["id"]
    res = client.patch(f"/api/notifications/{notif_id}/read", headers=headers)
    assert res.status_code == 200
    updated_notif = res.get_json()["data"]["notification"]
    assert updated_notif["is_read"] is True

    # Check unread count decreased
    res = client.get("/api/notifications/unread-count", headers=headers)
    assert res.get_json()["data"]["unread_count"] == initial_unread - 1

    # 5. Mark all as read
    res = client.post("/api/notifications/mark-all-read", headers=headers)
    assert res.status_code == 200
    res = client.get("/api/notifications/unread-count", headers=headers)
    assert res.get_json()["data"]["unread_count"] == 0

    # 6. Clear read notifications
    res = client.delete("/api/notifications/clear-read", headers=headers)
    assert res.status_code == 200
    res = client.get("/api/notifications", headers=headers)
    items_after_clear = res.get_json()["data"]["notifications"]
    assert len(items_after_clear) == 0


def test_notification_ownership_isolation(client, doctor_auth, patient_auth):
    doc_headers = {"Authorization": f"Bearer {doctor_auth['access_token']}"}
    pat_headers = {"Authorization": f"Bearer {patient_auth['access_token']}"}

    # Get doctor notification
    res = client.get("/api/notifications", headers=doc_headers)
    assert res.status_code == 200
    doc_notifs = res.get_json()["data"]["notifications"]
    assert len(doc_notifs) > 0
    doc_notif_id = doc_notifs[0]["id"]

    # Patient tries to mark doctor's notification as read -> 404
    res = client.patch(f"/api/notifications/{doc_notif_id}/read", headers=pat_headers)
    assert res.status_code == 404

    # Patient tries to delete doctor's notification -> 404
    res = client.delete(f"/api/notifications/{doc_notif_id}", headers=pat_headers)
    assert res.status_code == 404
