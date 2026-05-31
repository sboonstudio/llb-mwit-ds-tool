#!/bin/bash
set -e

# Get the directory of the script and then the repo root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
TARGET_FILE="$REPO_ROOT/.env"

if [ ! -f "$REPO_ROOT/docker-compose.yml" ]; then
    echo "Error: Repository root not found or invalid at $REPO_ROOT"
    exit 1
fi

# Create .env if it doesn't exist from example
if [ ! -f "$TARGET_FILE" ]; then
    if [ -f "$REPO_ROOT/.env.example" ]; then
        cp "$REPO_ROOT/.env.example" "$TARGET_FILE"
        echo "Created .env from .env.example"
    else
        touch "$TARGET_FILE"
        echo "Created empty .env"
    fi
fi

# 1. Replace all <clone-root> placeholders
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|<clone-root>|$REPO_ROOT|g" "$TARGET_FILE"
else
    sed -i "s|<clone-root>|$REPO_ROOT|g" "$TARGET_FILE"
fi

# 2. Force update all path keys
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^LLBRIDGE_PROJECT_ROOT=.*|LLBRIDGE_PROJECT_ROOT=$REPO_ROOT|" "$TARGET_FILE"
    sed -i '' "s|^JUPYTERHUB_HOST_WORKSPACES=.*|JUPYTERHUB_HOST_WORKSPACES=$REPO_ROOT/infrastructure/data/lab-workspaces|" "$TARGET_FILE"
    sed -i '' "s|^JUPYTERHUB_HOST_SHARED_CONTENT=.*|JUPYTERHUB_HOST_SHARED_CONTENT=$REPO_ROOT/infrastructure/content/sample-notebooks|" "$TARGET_FILE"
    sed -i '' "s|^JUPYTERHUB_HOST_SINGLEUSER_CONFIG=.*|JUPYTERHUB_HOST_SINGLEUSER_CONFIG=$REPO_ROOT/infrastructure/lab/jupyterlab/singleuser-config|" "$TARGET_FILE"
else
    sed -i "s|^LLBRIDGE_PROJECT_ROOT=.*|LLBRIDGE_PROJECT_ROOT=$REPO_ROOT|" "$TARGET_FILE"
    sed -i "s|^JUPYTERHUB_HOST_WORKSPACES=.*|JUPYTERHUB_HOST_WORKSPACES=$REPO_ROOT/infrastructure/data/lab-workspaces|" "$TARGET_FILE"
    sed -i "s|^JUPYTERHUB_HOST_SHARED_CONTENT=.*|JUPYTERHUB_HOST_SHARED_CONTENT=$REPO_ROOT/infrastructure/content/sample-notebooks|" "$TARGET_FILE"
    sed -i "s|^JUPYTERHUB_HOST_SINGLEUSER_CONFIG=.*|JUPYTERHUB_HOST_SINGLEUSER_CONFIG=$REPO_ROOT/infrastructure/lab/jupyterlab/singleuser-config|" "$TARGET_FILE"
fi

echo "Successfully synced environment paths to: $REPO_ROOT"
