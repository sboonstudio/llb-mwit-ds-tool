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
echo -e "\033[0;33m>>> Phase 1: Checking environment...\033[0m"

# Run Sync
bash "$SCRIPT_DIR/sync-env.sh"

# Determine Docker Arguments and Local Mode
DOCKER_ARGS=()
IS_LOCAL=false

for arg in "$@"; do
    if [ "$arg" == "--local" ]; then
        IS_LOCAL=true
    else
        DOCKER_ARGS+=("$arg")
    fi
done

if [ ${#DOCKER_ARGS[@]} -eq 0 ]; then
    DOCKER_ARGS=("-d" "--build")
fi

# Check if detached mode is requested
IS_DETACHED=false
for arg in "${DOCKER_ARGS[@]}"; do
    if [ "$arg" == "-d" ]; then
        IS_DETACHED=true
        break
    fi
done

if [ "$IS_LOCAL" = true ]; then
    echo -e "\033[0;36m>>> Mode: Localhost Only (No Cloudflare)\033[0m"
    # Reset URLs to localhost in .env
    sed -i '/^LLBRIDGE_PUBLIC_URL=/d' .env
    sed -i '/^LLBRIDGE_PUBLIC_BASE_URL=/d' .env
    sed -i '/^JUPYTERHUB_BASE_URL=/d' .env
    sed -i '/^AUTH_URL=/d' .env
    sed -i '/^NEXTAUTH_URL=/d' .env
    echo "LLBRIDGE_PUBLIC_URL=http://localhost:3000" >> .env
    echo "LLBRIDGE_PUBLIC_BASE_URL=http://localhost:3000" >> .env
    echo "JUPYTERHUB_BASE_URL=http://localhost:8000" >> .env
    echo "AUTH_URL=http://localhost:3000" >> .env
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env
fi

echo -e "\n\033[0;33m>>> Phase 2: Starting Docker containers (Args: ${DOCKER_ARGS[*]})...\033[0m"
if [ "$IS_LOCAL" = true ]; then
    # Exclude tunnel service in local mode
    docker compose --env-file .env -f docker-compose.yml up "${DOCKER_ARGS[@]}" llbridge-web llbridge-hub llbridge-proxy
else
    docker compose --env-file .env -f docker-compose.yml up "${DOCKER_ARGS[@]}"
fi

if [ "$IS_DETACHED" = true ]; then
    echo -e "\n\033[0;33m>>> Phase 3: Auto-Admin Provisioning...\033[0m"
    # Wait a bit for DB to be ready
    sleep 3
    
    # Extract credentials from .env
    ADMIN_EMAIL=$(grep "^INITIAL_ADMIN_EMAIL=" .env | cut -d'=' -f2)
    ADMIN_PASS=$(grep "^INITIAL_ADMIN_PASSWORD=" .env | cut -d'=' -f2)
    
    # Fallback to defaults if not set in .env
    ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@sboon.org"}
    ADMIN_PASS=${ADMIN_PASS:-"admin543"}
    
    echo ">>> Initializing admin: $ADMIN_EMAIL"
    docker compose exec -T llbridge-web node scripts/create-admin.mjs "$ADMIN_EMAIL" "$ADMIN_PASS" --silent || echo ">>> Warning: Admin auto-provisioning skipped or failed."

    echo -e "\n\033[0;32m>>> Success! System is starting up.\033[0m"

    if [ "$IS_LOCAL" = false ]; then
        # Extract Quick Tunnel URL
        echo -e "\033[0;33m>>> Searching for Cloudflare Quick Tunnel URL...\033[0m"
        sleep 8
        QUICK_URL=$(docker compose logs llbridge-tunnel 2>&1 | grep -oE "https://[a-zA-Z0-9-]+\.trycloudflare\.com" | head -n 1)
        
        if [ ! -z "$QUICK_URL" ]; then
            echo -e ">>> Quick Tunnel URL: \033[0;36m$QUICK_URL\033[0m"
            
            # Update .env with the new public URL
            echo -e "\033[0;33m>>> Updating .env with public URL...\033[0m"
            sed -i '/^LLBRIDGE_PUBLIC_URL=/d' .env
            sed -i '/^LLBRIDGE_PUBLIC_BASE_URL=/d' .env
            sed -i '/^JUPYTERHUB_BASE_URL=/d' .env
            sed -i '/^AUTH_URL=/d' .env
            sed -i '/^NEXTAUTH_URL=/d' .env
            echo "LLBRIDGE_PUBLIC_URL=$QUICK_URL" >> .env
            echo "LLBRIDGE_PUBLIC_BASE_URL=$QUICK_URL" >> .env
            echo "JUPYTERHUB_BASE_URL=$QUICK_URL" >> .env
            echo "AUTH_URL=$QUICK_URL" >> .env
            echo "NEXTAUTH_URL=$QUICK_URL" >> .env

            echo -e "\033[0;33m>>> Restarting Web and Hub to apply new URL...\033[0m"
            docker compose up -d llbridge-web llbridge-hub
        fi
    fi

    echo ">>> Access Points:"
    echo "  - Local Web:    http://localhost:3000"
    echo "  - Local Hub:    http://localhost:8000"
    if [ ! -z "$QUICK_URL" ]; then
        echo -e "  - Public Access: \033[0;36m$QUICK_URL\033[0m"
    fi
else
    echo -e "\n\033[0;33m>>> System stopped (Attached mode finished).\033[0m"
fi
echo ""
