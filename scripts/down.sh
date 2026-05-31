#!/bin/bash
set -e

# Get repo root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$REPO_ROOT"

# Get Version
VERSION="Unknown"
if [ -f "VERSION" ]; then
    VERSION=$(cat VERSION)
fi

echo -e "\n\033[0;36m>>> LearnLab Bridge - Version: $VERSION\033[0m"
echo -e "\033[0;33m>>> Stopping Docker containers...\033[0m"

docker compose --env-file .env -f docker-compose.yml down

echo -e "\n\033[0;32m>>> System stopped successfully.\033[0m"
echo ""
