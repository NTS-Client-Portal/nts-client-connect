#!/usr/bin/env bash

set -euo pipefail

if [ $# -lt 1 ]; then
	echo "Usage: $0 \"commit message\" [branch]"
	exit 1
fi

COMMIT_MESSAGE="$1"
BRANCH="${2:-$(git rev-parse --abbrev-ref HEAD)}"

echo "Adding changes..."
git add .

echo "Creating commit..."
git commit -m "$COMMIT_MESSAGE"

echo "Waiting 90 seconds before push..."
sleep 90

echo "Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

echo "Done."
