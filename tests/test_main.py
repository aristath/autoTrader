import os
import sys

import main as sentinel_main


def test_default_and_legacy_all_start_the_same_complete_application(monkeypatch):
    calls = []
    monkeypatch.delenv("SENTINEL_BASE_URL", raising=False)
    monkeypatch.setattr(sentinel_main.uvicorn, "run", lambda *args, **kwargs: calls.append((args, kwargs)))

    for argv in (["main.py"], ["main.py", "--all"]):
        monkeypatch.setattr(sys, "argv", argv)
        sentinel_main.main()

    assert calls == [
        (("sentinel.app:app",), {"host": "::", "port": 8000, "log_level": "info"}),
        (("sentinel.app:app",), {"host": "::", "port": 8000, "log_level": "info"}),
    ]
    assert os.environ["SENTINEL_BASE_URL"] == "http://127.0.0.1:8000"
