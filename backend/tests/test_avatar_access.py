from app.dependencies import get_auth_service


def test_avatar_cleanup_only_deletes_current_users_local_file(app, tmp_path, monkeypatch):
    avatar_dir = tmp_path / "avatars"
    avatar_dir.mkdir()
    outside = tmp_path / "keep.txt"
    other_avatar = avatar_dir / "avatar_2_other.png"
    own_avatar = avatar_dir / "avatar_1_own.png"
    for path in (outside, other_avatar, own_avatar):
        path.write_text("keep")

    with app.app_context():
        service = get_auth_service()
        monkeypatch.setattr(service, "get_avatar_dir", lambda: avatar_dir)
        for filename in ("../keep.txt", "avatar_1_/../../keep.txt", "avatar_2_other.png"):
            service._remove_local_avatar_file(f"/api/auth/avatar/{filename}", 1)
        assert outside.exists()
        assert other_avatar.exists()
        service._remove_local_avatar_file("/api/auth/avatar/avatar_1_own.png", 1)
        assert not own_avatar.exists()
