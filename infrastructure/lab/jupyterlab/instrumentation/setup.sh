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

# 3. Jupyter Server Extension (File Tracker)
# Create a config file to load the extension
JUPYTER_CONFIG_DIR="/home/jovyan/.jupyter"
mkdir -p "$JUPYTER_CONFIG_DIR"
cat <<EOF > "$JUPYTER_CONFIG_DIR/jupyter_server_config.py"
c.ServerApp.jpserver_extensions = {
    'file_tracker': True
}
EOF

# Copy the extension to a place where python can find it
# Or add instrumentation dir to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:/opt/llbridge/instrumentation

echo ">>> LearnLab Instrumentation initialized."
