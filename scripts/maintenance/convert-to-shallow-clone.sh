#!/bin/bash
# Convert existing full git clone to shallow clone to save disk space
# This script removes git history while keeping the working directory intact
# Usage: ./scripts/maintenance/convert-to-shallow-clone.sh [REPO_DIR]

set -e

# Default repo directory (can be overridden)
REPO_DIR="${1:-$(pwd)}"

if [ ! -d "$REPO_DIR/.git" ]; then
    echo "Error: $REPO_DIR is not a git repository"
    exit 1
fi

echo "=== Converting Git Repository to Shallow Clone ==="
echo "Repository: $REPO_DIR"
echo ""

# Get current branch
CURRENT_BRANCH=$(cd "$REPO_DIR" && git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Get remote URL
REMOTE_URL=$(cd "$REPO_DIR" && git config --get remote.origin.url)
echo "Remote URL: $REMOTE_URL"
echo ""

# Confirm
read -p "This will remove all git history. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Fetching latest from remote..."
cd "$REPO_DIR"
git fetch origin "$CURRENT_BRANCH"

echo "Step 2: Creating backup of .git directory..."
BACKUP_DIR="${REPO_DIR}.git.backup.$(date +%Y%m%d_%H%M%S)"
cp -r "$REPO_DIR/.git" "$BACKUP_DIR"
echo "Backup created at: $BACKUP_DIR"

echo "Step 3: Removing old .git directory..."
rm -rf "$REPO_DIR/.git"

echo "Step 4: Re-initializing as shallow clone..."
cd "$REPO_DIR"
git init
git remote add origin "$REMOTE_URL"
git fetch --depth 1 origin "$CURRENT_BRANCH"
git checkout -b "$CURRENT_BRANCH" "origin/$CURRENT_BRANCH"
git branch --set-upstream-to="origin/$CURRENT_BRANCH" "$CURRENT_BRANCH"

echo ""
echo "=== Conversion Complete ==="
echo ""
echo "Repository is now a shallow clone (latest commit only)."
echo "Disk space saved: Check with 'du -sh $REPO_DIR'"
echo ""
echo "To restore from backup (if needed):"
echo "  rm -rf $REPO_DIR/.git"
echo "  mv $BACKUP_DIR $REPO_DIR/.git"
echo ""
