"""Tests for backup task functions."""

import os
import sqlite3
import tarfile
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from sentinel.database import Database
from sentinel.jobs.tasks import (
    _create_archive,
    _create_database_snapshot,
    _prune_old_backups,
    backup_r2,
)


def test_create_archive():
    """_create_archive should produce a valid tar.gz containing the data dir."""
    with tempfile.TemporaryDirectory() as tmpdir:
        data_dir = Path(tmpdir) / "data"
        data_dir.mkdir()

        (data_dir / "test.txt").write_text("hello")
        sentinel_home = Path(tmpdir) / ".sentinel"
        task_dir = sentinel_home / "tasks" / "custom-task"
        task_dir.mkdir(parents=True)
        (task_dir / "task.js").write_text("console.log('custom');\n")

        dest = os.path.join(tmpdir, "backup.tar.gz")

        with (
            patch("sentinel.jobs.tasks.DATA_DIR", data_dir),
            patch("sentinel.jobs.tasks.SENTINEL_HOME", sentinel_home),
        ):
            _create_archive(dest)

        assert os.path.exists(dest)
        assert os.path.getsize(dest) > 0

        with tarfile.open(dest, "r:gz") as tar:
            names = tar.getnames()
            assert any("test.txt" in n for n in names)
            assert ".sentinel/tasks/custom-task/task.js" in names


def test_create_archive_missing_dir():
    """_create_archive should raise if data dir doesn't exist."""
    with tempfile.TemporaryDirectory() as tmpdir:
        dest = os.path.join(tmpdir, "backup.tar.gz")
        missing = Path(tmpdir) / "nonexistent"

        with (
            patch("sentinel.jobs.tasks.DATA_DIR", missing),
            patch("sentinel.jobs.tasks.SENTINEL_HOME", Path(tmpdir) / ".sentinel"),
        ):
            with pytest.raises(FileNotFoundError):
                _create_archive(dest)


def test_create_archive_replaces_live_database_with_snapshot():
    with tempfile.TemporaryDirectory() as tmpdir:
        root = Path(tmpdir)
        data_dir = root / "data"
        data_dir.mkdir()
        (data_dir / "sentinel.db").write_bytes(b"live database")
        (data_dir / "sentinel.db-wal").write_bytes(b"live wal")
        (data_dir / "sentinel.db-shm").write_bytes(b"live shm")
        (data_dir / "sentinel.db-journal").write_bytes(b"live journal")
        snapshot = root / "snapshot.db"
        snapshot.write_bytes(b"consistent snapshot")
        dest = str(root / "backup.tar.gz")

        with (
            patch("sentinel.jobs.tasks.DATA_DIR", data_dir),
            patch("sentinel.jobs.tasks.SENTINEL_HOME", root / ".sentinel"),
        ):
            _create_archive(dest, snapshot, "sentinel.db")

        with tarfile.open(dest, "r:gz") as tar:
            names = tar.getnames()
            assert names.count("data/sentinel.db") == 1
            assert "data/sentinel.db-wal" not in names
            assert "data/sentinel.db-shm" not in names
            assert "data/sentinel.db-journal" not in names
            archived = tar.extractfile("data/sentinel.db")
            assert archived is not None
            assert archived.read() == b"consistent snapshot"


@pytest.mark.asyncio
async def test_database_snapshot_includes_committed_wal_data_and_passes_integrity_check(tmp_path):
    db_path = tmp_path / "sentinel.db"
    snapshot_path = tmp_path / "snapshot.db"
    db = Database(str(db_path))
    await db.connect()
    try:
        await db.conn.execute("CREATE TABLE backup_probe (value TEXT NOT NULL)")
        await db.conn.execute("INSERT INTO backup_probe VALUES ('committed')")
        await db.conn.commit()

        await _create_database_snapshot(db, snapshot_path)

        with sqlite3.connect(snapshot_path) as snapshot:
            assert snapshot.execute("PRAGMA integrity_check").fetchone() == ("ok",)
            assert snapshot.execute("SELECT value FROM backup_probe").fetchone() == ("committed",)
    finally:
        await db.close()
        db.remove_from_cache()


def test_prune_old_backups():
    """_prune_old_backups should delete objects older than retention period."""
    from datetime import datetime, timezone

    old_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
    new_date = datetime(2099, 1, 1, tzinfo=timezone.utc)

    client = MagicMock()
    client.list_objects_v2.return_value = {
        "Contents": [
            {"Key": "backups/old.tar.gz", "LastModified": old_date},
            {"Key": "backups/new.tar.gz", "LastModified": new_date},
        ]
    }

    _prune_old_backups(client, "test-bucket", retention_days=30)

    client.delete_objects.assert_called_once()
    deleted_keys = client.delete_objects.call_args[1]["Delete"]["Objects"]
    assert len(deleted_keys) == 1
    assert deleted_keys[0]["Key"] == "backups/old.tar.gz"


def test_prune_no_old_backups():
    """_prune_old_backups should not call delete if nothing is old."""
    from datetime import datetime, timezone

    new_date = datetime(2099, 1, 1, tzinfo=timezone.utc)

    client = MagicMock()
    client.list_objects_v2.return_value = {
        "Contents": [
            {"Key": "backups/new.tar.gz", "LastModified": new_date},
        ]
    }

    _prune_old_backups(client, "test-bucket", retention_days=30)

    client.delete_objects.assert_not_called()


@pytest.mark.asyncio
async def test_backup_skips_without_credentials():
    """backup_r2 should skip gracefully when credentials are not configured."""
    mock_db = AsyncMock()

    with patch("sentinel.settings.Settings") as MockSettings:
        instance = MockSettings.return_value
        instance.get = AsyncMock(return_value="")
        await backup_r2(mock_db)


@pytest.mark.asyncio
async def test_backup_full_flow():
    """backup_r2 should create archive, upload, and prune."""
    mock_db = AsyncMock()
    mock_db.path = Path.cwd() / "sentinel.db"
    mock_client = MagicMock()
    mock_client.list_objects_v2.return_value = {"Contents": []}

    async def mock_get(key, default=""):
        values = {
            "r2_account_id": "test-account",
            "r2_access_key": "test-key",
            "r2_secret_key": "test-secret",
            "r2_bucket_name": "test-bucket",
            "r2_backup_retention_days": 30,
        }
        return values.get(key, default)

    with (
        patch("sentinel.settings.Settings") as MockSettings,
        patch("sentinel.jobs.tasks._create_database_snapshot", new_callable=AsyncMock) as mock_snapshot,
        patch("sentinel.jobs.tasks._get_r2_client", return_value=mock_client),
        patch("sentinel.jobs.tasks._create_archive"),
        patch("sentinel.jobs.tasks._upload_archive") as mock_upload,
    ):
        instance = MockSettings.return_value
        instance.get = mock_get

        await backup_r2(mock_db)

        mock_snapshot.assert_awaited_once()
        mock_upload.assert_called_once()
