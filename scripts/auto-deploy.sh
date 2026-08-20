#!/usr/bin/env bash

set -euo pipefail

REPO_DIR="${SENTINEL_REPO_DIR:-/var/home/aristath/sentinel}"
BRANCH="${SENTINEL_BRANCH:-main}"

cd "$REPO_DIR"
git fetch origin "$BRANCH" --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [[ "$LOCAL" != "$REMOTE" ]]; then
    systemctl --user restart sentinel.service
fi
