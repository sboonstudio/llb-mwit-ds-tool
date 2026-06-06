#!/bin/bash
# Script to synchronize version information across the project
# Source of truth: /VERSION

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
VERSION_FILE="$REPO_ROOT/VERSION"

if [ ! -f "$VERSION_FILE" ]; then
    echo "Error: Root VERSION file not found at $VERSION_FILE"
    exit 1
fi

VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')
echo "Synchronizing version: $VERSION"

# 1. Sync to platform/apps/web/VERSION
WEB_VERSION_FILE="$REPO_ROOT/platform/apps/web/VERSION"
echo "$VERSION" > "$WEB_VERSION_FILE"
echo "Updated $WEB_VERSION_FILE"

# 2. Sync to platform/apps/web/package.json
PACKAGE_JSON_FILE="$REPO_ROOT/platform/apps/web/package.json"
if [ -f "$PACKAGE_JSON_FILE" ]; then
    # Use sed to replace version field
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$PACKAGE_JSON_FILE"
    else
        sed -i "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" "$PACKAGE_JSON_FILE"
    fi
    echo "Updated $PACKAGE_JSON_FILE"
fi

# 3. Sync to platform/apps/web/src/lib/version.ts (Fallback string)
VERSION_TS_FILE="$REPO_ROOT/platform/apps/web/src/lib/version.ts"
if [ -f "$VERSION_TS_FILE" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/return \".*\"; \/\/ Final fallback/return \"$VERSION\"; \/\/ Final fallback/" "$VERSION_TS_FILE"
    else
        sed -i "s/return \".*\"; \/\/ Final fallback/return \"$VERSION\"; \/\/ Final fallback/" "$VERSION_TS_FILE"
    fi
    echo "Updated $VERSION_TS_FILE"
fi

echo "Version synchronization complete."
