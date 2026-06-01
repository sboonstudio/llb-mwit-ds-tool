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

# 2. Force update or append essential path keys
KEYS_TO_ENSURE=(
    "LLBRIDGE_PROJECT_ROOT=$REPO_ROOT"
    "JUPYTERHUB_HOST_WORKSPACES=$REPO_ROOT/infrastructure/data/lab-workspaces"
    "JUPYTERHUB_HOST_SHARED_CONTENT=$REPO_ROOT/infrastructure/content/sample-notebooks"
    "JUPYTERHUB_HOST_SINGLEUSER_CONFIG=$REPO_ROOT/infrastructure/lab/jupyterlab/singleuser-config"
)

for pair in "${KEYS_TO_ENSURE[@]}"; do
    key=$(echo $pair | cut -d'=' -f1)
    value=$(echo $pair | cut -d'=' -f2-)
    if grep -q "^$key=" "$TARGET_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^$key=.*|$key=$value|" "$TARGET_FILE"
        else
            sed -i "s|^$key=.*|$key=$value|" "$TARGET_FILE"
        fi
    else
        echo "$key=$value" >> "$TARGET_FILE"
    fi
done

echo "Successfully synced environment paths to: $REPO_ROOT"
