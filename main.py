#!/usr/bin/env python3
"""
Sentinel - Entry point for running the application.

Usage:
    python main.py          # Run Sentinel, including scheduled work
    python main.py --all    # Backward-compatible alias for the same command
"""

import argparse
import logging
import os

import uvicorn

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Sentinel Portfolio Management")
    parser.add_argument("--all", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument("--host", default="::", help="Web server host")
    parser.add_argument("--port", type=int, default=8000, help="Web server port")
    args = parser.parse_args()

    os.environ.setdefault("SENTINEL_BASE_URL", f"http://127.0.0.1:{args.port}")
    logger.info("Running Sentinel on %s:%s", args.host, args.port)
    uvicorn.run("sentinel.app:app", host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
