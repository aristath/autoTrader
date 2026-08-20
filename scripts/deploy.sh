#!/usr/bin/env bash

set -euo pipefail

TARGET="${SENTINEL_TARGET:-aristath@clara.local}"

ssh -o BatchMode=yes "$TARGET" systemctl --user restart sentinel.service

for _ in $(seq 1 90); do
    if curl --fail --silent --max-time 2 "http://clara.local:8000/api/health" >/dev/null; then
        echo "Sentinel is healthy at http://clara.local:8000"
        exit 0
    fi
    sleep 2
done

echo "Sentinel did not become healthy after deployment" >&2
exit 1
