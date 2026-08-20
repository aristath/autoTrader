"""Clara-compatible folder task storage rooted at ``~/.sentinel/tasks``."""

from __future__ import annotations

import filecmp
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Any

from apscheduler.triggers.cron import CronTrigger

from sentinel.paths import SENTINEL_HOME, TASKS_DIR

CORE_TASKS_DIR = Path(__file__).resolve().parent.parent / "task_definitions"
LEGACY_SEED_MARKER = TASKS_DIR / ".defaults-seeded"
PREVIOUS_OVERLAY_MARKER = TASKS_DIR / ".core-overlay-migrated"
OVERLAY_MIGRATION_MARKER = TASKS_DIR / ".core-overlay-migrated-v2"
EDITABLE_EXTENSIONS = {".sh", ".md", ".py", ".mjs", ".js", ".json", ".txt"}
PROTECTED_FILES = {"task.js", "task.json"}
ID_RE = re.compile(r"^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$")
SAFE_FILENAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
REFERENCE_RE = re.compile(r"\b(?:prompt|run)\(\s*(['\"])([^'\"]+)\1")
LEGACY_VALIDATORS = {
    ("rate-portfolio", "validate-ratings.mjs"),
    ("rate-security", "validate-rating.mjs"),
}
LEGACY_CORE_FIXES = {
    ("analyze-security", "fetch-profile-sources.py"): "    raise last_error\n",
    ("analyze-security", "fetch-query-sources.py"): "    raise last_error\n",
    ("analyze-security", "resolve-security.py"): '"name": str(selected.get("name") or "").strip()',
}


def ensure_default_tasks() -> None:
    """Initialize the user task directory and migrate old seed copies to overlays."""
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    if OVERLAY_MIGRATION_MARKER.exists():
        return

    # The first WIP copied every bundled definition into the user directory. Remove
    # only byte-identical copies so future core fixes can flow through; edited folders
    # remain user-owned overrides.
    if LEGACY_SEED_MARKER.exists() or PREVIOUS_OVERLAY_MARKER.exists():
        for core in _task_folders(CORE_TASKS_DIR):
            user = TASKS_DIR / core.name
            if user.is_dir():
                _upgrade_legacy_seed_copy(core, user)
                if _folders_equal(core, user):
                    shutil.rmtree(user)
        LEGACY_SEED_MARKER.unlink(missing_ok=True)
        PREVIOUS_OVERLAY_MARKER.unlink(missing_ok=True)
    _write_atomic(OVERLAY_MIGRATION_MARKER, "Sentinel task storage uses Clara-style core overlays\n")


def _upgrade_legacy_seed_copy(core: Path, user: Path) -> None:
    """Replace only the known WIP validators that depended on web/node_modules."""
    for task_id, name in LEGACY_VALIDATORS:
        if core.name != task_id:
            continue
        user_file = user / name
        core_file = core / name
        if not user_file.is_file() or not core_file.is_file():
            continue
        old = user_file.read_text(encoding="utf-8")
        if "appRequire.resolve('jsonrepair')" in old and "SENTINEL_APP_ROOT" in old:
            _write_atomic(user_file, core_file.read_text(encoding="utf-8"))
    for (task_id, name), signature in LEGACY_CORE_FIXES.items():
        if core.name != task_id:
            continue
        user_file = user / name
        core_file = core / name
        if not user_file.is_file() or not core_file.is_file():
            continue
        old = user_file.read_text(encoding="utf-8")
        if signature in old:
            _write_atomic(user_file, core_file.read_text(encoding="utf-8"))


def _task_folders(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return sorted(path for path in root.iterdir() if path.is_dir() and (path / "task.js").is_file())


def _folders_equal(left: Path, right: Path) -> bool:
    comparison = filecmp.dircmp(left, right, ignore=["__pycache__"])
    if comparison.left_only or comparison.right_only or comparison.funny_files:
        return False
    if any(not filecmp.cmp(left / name, right / name, shallow=False) for name in comparison.common_files):
        return False
    return all(_folders_equal(left / name, right / name) for name in comparison.common_dirs)


def validate_task_id(task_id: str) -> str:
    task_id = str(task_id).strip()
    if not ID_RE.fullmatch(task_id):
        raise ValueError("Task id must use lowercase letters, numbers, dots, underscores, or dashes")
    return task_id


def _user_task_dir(task_id: str) -> Path:
    task_id = validate_task_id(task_id)
    path = (TASKS_DIR / task_id).resolve()
    if path.parent != TASKS_DIR.resolve():
        raise ValueError("Invalid task id")
    return path


def _core_task_dir(task_id: str) -> Path:
    task_id = validate_task_id(task_id)
    path = (CORE_TASKS_DIR / task_id).resolve()
    if path.parent != CORE_TASKS_DIR.resolve():
        raise ValueError("Invalid task id")
    return path


def _resolve_task_dir(task_id: str) -> tuple[Path, str]:
    user = _user_task_dir(task_id)
    if user.is_dir() and (user / "task.js").is_file():
        return user, "user"
    core = _core_task_dir(task_id)
    if core.is_dir() and (core / "task.js").is_file():
        return core, "core"
    raise FileNotFoundError(f'Task "{task_id}" not found')


def _ensure_user_copy(task_id: str) -> Path:
    user = _user_task_dir(task_id)
    if user.exists():
        return user
    core = _core_task_dir(task_id)
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    if core.is_dir() and (core / "task.js").is_file():
        temp = TASKS_DIR / f".{task_id}.tmp-{os.getpid()}-{uuid.uuid4()}"
        try:
            shutil.copytree(core, temp)
            os.replace(temp, user)
        except Exception:
            shutil.rmtree(temp, ignore_errors=True)
            if not user.exists():
                raise
    else:
        user.mkdir()
    return user


def slugify(name: str, existing: set[str] | None = None) -> str:
    base = re.sub(r"[^a-z0-9._-]+", "-", name.lower()).strip("-._") or "untitled-task"
    base = base[:80].rstrip("-._") or "untitled-task"
    candidate = base
    used = existing or set()
    index = 2
    while candidate in used:
        candidate = f"{base}-{index}"
        index += 1
    return candidate


def _safe_filename(name: str) -> str:
    name = str(name).strip()
    if (
        not name
        or name in {".", ".."}
        or Path(name).name != name
        or "/" in name
        or "\\" in name
        or "\0" in name
        or not SAFE_FILENAME_RE.fullmatch(name)
    ):
        raise ValueError("File name must be a single safe filename")
    if name.lower() not in PROTECTED_FILES and Path(name).suffix.lower() not in EDITABLE_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {Path(name).suffix or '(none)'}")
    return name


def _read_meta(path: Path) -> dict[str, Any]:
    try:
        value = json.loads((path / "task.json").read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as exc:
        raise ValueError(f"task.json is not valid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError("task.json must contain a JSON object")
    return value


def _normalize_policy(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    out: dict[str, Any] = {}
    stale = value.get("staleAfterSeconds")
    if isinstance(stale, (int, float)) and not isinstance(stale, bool) and math.isfinite(stale) and stale >= 0:
        out["staleAfterSeconds"] = min(365 * 86400, int(stale))
    if value.get("runWhen") in {"idle", "immediate"}:
        out["runWhen"] = value["runWhen"]
    priority = value.get("priority")
    if isinstance(priority, (int, float)) and not isinstance(priority, bool) and math.isfinite(priority):
        out["priority"] = max(-1000, min(1000, int(priority)))
    return out or None


def _validate_meta(meta: dict[str, Any]) -> dict[str, Any]:
    if "name" in meta and (not isinstance(meta["name"], str) or not meta["name"].strip()):
        raise ValueError("name must be a non-empty string")
    if "enabled" in meta and not isinstance(meta["enabled"], bool):
        raise ValueError("enabled must be a boolean")
    if "tags" in meta and (not isinstance(meta["tags"], list) or not all(isinstance(x, str) for x in meta["tags"])):
        raise ValueError("tags must be an array of strings")
    for key in ("description", "cwd", "statePath"):
        if key in meta and not isinstance(meta[key], str):
            raise ValueError(f"{key} must be a string")
    if "timeout" in meta:
        timeout = meta["timeout"]
        if (
            isinstance(timeout, bool)
            or not isinstance(timeout, (int, float))
            or not math.isfinite(timeout)
            or timeout < 0
        ):
            raise ValueError("timeout must be a non-negative number")
        meta["timeout"] = int(timeout)
    schedule = meta.get("schedule")
    if schedule is not None and (not isinstance(schedule, str) or not schedule.strip()):
        raise ValueError("schedule must be a non-empty cron string or null")
    if schedule:
        try:
            CronTrigger.from_crontab(schedule)
        except ValueError as exc:
            raise ValueError(f"Invalid cron schedule: {schedule}") from exc
    if "schedulePolicy" in meta:
        if meta["schedulePolicy"] is not None and not isinstance(meta["schedulePolicy"], dict):
            raise ValueError("schedulePolicy must be an object or null")
        normalized = _normalize_policy(meta["schedulePolicy"])
        if normalized is None:
            meta.pop("schedulePolicy", None)
        else:
            meta["schedulePolicy"] = normalized
    return meta


def serialize_task(task_id: str) -> dict[str, Any]:
    path, source = _resolve_task_dir(task_id)
    meta = _validate_meta(_read_meta(path))
    schedule = meta.get("schedule") if isinstance(meta.get("schedule"), str) else None
    timeout = meta.get("timeout")
    return {
        "id": task_id,
        "name": meta.get("name") if isinstance(meta.get("name"), str) else task_id,
        "description": meta.get("description") if isinstance(meta.get("description"), str) else None,
        "tags": [tag for tag in meta.get("tags", []) if isinstance(tag, str)]
        if isinstance(meta.get("tags"), list)
        else [],
        "enabled": meta.get("enabled") is True,
        "schedule": schedule,
        "cwd": meta.get("cwd") if isinstance(meta.get("cwd"), str) else None,
        "statePath": meta.get("statePath") if isinstance(meta.get("statePath"), str) else None,
        "schedulePolicy": _normalize_policy(meta.get("schedulePolicy")),
        "timeout": int(timeout) if isinstance(timeout, (int, float)) and not isinstance(timeout, bool) else None,
        "format": "folder",
        "source": source,
    }


def list_tasks() -> list[dict[str, Any]]:
    ensure_default_tasks()
    by_id: dict[str, tuple[Path, str]] = {path.name: (path, "core") for path in _task_folders(CORE_TASKS_DIR)}
    by_id.update({path.name: (path, "user") for path in _task_folders(TASKS_DIR)})
    entries: list[dict[str, Any]] = []
    for task_id, (_path, source) in sorted(by_id.items()):
        try:
            entries.append(serialize_task(task_id))
        except Exception as exc:  # malformed definitions stay editable
            entries.append(
                {
                    "id": task_id,
                    "name": task_id,
                    "enabled": False,
                    "schedule": None,
                    "tags": [],
                    "format": "folder",
                    "source": source,
                    "invalid": True,
                    "error": str(exc),
                }
            )
    return sorted(entries, key=lambda item: (str(item.get("name", "")).lower(), item["id"]))


def get_task(task_id: str) -> dict[str, Any]:
    task = serialize_task(task_id)
    path, _ = _resolve_task_dir(task_id)
    task["markdown"] = (path / "task.js").read_text(encoding="utf-8")
    return task


def task_directory(task_id: str) -> Path:
    return _resolve_task_dir(task_id)[0]


def create_task(name: str) -> dict[str, Any]:
    ensure_default_tasks()
    clean_name = str(name).strip() or "Untitled task"
    task_id = slugify(clean_name, {item["id"] for item in list_tasks()})
    target = _user_task_dir(task_id)
    target.mkdir(parents=False)
    _write_atomic(
        target / "task.json",
        json.dumps(
            {"name": clean_name, "enabled": False, "schedule": None, "cwd": "@/tasks/artifacts/{{task-id}}"}, indent=2
        )
        + "\n",
    )
    _write_atomic(target / "task.js", f'/** {clean_name} */\nconsole.log("{clean_name}");\n')
    return get_task(task_id)


def delete_task(task_id: str) -> None:
    user = _user_task_dir(task_id)
    core = _core_task_dir(task_id)
    if user.is_dir():
        shutil.rmtree(user)
        return
    if core.is_dir() and (core / "task.js").is_file():
        raise PermissionError(f'Task "{task_id}" is core and cannot be deleted; disable it instead')
    raise FileNotFoundError(f'Task "{task_id}" not found')


def list_files(task_id: str) -> list[dict[str, Any]]:
    path, source = _resolve_task_dir(task_id)
    rows = []
    for file in path.iterdir():
        if not file.is_file():
            continue
        lower = file.name.lower()
        if lower not in PROTECTED_FILES and file.suffix.lower() not in EDITABLE_EXTENSIONS:
            continue
        rows.append(
            {
                "name": file.name,
                "language": language_for(file.name),
                "protected": lower in PROTECTED_FILES,
                "source": source,
                "size": file.stat().st_size,
            }
        )
    rank = {"task.json": 0, "task.js": 1}
    return sorted(rows, key=lambda row: (rank.get(row["name"], 2), row["name"].lower()))


def language_for(name: str) -> str:
    return {
        ".js": "javascript",
        ".mjs": "javascript",
        ".py": "python",
        ".sh": "shell",
        ".md": "markdown",
        ".json": "json",
    }.get(Path(name).suffix.lower(), "plaintext")


def read_file(task_id: str, name: str) -> dict[str, Any]:
    path, source = _resolve_task_dir(task_id)
    file = path / _safe_filename(name)
    if not file.is_file():
        raise FileNotFoundError(f'File "{name}" not found in task "{task_id}"')
    return {"name": name, "content": file.read_text(encoding="utf-8"), "language": language_for(name), "source": source}


def write_file(task_id: str, name: str, content: str, *, create: bool = False) -> dict[str, Any]:
    name = _safe_filename(name)
    effective, _ = _resolve_task_dir(task_id)
    effective_file = effective / name
    if create and (name.lower() in PROTECTED_FILES or effective_file.exists()):
        raise FileExistsError(f'"{name}" already exists')
    if not create and not effective_file.exists():
        raise FileNotFoundError(f'File "{name}" not found in task "{task_id}"')
    if name.lower() == "task.json":
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValueError(f"task.json contains invalid JSON: {exc}") from exc
        if not isinstance(parsed, dict):
            raise ValueError("task.json must contain a JSON object")
        _validate_meta(parsed)
    target = _ensure_user_copy(task_id) / name
    _write_atomic(target, content)
    return next(row for row in list_files(task_id) if row["name"] == name)


def delete_file(task_id: str, name: str) -> None:
    name = _safe_filename(name)
    if name.lower() in PROTECTED_FILES:
        raise PermissionError(f'"{name}" cannot be deleted')
    effective, _ = _resolve_task_dir(task_id)
    if not (effective / name).is_file():
        raise FileNotFoundError(f'File "{name}" not found in task "{task_id}"')
    file = _ensure_user_copy(task_id) / name
    file.unlink(missing_ok=True)


def update_meta(task_id: str, patch: dict[str, Any]) -> dict[str, Any]:
    effective, _ = _resolve_task_dir(task_id)
    meta = _read_meta(effective)
    allowed = {"name", "description", "tags", "enabled", "schedule", "cwd", "statePath", "timeout", "schedulePolicy"}
    for key, value in patch.items():
        if key not in allowed:
            continue
        if value is None:
            meta.pop(key, None)
        else:
            meta[key] = value
    _validate_meta(meta)
    path = _ensure_user_copy(task_id)
    _write_atomic(path / "task.json", json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    return get_task(task_id)


def validate_task(task_id: str) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    try:
        serialize_task(task_id)
        path, _ = _resolve_task_dir(task_id)
        script = path / "task.js"
        source = script.read_text(encoding="utf-8")
        if not source.strip():
            errors.append("task.js is empty")
        else:
            node = shutil.which("node")
            if node is None:
                errors.append("Node.js is required to validate task.js")
            else:
                check = subprocess.run(  # noqa: S603 - fixed executable and argv, no shell
                    [node, "--check", str(script)],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    check=False,
                )
                if check.returncode != 0:
                    errors.append((check.stderr or check.stdout).strip())
        for _quote, name in REFERENCE_RE.findall(source):
            if Path(name).is_absolute() or "/" in name or "\\" in name:
                continue
            if not (path / name).is_file():
                errors.append(f'Referenced file "{name}" does not exist')
    except Exception as exc:
        errors.append(str(exc))
    return {"ok": not errors, "errors": errors, "warnings": warnings}


def resolve_cwd(task: dict[str, Any]) -> Path:
    raw = task.get("cwd") or "@/tasks/artifacts/{{task-id}}"
    expanded = str(raw).replace("{{task-id}}", task["id"])
    if expanded.startswith("@/"):
        expanded = str(SENTINEL_HOME / expanded[2:])
    return Path(os.path.expanduser(expanded)).resolve()


def _write_atomic(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
        os.replace(temp_name, path)
    except Exception:
        Path(temp_name).unlink(missing_ok=True)
        raise
