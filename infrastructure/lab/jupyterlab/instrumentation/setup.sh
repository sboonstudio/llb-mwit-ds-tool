#!/bin/bash
# Setup Instrumentation for student container

# 1. Shell Logger
if [ -f "/opt/llbridge/instrumentation/shell_logger.sh" ]; then
    # Add to global bashrc or user bashrc
    # For jupyter/datascience-notebook, the user is jovyan
    BASHRC="/home/jovyan/.bashrc"
    if ! grep -q "shell_logger.sh" "$BASHRC"; then
        echo "source /opt/llbridge/instrumentation/shell_logger.sh" >> "$BASHRC"
    fi
fi

# 2. IPython Logger
IPYTHON_STARTUP="/home/jovyan/.ipython/profile_default/startup"
mkdir -p "$IPYTHON_STARTUP"
if [ -f "/opt/llbridge/instrumentation/ipython_logger.py" ]; then
    cp "/opt/llbridge/instrumentation/ipython_logger.py" "$IPYTHON_STARTUP/99-llbridge-insight.py"
fi

echo ">>> LearnLab Instrumentation initialized."
