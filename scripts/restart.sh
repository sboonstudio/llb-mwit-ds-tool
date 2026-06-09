#!/bin/bash
set -e

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "\n\033[0;33m>>> Restarting LearnLab Bridge...\033[0m"

# Execute down then up
bash "./down.sh"
bash "./up.sh" "$@"
